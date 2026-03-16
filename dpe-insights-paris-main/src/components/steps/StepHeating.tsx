import type { FormData, HeatingType } from "@/lib/types";
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

const CheckboxRow = ({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
      checked
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border hover:border-primary/40 hover:bg-muted/30"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked ? "border-primary bg-primary" : "border-muted-foreground/40"
        }`}
      >
        {checked && <span className="text-[10px] leading-none text-primary-foreground">✓</span>}
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
    </div>
  </button>
);

const StepHeating = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  const heatingOptions: { value: HeatingType; labelKey: string }[] = [
    { value: "electric_convector", labelKey: "heating.electric_convector" },
    { value: "electric_radiant", labelKey: "heating.electric_radiant" },
    { value: "gas_boiler", labelKey: "heating.gas_boiler" },
    { value: "gas_condensing", labelKey: "heating.gas_condensing" },
    { value: "fuel_boiler", labelKey: "heating.fuel_boiler" },
    { value: "heat_pump", labelKey: "heating.heat_pump" },
    { value: "wood", labelKey: "heating.wood" },
  ];

  const currentTypes = data.heatingTypes || [];

  const toggleHeatingType = (ht: HeatingType) => {
    if (currentTypes.includes(ht)) {
      onChange({ heatingTypes: currentTypes.filter((t) => t !== ht) });
    } else {
      onChange({ heatingTypes: [...currentTypes, ht] });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("heating.type")}</h3>
        <HelperText>{t("heating.type.help")}</HelperText>
        <p className="text-xs text-muted-foreground">{t("heating.multi")}</p>
        <div className="space-y-2">
          {heatingOptions.map((opt) => (
            <CheckboxRow
              key={opt.value}
              checked={currentTypes.includes(opt.value)}
              label={t(opt.labelKey)}
              onClick={() => toggleHeatingType(opt.value)}
            />
          ))}
          <OptionRow
            selected={currentTypes.length === 0}
            label={t("heating.idk")}
            desc={t("heating.idk.desc")}
            onClick={() => onChange({ heatingTypes: [] })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("heating.age")}</h3>
        <HelperText>{t("heating.age.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.heatingAge === "less5"} label={t("heating.age.less5")} onClick={() => onChange({ heatingAge: "less5" })} />
          <OptionRow selected={data.heatingAge === "5to15"} label={t("heating.age.5to15")} onClick={() => onChange({ heatingAge: "5to15" })} />
          <OptionRow selected={data.heatingAge === "15to25"} label={t("heating.age.15to25")} onClick={() => onChange({ heatingAge: "15to25" })} />
          <OptionRow selected={data.heatingAge === "more25"} label={t("heating.age.more25")} onClick={() => onChange({ heatingAge: "more25" })} />
          <OptionRow selected={!data.heatingAge} label={t("heating.age.idk")} onClick={() => onChange({ heatingAge: undefined })} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("heating.distribution")}</h3>
        <HelperText>{t("heating.distribution.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.distributionSystem === "radiators"} label={t("heating.radiators")} onClick={() => onChange({ distributionSystem: "radiators" })} />
          <OptionRow selected={data.distributionSystem === "floor_heating"} label={t("heating.floor_heating")} onClick={() => onChange({ distributionSystem: "floor_heating" })} />
          <OptionRow selected={!data.distributionSystem} label={t("heating.distribution.idk")} onClick={() => onChange({ distributionSystem: undefined })} />
        </div>
      </div>
    </div>
  );
};

export default StepHeating;
