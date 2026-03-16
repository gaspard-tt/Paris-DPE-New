import type { FormData } from "@/lib/types";
import { HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  data: FormData;
  onChange: (updates: Partial<FormData>) => void;
}

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
    <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
    <span>{children}</span>
  </div>
);

const OptionRow = ({
  selected,
  label,
  desc,
  onClick,
}: {
  selected: boolean;
  label: string;
  desc?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border hover:border-primary/40 hover:bg-muted/30"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
        }`}
      >
        {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        {desc && <div className="text-xs text-muted-foreground">{desc}</div>}
      </div>
    </div>
  </button>
);

const StepVentilation = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("ventilation.type")}</h3>
        <HelperText>{t("ventilation.type.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.ventilationType === "natural"} label={t("ventilation.natural")} desc={t("ventilation.natural.desc")} onClick={() => onChange({ ventilationType: "natural" })} />
          <OptionRow selected={data.ventilationType === "vmc_simple"} label={t("ventilation.vmc_simple")} desc={t("ventilation.vmc_simple.desc")} onClick={() => onChange({ ventilationType: "vmc_simple" })} />
          <OptionRow selected={data.ventilationType === "vmc_double"} label={t("ventilation.vmc_double")} desc={t("ventilation.vmc_double.desc")} onClick={() => onChange({ ventilationType: "vmc_double" })} />
          <OptionRow selected={!data.ventilationType} label={t("ventilation.idk")} desc={t("ventilation.idk.desc")} onClick={() => onChange({ ventilationType: undefined })} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("ventilation.leakage")}</h3>
        <HelperText>{t("ventilation.leakage.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.airLeakage === "none"} label={t("ventilation.none")} onClick={() => onChange({ airLeakage: "none" })} />
          <OptionRow selected={data.airLeakage === "slight"} label={t("ventilation.slight")} onClick={() => onChange({ airLeakage: "slight" })} />
          <OptionRow selected={data.airLeakage === "moderate"} label={t("ventilation.moderate")} onClick={() => onChange({ airLeakage: "moderate" })} />
          <OptionRow selected={data.airLeakage === "significant"} label={t("ventilation.significant")} onClick={() => onChange({ airLeakage: "significant" })} />
          <OptionRow selected={!data.airLeakage} label={t("ventilation.leakage.idk")} onClick={() => onChange({ airLeakage: undefined })} />
        </div>
      </div>
    </div>
  );
};

export default StepVentilation;
