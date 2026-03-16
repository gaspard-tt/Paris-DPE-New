import type {
  FormData,
  DPEResult,
  DPEClass,
  EnergyBreakdown,
  Weakness,
  Recommendation,
  HeatingType,
} from "./types";
import type { Language } from "./i18n";

// --- Base consumption by construction period (kWh/m²/an) ---
const BASE_CONSUMPTION: Record<string, number> = {
  before1948: 380,
  "1948-1974": 330,
  "1975-1988": 250,
  "1989-2000": 190,
  "2001-2012": 130,
  after2012: 70,
};

const CLIMATE_MULTIPLIER: Record<string, number> = {
  H1: 1.15,
  H2: 1.0,
  H3: 0.8,
};

const INSULATION_COEFF: Record<string, number> = {
  none: 1.4,
  poor: 1.2,
  average: 1.0,
  good: 0.75,
  excellent: 0.55,
};

const WINDOW_COEFF: Record<string, number> = {
  single: 1.35,
  double: 1.0,
  triple: 0.8,
};

const HEATING_EFFICIENCY: Record<string, number> = {
  electric_convector: 1.3,
  electric_radiant: 1.1,
  gas_boiler: 1.0,
  gas_condensing: 0.82,
  fuel_boiler: 1.2,
  heat_pump: 0.55,
  wood: 0.9,
};

const HEATING_AGE_MULT: Record<string, number> = {
  less5: 0.9,
  "5to15": 1.0,
  "15to25": 1.15,
  more25: 1.35,
};

const DISTRIBUTION_COEFF: Record<string, number> = {
  radiators: 1.0,
  floor_heating: 0.88,
};

const VENTILATION_COEFF: Record<string, number> = {
  natural: 1.2,
  vmc_simple: 1.0,
  vmc_double: 0.78,
};

const LEAKAGE_COEFF: Record<string, number> = {
  none: 0.95,
  slight: 1.0,
  moderate: 1.12,
  significant: 1.3,
};

const USAGE_COEFF: Record<string, number> = {
  low: 0.85,
  average: 1.0,
  high: 1.2,
};

const ORIENTATION_COEFF: Record<string, number> = {
  south: 0.92,
  east: 0.97,
  west: 0.97,
  north: 1.05,
};

function getDPEClass(consumption: number): DPEClass {
  if (consumption <= 70) return "A";
  if (consumption <= 110) return "B";
  if (consumption <= 180) return "C";
  if (consumption <= 250) return "D";
  if (consumption <= 330) return "E";
  if (consumption <= 420) return "F";
  return "G";
}

function getPrimaryHeatingType(data: FormData): HeatingType {
  if (data.heatingTypes && data.heatingTypes.length > 0) {
    return data.heatingTypes[0];
  }
  return "gas_boiler";
}

function txt(lang: Language, fr: string, en: string): string {
  return lang === "fr" ? fr : en;
}

function calculateConsumption(data: FormData): number {
  const base = BASE_CONSUMPTION[data.constructionPeriod || "1975-1988"];
  const climate = CLIMATE_MULTIPLIER[data.climateZone || "H1"];

  const wallWeight = 0.4;
  const roofWeight = 0.3;
  const floorWeight = 0.15;
  const windowWeight = 0.15;

  const envelopeFactor =
    INSULATION_COEFF[data.wallInsulation || "average"] * wallWeight +
    INSULATION_COEFF[data.roofInsulation || "average"] * roofWeight +
    INSULATION_COEFF[data.floorInsulation || "average"] * floorWeight +
    WINDOW_COEFF[data.windowType || "double"] * windowWeight;

  const surfaceArea = data.surfaceArea || 70;
  const windowSurface = data.windowSurface || 15;
  const windowRatio = windowSurface / surfaceArea;
  const windowSurfaceImpact = windowRatio > 0.2 ? 0.95 : windowRatio < 0.1 ? 1.05 : 1.0;

  const heatingTypes = data.heatingTypes || [];
  let heatingEfficiency = HEATING_EFFICIENCY["gas_boiler"];
  if (heatingTypes.length > 0) {
    heatingEfficiency = heatingTypes.reduce((sum, ht) => sum + (HEATING_EFFICIENCY[ht] || 1.0), 0) / heatingTypes.length;
  }

  const heatingFactor =
    heatingEfficiency *
    HEATING_AGE_MULT[data.heatingAge || "5to15"] *
    DISTRIBUTION_COEFF[data.distributionSystem || "radiators"];

  const ventilationFactor =
    VENTILATION_COEFF[data.ventilationType || "vmc_simple"] *
    LEAKAGE_COEFF[data.airLeakage || "slight"];

  let usageFactor: number;
  if (data.thermostatTemp) {
    const tempCoeff = 1 + (data.thermostatTemp - 19) * 0.07;
    usageFactor = tempCoeff * 0.6 + USAGE_COEFF[data.hotWaterUsage || "average"] * 0.4;
  } else {
    usageFactor =
      USAGE_COEFF[data.heatingHabits || "average"] * 0.6 +
      USAGE_COEFF[data.hotWaterUsage || "average"] * 0.4;
  }

  // Habits adjustments
  if (data.heatingFrequency === "always") usageFactor *= 1.1;
  else if (data.heatingFrequency === "rarely") usageFactor *= 0.85;
  else if (data.heatingFrequency === "sometimes") usageFactor *= 0.92;

  if (data.airingHabit === "multiple") usageFactor *= 1.08;
  if (data.usesDryer) usageFactor *= 1.03;
  if (data.laundryFrequency === "5_plus") usageFactor *= 1.02;

  const orientationFactor = ORIENTATION_COEFF[data.orientation || "south"];

  const consumption =
    base * climate * envelopeFactor * windowSurfaceImpact *
    heatingFactor * ventilationFactor * usageFactor * orientationFactor;

  return Math.round(consumption);
}

function calculateBreakdown(total: number, data: FormData): EnergyBreakdown {
  const envelopeShare =
    (INSULATION_COEFF[data.wallInsulation || "average"] +
      INSULATION_COEFF[data.roofInsulation || "average"] +
      WINDOW_COEFF[data.windowType || "double"]) / 3;

  const primaryHT = getPrimaryHeatingType(data);
  const heatingShare = HEATING_EFFICIENCY[primaryHT];
  const hotWaterShare = USAGE_COEFF[data.hotWaterUsage || "average"] * 0.3;

  const totalShares = envelopeShare + heatingShare + hotWaterShare;

  return {
    heating: Math.round((heatingShare / totalShares) * total),
    hotWater: Math.round((hotWaterShare / totalShares) * total),
    envelopeLosses: Math.round((envelopeShare / totalShares) * total),
    total,
  };
}

function identifyWeaknesses(data: FormData, lang: Language): Weakness[] {
  const weaknesses: Weakness[] = [];

  if (data.wallInsulation === "none" || data.wallInsulation === "poor") {
    weaknesses.push({
      id: "wall_insulation",
      label: txt(lang, "Murs mal isolés — chaleur et argent s'échappent", "Poorly insulated walls — heat and money escaping"),
      category: "envelope",
      severity: data.wallInsulation === "none" ? "high" : "medium",
      description: txt(lang,
        "Les murs sont responsables de 20 à 25% des pertes de chaleur. Ça peut représenter plusieurs centaines d'euros par an en chauffage gaspillé.",
        "Walls account for 20–25% of heat loss. That can mean hundreds of euros per year in wasted heating."
      ),
      impactScore: data.wallInsulation === "none" ? 90 : 70,
    });
  }

  if (data.roofInsulation === "none" || data.roofInsulation === "poor") {
    weaknesses.push({
      id: "roof_insulation",
      label: txt(lang, "Toiture mal isolée — jusqu'à 30% de chaleur perdue", "Poorly insulated roof — up to 30% of heat lost"),
      category: "envelope",
      severity: "high",
      description: txt(lang,
        "La chaleur monte. Sans isolation au toit, elle s'échappe directement dehors. C'est souvent le poste le plus rentable à traiter.",
        "Heat rises. Without roof insulation, it escapes straight outside. This is often the most cost-effective fix."
      ),
      impactScore: data.roofInsulation === "none" ? 95 : 80,
    });
  }

  if (data.floorInsulation === "none" || data.floorInsulation === "poor") {
    weaknesses.push({
      id: "floor_insulation",
      label: txt(lang, "Plancher non isolé — froid qui remonte", "Uninsulated floor — cold rising from below"),
      category: "envelope",
      severity: "medium",
      description: txt(lang,
        "Le plancher représente 7 à 10% des pertes, surtout au rez-de-chaussée au-dessus d'une cave.",
        "The floor accounts for 7–10% of losses, especially at ground level above a cellar."
      ),
      impactScore: data.floorInsulation === "none" ? 50 : 35,
    });
  }

  if (data.windowType === "single") {
    weaknesses.push({
      id: "windows",
      label: txt(lang, "Simple vitrage — 3 à 4 fois plus de pertes", "Single glazing — 3–4x more heat loss"),
      category: "envelope",
      severity: "high",
      description: txt(lang,
        "Le simple vitrage laisse passer 3 à 4 fois plus de chaleur que le double vitrage. Remplacer vos fenêtres peut réduire votre facture de 10 à 15%.",
        "Single glazing lets through 3–4x more heat than double glazing. Replacing windows can cut your bill by 10–15%."
      ),
      impactScore: 85,
    });
  }

  const heatingTypes = data.heatingTypes || [];
  if (heatingTypes.includes("electric_convector")) {
    weaknesses.push({
      id: "heating_type",
      label: txt(lang, "Convecteurs électriques — le chauffage le plus cher", "Electric convectors — the most expensive heating"),
      category: "heating",
      severity: "high",
      description: txt(lang,
        "Les convecteurs consomment bien plus que les alternatives modernes. Passer à une pompe à chaleur peut diviser votre facture chauffage par 3.",
        "Convectors consume far more than modern alternatives. Switching to a heat pump can cut your heating bill by 3x."
      ),
      impactScore: 80,
    });
  }

  if (heatingTypes.includes("fuel_boiler")) {
    weaknesses.push({
      id: "heating_fuel",
      label: txt(lang, "Chaudière fioul — énergie la plus polluante et la plus chère", "Oil boiler — most polluting and expensive energy"),
      category: "heating",
      severity: "high",
      description: txt(lang,
        "Le fioul est l'énergie la plus carbonée et son prix ne cesse d'augmenter. Son remplacement sera obligatoire à terme.",
        "Fuel oil is the most carbon-heavy energy and its price keeps rising. Replacement will become mandatory."
      ),
      impactScore: 85,
    });
  }

  if (data.heatingAge === "more25" || data.heatingAge === "15to25") {
    weaknesses.push({
      id: "heating_age",
      label: txt(lang, "Système de chauffage ancien — perd en efficacité", "Ageing heating system — losing efficiency"),
      category: "heating",
      severity: data.heatingAge === "more25" ? "high" : "medium",
      description: txt(lang,
        "Un système vieillissant perd 20 à 40% de son efficacité. Le remplacer peut réduire significativement votre facture.",
        "An ageing system loses 20–40% of its efficiency. Replacing it can significantly cut your bill."
      ),
      impactScore: data.heatingAge === "more25" ? 75 : 50,
    });
  }

  if (data.ventilationType === "natural") {
    weaknesses.push({
      id: "ventilation",
      label: txt(lang, "Ventilation naturelle — pertes de chaleur incontrôlées", "Natural ventilation — uncontrolled heat loss"),
      category: "ventilation",
      severity: "medium",
      description: txt(lang,
        "Sans VMC, le renouvellement d'air est incontrôlé. Vous chauffez l'air qui s'échappe sans rien récupérer.",
        "Without mechanical ventilation, air renewal is uncontrolled. You're heating air that escapes without recovering anything."
      ),
      impactScore: 60,
    });
  }

  if (data.airLeakage === "significant" || data.airLeakage === "moderate") {
    weaknesses.push({
      id: "air_leakage",
      label: txt(lang, "Courants d'air — chauffage gaspillé", "Draughts — wasted heating"),
      category: "ventilation",
      severity: data.airLeakage === "significant" ? "high" : "medium",
      description: txt(lang,
        "Les infiltrations d'air augmentent votre facture de chauffage de 10 à 25%. Souvent réparable pour moins de 100 €.",
        "Air infiltrations increase your heating bill by 10–25%. Often fixable for under €100."
      ),
      impactScore: data.airLeakage === "significant" ? 70 : 45,
    });
  }

  weaknesses.sort((a, b) => b.impactScore - a.impactScore);
  return weaknesses;
}

function generateRecommendations(data: FormData, weaknesses: Weakness[], lang: Language): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const weaknessIds = new Set(weaknesses.map((w) => w.id));
  const isParis = data.postalCode === "75";

  if (weaknessIds.has("roof_insulation")) {
    recommendations.push({
      id: "insulate_roof",
      name: txt(lang, "Isoler la toiture ou les combles", "Insulate the roof or loft"),
      priority: "high",
      reason: txt(lang,
        "La toiture est votre premier poste de déperdition. L'isoler est le geste le plus rentable.",
        "The roof is your biggest source of heat loss. Insulating it is the most cost-effective measure."
      ),
      dpeImpact: txt(lang, "Gain potentiel de 1 à 2 classes", "Potential gain of 1–2 classes"),
      comfortImpact: txt(lang, "Nette amélioration du confort été comme hiver", "Major improvement in comfort summer and winter"),
      billImpact: txt(lang, "Économie estimée de 20 à 30% sur votre facture de chauffage", "Estimated 20–30% saving on your heating bill"),
      explanation: txt(lang,
        "L'air chaud monte. Sans isolation, la chaleur s'échappe par le toit. Pour les derniers étages parisiens, c'est souvent le travail le plus rentable.",
        "Hot air rises. Without insulation, heat escapes through the roof. For top-floor Parisian flats, this is often the highest-ROI work."
      ),
      estimatedSaving: 25,
      estimatedCost: txt(lang, "30–60 €/m² (combles perdus) à 100–200 €/m² (toiture extérieure)", "€30–60/m² (loft) to €100–200/m² (external roof)"),
      parisAid: isParis
        ? txt(lang,
          "Éco-rénovons Paris+ : subvention jusqu'à 30%. MaPrimeRénov' : jusqu'à 25 €/m² pour les ménages modestes.",
          "Éco-rénovons Paris+: grant up to 30%. MaPrimeRénov': up to €25/m² for low-income households."
        )
        : txt(lang,
          "MaPrimeRénov' : jusqu'à 25 €/m². CEE cumulables.",
          "MaPrimeRénov': up to €25/m². CEE combinable."
        ),
      providers: isParis
        ? ["CAUE de Paris", "Agence Parisienne du Climat", "Espace Conseil France Rénov' Paris"]
        : ["Espace Conseil France Rénov' Île-de-France"],
    });
  }

  if (weaknessIds.has("wall_insulation")) {
    recommendations.push({
      id: "insulate_walls",
      name: txt(lang, "Isoler les murs", "Insulate the walls"),
      priority: "high",
      reason: txt(lang,
        "Les murs sont la deuxième source de pertes. Les isoler transforme le confort et la facture.",
        "Walls are the second biggest source of heat loss. Insulating them transforms comfort and bills."
      ),
      dpeImpact: txt(lang, "Gain potentiel de 1 classe", "Potential gain of 1 class"),
      comfortImpact: txt(lang, "Fini l'effet « mur froid »", "No more 'cold wall' effect"),
      billImpact: txt(lang, "Économie estimée de 15 à 25% sur la facture", "Estimated 15–25% saving on bills"),
      explanation: isParis
        ? txt(lang,
          "Dans les immeubles haussmanniens, l'ITE (par l'extérieur) nécessite l'accord de l'ABF. L'ITI (par l'intérieur) est plus simple mais réduit un peu la surface.",
          "In Haussmann buildings, external insulation needs ABF approval. Internal insulation is simpler but slightly reduces living space."
        )
        : txt(lang,
          "L'ITE est la plus performante, l'ITI est moins coûteuse.",
          "External insulation is most effective, internal is cheaper."
        ),
      estimatedSaving: 20,
      estimatedCost: txt(lang, "100–180 €/m² (intérieur) à 150–250 €/m² (extérieur)", "€100–180/m² (internal) to €150–250/m² (external)"),
      parisAid: isParis
        ? txt(lang,
          "Éco-rénovons Paris+ : aide majorée en copropriété. MaPrimeRénov' Copropriétés : jusqu'à 25%.",
          "Éco-rénovons Paris+: increased aid for co-ownerships. MaPrimeRénov' Copropriétés: up to 25%."
        )
        : txt(lang, "MaPrimeRénov' + CEE cumulables.", "MaPrimeRénov' + CEE combinable."),
      providers: isParis
        ? ["Agence Parisienne du Climat", "CAUE de Paris", "Mon Accompagnateur Rénov'"]
        : ["Espace Conseil France Rénov'", "Mon Accompagnateur Rénov'"],
    });
  }

  if (weaknessIds.has("windows")) {
    recommendations.push({
      id: "replace_windows",
      name: txt(lang, "Passer au double vitrage", "Switch to double glazing"),
      priority: "high",
      reason: txt(lang,
        "Vos fenêtres en simple vitrage laissent passer 3 à 4 fois plus de chaleur.",
        "Your single-glazed windows let through 3–4x more heat."
      ),
      dpeImpact: txt(lang, "Gain de 0.5 à 1 classe", "Gain of 0.5–1 class"),
      comfortImpact: txt(lang, "Fini les courants d'air froid et la condensation", "No more cold draughts and condensation"),
      billImpact: txt(lang, "Économie estimée de 10 à 15% sur la facture", "Estimated 10–15% saving on bills"),
      explanation: isParis
        ? txt(lang,
          "À Paris, le remplacement de fenêtres nécessite l'accord de la copro et parfois de l'ABF en secteur protégé. Privilégiez le double vitrage renforcé (VIR).",
          "In Paris, window replacement needs co-ownership and sometimes ABF approval in protected areas. Choose reinforced double glazing (VIR)."
        )
        : txt(lang, "Le double vitrage divise par 3 les pertes par les fenêtres.", "Double glazing reduces window heat loss by 3x."),
      estimatedSaving: 12,
      estimatedCost: txt(lang, "500–1 200 € par fenêtre", "€500–1,200 per window"),
      parisAid: isParis
        ? txt(lang, "MaPrimeRénov' : 40–100 € par fenêtre. Éco-rénovons Paris+ : aide complémentaire possible.", "MaPrimeRénov': €40–100 per window. Éco-rénovons Paris+: additional aid possible.")
        : txt(lang, "MaPrimeRénov' : 40–100 €.", "MaPrimeRénov': €40–100."),
      providers: isParis
        ? ["Agence Parisienne du Climat", txt(lang, "Votre syndic de copropriété", "Your co-ownership manager")]
        : ["Espace Conseil France Rénov'"],
    });
  }

  if (weaknessIds.has("heating_type") || weaknessIds.has("heating_fuel")) {
    recommendations.push({
      id: "upgrade_heating",
      name: txt(lang, "Passer à une pompe à chaleur", "Switch to a heat pump"),
      priority: "high",
      reason: txt(lang,
        "Une pompe à chaleur consomme 3 à 4 fois moins que vos convecteurs ou votre chaudière fioul.",
        "A heat pump uses 3–4x less energy than your convectors or oil boiler."
      ),
      dpeImpact: txt(lang, "Gain de 1 à 2 classes", "Gain of 1–2 classes"),
      comfortImpact: txt(lang, "Chaleur homogène, meilleure régulation", "Even heat, better regulation"),
      billImpact: txt(lang, "Économie estimée de 30 à 50% sur le chauffage", "Estimated 30–50% saving on heating"),
      explanation: isParis
        ? txt(lang,
          "En appartement, les PAC air/air (clim réversible) sont les plus simples. En maison, une PAC air/eau est idéale. Pour le chauffage collectif fioul, la conversion au réseau de chaleur (CPCU) est prioritaire.",
          "In flats, air/air heat pumps (reversible AC) are simplest. For houses, air/water heat pumps are ideal. For collective oil heating, switching to the heat network (CPCU) is the priority."
        )
        : txt(lang, "Une PAC air/eau offre un rendement 3 à 4 fois supérieur.", "An air/water heat pump is 3–4x more efficient."),
      estimatedSaving: 35,
      estimatedCost: txt(lang, "2 000–5 000 € (air/air) à 10 000–18 000 € (air/eau)", "€2,000–5,000 (air/air) to €10,000–18,000 (air/water)"),
      parisAid: isParis
        ? txt(lang,
          "MaPrimeRénov' : 2 000–4 000 €. Coup de pouce chauffage + Éco-rénovons Paris+ en copro.",
          "MaPrimeRénov': €2,000–4,000. 'Coup de pouce chauffage' + Éco-rénovons Paris+ for co-ownerships."
        )
        : txt(lang, "MaPrimeRénov' : 2 000–4 000 €. CEE cumulable.", "MaPrimeRénov': €2,000–4,000. CEE combinable."),
      providers: isParis
        ? ["Agence Parisienne du Climat", "CPCU (réseau de chaleur Paris)", "Espace Conseil France Rénov' Paris"]
        : ["Espace Conseil France Rénov'"],
    });
  } else if (weaknessIds.has("heating_age")) {
    recommendations.push({
      id: "modernize_heating",
      name: txt(lang, "Remplacer votre chaudière vieillissante", "Replace your ageing boiler"),
      priority: "medium",
      reason: txt(lang,
        "Votre système perd en efficacité avec l'âge. Un équipement récent consomme 20 à 40% de moins.",
        "Your system loses efficiency with age. A newer unit uses 20–40% less."
      ),
      dpeImpact: txt(lang, "Gain de 0.5 à 1 classe", "Gain of 0.5–1 class"),
      comfortImpact: txt(lang, "Meilleure régulation, plus de fiabilité", "Better regulation, more reliability"),
      billImpact: txt(lang, "Économie estimée de 10 à 20%", "Estimated 10–20% saving"),
      explanation: txt(lang,
        "Même sans changer de technologie, un équipement récent offre un meilleur rendement. Un thermostat programmable peut aussi faire gagner 10 à 15% immédiatement.",
        "Even without changing technology, newer equipment is more efficient. A programmable thermostat can save 10–15% immediately."
      ),
      estimatedSaving: 15,
      estimatedCost: txt(lang, "3 000–8 000 € (chaudière gaz condensation)", "€3,000–8,000 (condensing gas boiler)"),
      parisAid: txt(lang, "MaPrimeRénov' : jusqu'à 1 200 €.", "MaPrimeRénov': up to €1,200."),
      providers: isParis
        ? ["Agence Parisienne du Climat", txt(lang, "Votre syndic", "Your building manager")]
        : ["Espace Conseil France Rénov'"],
    });
  }

  if (weaknessIds.has("ventilation")) {
    recommendations.push({
      id: "install_vmc",
      name: txt(lang, "Installer une VMC", "Install mechanical ventilation"),
      priority: "medium",
      reason: txt(lang,
        "La ventilation naturelle ne permet pas de contrôler les pertes d'air — vous chauffez l'air qui s'échappe.",
        "Natural ventilation doesn't control air losses — you're heating air that escapes."
      ),
      dpeImpact: txt(lang, "Impact modéré sur le DPE", "Moderate DPE impact"),
      comfortImpact: txt(lang, "Meilleure qualité de l'air, moins d'humidité", "Better air quality, less humidity"),
      billImpact: txt(lang, "Économie de 5 à 10%", "5–10% saving"),
      explanation: isParis
        ? txt(lang,
          "En copropriété, une VMC simple flux hygroréglable est souvent le meilleur compromis. Consultez votre syndic.",
          "In co-ownerships, a humidity-controlled single-flow system is often the best compromise. Ask your building manager."
        )
        : txt(lang, "Une VMC double flux récupère la chaleur de l'air sortant.", "Dual-flow ventilation recovers heat from outgoing air."),
      estimatedSaving: 8,
      estimatedCost: txt(lang, "1 500–4 000 € (simple flux) à 5 000–10 000 € (double flux)", "€1,500–4,000 (single-flow) to €5,000–10,000 (dual-flow)"),
      parisAid: txt(lang, "MaPrimeRénov' : 2 500–4 000 € (double flux).", "MaPrimeRénov': €2,500–4,000 (dual-flow)."),
      providers: isParis
        ? ["Agence Parisienne du Climat", txt(lang, "Votre syndic", "Your building manager")]
        : ["Espace Conseil France Rénov'"],
    });
  }

  if (weaknessIds.has("air_leakage")) {
    recommendations.push({
      id: "seal_air_leaks",
      name: txt(lang, "Colmater les fuites d'air", "Seal air leaks"),
      priority: "medium",
      reason: txt(lang,
        "Les infiltrations augmentent votre facture de chauffage de façon invisible.",
        "Air infiltrations invisibly increase your heating bill."
      ),
      dpeImpact: txt(lang, "Impact modéré mais effet immédiat", "Moderate but immediate effect"),
      comfortImpact: txt(lang, "Plus de courants d'air froid", "No more cold draughts"),
      billImpact: txt(lang, "Économie estimée de 5 à 10%", "Estimated 5–10% saving"),
      explanation: txt(lang,
        "Jointez les fenêtres, calfeutrez les coffres de volets, installez des boudins de porte. Souvent faisable soi-même pour moins de 100 €.",
        "Seal window joints, draught-proof shutter boxes, install door draught excluders. Often DIY for under €100."
      ),
      estimatedSaving: 7,
      estimatedCost: txt(lang, "50–200 € — faisable soi-même", "€50–200 — DIY possible"),
    });
  }

  if (weaknessIds.has("floor_insulation")) {
    recommendations.push({
      id: "insulate_floor",
      name: txt(lang, "Isoler le plancher", "Insulate the floor"),
      priority: "low",
      reason: txt(lang,
        "Le plancher contribue modérément aux pertes mais le confort s'améliore nettement.",
        "The floor contributes moderately to losses but comfort improves noticeably."
      ),
      dpeImpact: txt(lang, "Gain faible à modéré", "Low to moderate gain"),
      comfortImpact: txt(lang, "Sol moins froid, meilleur confort", "Warmer floors, better comfort"),
      billImpact: txt(lang, "Économie estimée de 5 à 7%", "Estimated 5–7% saving"),
      explanation: isParis
        ? txt(lang,
          "Simple si vous êtes au-dessus d'une cave ou d'un parking. L'isolation par le dessous est la méthode la moins invasive.",
          "Simple if above a cellar or parking. Insulating from below is least invasive."
        )
        : txt(lang, "L'isolation du plancher est simple avec un vide sanitaire ou une cave.", "Floor insulation is simple with a crawl space or cellar."),
      estimatedSaving: 6,
      estimatedCost: txt(lang, "25–50 €/m²", "€25–50/m²"),
      parisAid: txt(lang, "Prime CEE disponible.", "CEE bonus available."),
    });
  }

  // Quick wins
  recommendations.push({
    id: "quick_wins",
    name: txt(lang, "Gestes immédiats — 0 € de travaux", "Immediate actions — €0 in works"),
    priority: recommendations.length === 0 ? "high" : "low",
    reason: txt(lang,
      "Des actions gratuites qui réduisent votre facture dès aujourd'hui.",
      "Free actions that cut your bills starting today."
    ),
    dpeImpact: txt(lang, "Pas d'impact direct sur le DPE", "No direct DPE impact"),
    comfortImpact: txt(lang, "Même confort, moins cher", "Same comfort, lower cost"),
    billImpact: txt(lang, "Économie de 5 à 15% par les habitudes", "5–15% saving through habits"),
    explanation: isParis
      ? txt(lang,
        "• Réglez le thermostat à 19°C\n• Purgez vos radiateurs avant l'hiver\n• Fermez les volets la nuit (+1 à 2°C)\n• Éteignez les veilles (multiprises à interrupteur)\n• Lancez le lave-linge en heures creuses\n• Rendez-vous gratuit : Agence Parisienne du Climat",
        "• Set thermostat to 19°C\n• Bleed radiators before winter\n• Close shutters at night (+1–2°C)\n• Turn off standby (use power strips)\n• Run washing machine off-peak\n• Free advice: Agence Parisienne du Climat"
      )
      : txt(lang,
        "• Thermostat à 19°C jour / 16°C nuit\n• Purgez vos radiateurs\n• Fermez les volets la nuit\n• Éteignez les veilles\n• Heures creuses pour le lave-linge",
        "• Thermostat 19°C day / 16°C night\n• Bleed radiators\n• Close shutters at night\n• Turn off standby\n• Off-peak for washing machine"
      ),
    estimatedSaving: 10,
    estimatedCost: txt(lang, "0 € — gratuit", "€0 — free"),
    parisAid: isParis
      ? txt(lang, "Conseil gratuit : agenceparisienneclimat.fr", "Free advice: agenceparisienneclimat.fr")
      : undefined,
    providers: isParis
      ? ["Agence Parisienne du Climat", "ADIL 75", txt(lang, "Mairie de votre arrondissement", "Your arrondissement town hall")]
      : ["Espace Conseil France Rénov'"],
  });

  return recommendations;
}

export function calculateDPE(data: FormData, lang: Language = "fr"): DPEResult {
  const consumption = calculateConsumption(data);
  const dpeClass = getDPEClass(consumption);
  const energyBreakdown = calculateBreakdown(consumption, data);
  const weaknesses = identifyWeaknesses(data, lang);
  const recommendations = generateRecommendations(data, weaknesses, lang);

  return {
    dpeClass,
    consumption,
    energyBreakdown,
    weaknesses,
    recommendations,
  };
}

export const DPE_CLASSES: { class: DPEClass; label: string; max: number; color: string }[] = [
  { class: "A", label: "≤ 70", max: 70, color: "dpe-a" },
  { class: "B", label: "71–110", max: 110, color: "dpe-b" },
  { class: "C", label: "111–180", max: 180, color: "dpe-c" },
  { class: "D", label: "181–250", max: 250, color: "dpe-d" },
  { class: "E", label: "251–330", max: 330, color: "dpe-e" },
  { class: "F", label: "331–420", max: 420, color: "dpe-f" },
  { class: "G", label: "> 420", max: 9999, color: "dpe-g" },
];
