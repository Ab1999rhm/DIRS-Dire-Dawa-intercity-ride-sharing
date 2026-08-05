import en from './en.json';
import am from './am.json';

const translations = {
  en,
  am
};

let currentLanguage = localStorage.getItem('language') || 'en';

export const setLanguage = (lang) => {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
};

export const getLanguage = () => currentLanguage;

export const t = (key, params = {}) => {
  const keys = key.split('.');
  let value = translations[currentLanguage];

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key;
    }
  }

  if (typeof value === 'string') {
    return Object.entries(params).reduce(
      (str, [param, val]) => str.replace(`{{${param}}}`, val),
      value
    );
  }

  return value;
};

export const getAvailableLanguages = () => [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' }
];

export default { t, setLanguage, getLanguage, getAvailableLanguages };
