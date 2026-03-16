import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface Props {
  currentStep: number;
}

const FloatingHelp = ({ currentStep }: Props) => {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const helpKeys = [
    "help.step.general",
    "help.step.currentdpe",
    "help.step.envelope",
    "help.step.heating",
    "help.step.energy",
    "help.step.ventilation",
    "help.step.usage",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label="Help"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6"
          >
            <div className="fixed inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-sm rounded-2xl border bg-card p-5 shadow-xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground">{t("help.title")}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(helpKeys[currentStep] || helpKeys[0])}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingHelp;
