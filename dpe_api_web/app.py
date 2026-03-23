from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import __main__
from helpers import to_str as _to_str
__main__.to_str = _to_str

# ----------------------------
# Load model
# ----------------------------
HERE = Path(__file__).resolve().parent
MODEL_PATH = HERE / "dpe_model_v2_no_ges.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

# ----------------------------
# Features expected by the pipeline
# ----------------------------
FEATURES_V2 = [
    "type_batiment",
    "periode_construction",
    "surface_habitable_logement",
    "type_energie_principale_chauffage",
    "conso_5_usages_par_m2_ep",
]

# ----------------------------
# Expert adjustment layer
# Nudges the ML letter ±1 based on insulation, windows, heating
# ----------------------------
DPE_ORDER = ["A", "B", "C", "D", "E", "F", "G"]
DPE_TO_SCORE = {k: i for i, k in enumerate(DPE_ORDER)}
SCORE_TO_DPE = {i: k for k, i in DPE_TO_SCORE.items()}

INSULATION_ADJ = {"Poor": +1.0, "Average": +0.5, "Good": 0.0, "Excellent": -0.5}
WINDOW_ADJ = {"Single Pane": +0.5, "Double Pane": 0.0, "Triple Pane": -0.3}
HEATING_ADJ = {
    "Electric radiators (old convectors)": +1.0,
    "Electric radiators (recent/inertia)": +0.4,
    "Heat pump": -1.0,
    "Gas boiler": 0.0,
    "District heating": -0.3,
    "Oil heating": +0.6,
    "Wood/pellets": -0.2,
}


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def adjust_dpe_letter(
    ml_pred_letter: str,
    insulation: Optional[str] = None,
    windows: Optional[str] = None,
    heating: Optional[str] = None,
    max_jump_letters: int = 1,
) -> Tuple[str, List[str], float]:
    base = DPE_TO_SCORE[ml_pred_letter]
    delta = 0.0
    reasons: List[str] = []

    if insulation in INSULATION_ADJ:
        d = INSULATION_ADJ[insulation]
        if d:
            delta += d
            reasons.append(f"Insulation: {insulation} ({d:+.1f})")

    if windows in WINDOW_ADJ:
        d = WINDOW_ADJ[windows]
        if d:
            delta += d
            reasons.append(f"Windows: {windows} ({d:+.1f})")

    if heating in HEATING_ADJ:
        d = HEATING_ADJ[heating]
        if d:
            delta += d
            reasons.append(f"Heating: {heating} ({d:+.1f})")

    score = base + delta
    score = clamp(score, base - max_jump_letters, base + max_jump_letters)
    score = int(round(score))
    score = int(clamp(score, 0, 6))

    return SCORE_TO_DPE[score], reasons, delta


def dpe_band(a: str, b: str) -> str:
    if a == b:
        return a
    lo, hi = sorted([DPE_TO_SCORE[a], DPE_TO_SCORE[b]])
    return f"{SCORE_TO_DPE[lo]}–{SCORE_TO_DPE[hi]}"


# ----------------------------
# API schema
# ----------------------------
class PredictRequest(BaseModel):
    type_batiment: str
    periode_construction: str
    surface_habitable_logement: float = Field(gt=0)
    type_energie_principale_chauffage: str

    # Provide either direct consumption/m² or total annual kWh (we'll divide by surface)
    conso_5_usages_par_m2_ep: Optional[float] = Field(default=None, ge=0)
    conso_totale_kwh_an: Optional[float] = Field(default=None, ge=0)

    emission_ges_5_usages: Optional[float] = Field(default=0.0, ge=0)

    # Optional expert-adjustment inputs
    heating_system: Optional[str] = None
    insulation: Optional[str] = None
    windows: Optional[str] = None


# ----------------------------
# FastAPI app + CORS
# ----------------------------
app = FastAPI(title="DPE API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict")
def predict(req: PredictRequest) -> Dict[str, Any]:
    if req.conso_5_usages_par_m2_ep is not None:
        conso_m2 = float(req.conso_5_usages_par_m2_ep)
    elif req.conso_totale_kwh_an is not None:
        conso_m2 = float(req.conso_totale_kwh_an) / float(req.surface_habitable_logement)
    else:
        conso_m2 = 0.0

    row = {
        "type_batiment": req.type_batiment,
        "periode_construction": req.periode_construction,
        "surface_habitable_logement": float(req.surface_habitable_logement),
        "type_energie_principale_chauffage": req.type_energie_principale_chauffage,
        "conso_5_usages_par_m2_ep": float(conso_m2),
        "emission_ges_5_usages": float(req.emission_ges_5_usages or 0.0),
    }

    X = pd.DataFrame([row], columns=FEATURES_V2)
    X["conso_5_usages_par_m2_ep"] = np.log1p(
        pd.to_numeric(X["conso_5_usages_par_m2_ep"], errors="coerce").fillna(0.0)
    )

    ml_pred = model.predict(X)[0]

    proba = None
    top3 = None
    if hasattr(model, "predict_proba"):
        p = model.predict_proba(X)[0]
        proba = {c: float(v) for c, v in zip(model.classes_, p)}
        top3 = sorted(proba.items(), key=lambda x: x[1], reverse=True)[:3]

    adjusted, reasons, delta = adjust_dpe_letter(
        ml_pred,
        insulation=req.insulation,
        windows=req.windows,
        heating=req.heating_system,
        max_jump_letters=1,
    )

    return {
        "ml_prediction": ml_pred,
        "adjusted_prediction": adjusted,
        "band": dpe_band(ml_pred, adjusted),
        "reasons": reasons,
        "rule_delta": delta,
        "top_probs": top3,
        "inputs_used": row,
    }
