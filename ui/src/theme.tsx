import React from 'react';

import * as allThemes from "@theme-ui/presets";
import { Theme, ThemeProviderProps } from "theme-ui";
import { darken } from "@theme-ui/color";
import { i18n } from './i18next';
import { useThemeSystem } from './components/ThemeSystemProvider';

const { dark } = allThemes;

const defaultTheme: ThemeProviderProps<Theme> = {
  ...dark,
  colors: {
    ...dark.colors,
    primary: '#DA1B9A',
    secondary: '#2030DF',
    accent: '#2030DF',
  },
  buttons: {
    primary: {
      color: '#dedede',
      backgroundColor: '#444',
      // backgroundColor: 'primary',
      '&:hover': {
        color: '#dedede',
        textDecoration: 'none',
        // backgroundColor: darken('primary', 0.05),
        backgroundColor: darken('#444', 0.1)
      },
      '&:disabled': {
        opacity: 0.65,
        cursor: 'not-allowed',
        backgroundColor: '#444',
      }
    }
  }
}

export const themes = {
  chapo: defaultTheme,
  ...allThemes,
}

export function ThemeSelector({ value, onChange }) {
  const { setCurrentTheme } = useThemeSystem();
  // console.log({ context });

  function handleThemeChange(e) {
    setCurrentTheme(e.target.value)
    onChange(e);
  }

  return (
    <select
      value={value}
      onBlur={handleThemeChange}
      className="ml-2 custom-select custom-select-sm w-auto"
    >
      <option disabled>{i18n.t('theme')}</option>
      {Object.keys(themes).map(theme => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </select>
  )
}

// create custom event to allow theme to be changed from anywhere
export function changeTheme(themeName = 'chapo') {
  const event = new CustomEvent('change-theme', { detail: themeName });
  document.dispatchEvent(event);
}

export default defaultTheme;