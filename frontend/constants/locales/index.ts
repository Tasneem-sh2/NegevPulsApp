import en from './en';
import ar from './ar';
import he from './he';
import { LocaleKeys } from './types';
import { useLanguage } from '@/frontend/context/LanguageProvider'; // ⬅️ هنا الصح

export const translations = {
  en: { ...en, currentLanguage: 'English' },
  ar: { ...ar, currentLanguage: 'العربية' },
  he: { ...he, currentLanguage: 'עברית' },
};

// ✅ الآن نجيب اللغة من الكونتكست مش من برّا
export const useTranslations = () => {
  const { language } = useLanguage();
  return translations[language] || translations.en;
};
