import { Link, useLocation } from "react-router-dom";
import { Home, ClipboardList, BarChart3, Languages, Zap } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  const { lang, toggleLang, t } = useI18n();

  const links = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/questionnaire", label: t("nav.diagnostic"), icon: ClipboardList },
    { to: "/resultats", label: t("nav.results"), icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg hero-gradient">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">
            Écowatt
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="ml-2 gap-1.5 text-xs font-semibold"
            aria-label="Switch language"
          >
            <Languages className="h-4 w-4" />
            {lang === "fr" ? "EN" : "FR"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
