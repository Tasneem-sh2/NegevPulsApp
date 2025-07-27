export type LocaleKeys = 'en' | 'ar' | 'he';

// استيراد نوع من ملف الترجمة الإنجليزية كقاعدة
import enTranslations from './en';

// إنشاء نوع لجميع مفاتيح الترجمة
export type TranslationKeys = {
  common: keyof typeof enTranslations.common;
  villages: keyof typeof enTranslations.villages;
  auth: keyof typeof enTranslations.auth;
  tabs: keyof typeof enTranslations.tabs;
  localPage: keyof typeof enTranslations.localPage;
  HomePage: keyof typeof enTranslations.HomePage;
  landmarks: keyof typeof enTranslations.landmarks;
  about: keyof typeof enTranslations.about;
  contactUs: keyof typeof enTranslations.contactUs;
  paragraphs: keyof typeof enTranslations.paragraphs;
};