
import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates'; // تحتاج لإضافة expo-updates
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
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  const changeLanguage = async (lang: LocaleKeys) => {
    const shouldBeRTL = lang === 'ar' || lang === 'he';

    setLanguage(lang);
    setIsRTL(shouldBeRTL);

    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);

      // إعادة تحميل التطبيق لتطبيق التغييرات
      await Updates.reloadAsync();
    }

    // يمكنك حفظ اللغة في AsyncStorage هنا إذا أردت استرجاعها عند الإقلاع
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);