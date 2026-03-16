import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import Header from "@/components/Header";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-20 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-semibold text-foreground">{t("notfound.title")}</p>
        <p className="mb-6 text-muted-foreground">{t("notfound.desc")}</p>
        <Button variant="hero" size="lg" asChild>
          <Link to="/">{t("notfound.cta")}</Link>
        </Button>
      </main>
    </div>
  );
};

export default NotFound;
