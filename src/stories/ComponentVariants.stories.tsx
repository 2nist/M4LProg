import type { Meta, StoryObj } from '@storybook/react-vite';
import { THEME_PRESETS } from '../../.storybook/ThemeDecorator';
import applyTheme from '../styles/applyTheme';

/**
 * Component Variants Across Themes
 * Shows how components render in light, dark, and example themes.
 * Useful for design consistency checks and accessibility review.
 */

const ComponentVariants = () => {
  const themes = Object.entries(THEME_PRESETS);

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Component Variants Across Themes</h1>
      <p>
        Below, each component is rendered in all available themes. Use this to verify design consistency and
        accessibility across color schemes.
      </p>

      {/* Buttons */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Buttons</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {themes.map(([themeKey, theme]) => (
            <div
              key={themeKey}
              style={{
                padding: '1.5rem',
                backgroundColor: `var(--muted)`,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>{theme.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => applyTheme(theme.tokens as Record<string, string>)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Primary
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Secondary
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Outline
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--destructive)',
                    color: 'var(--destructive-foreground)',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Destructive
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Inputs */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Input Fields</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {themes.map(([themeKey, theme]) => (
            <div
              key={`input-${themeKey}`}
              style={{
                padding: '1.5rem',
                backgroundColor: `var(--muted)`,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>{theme.name}</h4>
              <input
                type="text"
                placeholder="Enter text..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.875rem',
                  marginBottom: '0.75rem',
                }}
              />
              <textarea
                placeholder="Enter longer text..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--input)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.875rem',
                  minHeight: '80px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Cards</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {themes.map(([themeKey, theme]) => (
            <div
              key={`card-${themeKey}`}
              style={{
                padding: '1.5rem',
                backgroundColor: `var(--muted)`,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>{theme.name}</h4>
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--card)',
                  color: 'var(--card-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
              >
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600 }}>
                  Card Title
                </h5>
                <p style={{ margin: 0, fontSize: '0.75rem' }}>
                  This is a card component using semantic color tokens. It adapts to the theme automatically.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Status Badges */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Status Badges</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {themes.map(([themeKey, theme]) => (
            <div
              key={`badge-${themeKey}`}
              style={{
                padding: '1.5rem',
                backgroundColor: `var(--muted)`,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>{theme.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  Active
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  Warning
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--destructive)',
                    color: 'var(--destructive-foreground)',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  Error
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'var(--muted)',
                    color: 'var(--muted-foreground)',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  Disabled
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alerts / Messages */}
      <section>
        <h2>Alert Messages</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
          }}
        >
          {themes.map(([themeKey, theme]) => (
            <div
              key={`alert-${themeKey}`}
              style={{
                padding: '1.5rem',
                backgroundColor: `var(--muted)`,
                borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}
            >
              <h4 style={{ margin: '0 0 1rem 0' }}>{theme.name}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Info */}
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  ℹ️ Info message
                </div>

                {/* Success */}
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--chart-2)',
                    color: 'white',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  ✓ Success message
                </div>

                {/* Warning */}
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  ⚠ Warning message
                </div>

                {/* Error */}
                <div
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--destructive)',
                    color: 'var(--destructive-foreground)',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                  }}
                >
                  ✕ Error message
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Component Variants',
  component: ComponentVariants,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentVariants>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllThemes: Story = {};
