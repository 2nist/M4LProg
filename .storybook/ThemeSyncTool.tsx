import { useEffect } from 'react';
import { useGlobals } from '@storybook/api';
import applyTheme from '../src/styles/applyTheme';
import { THEME_PRESETS, type ThemePreset } from './ThemeDecorator';

/**
 * Theme sync tool for Storybook toolbar.
 * Watches for toolbar theme changes and applies them globally.
 */
export function ThemeSyncTool() {
  const [globals, updateGlobals] = useGlobals();

  useEffect(() => {
    const theme = (globals.theme || 'light') as ThemePreset;
    const preset = THEME_PRESETS[theme];

    if (preset) {
      applyTheme(preset.tokens as Record<string, string>);
    }

    // Apply/remove dark class
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [globals.theme]);

  return null;
}
