import React, {createContext, useContext, useState} from 'react';
import {useTranslation} from 'react-i18next';
import i18n from '../locales/i18n';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({children}) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'ta');

  const changeLanguage = async lang => {
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  const languages = [
    {code: 'ta', name: 'தமிழ்', nativeName: 'Tamil'},
    {code: 'en', name: 'English', nativeName: 'English'},
    {code: 'ml', name: 'മലയാളം', nativeName: 'Malayalam'},
  ];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        languages,
      }}>
      {children}
    </LanguageContext.Provider>
  );
};
