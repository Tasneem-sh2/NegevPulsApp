import React, { createContext, useContext, useState } from 'react';
import { LocaleKeys } from '@/frontend/constants/locales/types';

type LanguageContextType = {
  language: LocaleKeys;
  changeLanguage: (lang: LocaleKeys) => void;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  changeLanguage: () => {},
  isRTL: false
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<LocaleKeys>('en');
  
  const changeLanguage = (lang: LocaleKeys) => {
    setLanguage(lang);
    // يمكنك هنا حفظ اللغة في AsyncStorage إذا لزم الأمر
  };

  const isRTL = language === 'ar' || language === 'he';

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);