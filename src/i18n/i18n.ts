import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './en/translation.json';
import translationSK from './sk/translation.json';

// Exportujeme preklady pre možnosť použitia inde v kóde
export const resources = {
  en: {
    translation: translationEN
  },
  sk: {
    translation: translationSK
  }
};

// Pomocná funkcia pre logovanie do konzoly - len pre účely debugovania
const logI18nInit = () => {
  console.log('i18n initialized with languages:', Object.keys(resources));
  console.log('Current language:', i18n.language);
  console.log('localStorage language:', localStorage.getItem('i18nextLng'));
};

i18n
  // Detekcia jazyka používateľa z prehliadača
  .use(LanguageDetector)
  // Prechod pre React
  .use(initReactI18next)
  // Inicializácia i18next
  .init({
    resources,
    fallbackLng: 'sk', // Predvolený jazyk
    debug: process.env.NODE_ENV === 'development', // Debugovanie len vo vývojovom prostredí
    interpolation: {
      escapeValue: false // Nie je potrebný pre React
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'], // Najprv kontrola localStorage, potom prehliadača
      lookupLocalStorage: 'i18nextLng', // Názov kľúča v localStorage
      caches: ['localStorage'], // Uloží vybraný jazyk do localStorage
    },
    react: {
      useSuspense: false // Vypnutie Suspense, môže spôsobovať problémy v niektorých prípadoch
    }
  }, () => {
    // Callback po inicializácii
    if (process.env.NODE_ENV === 'development') {
      logI18nInit();
    }
  });

// Exportujeme instanciu i18n pre použitie v iných častiach aplikácie
export default i18n; 