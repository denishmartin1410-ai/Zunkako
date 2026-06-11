// src/context/ThemeContext.js
// ✅ isDark + toggleTheme aliases added (SettingsScreen uses these)

import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({children}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@F2C_darkMode').then(value => {
      if (value !== null) {
        setIsDarkMode(JSON.parse(value));
      }
    });
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    AsyncStorage.setItem('@F2C_darkMode', JSON.stringify(newValue));
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        // ✅ Aliases — SettingsScreen uses these names
        isDark: isDarkMode,
        toggleTheme: toggleDarkMode,
      }}>
      {children}
    </ThemeContext.Provider>
  );
};
