import type { FormData, ConstructionPeriod } from "@/lib/types";
import { HelpCircle, Home, Building2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/lib/i18n";
import { useEffect } from "react";

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

const CardOption = ({
  selected,
  label,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 rounded-lg border px-6 py-4 transition-all ${
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border hover:border-primary/40 hover:bg-muted/30"
    }`}
  >
    <Icon className={`h-6 w-6 ${selected ? "text-primary" : "text-muted-foreground"}`} />
    <span className="text-sm font-medium text-foreground">{label}</span>
  </button>
);

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1;
  const suffix = num === 1 ? "er" : "ème";
  return { value: `${num}`, label: `${num}${suffix} arrondissement` };
});

const StepGeneralInfo = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  const constructionPeriods: ConstructionPeriod[] = [
    "before1948",
    "1948-1974",
    "1975-1988",
    "1989-2000",
    "2001-2012",
    "after2012",
  ];

  // Auto-set Paris climate zone
  useEffect(() => {
    if (!data.climateZone) {
      onChange({ postalCode: "75", climateZone: "H1" });
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Housing type */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("general.housing_type")}</h3>
        <HelperText>{t("general.housing_type.help")}</HelperText>
        <div className="grid grid-cols-2 gap-3">
          <CardOption selected={data.housingType === "apartment"} label={t("general.apartment")} icon={Building2} onClick={() => onChange({ housingType: "apartment" })} />
          <CardOption selected={data.housingType === "house"} label={t("general.house")} icon={Home} onClick={() => onChange({ housingType: "house" })} />
        </div>
      </div>

      {/* Surface with slider — NO pre-fill */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("general.surface")}</h3>
        <HelperText>{t("general.surface.help")}</HelperText>
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm text-muted-foreground">{t("general.surface")}</span>
            <span className="text-3xl font-bold text-primary">
              {data.surfaceArea ? (
                <>{data.surfaceArea} <span className="text-base font-normal text-muted-foreground">m²</span></>
              ) : (
                <span className="text-muted-foreground/40 font-normal text-xl">ex. 49 m²</span>
              )}
            </span>
          </div>
          <Slider
            value={data.surfaceArea ? [data.surfaceArea] : [5]}
            onValueChange={([v]) => onChange({ surfaceArea: v })}
            min={5}
            max={300}
            step={1}
            className={`w-full ${!data.surfaceArea ? "opacity-40" : ""}`}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>5 m²</span>
            <span className="text-primary font-medium">{t("general.paris_avg")}</span>
            <span>300 m²</span>
          </div>
        </div>
      </div>

      {/* Arrondissement selector only */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("general.arrondissement")}</h3>
        <HelperText>{t("general.arrondissement.help")}</HelperText>
        <div className="grid grid-cols-4 gap-2">
          {ARRONDISSEMENTS.map((arr) => (
            <button
              key={arr.value}
              type="button"
              onClick={() => onChange({ arrondissement: arr.value })}
              className={`rounded-lg border px-2 py-2 text-center text-xs font-medium transition-all ${
                data.arrondissement === arr.value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {arr.value}{arr.value === "1" ? "er" : "e"}
            </button>
          ))}
        </div>
      </div>

      {/* Construction period */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("general.construction")}</h3>
        <HelperText>{t("general.construction.help")}</HelperText>
        <div className="space-y-2">
          {constructionPeriods.map((p) => (
            <OptionRow key={p} selected={data.constructionPeriod === p} label={t(`general.period.${p}`)} onClick={() => onChange({ constructionPeriod: p })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepGeneralInfo;