import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Typography
 * Showcases font families, sizes, weights, and line-height scales.
 */

const Typography = () => {
  const textSizes = [
    { size: 'xs', label: 'Extra Small', desc: '0.75rem / 12px' },
    { size: 'sm', label: 'Small', desc: '0.875rem / 14px' },
    { size: 'base', label: 'Base', desc: '1rem / 16px' },
    { size: 'lg', label: 'Large', desc: '1.125rem / 18px' },
    { size: 'xl', label: 'Extra Large', desc: '1.25rem / 20px' },
    { size: '2xl', label: '2XL', desc: '1.5rem / 24px' },
  ];

  const fontWeights = [
    { weight: 'normal', label: 'Normal', value: 400 },
    { weight: 'medium', label: 'Medium', value: 500 },
    { weight: 'semibold', label: 'Semibold', value: 600 },
    { weight: 'bold', label: 'Bold', value: 700 },
  ];

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Typography</h1>
      <p>Font families, scales, weights, and specimens.</p>

      {/* Font Families */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Font Families</h2>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Sans Serif (Body)</h3>
          <p style={{ fontFamily: 'var(--font-sans, system-ui)' }}>
            The quick brown fox jumps over the lazy dog. (var(--font-sans))
          </p>
          <code style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            font-family: var(--font-sans)
          </code>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Monospace (Code)</h3>
          <p style={{ fontFamily: 'var(--font-mono, monospace)' }}>
            function hello() console.log('world'); (var(--font-mono))
          </p>
          <code style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            font-family: var(--font-mono)
          </code>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3>Serif (Display)</h3>
          <p style={{ fontFamily: 'var(--font-serif, serif)' }}>
            The quick brown fox jumps over the lazy dog. (var(--font-serif))
          </p>
          <code style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            font-family: var(--font-serif)
          </code>
        </div>
      </section>

      {/* Text Sizes */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Text Sizes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {textSizes.map(({ size, label, desc }) => (
            <div key={size}>
              <div
                style={{
                  fontSize: `var(--text-${size})`,
                  lineHeight: `var(--text-${size}--line-height)`,
                  marginBottom: '0.25rem',
                }}
              >
                {label}: The quick brown fox
              </div>
              <code style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                {desc}
              </code>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Font Weights</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {fontWeights.map(({ weight, label, value }) => (
            <div
              key={weight}
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
            >
              <div style={{ fontWeight: value as any, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                {label}
              </div>
              <code style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                font-weight: {value}
              </code>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: value as any }}>
                The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Headings */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>Headings</h2>
        <h1 style={{ marginTop: '1rem' }}>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
        <h5>Heading 5</h5>
        <h6>Heading 6</h6>
      </section>

      {/* Body Text Styles */}
      <section>
        <h2>Text Styles</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Paragraph */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Paragraph</h4>
            <p>
              This is a standard paragraph. It uses the body font size and line-height. Lorem ipsum dolor sit amet,
              consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>

          {/* Small Text */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Small / Muted</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              This is smaller muted text, often used for captions, timestamps, or secondary information.
            </p>
          </div>

          {/* Emphasis */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Emphasis</h4>
            <p>
              Use <strong>strong</strong> for bold emphasis and <em>italic</em> for text emphasis. You can also use{' '}
              <code>code</code> for inline code snippets.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Links</h4>
            <p>
              <a
                href="#"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                This is a link
              </a>
              . Links use the primary color.
            </p>
          </div>

          {/* Lists */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Unordered List</h4>
            <ul style={{ margin: '0.5rem 0 0 1.5rem' }}>
              <li>First item</li>
              <li>Second item</li>
              <li>Third item</li>
            </ul>
          </div>

          {/* Ordered Lists */}
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Ordered List</h4>
            <ol style={{ margin: '0.5rem 0 0 1.5rem' }}>
              <li>First step</li>
              <li>Second step</li>
              <li>Third step</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Line Height */}
      <section style={{ marginTop: '3rem' }}>
        <h2>Line Height Examples</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Tight Line Height (1.25)</h4>
            <p style={{ lineHeight: 1.25 }}>
              This paragraph uses a tight line height of 1.25. It's useful for headlines and short content. The quick
              brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Normal Line Height (1.5)</h4>
            <p style={{ lineHeight: 1.5 }}>
              This paragraph uses a normal line height of 1.5. It's the default for body text and provides good
              readability. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet.
            </p>
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Loose Line Height (1.75)</h4>
            <p style={{ lineHeight: 1.75 }}>
              This paragraph uses a loose line height of 1.75. It provides extra breathing room and is sometimes used
              for accessibility or design preference. The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit
              amet.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Typography',
  component: Typography,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {};
