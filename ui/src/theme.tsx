import React from 'react';

import * as allThemes from '@theme-ui/presets';
import { Select, Theme, ThemeProviderProps } from 'theme-ui';
import { darken, lighten } from '@theme-ui/color';
import { i18n } from './i18next';
import { useThemeSystem } from './components/ThemeSystemProvider';

const { dark, bulma, tailwind, ...remainingThemes } = allThemes;

export const variants: any = {
  buttons: {
    primary: {
      color: 'background',
      bg: 'primary',
      cursor: 'pointer',
      '&:hover': {
        textDecoration: 'none',
        cursor: 'pointer',
        color: 'background',
      },
      '&:disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    secondary: {
      color: 'background',
      bg: 'secondary',
    },
    muted: {
      bg: 'muted',
      color: 'text',
    },
    highlight: {
      bg: 'highlight',
      color: 'text',
      '&:hover': {
        backgroundColor: 'muted',
      },
    },
    danger: {
      backgroundColor: 'danger',
    },
    outline: {
      color: 'text',
      borderColor: 'muted',
      borderWidth: '2px',
      borderStyle: 'solid',
      backgroundColor: 'transparent',
    },
  },
  forms: {
    select: {
      // borderColor: lighten('muted', 0.4),
      backgroundColor: 'background',
      color: 'text',
    },
  },
  alerts: {
    primary: {
      color: 'background',
      bg: 'primary',
    },
    muted: {
      color: 'text',
      bg: 'muted',
    },
  },
};

const defaultTheme: ThemeProviderProps<Theme> = {
  ...dark,
  colors: {
    ...dark.colors,
    background: '#222',
    // primary: '#DA1B9A',
    primary: '#A4288B',
    secondary: '#2030DF',
    accent: '#F3B90C',
    danger: '#dc3545',
    muted: '#303030',
  },
  buttons: {
    ...variants.buttons,
    primary: {
      ...variants.buttons.primary,
      color: 'text',
      bg: 'primary',
      '&:hover': {
        bg: 'primary',
      },
    },
    secondary: {
      ...variants.buttons.secondary,
      color: 'text',
      bg: 'secondary',
    },
    highlight: {
      ...variants.buttons.highlight,
      color: 'text',
      bg: lighten('muted', 0.1),
    },
  },
  alerts: {
    ...variants.alerts,
    primary: {
      ...variants.alerts.primary,
      color: 'text',
      bg: 'primary',
    },
    secondary: {
      ...variants.alerts.secondary,
      color: 'text',
      bg: 'secondary',
    },
    highlight: {
      ...variants.alerts.highlight,
      color: 'text',
      bg: lighten('muted', 0.1),
    },
  },
};

export const themes = {
  chapo: { ...defaultTheme },
  dark,
  ...remainingThemes,
};

// console.log({ themes })

export function ThemeSelector({ value, onChange }) {
  const { setCurrentTheme } = useThemeSystem();
  // console.log({ context });

  function handleThemeChange(e) {
    setCurrentTheme(e.target.value);
    onChange(e.target.value);
  }

  return (
    <Select
      value={value}
      onChange={handleThemeChange}
      // ml={2}
      // className="ml-2 custom-select custom-select-sm w-auto"
    >
      <option disabled>{i18n.t('theme')}</option>
      {Object.keys(themes).map(theme => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </Select>
  );
}

// create custom event to allow theme to be changed from anywhere
export function changeTheme(themeName = 'chapo') {
  const event = new CustomEvent('change-theme', { detail: themeName });
  document.dispatchEvent(event);
}

export default defaultTheme;
