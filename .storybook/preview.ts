import '../src/styles/globals.css';
import '../src/styles/index.css';
import type { Preview } from '@storybook/react';
import { themeDecorator, THEME_PRESETS } from './ThemeDecorator';

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
  globals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      // Apply the theme from global state
      const theme = (context.globals.theme || 'light') as keyof typeof THEME_PRESETS;
      return themeDecorator(Story, { ...context, parameters: { ...context.parameters, theme } });
    },
  ],
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Global theme for all stories',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'contrast',
        items: Object.entries(THEME_PRESETS).map(([key, preset]) => ({
          value: key,
          title: preset.name,
          icon: key === 'dark' ? 'moon' : 'sun',
        })),
      },
    },
  },
};

export default preview;
