import type { FormData } from "@/lib/types";
import { HelpCircle, Thermometer, Users, Droplets, Flame, Wind, Shirt, Lightbulb } from "lucide-react";
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

const ToggleRow = ({
  checked,
  label,
  onClick,
}: {
  checked: boolean | undefined;
  label: string;
  onClick: (val: boolean) => void;
}) => {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onClick(true)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
            checked === true ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("habits.yes")}
        </button>
        <button
          type="button"
          onClick={() => onClick(false)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
            checked === false ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("habits.no")}
        </button>
      </div>
    </div>
  );
};

const StepOccupancy = ({ data, onChange }: Props) => {
  const { t } = useI18n();

  const getThermostatLevel = (temp: number) => {
    if (temp <= 18.5) return "low";
    if (temp <= 20) return "average";
    return "high";
  };

  const thermostatColor = !data.thermostatTemp
    ? "text-muted-foreground/40"
    : data.thermostatTemp <= 18.5
    ? "text-teal"
    : data.thermostatTemp <= 20
    ? "text-primary"
    : data.thermostatTemp <= 21.5
    ? "text-amber"
    : "text-rose";

  const thermostatHint = !data.thermostatTemp
    ? ""
    : data.thermostatTemp <= 18.5
    ? t("occupancy.thermo.eco")
    : data.thermostatTemp <= 20
    ? t("occupancy.thermo.comfort")
    : data.thermostatTemp <= 21.5
    ? t("occupancy.thermo.warm")
    : t("occupancy.thermo.hot");

  return (
    <div className="space-y-8">
      {/* Occupants slider — NO prefill */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Users className="h-5 w-5 text-indigo" />
          {t("occupancy.count")}
        </h3>
        <HelperText>{t("occupancy.count.help")}</HelperText>
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-sm text-muted-foreground">{t("occupancy.people")}</span>
            <span className="text-3xl font-bold text-indigo">
              {data.occupants ? (
                <>{data.occupants} <span className="text-base font-normal text-muted-foreground">{data.occupants > 1 ? t("occupancy.persons") : t("occupancy.person")}</span></>
              ) : (
                <span className="text-xl font-normal text-muted-foreground/40">ex. 2</span>
              )}
            </span>
          </div>
          <Slider
            value={data.occupants ? [data.occupants] : [1]}
            onValueChange={([v]) => onChange({ occupants: v })}
            min={1}
            max={8}
            step={1}
            className={`w-full ${!data.occupants ? "opacity-40" : ""}`}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span className="text-primary font-medium">{t("occupancy.paris_avg")}</span>
            <span>8+</span>
          </div>
        </div>
      </div>

      {/* Hot water usage */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Droplets className="h-5 w-5 text-primary" />
          {t("occupancy.hot_water")}
        </h3>
        <HelperText>{t("occupancy.hot_water.help")}</HelperText>
        <div className="space-y-2">
          <OptionRow selected={data.hotWaterUsage === "low"} label={t("occupancy.hw_low")} onClick={() => onChange({ hotWaterUsage: "low" })} />
          <OptionRow selected={data.hotWaterUsage === "average"} label={t("occupancy.hw_average")} onClick={() => onChange({ hotWaterUsage: "average" })} />
          <OptionRow selected={data.hotWaterUsage === "high"} label={t("occupancy.hw_high")} onClick={() => onChange({ hotWaterUsage: "high" })} />
        </div>
      </div>

      {/* Thermostat slider — NO prefill */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Thermometer className="h-5 w-5 text-rose" />
          {t("occupancy.thermostat")}
        </h3>
        <HelperText>{t("occupancy.thermostat.help")}</HelperText>
        <div className="rounded-xl border bg-muted/20 p-5">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t("occupancy.temperature")}</span>
            <span className={`text-3xl font-bold ${thermostatColor}`}>
              {data.thermostatTemp ? (
                <>{data.thermostatTemp.toFixed(1)} <span className="text-base font-normal text-muted-foreground">°C</span></>
              ) : (
                <span className="text-xl font-normal text-muted-foreground/40">ex. 19.5°C</span>
              )}
            </span>
          </div>
          {thermostatHint && <p className={`text-xs font-medium mb-4 ${thermostatColor}`}>{thermostatHint}</p>}
          <Slider
            value={data.thermostatTemp ? [data.thermostatTemp] : [15]}
            onValueChange={([v]) => {
              onChange({
                thermostatTemp: v,
                heatingHabits: getThermostatLevel(v),
              });
            }}
            min={15}
            max={25}
            step={0.5}
            className={`w-full ${!data.thermostatTemp ? "opacity-40" : ""}`}
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>15°C</span>
            <span className="text-primary font-medium">{t("occupancy.recommended")}</span>
            <span>25°C</span>
          </div>
        </div>
      </div>

      {/* ── Expanded Habits Section ── */}
      <div className="space-y-4 rounded-xl border bg-muted/10 p-5">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t("habits.title")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("habits.subtitle")}</p>
        </div>

        {/* Heating frequency */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Flame className="h-4 w-4 text-rose" />
            {t("habits.heating_freq")}
          </h4>
          <HelperText>{t("habits.heating_freq.help")}</HelperText>
          <div className="space-y-1.5">
            <OptionRow selected={data.heatingFrequency === "rarely"} label={t("habits.heating_freq.rarely")} onClick={() => onChange({ heatingFrequency: "rarely" })} />
            <OptionRow selected={data.heatingFrequency === "sometimes"} label={t("habits.heating_freq.sometimes")} onClick={() => onChange({ heatingFrequency: "sometimes" })} />
            <OptionRow selected={data.heatingFrequency === "often"} label={t("habits.heating_freq.often")} onClick={() => onChange({ heatingFrequency: "often" })} />
            <OptionRow selected={data.heatingFrequency === "always"} label={t("habits.heating_freq.always")} onClick={() => onChange({ heatingFrequency: "always" })} />
          </div>
        </div>

        {/* Airing */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wind className="h-4 w-4 text-teal" />
            {t("habits.airing")}
          </h4>
          <HelperText>{t("habits.airing.help")}</HelperText>
          <div className="space-y-1.5">
            <OptionRow selected={data.airingHabit === "never"} label={t("habits.airing.never")} onClick={() => onChange({ airingHabit: "never" })} />
            <OptionRow selected={data.airingHabit === "sometimes"} label={t("habits.airing.sometimes")} onClick={() => onChange({ airingHabit: "sometimes" })} />
            <OptionRow selected={data.airingHabit === "daily"} label={t("habits.airing.daily")} onClick={() => onChange({ airingHabit: "daily" })} />
            <OptionRow selected={data.airingHabit === "multiple"} label={t("habits.airing.multiple")} onClick={() => onChange({ airingHabit: "multiple" })} />
          </div>
        </div>

        {/* Laundry */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Shirt className="h-4 w-4 text-indigo" />
            {t("habits.laundry")}
          </h4>
          <HelperText>{t("habits.laundry.help")}</HelperText>
          <div className="space-y-1.5">
            <OptionRow selected={data.laundryFrequency === "1_2"} label={t("habits.laundry.1_2")} onClick={() => onChange({ laundryFrequency: "1_2" })} />
            <OptionRow selected={data.laundryFrequency === "3_4"} label={t("habits.laundry.3_4")} onClick={() => onChange({ laundryFrequency: "3_4" })} />
            <OptionRow selected={data.laundryFrequency === "5_plus"} label={t("habits.laundry.5_plus")} onClick={() => onChange({ laundryFrequency: "5_plus" })} />
          </div>
        </div>

        {/* Toggle questions */}
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Lightbulb className="h-4 w-4 text-amber" />
            {t("habits.title")}
          </h4>
          <div className="space-y-2">
            <ToggleRow checked={data.usesDishwasher} label={t("habits.dishwasher")} onClick={(v) => onChange({ usesDishwasher: v })} />
            <ToggleRow checked={data.usesDryer} label={t("habits.dryer")} onClick={(v) => onChange({ usesDryer: v })} />
            <ToggleRow checked={data.leavesLightsOn} label={t("habits.lights")} onClick={(v) => onChange({ leavesLightsOn: v })} />
            <ToggleRow checked={data.programmableHeating} label={t("habits.programmable")} onClick={(v) => onChange({ programmableHeating: v })} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepOccupancy;