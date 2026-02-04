import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";

export function LanguageToggle() {
  const { language, setLanguage } = useApp();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
      className="font-medium"
      data-testid="button-language-toggle"
    >
      {language === 'vi' ? 'EN' : 'VI'}
    </Button>
  );
}
