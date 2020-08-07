import React, { useState, useContext, createContext, useEffect } from 'react';
import { ThemeProvider } from 'theme-ui';
import { UserService } from '../services';
import { themes, variants } from '../theme';

const ThemeSystem = createContext({});

function ThemeSystemProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark');

  const theme = Object.keys(themes).includes(currentTheme)
    ? themes[currentTheme]
    : themes.dark;

  useEffect(() => {
    const theme = UserService?.Instance?.user?.theme;

    if (theme) {
      setCurrentTheme(theme);
    }
  }, []);

  useEffect(() => {
    function handleThemeChange(e) {
      setCurrentTheme(e.detail);
    }

    document.addEventListener('change-theme', handleThemeChange);

    return () =>
      document.removeEventListener('change-theme', handleThemeChange);
  }, []);

  return (
    <ThemeSystem.Provider
      value={{
        currentTheme,
        setCurrentTheme,
      }}
    >
      <ThemeProvider theme={{ ...theme, ...variants }}>
        {children}
      </ThemeProvider>
    </ThemeSystem.Provider>
  );
}

// you can also create this helper to avoid having to import two things to use this context
const useThemeSystem = () => {
  return useContext(ThemeSystem);
};

export { ThemeSystemProvider, ThemeSystem, useThemeSystem };
