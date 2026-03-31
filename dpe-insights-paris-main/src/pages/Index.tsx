import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Lightbulb,
  Shield,
  TrendingDown,
  Wrench,
  BarChart3,
  Thermometer,
  Users,
  Lock,
  Scale,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import DPEScale from "@/components/DPEScale";
import heroImage from "@/assets/hero-house.jpg";
import { useI18n } from "@/lib/i18n";

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
};

const Index = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  // Each card gets a unique colour from the design system
  const whyCards = [
    { icon: PiggyBank, title: t("why.bills.title"), desc: t("why.bills.desc"), iconBg: "bg-warning/10", iconColor: "text-warning" },
    { icon: Scale, title: t("why.regulation.title"), desc: t("why.regulation.desc"), iconBg: "bg-rose/10", iconColor: "text-rose" },
    { icon: Building2, title: t("why.value.title"), desc: t("why.value.desc"), iconBg: "bg-success/10", iconColor: "text-success" },
  ];

  const toolCards = [
    { icon: BarChart3, title: t("tool.estimate.title"), desc: t("tool.estimate.desc"), iconBg: "bg-primary/10", iconColor: "text-primary" },
    { icon: TrendingDown, title: t("tool.losses.title"), desc: t("tool.losses.desc"), iconBg: "bg-rose/10", iconColor: "text-rose" },
    { icon: Wrench, title: t("tool.reco.title"), desc: t("tool.reco.desc"), iconBg: "bg-teal/10", iconColor: "text-teal" },
    { icon: Lightbulb, title: t("tool.edu.title"), desc: t("tool.edu.desc"), iconBg: "bg-amber/10", iconColor: "text-amber" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Illustration d'une maison et sa performance énergétique"
            className="h-full w-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="container relative z-10 mx-auto px-4 pb-20 pt-16 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Thermometer className="h-3.5 w-3.5 text-primary" />
                {t("hero.badge")}
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {t("hero.title.1")}{" "}
                <span className="text-gradient">{t("hero.title.highlight")}</span>{" "}
                {t("hero.title.2")}
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {t("hero.desc")}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  variant="hero"
                  size="xl"
                  onClick={() => navigate("/questionnaire")}
                  className="gap-3"
                >
                  {t("hero.cta")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t("hero.sub")}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What is DPE */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              {t("dpe.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("dpe.desc")}
            </p>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }} className="mx-auto max-w-md">
            <DPEScale size="md" />
          </motion.div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              {t("why.title")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-3">
            {whyCards.map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border bg-card p-6"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.iconBg}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What this tool does */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">
              {t("tool.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t("tool.desc")}
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2">
            {toolCards.map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-start gap-4 rounded-xl border bg-background p-5"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconBg}`}>
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Team */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="text-center mb-10">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo/10">
                <Users className="h-7 w-7 text-indigo" />
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              {t("about.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("about.desc")}
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("about.disclaimer")}
            </p>
          </motion.div>

          {/* Team */}
          <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              {t("about.team.title")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { name: "Nora", role: t("about.team.nora") },
                { name: "Hannah", role: t("about.team.hannah") },
                { name: "Gaspard", role: t("about.team.gaspard") },
                { name: "Amélie", role: t("about.team.amelie") },
                { name: "Nicodème", role: t("about.team.nicodème") },
              ].map((member) => (
                <div key={member.name} className="rounded-xl border bg-card p-4 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {member.name[0]}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{member.role}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-bold text-foreground">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("cta.desc")}
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/questionnaire")}
              className="mt-8 gap-3"
            >
              {t("cta.button")}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>{t("footer.disclaimer")}</p>
          <p className="mt-2 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" />
            {t("footer.privacy")}
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} {t("footer.copy")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
