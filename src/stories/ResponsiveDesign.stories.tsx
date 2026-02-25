import type { Meta, StoryObj } from '@storybook/react';

/**
 * Responsive Design
 * Demonstrates layout behavior across device sizes.
 * Use viewport toolbar to preview different screen sizes.
 */

const ResponsiveLayout = () => {
  return (
    <div style={{ padding: '1rem', fontFamily: 'var(--font-sans, system-ui)' }}>
      <h1>Responsive Layout Showcase</h1>
      <p>
        Use the <strong>Viewport</strong> toolbar button (top-right) to preview this layout on mobile, tablet,
        desktop, and wide screens.
      </p>

      {/* Hero Section */}
      <section
        style={{
          padding: '2rem 1rem',
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Responsive Hero</h2>
        <p style={{ margin: '0' }}>Scales font and padding based on viewport</p>
      </section>

      {/* Grid Layout */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Responsive Grid</h2>
        <p>Adapts columns: 1 column on mobile, 2 on tablet, 3+ on desktop</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '1rem',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                textAlign: 'center',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Card {i}</h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Responsive grid item
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Flex Layout */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Flexible Navigation</h2>
        <p>Stack vertically on mobile, horizontally on larger screens</p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {['Home', 'About', 'Services', 'Contact'].map((item) => (
            <button
              key={item}
              style={{
                flex: '1 1 auto',
                minWidth: '100px',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Sidebar Layout */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Sidebar + Content Layout</h2>
        <p>Side-by-side on desktop, stacked on mobile</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(200px, 1fr) 3fr',
            gap: '1.5rem',
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
            },
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              padding: '1rem',
              backgroundColor: 'var(--sidebar)',
              color: 'var(--sidebar-foreground)',
              borderRadius: '0.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0' }}>Sidebar</h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
              <li>Link 1</li>
              <li>Link 2</li>
              <li>Link 3</li>
            </ul>
          </aside>

          {/* Main Content */}
          <main>
            <div style={{ backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Main Content Area</h3>
              <p>
                This layout uses a grid with a flexible sidebar. On mobile (use viewport tool), the sidebar
                stacks above the content. On desktop, they sit side-by-side.
              </p>
              <p>
                The sidebar width is constrained with <code>minmax(200px, 1fr)</code>, while content gets{' '}
                <code>3fr</code> of available space.
              </p>
            </div>
          </main>
        </div>
      </section>

      {/* Fluid Typography */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>Responsive Typography</h2>
        <div
          style={{
            padding: '1.5rem',
            backgroundColor: 'var(--card)',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', margin: '0 0 0.5rem 0' }}>
            Fluid Heading (scales with viewport)
          </h3>
          <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', margin: 0, color: 'var(--muted-foreground)' }}>
            Paragraph also scales. Uses CSS <code>clamp()</code> for smooth responsive sizing.
          </p>
        </div>
      </section>

      {/* Breakpoint Reference */}
      <section>
        <h2>Breakpoint Reference</h2>
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--muted)',
            borderRadius: '0.5rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '0.75rem',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Mobile:</strong> 390px (iPhone 12)
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Tablet:</strong> 820px (iPad Air)
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Desktop:</strong> 1920px (Full HD)
          </p>
          <p style={{ margin: 0 }}>
            <strong>Wide:</strong> 2560px (4K)
          </p>
        </div>
      </section>
    </div>
  );
};

const meta = {
  title: 'Design System/Responsive Design',
  component: ResponsiveLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResponsiveLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const Desktop: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

export const Wide: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'wide',
    },
  },
};

export const Showcase: Story = {};
