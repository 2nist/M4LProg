import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Color Palette
 * Displays all semantic color tokens used throughout the design system.
 * Colors adapt to the active theme via CSS variables.
 */

const ColorPalette = () => {
  const semanticColors = [
    {
      name: 'Primary',
      variable: '--primary',
      desc: 'Primary accent for buttons, links, highlights',
    },
    {
      name: 'Primary Foreground',
      variable: '--primary-foreground',
      desc: 'Text color on primary backgrounds',
    },
    {
      name: 'Secondary',
      variable: '--secondary',
      desc: 'Secondary accent, alternative to primary',
    },
    {
      name: 'Secondary Foreground',
      variable: '--secondary-foreground',
      desc: 'Text color on secondary backgrounds',
    },
    {
      name: 'Muted',
      variable: '--muted',
      desc: 'Muted background for disabled or secondary content',
    },
    {
      name: 'Muted Foreground',
      variable: '--muted-foreground',
      desc: 'Text color on muted backgrounds',
    },
    {
      name: 'Accent',
      variable: '--accent',
      desc: 'Accent color for warnings, tertiary actions',
    },
    {
      name: 'Accent Foreground',
      variable: '--accent-foreground',
      desc: 'Text color on accent backgrounds',
    },
    {
      name: 'Destructive',
      variable: '--destructive',
      desc: 'Red for delete, cancel, error states',
    },
    {
      name: 'Destructive Foreground',
      variable: '--destructive-foreground',
      desc: 'Text color on destructive backgrounds',
    },
    {
      name: 'Background',
      variable: '--background',
      desc: 'Primary page/app background',
    },
    {
      name: 'Foreground',
      variable: '--foreground',
      desc: 'Primary text color',
    },
    {
      name: 'Card',
      variable: '--card',
      desc: 'Card/panel background',
    },
    {
      name: 'Card Foreground',
      variable: '--card-foreground',
      desc: 'Text color on card backgrounds',
    },
    {
      name: 'Popover',
      variable: '--popover',
      desc: 'Modal/dropdown/popover background',
    },
    {
      name: 'Popover Foreground',
      variable: '--popover-foreground',
      desc: 'Text color in popovers',
    },
    {
      name: 'Border',
      variable: '--border',
      desc: 'Border and outline color',
    },
    {
      name: 'Input',
      variable: '--input',
      desc: 'Input field background',
    },
    {
      name: 'Ring',
      variable: '--ring',
      desc: 'Focus ring color',
    },
    {
      name: 'Sidebar',
      variable: '--sidebar',
      desc: 'Sidebar/navigation background',
    },
    {
      name: 'Sidebar Foreground',
      variable: '--sidebar-foreground',
      desc: 'Text color in sidebar',
    },
  ];

  const chartColors = [
    { name: 'Chart 1', variable: '--chart-1', desc: 'Primary chart color' },
    { name: 'Chart 2', variable: '--chart-2', desc: 'Secondary chart color' },
    { name: 'Chart 3', variable: '--chart-3', desc: 'Tertiary chart color' },
    { name: 'Chart 4', variable: '--chart-4', desc: 'Quaternary chart color' },
    { name: 'Chart 5', variable: '--chart-5', desc: 'Quinary chart color' },
  ];

  const ColorSwatch = ({ name, variable, desc }: { name: string; variable: string; desc: string }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '120px',
          backgroundColor: `var(${variable})`,
          borderRadius: '0.25rem',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      />
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600 }}>{name}</h4>
        <code
          style={{
            fontSize: '0.75rem',
            backgroundColor: 'var(--muted)',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            display: 'inline-block',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          {variable}
        </code>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          {desc}
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Color Palette</h1>
      <p>Semantic colors that adapt to the active theme. Use these tokens instead of hard-coded colors.</p>

      {/* Semantic Colors */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Semantic Colors</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {semanticColors.map(({ name, variable, desc }) => (
            <ColorSwatch key={variable} name={name} variable={variable} desc={desc} />
          ))}
        </div>
      </section>

      {/* Chart Colors */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Chart Colors</h2>
        <p>Use these for data visualization and charts.</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
          }}
        >
          {chartColors.map(({ name, variable, desc }) => (
            <ColorSwatch key={variable} name={name} variable={variable} desc={desc} />
          ))}
        </div>
      </section>

      {/* Color Combinations */}
      <section>
        <h2>Common Combinations</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Primary Button */}
          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Primary Button</h4>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Click Me
            </button>
          </div>

          {/* Destructive Button */}
          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Destructive Button</h4>
            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--destructive)',
                color: 'var(--destructive-foreground)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Delete
            </button>
          </div>

          {/* Card */}
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Card</h4>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Cards use <code>--card</code> background with <code>--card-foreground</code> text.
            </p>
          </div>

          {/* Input */}
          <div
            style={{
              padding: '1rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Input Field</h4>
            <input
              type="text"
              placeholder="Type something..."
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'var(--input)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                borderRadius: '0.25rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Colors',
  component: ColorPalette,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Palette: Story = {};
