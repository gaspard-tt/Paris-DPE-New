import type { FormData, DPEClass } from "@/lib/types";
import { HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Slider } from "@/components/ui/slider";

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}

const DPE_OPTIONS: { value: DPEClass | "unknown"; color: string }[] = [
  { value: "A", color: "bg-[#319834] text-white" },
  { value: "B", color: "bg-[#33a357] text-white" },
  { value: "C", color: "bg-[#cbdb2a] text-foreground" },
  { value: "D", color: "bg-[#ffed00] text-foreground" },
  { value: "E", color: "bg-[#f0b616] text-foreground" },
  { value: "F", color: "bg-[#ec6927] text-white" },
  { value: "G", color: "bg-[#e7221a] text-white" },
  { value: "unknown", color: "bg-muted text-muted-foreground" },
];

const StepCurrentDPE = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  const billUnknown = data.annualBill === undefined;

  return (
    <div className="space-y-8">
      {/* DPE class selection */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("currentdpe.title")}</h3>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{t("currentdpe.help")}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DPE_OPTIONS.map((opt) => {
            const isUnknown = opt.value === "unknown";
            const selected = isUnknown
              ? data.currentDPE === undefined
              : data.currentDPE === opt.value;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange({
                    currentDPE: isUnknown ? undefined : (opt.value as DPEClass),
                  })
                }
                className={`flex flex-col items-center justify-center rounded-xl border-2 px-3 py-4 text-center transition-all ${
                  selected
                    ? "border-primary shadow-md scale-[1.03]"
                    : "border-transparent hover:border-primary/30"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold ${opt.color}`}
                >
                  {isUnknown ? "?" : opt.value}
                </div>
                <span className="mt-2 text-xs font-medium text-foreground">
                  {isUnknown ? t("currentdpe.idk") : `${t("currentdpe.class")} ${opt.value}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual energy bill — no pre-fill */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">{t("currentdpe.bill.title")}</h3>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
          <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{t("currentdpe.bill.help")}</span>
        </div>

        <div className="mt-4 space-y-4">
          {!billUnknown && (
            <>
              <div className="text-center">
                <span className="text-3xl font-bold text-foreground">{data.annualBill} €</span>
                <span className="text-sm text-muted-foreground ml-1">/ {t("results.roi.year")}</span>
              </div>
              <Slider
                value={[data.annualBill || 200]}
                onValueChange={([v]) => onChange({ annualBill: v })}
                min={200}
                max={6000}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>200 €</span>
                <span className="text-primary font-medium">{t("currentdpe.bill.avg")}</span>
                <span>6 000 €</span>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() =>
              onChange({ annualBill: billUnknown ? 1200 : undefined })
            }
            className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
              billUnknown
                ? "border-primary bg-primary/5 text-primary"
                : "border-muted text-muted-foreground hover:border-primary/30"
            }`}
          >
            {billUnknown ? (
              <>
                ✓ {t("currentdpe.bill.idk")}
                <span className="text-xs font-normal text-muted-foreground ml-1">— {t("currentdpe.bill.idk.tap")}</span>
              </>
            ) : (
              t("currentdpe.bill.idk")
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepCurrentDPE;
