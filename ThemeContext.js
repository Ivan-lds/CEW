import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definição das cores dos temas
export const themes = {
  light: {
    background: '#F5F5F5',
    panel: '#FFFFFF',
    border: '#E0E0E0',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#007BFF',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  },
  dark: {
    background: '#121212',
    panel: '#1f1f1f',
    border: '#F5F5F5',
    text: '#fff',
    textSecondary: '#CCCCCC',
    accent: '#007BFF',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  }
};

export const ThemeContext = createContext({
  isDarkMode: false,
  theme: themes.light,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Erro ao carregar preferência de tema:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('isDarkMode', isDarkMode.toString());
      } catch (error) {
        console.error('Erro ao salvar preferência de tema:', error);
      }
    };
    
    saveThemePreference();
  }, [isDarkMode]);
  
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };
  
  const themeContextValue = {
    isDarkMode,
    theme: isDarkMode ? themes.dark : themes.light,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
