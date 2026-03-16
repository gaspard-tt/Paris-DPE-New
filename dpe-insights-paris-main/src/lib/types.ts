export type HousingType = "apartment" | "house";

export type ConstructionPeriod =
  | "before1948"
  | "1948-1974"
  | "1975-1988"
  | "1989-2000"
  | "2001-2012"
  | "after2012";

export type ClimateZone = "H1" | "H2" | "H3";

export type InsulationQuality = "none" | "poor" | "average" | "good" | "excellent";

export type WindowType = "single" | "double" | "triple";

export type Orientation = "north" | "south" | "east" | "west";

export type HeatingType =
  | "electric_convector"
  | "electric_radiant"
  | "gas_boiler"
  | "gas_condensing"
  | "fuel_boiler"
  | "heat_pump"
  | "wood";

export type HeatingAge = "less5" | "5to15" | "15to25" | "more25";

export type DistributionSystem = "radiators" | "floor_heating";

export type EnergySource = "electricity" | "gas" | "fuel" | "renewable" | "hybrid";

export type VentilationType = "natural" | "vmc_simple" | "vmc_double";

export type AirLeakage = "none" | "slight" | "moderate" | "significant";

export type UsageLevel = "low" | "average" | "high";

export type DPEClass = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type HeatingFrequency = "rarely" | "sometimes" | "often" | "always";
export type AiringHabit = "never" | "sometimes" | "daily" | "multiple";
export type LaundryFrequency = "1_2" | "3_4" | "5_plus";

export interface FormData {
  // Step 1: General
  housingType?: HousingType;
  surfaceArea?: number;
  constructionPeriod?: ConstructionPeriod;
  climateZone?: ClimateZone;
  postalCode?: string;
  arrondissement?: string;

  // Step 2: Current DPE & bill
  currentDPE?: DPEClass;
  annualBill?: number;

  // Step 3: Envelope
  wallInsulation?: InsulationQuality;
  roofInsulation?: InsulationQuality;
  floorInsulation?: InsulationQuality;
  windowType?: WindowType;
  windowSurface?: number;
  orientation?: Orientation;

  // Step 4: Heating (multi-select)
  heatingTypes?: HeatingType[];
  heatingAge?: HeatingAge;
  distributionSystem?: DistributionSystem;

  // Step 5: Energy (multi-select now)
  energySources?: EnergySource[];
  /** @deprecated use energySources */
  energySource?: EnergySource;

  // Step 6: Ventilation
  ventilationType?: VentilationType;
  airLeakage?: AirLeakage;

  // Step 7: Occupancy & Habits
  occupants?: number;
  heatingHabits?: UsageLevel;
  hotWaterUsage?: UsageLevel;
  thermostatTemp?: number;

  // Expanded habits
  heatingFrequency?: HeatingFrequency;
  airingHabit?: AiringHabit;
  laundryFrequency?: LaundryFrequency;
  usesDishwasher?: boolean;
  usesDryer?: boolean;
  leavesLightsOn?: boolean;
  programmableHeating?: boolean;
}

export interface EnergyBreakdown {
  heating: number;
  hotWater: number;
  envelopeLosses: number;
  total: number;
}

export interface Weakness {
  id: string;
  label: string;
  category: "envelope" | "heating" | "ventilation";
  severity: "high" | "medium" | "low";
  description: string;
  impactScore: number;
}

export interface Recommendation {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  reason: string;
  dpeImpact: string;
  comfortImpact: string;
  billImpact: string;
  explanation: string;
  estimatedSaving: number;
  estimatedCost?: string;
  parisAid?: string;
  providers?: string[];
}

export interface DPEResult {
  dpeClass: DPEClass;
  consumption: number;
  energyBreakdown: EnergyBreakdown;
  weaknesses: Weakness[];
  recommendations: Recommendation[];
}

export const DEFAULT_FORM_DATA: FormData = {};
