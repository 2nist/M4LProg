import { ReactNode } from 'react';
import { Decorator } from '@storybook/react';
import applyTheme from '../src/styles/applyTheme';

/**
 * Theme context for Storybook.
 * Provides a global theme switcher in the toolbar.
 */

export const THEME_PRESETS = {
  light: {
    name: 'Light (Default)',
    tokens: {
      '--background': '#f7f9f3',
      '--foreground': '#000000',
      '--card': '#ffffff',
      '--card-foreground': '#000000',
      '--popover': '#ffffff',
      '--popover-foreground': '#000000',
      '--primary': '#4f46e5',
      '--primary-foreground': '#ffffff',
      '--secondary': '#14b8a6',
      '--secondary-foreground': '#ffffff',
      '--muted': '#f0f0f0',
      '--muted-foreground': '#333333',
      '--accent': '#f59e0b',
      '--accent-foreground': '#000000',
      '--destructive': '#ef4444',
      '--destructive-foreground': '#ffffff',
      '--border': '#000000',
      '--input': '#737373',
      '--ring': '#a5b4fc',
      '--sidebar': '#f7f9f3',
      '--sidebar-foreground': '#000000',
    },
  },
  dark: {
    name: 'Dark',
    tokens: {
      '--background': '#000000',
      '--foreground': '#fff9e5',
      '--card': '#000000',
      '--card-foreground': '#fff9e5',
      '--popover': '#000000',
      '--popover-foreground': '#fff9e5',
      '--primary': '#17d0d3',
      '--primary-foreground': '#000000',
      '--secondary': '#feae01',
      '--secondary-foreground': '#000000',
      '--muted': '#1f1f1f',
      '--muted-foreground': '#cccccc',
      '--accent': '#4e4537',
      '--accent-foreground': '#000000',
      '--destructive': '#f87171',
      '--destructive-foreground': '#000000',
      '--border': '#363636',
      '--input': '#fff9e5',
      '--ring': '#17d0d3',
      '--sidebar': '#000000',
      '--sidebar-foreground': '#fff9e5',
    },
  },
  example: {
    name: 'Example (Custom)',
    tokens: {
      '--background': '#0b0b0f',
      '--foreground': '#f6f6f2',
      '--card': '#0f1113',
      '--card-foreground': '#f6f6f2',
      '--popover': '#0d0f11',
      '--popover-foreground': '#f6f6f2',
      '--primary': '#ff6b6b',
      '--primary-foreground': '#ffffff',
      '--secondary': '#7c5cff',
      '--secondary-foreground': '#ffffff',
      '--muted': '#121214',
      '--muted-foreground': '#cfcfcf',
      '--accent': '#ffb86b',
      '--accent-foreground': '#000000',
      '--destructive': '#e55353',
      '--destructive-foreground': '#ffffff',
      '--border': '#222228',
      '--input': '#1a1a1f',
      '--ring': '#ff6b6b',
      '--sidebar': '#0b0b0f',
      '--sidebar-foreground': '#f6f6f2',
    },
  },
};

export type ThemePreset = keyof typeof THEME_PRESETS;

/**
 * Global theme decorator that applies theme variables at render time.
 * Usage in preview.ts:
 *   import { themeDecorator } from './ThemeDecorator';
 *   export const decorators = [themeDecorator];
 */
export const themeDecorator: Decorator = (Story, context) => {
  const theme = (context.parameters.theme || 'light') as ThemePreset;
  const preset = THEME_PRESETS[theme];

  if (preset) {
    applyTheme(preset.tokens as Record<string, string>);
  }

  // Apply body class for .dark theme
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  return <Story />;
};
