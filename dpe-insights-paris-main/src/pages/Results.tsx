import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle,
  Info, Lightbulb, Wrench, Flame, Droplets,
  Layers, Wind, RefreshCw, Target, PiggyBank, Euro, MapPin,
  TrendingUp, Zap, ShowerHead, ThermometerSun, Tv, Timer, Building2, Download, Loader2,
  Leaf, Car, Shirt, Award, ArrowUpRight, Footprints, Receipt, Repeat, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import DPEScale from "@/components/DPEScale";
import type { DPEResult, FormData, DPEClass } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { calculateDPE, DPE_CLASSES } from "@/lib/dpe-calculator";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const DPE_THRESHOLDS: Record<DPEClass, { min: number; max: number }> = {
  A: { min: 0, max: 70 }, B: { min: 71, max: 110 }, C: { min: 111, max: 180 },
  D: { min: 181, max: 250 }, E: { min: 251, max: 330 }, F: { min: 331, max: 420 },
  G: { min: 421, max: 600 },
};

const DPE_COLORS: Record<DPEClass, string> = {
  A: "bg-[#319834]", B: "bg-[#33a357]", C: "bg-[#cbdb2a]", D: "bg-[#ffed00]",
  E: "bg-[#f0b616]", F: "bg-[#ec6927]", G: "bg-[#e7221a]",
};

const DPE_TEXT_COLORS: Record<DPEClass, string> = {
  A: "text-[#319834]", B: "text-[#33a357]", C: "text-[#8aad1a]", D: "text-[#c9a900]",
  E: "text-[#f0b616]", F: "text-[#ec6927]", G: "text-[#e7221a]",
};

const CO2_PER_KWH = 0.06;
const CAR_KM_PER_KG_CO2 = 6.25;

const ILLUSTRATIVE_COMPANIES: Record<string, { name: string; specialty: string }[]> = {
  insulate_roof: [
    { name: "Iso Combles Paris", specialty: "Isolation toiture & combles" },
    { name: "ThermoRénov' IDF", specialty: "Rénovation énergétique globale" },
  ],
  insulate_walls: [
    { name: "MurIsol Paris", specialty: "ITE & ITI spécialiste" },
    { name: "ThermoRénov' IDF", specialty: "Rénovation énergétique globale" },
  ],
  replace_windows: [
    { name: "Fenêtres de Paris", specialty: "Menuiseries sur mesure" },
    { name: "VitroConfort", specialty: "Double & triple vitrage" },
  ],
  upgrade_heating: [
    { name: "ClimaConfort Paris", specialty: "PAC & climatisation" },
    { name: "GreenHeat IDF", specialty: "Pompes à chaleur" },
  ],
  modernize_heating: [
    { name: "ChaufExpert", specialty: "Chaudières modernes" },
    { name: "ThermoService IDF", specialty: "Entretien & remplacement" },
  ],
  install_vmc: [
    { name: "AirPur Paris", specialty: "VMC simple & double flux" },
    { name: "VentiConfort", specialty: "Ventilation résidentielle" },
  ],
  seal_air_leaks: [
    { name: "ÉtanchéPro", specialty: "Étanchéité à l'air" },
    { name: "JointExpert", specialty: "Calfeutrage & joints" },
  ],
  insulate_floor: [
    { name: "SolIsol Paris", specialty: "Isolation plancher bas" },
    { name: "ThermoRénov' IDF", specialty: "Rénovation énergétique" },
  ],
  quick_wins: [
    { name: "Agence Parisienne du Climat", specialty: "Conseil gratuit" },
    { name: "ADIL 75", specialty: "Information logement" },
  ],
};

function estimateTargetClass(currentClass: DPEClass, totalSavingPct: number): DPEClass {
  const classes: DPEClass[] = ["A", "B", "C", "D", "E", "F", "G"];
  const idx = classes.indexOf(currentClass);
  const jump = Math.min(Math.floor(totalSavingPct / 15), idx);
  return classes[Math.max(idx - jump, 0)];
}

type SectionId = "overview" | "energy" | "habits" | "renovations" | "nextsteps";

const NAV_ITEMS: { id: SectionId; icon: React.ElementType; labelKey: string }[] = [
  { id: "overview", icon: BarChart3, labelKey: "results.nav.overview" },
  { id: "energy", icon: Receipt, labelKey: "results.nav.energy" },
  { id: "habits", icon: Repeat, labelKey: "results.nav.habits" },
  { id: "renovations", icon: Wrench, labelKey: "results.nav.renovations" },
  { id: "nextsteps", icon: Footprints, labelKey: "results.nav.nextsteps" },
];

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const state = location.state as { result: DPEResult; formData: FormData } | null;
  const recRefs = useRef<Record<string, HTMLElement | null>>({});
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    overview: null, energy: null, habits: null, renovations: null, nextsteps: null,
  });
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const recalculated = useMemo(() => {
    if (!state) return null;
    return calculateDPE(state.formData, lang);
  }, [state, lang]);

  const handleExportPDF = useCallback(async () => {
    if (!pdfRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }
      pdf.save(`diagnostic-dpe-${recalculated?.dpeClass || "resultat"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [recalculated?.dpeClass]);

  const scrollToSection = (id: SectionId) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formData = state?.formData;
  const surfaceArea = formData?.surfaceArea || 70;
  const avgEnergyPricePerKwh = 0.21;
  const consumption = recalculated?.consumption || 0;

  const currentAnnualBill = formData?.annualBill
    ? formData.annualBill
    : consumption * surfaceArea * avgEnergyPricePerKwh;

  const annualCO2 = Math.round(consumption * surfaceArea * CO2_PER_KWH);
  const carKmEquiv = Math.round(annualCO2 * CAR_KM_PER_KG_CO2);
  const monthlyBill = Math.round(currentAnnualBill / 12);

  const recommendations = recalculated?.recommendations || [];
  const renoRecs = recommendations.filter(r => r.id !== "quick_wins");

  const totalSavingPct = renoRecs.reduce((sum, r) => sum + r.estimatedSaving, 0);
  const totalAnnualSaving = Math.round(currentAnnualBill * Math.min(totalSavingPct, 70) / 100);
  const dpeClass = recalculated?.dpeClass || "D";
  const targetClass = estimateTargetClass(dpeClass, Math.min(totalSavingPct, 70));

  const classJump = "ABCDEFG".indexOf(dpeClass) - "ABCDEFG".indexOf(targetClass);
  const valueGainPct = Math.min(classJump * 8, 25);
  const estimatedPropertyValue = surfaceArea * 10000;
  const valueGain = Math.round(estimatedPropertyValue * valueGainPct / 100);

  // Energy subscription savings (~8% by switching)
  const energySubSaving = Math.round(currentAnnualBill * 0.08);
  const optimizedAnnualBill = Math.round(currentAnnualBill - energySubSaving);

  const roiItems = useMemo(() => {
    return renoRecs
      .filter((r) => r.estimatedSaving > 5)
      .slice(0, 5)
      .map((r) => {
        const annualSaving = currentAnnualBill * (r.estimatedSaving / 100);
        const costMatch = r.estimatedCost?.match(/[\d\s]+/g);
        const estimatedTotalCost = costMatch
          ? parseInt(costMatch[0].replace(/\s/g, "")) * (r.id.includes("window") ? 5 : surfaceArea * 0.3)
          : annualSaving * 12;
        const paybackYears = Math.round(estimatedTotalCost / annualSaving);
        const co2Saved = Math.round(annualCO2 * (r.estimatedSaving / 100));
        const roiPct = Math.round((annualSaving / estimatedTotalCost) * 100);
        return {
          id: r.id,
          name: r.name,
          annualSaving: Math.round(annualSaving),
          totalCost: Math.round(estimatedTotalCost),
          paybackYears: Math.min(paybackYears, 30),
          priority: r.priority,
          estimatedCost: r.estimatedCost,
          co2Saved,
          roiPct,
          reason: r.reason,
          dpeImpact: r.dpeImpact,
          comfortImpact: r.comfortImpact,
          billImpact: r.billImpact,
          explanation: r.explanation,
          parisAid: r.parisAid,
          providers: r.providers,
        };
      });
  }, [renoRecs, currentAnnualBill, surfaceArea, annualCO2]);

  const totalRenoCost = roiItems.reduce((s, r) => s + r.totalCost, 0);
  const totalRenoSaving = roiItems.reduce((s, r) => s + r.annualSaving, 0);
  const totalRenoCO2 = roiItems.reduce((s, r) => s + r.co2Saved, 0);
  const globalPayback = totalRenoSaving > 0 ? Math.round(totalRenoCost / totalRenoSaving) : 0;

  // Personalised quick wins
  const personalizedQuickWins = useMemo(() => {
    const occupants = formData?.occupants || 2;
    const wins: { icon: React.ElementType; text: string; saving: number; savingLabel: string }[] = [];

    const addWin = (icon: React.ElementType, text: string, monthlySaving: number) => {
      wins.push({ icon, text, saving: monthlySaving * 12, savingLabel: `~${monthlySaving} €/${t("smallwins.month")}` });
    };

    if (!formData?.thermostatTemp || formData.thermostatTemp > 19.5) {
      addWin(ThermometerSun, t("smallwins.thermostat"), Math.round(currentAnnualBill * 0.07 / 12));
    }
    if (formData?.leavesLightsOn !== false) {
      addWin(Tv, t("smallwins.standby"), Math.round(occupants * 5));
    }
    if (formData?.leavesLightsOn === true) {
      addWin(Lightbulb, t("smallwins.lights"), Math.round(currentAnnualBill * 0.03 / 12));
    }
    if (formData?.hotWaterUsage !== "low") {
      addWin(ShowerHead, t("smallwins.shower"), Math.round(occupants * 15));
    }
    addWin(Timer, t("smallwins.offpeak"), Math.round(currentAnnualBill * 0.05 / 12));
    if (formData?.usesDryer === true) {
      addWin(Shirt, t("smallwins.dryer"), Math.round(occupants * 8));
    }
    if (formData?.programmableHeating !== true) {
      addWin(Timer, t("smallwins.programmable"), Math.round(currentAnnualBill * 0.10 / 12));
    }
    return wins;
  }, [formData, currentAnnualBill, t]);

  const totalHabitSaving = personalizedQuickWins.reduce((s, w) => s + w.saving, 0);

  if (!state || !recalculated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-bold text-foreground">{t("results.none.title")}</h1>
          <p className="mb-6 text-muted-foreground">{t("results.none.desc")}</p>
          <Button variant="hero" size="lg" onClick={() => navigate("/questionnaire")}>
            {t("results.none.cta")}
          </Button>
        </main>
      </div>
    );
  }

  const { energyBreakdown, weaknesses } = recalculated;

  const priorityStyles = {
    high: { badge: "bg-destructive/10 text-destructive border-destructive/20", bar: "bg-destructive" },
    medium: { badge: "bg-warning/10 text-warning border-warning/20", bar: "bg-warning" },
    low: { badge: "bg-success/10 text-success border-success/20", bar: "bg-success" },
  };

  const priorityLabels = {
    high: t("results.priority.high"),
    medium: t("results.priority.medium"),
    low: t("results.priority.low"),
  };

  const severityStyles = {
    high: "border-l-destructive bg-destructive/5",
    medium: "border-l-warning bg-warning/5",
    low: "border-l-muted bg-muted/20",
  };

  const categoryIcons: Record<string, { icon: React.ElementType; color: string }> = {
    envelope: { icon: Layers, color: "text-teal" },
    heating: { icon: Flame, color: "text-rose" },
    ventilation: { icon: Wind, color: "text-indigo" },
  };

  const categoryLabels: Record<string, string> = {
    envelope: t("results.cat.envelope"),
    heating: t("results.cat.heating"),
    ventilation: t("results.cat.ventilation"),
  };

  const breakdownItems = [
    { label: t("results.breakdown.heating"), value: energyBreakdown.heating, icon: Flame, color: "text-rose", bar: "bg-rose" },
    { label: t("results.breakdown.hotwater"), value: energyBreakdown.hotWater, icon: Droplets, color: "text-primary", bar: "bg-primary" },
    { label: t("results.breakdown.envelope"), value: energyBreakdown.envelopeLosses, icon: Layers, color: "text-amber", bar: "bg-amber" },
  ];

  const hasCurrentDPE = !!formData?.currentDPE;
  const currentDPEClass = formData?.currentDPE;
  const currentDPEThreshold = currentDPEClass ? DPE_THRESHOLDS[currentDPEClass] : null;
  const currentDPEMid = currentDPEThreshold ? Math.round((currentDPEThreshold.min + currentDPEThreshold.max) / 2) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-6xl px-4 py-8 flex gap-6">

        {/* ── SIDEBAR NAV ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-8 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {t(item.labelKey)}
              </button>
            ))}
            <div className="border-t my-3" />
            <Button onClick={handleExportPDF} disabled={isExporting} variant="outline" size="sm" className="w-full gap-2">
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {t("results.export")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/questionnaire")} className="w-full gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              {t("results.redo")}
            </Button>
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main ref={pdfRef} className="flex-1 min-w-0 space-y-10">

          {/* ═══════════════════════════════════════════
              SECTION 1: OVERVIEW
          ═══════════════════════════════════════════ */}
          <section ref={(el) => { sectionRefs.current.overview = el; }}>
            {/* Hero result */}
            <motion.div {...fadeIn}>
              <div className="overflow-hidden rounded-2xl border bg-card">
                <div className="hero-gradient px-6 py-5">
                  <h1 className="text-2xl font-bold text-primary-foreground">{t("results.title")}</h1>
                  <p className="mt-1 text-sm text-primary-foreground/80">{t("results.subtitle")}</p>
                </div>
                <div className="grid gap-8 p-6 md:grid-cols-2">
                  <DPEScale activeClass={dpeClass} size="md" />
                  <div className="flex flex-col justify-center gap-4">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("results.class")}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`inline-flex items-center rounded-xl dpe-${dpeClass.toLowerCase()} px-5 py-2`}>
                          <span className="text-3xl font-bold">{dpeClass}</span>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-[200px]">{t(`results.summary.class_desc.${dpeClass}`)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("results.consumption")}</span>
                      <p className="text-2xl font-bold text-foreground">{consumption} <span className="text-sm font-normal text-muted-foreground">{t("dpe.unit")}</span></p>
                    </div>
                    <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("results.disclaimer")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Financial hero */}
            <motion.div {...fadeIn} transition={{ delay: 0.05 }} className="mt-6">
              <div className="rounded-2xl border-2 border-primary/20 overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">{t("results.performance.title")}</p>
                  <div className="flex items-center justify-center gap-1">
                    <Euro className="h-8 w-8 text-primary" />
                    <span className="text-6xl sm:text-7xl font-black text-foreground tracking-tight">{Math.round(currentAnnualBill).toLocaleString()}</span>
                    <span className="text-xl font-medium text-muted-foreground self-end mb-2">€/{t("results.roi.year")}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("results.performance.monthly")} <span className="font-bold text-foreground text-lg">{monthlyBill} €</span> {t("results.performance.monthly.unit")}
                  </p>
                </div>
                <div className="px-6 py-5 border-t bg-card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{t("results.performance.annual_cost.note")}</p>
                  <div className="space-y-3">
                    {breakdownItems.map((item) => {
                      const pct = Math.round((item.value / energyBreakdown.total) * 100);
                      const cost = Math.round(currentAnnualBill * pct / 100);
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                              <item.icon className={`h-4 w-4 ${item.color}`} /> {item.label}
                            </span>
                            <span className="text-lg font-bold text-foreground">~{cost} €</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-muted">
                            <motion.div className={`h-full rounded-full ${item.bar}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3, duration: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                      <Leaf className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("results.performance.emissions")}</p>
                      <p className="text-xl font-bold text-foreground">{annualCO2.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t("results.performance.emissions.unit")}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Car className="h-3.5 w-3.5" />
                    {t("results.performance.emissions.note")} ~{carKmEquiv.toLocaleString()} {t("results.performance.emissions.car_km")}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Savings potential */}
            {totalAnnualSaving > 50 && (
              <motion.div {...fadeIn} transition={{ delay: 0.08 }} className="mt-6">
                <div className="rounded-2xl overflow-hidden border-2 border-success/30 bg-gradient-to-br from-success/[0.06] to-transparent">
                  <div className="px-6 py-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-success mb-3">{t("results.potential.title")}</p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <PiggyBank className="h-8 w-8 text-success" />
                      <span className="text-5xl sm:text-6xl font-black text-success tracking-tight">-{totalAnnualSaving.toLocaleString()} €</span>
                      <span className="text-lg font-medium text-muted-foreground self-end mb-1">/{t("results.roi.year")}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t("results.potential.if_renovated")}</p>
                  </div>
                  <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-success/15 border-t border-success/15 bg-card">
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("results.potential.monthly_saving")}</p>
                      <p className="text-3xl font-black text-success">-{Math.round(totalAnnualSaving / 12)} €<span className="text-sm font-normal text-muted-foreground">/{t("smallwins.month")}</span></p>
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("results.potential.new_class")}</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className={`text-3xl font-black ${DPE_TEXT_COLORS[dpeClass]}`}>{dpeClass}</span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        <span className={`text-4xl font-black ${DPE_TEXT_COLORS[targetClass]}`}>{targetClass}</span>
                      </div>
                    </div>
                  <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("results.potential.value_gain")}</p>
                      <p className="text-3xl font-black text-foreground">+{valueGain.toLocaleString()} €</p>
                      <p className="text-xs text-muted-foreground">~+{valueGainPct}% {t("results.potential.property_value")}</p>
                    </div>
                  </div>

                  {/* kWh savings row */}
                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-success/15 border-t border-success/15 bg-card">
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {lang === "fr" ? "kWh économisés / an" : "kWh saved / year"}
                      </p>
                      <p className="text-3xl font-black text-success">
                        -{Math.round(consumption * surfaceArea * Math.min(totalSavingPct, 70) / 100).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
                      </p>
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {lang === "fr" ? "kWh économisés / mois" : "kWh saved / month"}
                      </p>
                      <p className="text-3xl font-black text-success">
                        -{Math.round(consumption * surfaceArea * Math.min(totalSavingPct, 70) / 100 / 12).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">kWh</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Weaknesses */}
            <motion.div {...fadeIn} transition={{ delay: 0.12 }} className="mt-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                <AlertTriangle className="h-4.5 w-4.5 text-warning" />
                {t("results.weaknesses")}
              </h2>
              {weaknesses.length === 0 ? (
                <div className="rounded-xl border bg-success/5 p-5 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                  <p className="text-sm font-medium text-foreground">{t("results.weaknesses.empty")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weaknesses.map((w, i) => {
                    const cat = categoryIcons[w.category] || categoryIcons.envelope;
                    return (
                      <motion.div key={w.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className={`rounded-lg border-l-[3px] p-3.5 ${severityStyles[w.severity]}`}>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            <cat.icon className={`h-2.5 w-2.5 ${cat.color}`} /> {categoryLabels[w.category]}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{w.label}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{w.description}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* DPE comparison */}
            {hasCurrentDPE && currentDPEClass && currentDPEMid && (
              <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="mt-6">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" /> {t("results.comparison.title")}
                </h2>
                <div className="rounded-2xl border bg-card p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{t("results.comparison.assigned")}</span>
                      <span className="text-xs font-bold text-foreground">{t("currentdpe.class")} {currentDPEClass} · ~{currentDPEMid} {t("dpe.unit")}</span>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div className={`h-full rounded-full ${DPE_COLORS[currentDPEClass]} flex items-center justify-end pr-2`} initial={{ width: 0 }} animate={{ width: `${Math.min((currentDPEMid / 600) * 100, 100)}%` }} transition={{ delay: 0.3, duration: 0.8 }}>
                        <span className="text-[10px] font-bold text-white drop-shadow">{currentDPEClass}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{t("results.comparison.estimated")}</span>
                      <span className="text-xs font-bold text-foreground">{t("currentdpe.class")} {dpeClass} · {consumption} {t("dpe.unit")}</span>
                    </div>
                    <div className="h-6 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div className={`h-full rounded-full ${DPE_COLORS[dpeClass]} flex items-center justify-end pr-2`} initial={{ width: 0 }} animate={{ width: `${Math.min((consumption / 600) * 100, 100)}%` }} transition={{ delay: 0.5, duration: 0.8 }}>
                        <span className="text-[10px] font-bold text-white drop-shadow">{dpeClass}</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2.5">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {consumption > currentDPEMid ? t("results.comparison.worse") : consumption < currentDPEMid ? t("results.comparison.better") : t("results.comparison.same")}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 2: ENERGY SUBSCRIPTIONS
          ═══════════════════════════════════════════ */}
          <section ref={(el) => { sectionRefs.current.energy = el; }}>
            <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
              <div className="rounded-2xl border-2 border-blue-500/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent px-6 py-5 border-b">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <Receipt className="h-5 w-5 text-blue-500" />
                    {t("results.energy_sub.title")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">{t("results.energy_sub.subtitle")}</p>
                </div>

                <div className="p-6">
                  {/* Price comparison */}
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-1">{t("results.energy_sub.current")}</p>
                      <p className="text-3xl font-black text-destructive">{Math.round(currentAnnualBill).toLocaleString()} €</p>
                      <p className="text-xs text-muted-foreground">{Math.round(currentAnnualBill / 12)} €{t("results.energy_sub.per_month")}</p>
                    </div>
                    <div className="rounded-xl border-2 border-success/20 bg-success/5 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-success mb-1">{t("results.energy_sub.optimized")}</p>
                      <p className="text-3xl font-black text-success">{optimizedAnnualBill.toLocaleString()} €</p>
                      <p className="text-xs text-muted-foreground">{Math.round(optimizedAnnualBill / 12)} €{t("results.energy_sub.per_month")}</p>
                    </div>
                    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 text-center flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{t("results.energy_sub.saving")}</p>
                      <p className="text-4xl font-black text-primary">-{energySubSaving} €</p>
                      <p className="text-xs text-muted-foreground">{t("results.energy_sub.per_year")}</p>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="space-y-2">
                    {["tip1", "tip2", "tip3"].map((tip, i) => (
                      <div key={tip} className="flex items-start gap-2.5 rounded-lg border bg-muted/20 p-3">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500">{i + 1}</div>
                        <p className="text-sm text-foreground">{t(`results.energy_sub.${tip}`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 3: HABIT CHANGES
          ═══════════════════════════════════════════ */}
          <section ref={(el) => { sectionRefs.current.habits = el; }}>
            <motion.div {...fadeIn} transition={{ delay: 0.18 }}>
              <div className="rounded-2xl border-2 border-amber/20 bg-card overflow-hidden">
                <div className="bg-gradient-to-r from-amber/10 via-amber/5 to-transparent px-6 py-5 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                        <Zap className="h-5 w-5 text-amber" />
                        {t("results.habits.title")}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{t("results.habits.subtitle")}</p>
                    </div>
                    {totalHabitSaving > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-success">{t("results.habits.total_saving")}</p>
                        <p className="text-2xl font-black text-success">-{totalHabitSaving} €<span className="text-xs font-normal text-muted-foreground">/{t("results.roi.year")}</span></p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  {personalizedQuickWins.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                      <p className="text-sm font-medium text-foreground">{t("results.quickwins.already_good")}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {personalizedQuickWins.map((win, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber/10">
                              <win.icon className="h-4 w-4 text-amber" />
                            </div>
                            <p className="text-sm font-medium text-foreground">{win.text}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">{win.savingLabel}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 4: RENOVATION OPTIONS
          ═══════════════════════════════════════════ */}
          <section ref={(el) => { sectionRefs.current.renovations = el; }}>
            <motion.div {...fadeIn} transition={{ delay: 0.22 }}>
              <div className="overflow-hidden rounded-2xl border-2 border-primary/20">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-5">
                  <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                    <Wrench className="h-5 w-5 text-primary" />
                    {t("results.reno.title")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t("results.reno.subtitle")}</p>
                </div>

                {/* Summary banner */}
                {roiItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x border-b bg-card">
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("results.reno.total_investment")}</p>
                      <p className="text-xl font-black text-foreground">{totalRenoCost.toLocaleString()} €</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-success">{t("results.reno.total_annual_saving")}</p>
                      <p className="text-xl font-black text-success">+{totalRenoSaving.toLocaleString()} €/{t("results.roi.yr")}</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{t("results.reno.total_co2")}</p>
                      <p className="text-xl font-black text-foreground">-{totalRenoCO2.toLocaleString()} kg</p>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{t("results.reno.global_payback")}</p>
                      <p className="text-xl font-black text-primary">{globalPayback} {t("results.roi.years_payback")}</p>
                    </div>
                  </div>
                )}

                {renoRecs.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-success" />
                    <p className="text-sm font-medium text-foreground">{t("results.reno.empty")}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {roiItems.map((item, index) => {
                      const rec = renoRecs.find(r => r.id === item.id)!;
                      const companies = ILLUSTRATIVE_COMPANIES[rec.id] || ILLUSTRATIVE_COMPANIES.quick_wins;
                      return (
                        <motion.article
                          key={rec.id}
                          ref={(el) => { recRefs.current[rec.id] = el; }}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + index * 0.08 }}
                          className="p-5 sm:p-6"
                        >
                          {/* Header */}
                          <div className="flex flex-wrap items-start gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${priorityStyles[rec.priority].badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${priorityStyles[rec.priority].bar}`} />
                              {priorityLabels[rec.priority]}
                            </span>
                            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">~{rec.estimatedSaving}% {t("results.saving")}</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{rec.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>

                          {/* Key metrics — 5 columns */}
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
                              <Euro className="h-3.5 w-3.5 text-amber mx-auto mb-1" />
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t("results.roi.cost")}</span>
                              <span className="block text-sm font-black text-foreground">~{item.totalCost.toLocaleString()} €</span>
                            </div>
                            <div className="rounded-lg bg-success/10 px-3 py-2.5 text-center">
                              <PiggyBank className="h-3.5 w-3.5 text-success mx-auto mb-1" />
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-success">{t("results.roi.saving")}</span>
                              <span className="block text-sm font-black text-success">+{item.annualSaving} €/{t("results.roi.yr")}</span>
                            </div>
                            <div className="rounded-lg bg-primary/10 px-3 py-2.5 text-center">
                              <Target className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-primary">{t("results.roi.payback")}</span>
                              <span className="block text-sm font-black text-primary">{item.paybackYears} {t("results.roi.years_payback")}</span>
                            </div>
                            <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-center">
                              <Leaf className="h-3.5 w-3.5 text-success mx-auto mb-1" />
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{t("results.reno.co2_saved")}</span>
                              <span className="block text-sm font-black text-foreground">-{item.co2Saved} {t("results.reno.co2_unit")}</span>
                            </div>
                            <div className="rounded-lg bg-primary/5 px-3 py-2.5 text-center">
                              <ArrowUpRight className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                              <span className="block text-[9px] font-bold uppercase tracking-wider text-primary">{t("results.reno.roi_pct")}</span>
                              <span className="block text-sm font-black text-primary">{item.roiPct}%/{t("results.roi.yr")}</span>
                            </div>
                          </div>

                          {/* Impact cards */}
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            {[
                              { icon: BarChart3, label: t("results.dpe_impact"), value: item.dpeImpact, color: "text-primary", bg: "bg-primary/5" },
                              { icon: Target, label: t("results.comfort"), value: item.comfortImpact, color: "text-indigo", bg: "bg-indigo/5" },
                              { icon: PiggyBank, label: t("results.bill"), value: item.billImpact, color: "text-success", bg: "bg-success/5" },
                            ].map((m) => (
                              <div key={m.label} className={`rounded-lg ${m.bg} px-3 py-2`}>
                                <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${m.color}`}>
                                  <m.icon className="h-3 w-3" /> {m.label}
                                </span>
                                <p className="mt-0.5 text-xs font-medium text-foreground">{m.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Explanation */}
                          <div className="mt-3 rounded-lg border bg-muted/20 p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
                              <p className="text-xs leading-relaxed text-muted-foreground">{item.explanation}</p>
                            </div>
                          </div>

                          {/* Cost + Aid */}
                          {(rec.estimatedCost || rec.parisAid) && (
                            <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                              {rec.estimatedCost && (
                                <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2">
                                  <Euro className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
                                  <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("results.cost")}</span>
                                    <p className="text-xs text-foreground">{rec.estimatedCost}</p>
                                  </div>
                                </div>
                              )}
                              {rec.parisAid && (
                                <div className="flex items-start gap-2 rounded-lg border border-success/10 bg-success/5 px-3 py-2">
                                  <PiggyBank className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                                  <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-success">{t("results.aid")}</span>
                                    <p className="text-xs text-foreground">{rec.parisAid}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Providers */}
                          {rec.providers && rec.providers.length > 0 && (
                            <div className="mt-2.5 rounded-lg bg-primary/[0.03] px-3 py-2">
                              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                                <MapPin className="h-3 w-3" /> {t("results.providers")}
                              </span>
                              <ul className="space-y-0.5">
                                {rec.providers.map((p, i) => (
                                  <li key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                                    <ArrowRight className="h-2.5 w-2.5 text-primary" /> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </motion.article>
                      );
                    })}
                  </div>
                )}

                <div className="px-6 py-3 border-t bg-muted/10">
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-[11px] text-muted-foreground">{t("results.roi.disclaimer")}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          {/* ═══════════════════════════════════════════
              SECTION 5: NEXT STEPS + EDUCATION
          ═══════════════════════════════════════════ */}
          <section ref={(el) => { sectionRefs.current.nextsteps = el; }}>
            <motion.div {...fadeIn} transition={{ delay: 0.28 }}>
              <div className="rounded-2xl border bg-card p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                  <Footprints className="h-5 w-5 text-primary" /> {t("results.next_steps.title")}
                </h2>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{n}</div>
                      <p className="text-sm text-foreground pt-0.5">{t(`results.next_steps.${n}`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.32 }} className="mt-6">
              <div className="rounded-2xl border bg-card">
                <div className="border-b px-6 py-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                    <CheckCircle className="h-4.5 w-4.5 text-primary" /> {t("results.edu.title")}
                  </h2>
                </div>
                <div className="space-y-4 p-6">
                  {[
                    { n: 1, icon: Lightbulb, color: "text-amber" },
                    { n: 2, icon: Target, color: "text-rose" },
                    { n: 3, icon: PiggyBank, color: "text-success" },
                  ].map(({ n, icon: EduIcon, color }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color.replace("text-", "bg-")}/10`}>
                        <EduIcon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{t(`results.edu.${n}.title`)}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`results.edu.${n}.desc`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Mobile action buttons */}
          <div className="flex flex-wrap justify-center gap-3 pb-10 lg:hidden">
            <Button onClick={handleExportPDF} disabled={isExporting} size="lg" className="gap-2">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t("results.export")}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/questionnaire")} className="gap-2">
              <RefreshCw className="h-4 w-4" /> {t("results.redo")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;
