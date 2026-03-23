import { supabase } from "./supabase";
import type { FormData, DPEClass } from "./types";

const API_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

// ----------------------------
// Value mappings: questionnaire → model
// ----------------------------

// Model was trained on ADEME DPE data with these exact string values
const PERIOD_MAP: Record<string, string> = {
  before1948: "avant 1948",
  "1948-1974": "1948-1974",
  "1975-1988": "1978-1982",   // model splits this range; use midpoint
  "1989-2000": "1989-2000",
  "2001-2012": "2006-2012",   // model splits this range; use midpoint
  after2012: "2013-2021",
};

const HEATING_TO_ENERGIE: Record<string, string> = {
  electric_convector: "Électricité",
  electric_radiant: "Électricité",
  heat_pump: "Électricité",
  gas_boiler: "Gaz naturel",
  gas_condensing: "Gaz naturel",
  fuel_boiler: "Fioul domestique",
  wood: "Bois – Bûches",
};

// Expert-adjustment layer inputs (labels expected by app.py)
const INSULATION_MAP: Record<string, string> = {
  none: "Poor",
  poor: "Poor",
  average: "Average",
  good: "Good",
  excellent: "Excellent",
};

const WINDOW_MAP: Record<string, string> = {
  single: "Single Pane",
  double: "Double Pane",
  triple: "Triple Pane",
};

const HEATING_SYSTEM_MAP: Record<string, string> = {
  electric_convector: "Electric radiators (old convectors)",
  electric_radiant: "Electric radiators (recent/inertia)",
  heat_pump: "Heat pump",
  gas_boiler: "Gas boiler",
  gas_condensing: "Gas boiler",
  fuel_boiler: "Oil heating",
  wood: "Wood/pellets",
};

// ----------------------------
// ML prediction
// Habits already folded into `consumption` by dpe-calculator.ts
// ----------------------------
export async function predictDPE(
  data: FormData,
  consumption: number
): Promise<DPEClass | null> {
  const primaryHeating = data.heatingTypes?.[0] ?? "gas_boiler";

  const payload = {
    type_batiment: data.housingType === "house" ? "maison" : "appartement",
    periode_construction: PERIOD_MAP[data.constructionPeriod ?? "1975-1988"],
    surface_habitable_logement: data.surfaceArea ?? 70,
    type_energie_principale_chauffage:
      HEATING_TO_ENERGIE[primaryHeating] ?? "Gaz naturel",
    conso_5_usages_par_m2_ep: consumption,
    insulation: data.wallInsulation ? INSULATION_MAP[data.wallInsulation] : undefined,
    windows: data.windowType ? WINDOW_MAP[data.windowType] : undefined,
    heating_system: HEATING_SYSTEM_MAP[primaryHeating],
  };

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json.adjusted_prediction as DPEClass;
}

// ----------------------------
// Supabase: save all questionnaire answers + results
// ----------------------------
export async function saveResponse(
  data: FormData,
  mlDpeClass: DPEClass | null,
  ruleDpeClass: DPEClass,
  consumption: number
): Promise<void> {
  if (!supabase) { console.warn("[Supabase] client not available, skipping save"); return; }
  const { error } = await supabase.from("dpe_responses").insert({
    // Step 1 — General
    housing_type: data.housingType,
    surface_area: data.surfaceArea,
    construction_period: data.constructionPeriod,
    arrondissement: data.arrondissement,

    // Step 2 — Current DPE
    current_dpe: data.currentDPE,
    annual_bill: data.annualBill,

    // Step 3 — Envelope
    wall_insulation: data.wallInsulation,
    roof_insulation: data.roofInsulation,
    floor_insulation: data.floorInsulation,
    window_type: data.windowType,
    orientation: data.orientation,

    // Step 4 — Heating
    heating_types: data.heatingTypes,
    heating_age: data.heatingAge,
    distribution_system: data.distributionSystem,

    // Step 5 — Energy
    energy_sources: data.energySources,

    // Step 6 — Ventilation
    ventilation_type: data.ventilationType,
    air_leakage: data.airLeakage,

    // Step 7 — Occupancy & Habits
    occupants: data.occupants,
    hot_water_usage: data.hotWaterUsage,
    thermostat_temp: data.thermostatTemp,
    heating_habits: data.heatingHabits,
    heating_frequency: data.heatingFrequency,
    airing_habit: data.airingHabit,
    laundry_frequency: data.laundryFrequency,
    uses_dishwasher: data.usesDishwasher,
    uses_dryer: data.usesDryer,
    leaves_lights_on: data.leavesLightsOn,
    programmable_heating: data.programmableHeating,

    // Results
    computed_consumption: consumption,
    ml_dpe_class: mlDpeClass,
    rule_dpe_class: ruleDpeClass,
  });

  if (error) console.error("[Supabase] save error:", error);
}
