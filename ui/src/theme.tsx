import React from 'react';

import * as allThemes from '@theme-ui/presets';
import { Theme, ThemeProviderProps } from 'theme-ui';
import { darken, lighten } from '@theme-ui/color';
import { i18n } from './i18next';
import { useThemeSystem } from './components/ThemeSystemProvider';

const { dark } = allThemes;

export const variants = {
  buttons: {
    primary: {
      color: 'text',
      backgroundColor: 'muted',
      cursor: 'pointer',
      // backgroundColor: 'primary',
      '&:hover': {
        color: 'text',
        textDecoration: 'none',
        // backgroundColor: darken('primary', 0.05),
        backgroundColor: darken('muted', 0.1),
      },
      '&:disabled': {
        opacity: 0.65,
        cursor: 'not-allowed',
        backgroundColor: '#444',
      },
    },
    highlight: {
      color: 'text',
      backgroundColor: lighten('muted', 0.1),
      '&:hover': {
        backgroundColor: 'muted',
      },
    },
    danger: {
      backgroundColor: 'danger',
    },
    outline: {
      borderColor: 'muted',
      borderWidth: '1px',
      borderStyle: 'solid',
      backgroundColor: 'transparent',
    },
  },
  forms: {
    select: {
      borderColor: lighten('muted', 0.4),
      backgroundColor: 'background',
      color: 'text',
    },
  },
};

const defaultTheme: ThemeProviderProps<Theme> = {
  ...dark,
  colors: {
    ...dark.colors,
    background: '#222',
    primary: '#DA1B9A',
    secondary: '#2030DF',
    accent: '#F3B90C',
    danger: '#E74C3C',
    muted: '#303030',
  },
};

export const themes = {
  chapo: defaultTheme,
  ...allThemes,
};

export function ThemeSelector({ value, onChange }) {
  const { setCurrentTheme } = useThemeSystem();
  // console.log({ context });

  function handleThemeChange(e) {
    setCurrentTheme(e.target.value);
    onChange(e.target.value);
  }

  return (
    <select
      value={value}
      onChange={handleThemeChange}
      className="ml-2 custom-select custom-select-sm w-auto"
    >
      <option disabled>{i18n.t('theme')}</option>
      {Object.keys(themes).map(theme => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </select>
  );
}

// create custom event to allow theme to be changed from anywhere
export function changeTheme(themeName = 'chapo') {
  const event = new CustomEvent('change-theme', { detail: themeName });
  document.dispatchEvent(event);
}

export default defaultTheme;
