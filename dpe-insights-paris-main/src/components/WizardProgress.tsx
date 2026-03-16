import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Check, Home, Layers, Flame, Zap, Wind, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const stepIcons = [Home, Layers, Flame, Zap, Wind, Users];
const stepColors = [
  { bg: "bg-primary", light: "bg-primary/10", text: "text-primary" },
  { bg: "bg-teal", light: "bg-teal/10", text: "text-teal" },
  { bg: "bg-rose", light: "bg-rose/10", text: "text-rose" },
  { bg: "bg-amber", light: "bg-amber/10", text: "text-amber" },
  { bg: "bg-indigo", light: "bg-indigo/10", text: "text-indigo" },
  { bg: "bg-success", light: "bg-success/10", text: "text-success" },
];

const WizardProgress = ({ currentStep, totalSteps, stepLabels }: WizardProgressProps) => {
  const { t } = useI18n();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {t("wizard.step")} {currentStep + 1} / {totalSteps}
        </span>
        <span className={`text-sm font-semibold ${stepColors[currentStep]?.text || "text-primary"}`}>
          {stepLabels[currentStep]}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="mt-3 flex justify-between">
        {stepLabels.map((label, index) => {
          const Icon = stepIcons[index] || Home;
          const color = stepColors[index] || stepColors[0];
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <motion.div
              key={label}
              className={`flex flex-col items-center ${
                index <= currentStep ? color.text : "text-muted-foreground/40"
              }`}
              initial={false}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? `${color.bg} text-white`
                    : isCurrent
                    ? `${color.bg} text-white shadow-md`
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span className="mt-1 hidden text-[10px] font-medium md:block">
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
