import type { FormData, InsulationQuality, Orientation } from "@/lib/types";
import { HelpCircle, Compass } from "lucide-react";
import { Slider } from "@/components/ui/slider";
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
  desc: string;
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
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </div>
  </button>
);

const INSULATION_LEVELS: InsulationQuality[] = ["none", "poor", "average", "good", "excellent"];

const InsulationSlider = ({
  title,
  helper,
  value,
  onChangeVal,
  t,
}: {
  title: string;
  helper: string;
  value?: InsulationQuality;
  onChangeVal: (v: InsulationQuality | undefined) => void;
  t: (key: string) => string;
}) => {
  // No pre-fill: if undefined, show "not set" state
  const hasValue = value !== undefined;
  const currentIndex = hasValue ? INSULATION_LEVELS.indexOf(value) : -1;
  const current = hasValue ? INSULATION_LEVELS[currentIndex] : null;

  const colorMap: Record<InsulationQuality, string> = {
    none: "text-destructive",
    poor: "text-rose",
    average: "text-amber",
    good: "text-teal",
    excellent: "text-success",
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <HelperText>{helper}</HelperText>
      <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm text-muted-foreground">{t("envelope.quality")}</span>
          {current ? (
            <span className={`text-lg font-bold ${colorMap[current]}`}>
              {t(`envelope.insulation.${current}`)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/40">—</span>
          )}
        </div>
        {current && (
          <p className="text-xs text-muted-foreground mb-4">{t(`envelope.insulation.${current}.desc`)}</p>
        )}
        <Slider
          value={[hasValue ? currentIndex : 0]}
          onValueChange={([v]) => onChangeVal(INSULATION_LEVELS[v])}
          min={0}
          max={4}
          step={1}
          className={`w-full ${!hasValue ? "opacity-40" : ""}`}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{t("envelope.insulation.none")}</span>
          <span>{t("envelope.insulation.excellent")}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChangeVal(undefined)}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm text-left transition-all ${
          !hasValue
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        }`}
      >
        <span className="text-muted-foreground">{t("envelope.insulation.idk")}</span>
      </button>
    </div>
  );
};

const StepEnvelope = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <InsulationSlider
        title={t("envelope.wall")}
        helper={t("envelope.wall.help")}
        value={data.wallInsulation}
        onChangeVal={(v) => onChange({ wallInsulation: v })}
        t={t}
      />
      <InsulationSlider
        title={t("envelope.roof")}
        helper={t("envelope.roof.help")}
        value={data.roofInsulation}
        onChangeVal={(v) => onChange({ roofInsulation: v })}
        t={t}
      />
      <InsulationSlider
        title={t("envelope.floor")}
        helper={t("envelope.floor.help")}
        value={data.floorInsulation}
        onChangeVal={(v) => onChange({ floorInsulation: v })}
        t={t}
      />

      {/* Window type */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{t("envelope.window_type")}</h3>
        <HelperText>{t("envelope.window_type.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.windowType === "single"} label={t("envelope.window.single")} desc={t("envelope.window.single.desc")} onClick={() => onChange({ windowType: "single" })} />
          <OptionRow selected={data.windowType === "double"} label={t("envelope.window.double")} desc={t("envelope.window.double.desc")} onClick={() => onChange({ windowType: "double" })} />
          <OptionRow selected={data.windowType === "triple"} label={t("envelope.window.triple")} desc={t("envelope.window.triple.desc")} onClick={() => onChange({ windowType: "triple" })} />
          <OptionRow selected={!data.windowType} label={t("envelope.window.idk")} desc={t("envelope.window.idk.desc")} onClick={() => onChange({ windowType: undefined })} />
        </div>
      </div>

      {/* Orientation */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Compass className="h-5 w-5 text-teal" />
          {t("envelope.orientation")}
        </h3>
        <HelperText>{t("envelope.orientation.help")}</HelperText>
        <div className="grid grid-cols-2 gap-2">
          {(["north", "south", "east", "west"] as Orientation[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onChange({ orientation: o })}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                data.orientation === o
                  ? "border-teal bg-teal/5 text-teal shadow-sm"
                  : "border-border text-foreground hover:border-teal/40 hover:bg-muted/30"
              }`}
            >
              {t(`envelope.dir.${o}`)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ orientation: undefined })}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm text-left transition-all ${
            !data.orientation
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          }`}
        >
          <span className="text-muted-foreground">{t("envelope.orientation.idk")}</span>
        </button>
      </div>
    </div>
  );
};

export default StepEnvelope;
