import React, { createContext, useState, useContext, useCallback } from 'react';
import { setLanguage as setLang, getLanguage, t as translate, getAvailableLanguages } from '../i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguage());

  const setLanguage = useCallback((lang) => {
    setLang(lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key, params) => translate(key, params), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, availableLanguages: getAvailableLanguages() }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
