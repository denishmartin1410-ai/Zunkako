import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ta from './ta.json';
import en from './en.json';
import ml from './ml.json';

const LANGUAGE_STORAGE_KEY = '@F2C_language';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async callback => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      callback(savedLanguage || 'ta');
    } catch {
      callback('ta');
    }
  },
  init: () => {},
  cacheUserLanguage: async language => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'ta',
    resources: {
      ta: {translation: ta},
      en: {translation: en},
      ml: {translation: ml},
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
