import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-9 px-3 gap-1.5 font-medium"
      title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a ingles'}
    >
      <span className="text-base leading-none">{language === 'en' ? '🇪🇸' : '🇬🇧'}</span>
      <span className="text-sm">{language === 'en' ? 'ES' : 'EN'}</span>
    </Button>
  );
}
