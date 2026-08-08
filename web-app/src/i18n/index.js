import translations from './translations.json';

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
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'so', name: 'Af Soomaali', flag: '🇸🇴' }
];
