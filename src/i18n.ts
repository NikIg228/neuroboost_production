import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en', 'kz'],
    load: 'languageOnly',
    lowerCaseLng: true,
    cleanCode: true,
    fallbackNS: 'common',
    ns: [
      'common', 
      'header', 
      'footer', 
      'home', 
      'catalog', 
      'calculator', 
      'auth', 
      'legal',
      'pages',
      'profile',
      'services',
      'tariffs',
      'components'
    ],
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },
    interpolation: { 
      escapeValue: false 
    },
    detection: { 
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },
    react: {
      useSuspense: false
    },
    debug: false
  });

export default i18n;
