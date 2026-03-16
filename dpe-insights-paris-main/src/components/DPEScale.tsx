import { DPE_CLASSES } from "@/lib/dpe-calculator";
import type { DPEClass } from "@/lib/types";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface DPEScaleProps {
  activeClass?: DPEClass;
  size?: "sm" | "md" | "lg";
}

const DPEScale = ({ activeClass, size = "md" }: DPEScaleProps) => {
  const { t } = useI18n();
  const sizeClasses = {
    sm: "text-xs py-1 px-2",
    md: "text-sm py-2 px-3",
    lg: "text-base py-3 px-4",
  };

  const widths = {
    A: "w-[30%]",
    B: "w-[38%]",
    C: "w-[48%]",
    D: "w-[58%]",
    E: "w-[68%]",
    F: "w-[80%]",
    G: "w-[92%]",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {DPE_CLASSES.map((dpe, index) => {
        const isActive = activeClass === dpe.class;
        return (
          <motion.div
            key={dpe.class}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className={`relative flex items-center ${widths[dpe.class]}`}
          >
            <div
              className={`${dpe.color} flex w-full items-center justify-between rounded-r-lg font-bold ${sizeClasses[size]} transition-all duration-300 ${
                isActive
                  ? "ring-2 ring-foreground/30 ring-offset-2 ring-offset-background scale-[1.03] shadow-lg"
                  : "opacity-70"
              }`}
            >
              <span>{dpe.class}</span>
              <span className="text-xs font-normal opacity-80">
                {dpe.label} {t("dpe.unit")}
              </span>
            </div>
            {isActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-8 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background"
              >
                ◀
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default DPEScale;
