import React, { useState, useContext, createContext, useEffect } from 'react';
import { ThemeProvider } from 'theme-ui';
import { UserService } from '../services';
import { themes, variants } from '../theme';

const ThemeSystem = createContext({});

function ThemeSystemProvider({ children, initialTheme = 'chapo' }) {
  console.log({ initialTheme });
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  const theme = Object.keys(themes).includes(currentTheme)
    ? themes[currentTheme]
    : themes.chapo;

  useEffect(() => {
    // const theme = UserService?.Instance?.user?.theme;

    // if (theme) {
    //   setCurrentTheme(theme);
    // }
  }, []);

  useEffect(() => {
    function handleThemeChange(e) {
      if (Object.keys(themes).includes(e.detail)) {
        setCurrentTheme(e.detail);
      } else {
        setCurrentTheme('chapo');
      }
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
      <ThemeProvider theme={{
        ...variants,
        ...theme,
      }}>
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
