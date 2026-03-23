import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BarChart3, Loader2, Lock, AlertCircle, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import WizardProgress from "@/components/WizardProgress";
import FloatingHelp from "@/components/FloatingHelp";
import StepGeneralInfo from "@/components/steps/StepGeneralInfo";
import StepCurrentDPE from "@/components/steps/StepCurrentDPE";
import StepEnvelope from "@/components/steps/StepEnvelope";
import StepHeating from "@/components/steps/StepHeating";
import StepEnergy from "@/components/steps/StepEnergy";
import StepVentilation from "@/components/steps/StepVentilation";
import StepOccupancy from "@/components/steps/StepOccupancy";
import Header from "@/components/Header";
import type { FormData } from "@/lib/types";
import { DEFAULT_FORM_DATA } from "@/lib/types";
import { calculateDPE } from "@/lib/dpe-calculator";
import { predictDPE, saveResponse } from "@/lib/dpe-service";
import { useI18n } from "@/lib/i18n";

/** Returns an error message key if the step is incomplete, or null if valid */
function validateStep(step: number, data: FormData, t: (k: string) => string): string | null {
  switch (step) {
    case 0: // General Info
      if (!data.housingType) return t("validation.housing_type");
      if (!data.surfaceArea) return t("validation.surface");
      if (!data.arrondissement) return t("validation.arrondissement");
      if (!data.constructionPeriod) return t("validation.construction");
      return null;

    case 1: // Current DPE — DPE class or "unknown" both fine, bill is optional
      // No strict requirement — user can skip DPE class (defaults to unknown)
      return null;

    case 2: // Envelope
      if (!data.windowType) return t("validation.window_type");
      if (!data.orientation) return t("validation.orientation");
      return null;

    case 3: // Heating
      if (!data.heatingTypes || data.heatingTypes.length === 0) return t("validation.heating_type");
      return null;

    case 4: // Energy
      if (!data.energySources || data.energySources.length === 0) return t("validation.energy_source");
      return null;

    case 5: // Ventilation
      if (!data.ventilationType) return t("validation.ventilation");
      return null;

    case 6: // Occupancy
      if (!data.occupants) return t("validation.occupants");
      if (!data.hotWaterUsage) return t("validation.hot_water");
      return null;

    default:
      return null;
  }
}

const Questionnaire = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [direction, setDirection] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const STEP_LABELS = [
    t("step.general"),
    t("step.currentdpe"),
    t("step.envelope"),
    t("step.heating"),
    t("step.energy"),
    t("step.ventilation"),
    t("step.usage"),
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowValidation(false);
  }, [currentStep]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear validation error as user interacts
    if (showValidation) setShowValidation(false);
  };

  const validationError = useMemo(
    () => validateStep(currentStep, formData, t),
    [currentStep, formData, t]
  );

  // Live energy cost estimate
  const energyEstimate = useMemo(() => {
    if (!formData.surfaceArea || !formData.constructionPeriod) return null;
    try {
      const result = calculateDPE(formData, lang);
      const annual = Math.round(result.consumption * formData.surfaceArea * 0.21);
      return annual > 0 ? annual : null;
    } catch {
      return null;
    }
  }, [formData, lang]);

  const nextStep = () => {
    if (validationError) {
      setShowValidation(true);
      return;
    }
    if (currentStep < STEP_LABELS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    if (validationError) {
      setShowValidation(true);
      return;
    }
    setIsCalculating(true);

    // Rule-based calc: folds in all habits → gives us consumption + weaknesses + recommendations
    const result = calculateDPE(formData, lang);
    const ruleClass = result.dpeClass;

    // ML prediction and minimum animation time run in parallel
    const [mlClass] = await Promise.all([
      predictDPE(formData, result.consumption).catch(() => null),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);

    // ML letter overrides rule-based letter when available
    if (mlClass) result.dpeClass = mlClass;

    // Save everything to Supabase (fire-and-forget — don't block navigation)
    saveResponse(formData, mlClass, ruleClass, result.consumption).catch(console.error);

    navigate("/resultats", { state: { result, formData } });
  };

  const isLastStep = currentStep === STEP_LABELS.length - 1;

  const renderStep = () => {
    const props = { data: formData, onChange: updateFormData };
    switch (currentStep) {
      case 0: return <StepGeneralInfo {...props} />;
      case 1: return <StepCurrentDPE {...props} />;
      case 2: return <StepEnvelope {...props} />;
      case 3: return <StepHeating {...props} />;
      case 4: return <StepEnergy {...props} />;
      case 5: return <StepVentilation {...props} />;
      case 6: return <StepOccupancy {...props} />;
      default: return null;
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{t("loading.title")}</h2>
            <p className="max-w-md text-muted-foreground">{t("loading.desc")}</p>
            <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full hero-gradient"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <WizardProgress
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          stepLabels={STEP_LABELS}
        />

        <div className="overflow-hidden rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Validation error */}
          {showValidation && validationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {validationError}
            </motion.div>
          )}

          {/* Energy estimate preview */}
          {energyEstimate && currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{t("questionnaire.energy_preview")}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">~{energyEstimate.toLocaleString()} €</span>
                <span className="text-xs text-muted-foreground ml-1">/{t("questionnaire.energy_preview.year")}</span>
                <span className="text-xs text-muted-foreground ml-2">({Math.round(energyEstimate / 12)} €/{t("questionnaire.energy_preview.month")})</span>
              </div>
            </motion.div>
          )}

          {/* Privacy note */}
          <div className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-muted/40 px-4 py-2.5 text-center text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            {t("footer.privacy")}
          </div>

          <div className="mt-6 flex items-center justify-between border-t pt-6">
            <Button
              variant="ghost"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("wizard.prev")}
            </Button>

            {isLastStep ? (
              <Button variant="hero" size="lg" onClick={handleSubmit} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("wizard.submit")}
              </Button>
            ) : (
              <Button onClick={nextStep} className="gap-2">
                {t("wizard.next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      <FloatingHelp currentStep={currentStep} />
    </div>
  );
};

export default Questionnaire;