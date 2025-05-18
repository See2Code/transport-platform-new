declare module 'i18next' {
  const i18n: any;
  export default i18n;
  export const createInstance: any;
  export const initReactI18next: any;
  export const use: any;
  export const t: any;
}

declare module 'react-i18next' {
  export const useTranslation: any;
  export const withTranslation: any;
  export const Trans: any;
  export const Translation: any;
  export const initReactI18next: any;
}

declare module 'i18next-browser-languagedetector' {
  const LanguageDetector: any;
  export default LanguageDetector;
} 