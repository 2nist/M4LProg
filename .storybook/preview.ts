import '../src/styles/globals.css';
import '../src/styles/index.css';
import type { Preview } from '@storybook/react';
import { themeDecorator, THEME_PRESETS } from './ThemeDecorator';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (iPhone 12)',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (iPad Air)',
          styles: { width: '820px', height: '1180px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1920x1080)',
          styles: { width: '1920px', height: '1080px' },
          type: 'desktop',
        },
        wide: {
          name: 'Wide (2560x1440)',
          styles: { width: '2560x', height: '1440px' },
          type: 'desktop',
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'Light (App BG)',
          value: 'var(--background)',
        },
        {
          name: 'Dark (Sidebar)',
          value: '#1a1a1a',
        },
        {
          name: 'White',
          value: '#ffffff',
        },
        {
          name: 'Black',
          value: '#000000',
        },
      ],
    },
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
