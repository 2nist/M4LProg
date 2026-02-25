import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import applyTheme from '../styles/applyTheme';

/**
 * Theme showcase demonstrating:
 * - CSS variable-driven theming
 * - Static theme files
 * - Runtime theme switching via `applyTheme()`
 */

const ThemeShowcase = () => {
  const [activeTheme, setActiveTheme] = useState<'default' | 'example'>('default');
  const [customOverride, setCustomOverride] = useState('');

  const themes = {
    default: {
      '--background': '#f7f9f3',
      '--foreground': '#000000',
      '--primary': '#4f46e5',
      '--muted': '#f0f0f0',
      '--border': '#000000',
    },
    example: {
      '--background': '#0b0b0f',
      '--foreground': '#f6f6f2',
      '--primary': '#ff6b6b',
      '--muted': '#121214',
      '--border': '#222228',
    },
  };

  const applyNamedTheme = (name: 'default' | 'example') => {
    setActiveTheme(name);
    applyTheme(themes[name] as Record<string, string>);
  };

  const applyCustom = () => {
    try {
      const parsed = JSON.parse(customOverride);
      applyTheme(parsed);
      setCustomOverride('');
    } catch {
      alert('Invalid JSON');
    }
  };

  useEffect(() => {
    applyNamedTheme('default');
  }, []);

  const tokenList = [
    { name: '--background', desc: 'Page background' },
    { name: '--foreground', desc: 'Text color' },
    { name: '--primary', desc: 'Primary accent' },
    { name: '--muted', desc: 'Muted surface' },
    { name: '--border', desc: 'Border color' },
    { name: '--ring', desc: 'Focus ring' },
    { name: '--font-sans', desc: 'Font family' },
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Theme System</h1>
      <p>
        This app uses CSS variables for theming. Switch between preset themes or apply custom overrides at runtime.
      </p>

      {/* Theme Buttons */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => applyNamedTheme('default')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeTheme === 'default' ? 'var(--primary)' : 'var(--muted)',
            color: activeTheme === 'default' ? '#fff' : 'var(--foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            borderRadius: '0.25rem',
          }}
        >
          Light Theme
        </button>
        <button
          onClick={() => applyNamedTheme('example')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeTheme === 'example' ? 'var(--primary)' : 'var(--muted)',
            color: activeTheme === 'example' ? '#fff' : 'var(--foreground)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            borderRadius: '0.25rem',
          }}
        >
          Dark Theme
        </button>
      </div>

      {/* Custom Override */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Custom Override</h3>
        <textarea
          value={customOverride}
          onChange={(e) => setCustomOverride(e.target.value)}
          placeholder={JSON.stringify({ '--primary': '#00ff00' })}
          style={{
            width: '100%',
            minHeight: '100px',
            fontFamily: 'var(--font-mono, monospace)',
            padding: '0.5rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
          }}
        />
        <button
          onClick={applyCustom}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '0.25rem',
          }}
        >
          Apply Custom
        </button>
      </div>

      {/* Token Reference */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Available Tokens</h3>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid var(--border)',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: 'var(--muted)' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border)' }}>Token</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border)' }}>Description</th>
              <th style={{ padding: '0.5rem', textAlign: 'left', border: '1px solid var(--border)' }}>Preview</th>
            </tr>
          </thead>
          <tbody>
            {tokenList.map(({ name, desc }) => (
              <tr key={name}>
                <td style={{ padding: '0.5rem', border: '1px solid var(--border)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {name}
                </td>
                <td style={{ padding: '0.5rem', border: '1px solid var(--border)' }}>{desc}</td>
                <td
                  style={{
                    padding: '0.5rem',
                    border: '1px solid var(--border)',
                    backgroundColor: `var(${name})`,
                    color: name.includes('background') || name.includes('muted') ? 'var(--foreground)' : '#fff',
                    minHeight: '2rem',
                  }}
                >
                  {name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Current Active Theme */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: '0.25rem' }}>
        <h3>Active Theme: {activeTheme}</h3>
        <p>
          Check your browser console: <code>localStorage.setItem('theme-override', JSON.stringify({'{--primary: "#00ff00"}}))</code>
        </p>
      </div>
    </div>
  );
};

const meta = {
  title: 'Design System/Theme',
  component: ThemeShowcase,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeShowcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Showcase: Story = {
  render: () => <ThemeShowcase />,
};
