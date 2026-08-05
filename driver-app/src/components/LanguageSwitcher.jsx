import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = () => {
  const { language, setLanguage, availableLanguages } = useLanguage();

  return (
    <div className="language-switcher">
      <FaGlobe className="lang-icon" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="lang-select"
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
