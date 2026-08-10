import translations from './translations.json';

let currentLanguage = localStorage.getItem('language') || 'en';

export const setLanguage = (lang) => {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
};

export const getLanguage = () => currentLanguage;

const lookupKey = (lang, key) => {
  const keys = key.split('.');
  let value = translations[lang];

  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return undefined;
    }
  }

  return value;
};

export const t = (key, params = {}) => {
  let value = lookupKey(currentLanguage, key);

  if (value === undefined && currentLanguage !== 'en') {
    value = lookupKey('en', key);
  }

  if (value === undefined) {
    return key;
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
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'so', name: 'Af Soomaali', flag: '🇸🇴' }
];
