import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocaleKeys = 'en' | 'ar' | 'he';

interface LanguageContextType {
  language: LocaleKeys;
  changeLanguage: (lang: LocaleKeys) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<LocaleKeys>('en');
  const [isRTL, setIsRTL] = useState(false);

  // ✅ تحميل اللغة المخزنة عند بدء التشغيل
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang && ['en', 'ar', 'he'].includes(storedLang)) {
          const lang = storedLang as LocaleKeys;
          const newIsRTL = lang === 'ar' || lang === 'he';

          setLanguage(lang);
          setIsRTL(newIsRTL);
          I18nManager.forceRTL(newIsRTL);
        }
      } catch (error) {
        console.error('فشل تحميل اللغة من AsyncStorage:', error);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (lang: LocaleKeys) => {
    const newIsRTL = lang === 'ar' || lang === 'he';

    if (newIsRTL !== isRTL) {
      I18nManager.forceRTL(newIsRTL);
      setIsRTL(newIsRTL);
    }

    setLanguage(lang);

    try {
      await AsyncStorage.setItem('appLanguage', lang);
    } catch (error) {
      console.error('فشل حفظ اللغة في AsyncStorage:', error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider