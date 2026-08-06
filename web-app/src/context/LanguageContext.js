import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { setLanguage as setLang, getLanguage, t as translate, getAvailableLanguages } from '../i18n';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getLanguage());

  const setLanguage = useCallback((lang) => {
    setLang(lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key, params) => translate(key, params), [language]);

  const availableLanguages = useMemo(() => getAvailableLanguages(), []);
  const value = useMemo(() => ({ language, setLanguage, t, availableLanguages }), [language, setLanguage, t, availableLanguages]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
