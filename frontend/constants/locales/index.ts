import en from './en';
import ar from './ar';
import he from './he';
import { LocaleKeys } from './types';
import { useLanguage } from '@/frontend/context/LanguageProvider';

export const translations = {
  en,
  ar,
  he
};

export const useTranslations = () => {
  const { language } = useLanguage();
  const currentTranslations = translations[language] || translations.en;

  // دالة مساعدة للتعامل مع الكائنات والمصفوفات
  const t = (key: string, options?: any) => {
    const keys = key.split('.');
    let result: any = currentTranslations;
    
    for (const k of keys) {
      if (!result[k]) {
        console.warn(`Missing translation for key: ${key} in language: ${language}`);
        return key;
      }
      result = result[k];
    }
    
    if (typeof result === 'object' && !Array.isArray(result) && options?.returnObjects) {
      return result;
    }
    
    if (options && typeof result === 'string') {
      return Object.keys(options).reduce((acc, k) => 
        acc.replace(new RegExp(`\\{${k}\\}`, 'g'), options[k]), 
        result
      );
    }
    
    return result;
  };

  return {
    ...currentTranslations,
    t
  };
};