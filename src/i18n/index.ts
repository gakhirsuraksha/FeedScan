import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';

/**
 * i18n setup. Coverage today: navigation labels, the Home page, and the Test
 * page's title/category/start-stop labels. Other screens (Result, History,
 * Device, Batch) remain English-only for now — see docs/i18n-status.md.
 */
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ta: { translation: ta }, hi: { translation: hi } },
  lng: localStorage.getItem('feedscan.lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setLanguage(lng: 'en' | 'ta' | 'hi') {
  i18n.changeLanguage(lng);
  localStorage.setItem('feedscan.lang', lng);
}

export default i18n;
