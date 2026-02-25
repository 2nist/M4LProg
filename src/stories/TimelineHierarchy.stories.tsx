import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy } from 'lucide-react';

/**
 * Timeline Hierarchy Story
 *
 * Demonstrates how TimelineCards (beats) are organized into bars and sections.
 * 
 * Hierarchy:
 * - Section (e.g., "Verse", "Chorus") — contains multiple bars
 *   - Bar (e.g., "Bar 1", "Bar 2") — contains beatsPerBar beats (typically 4 in 4/4)
 *     - Beat (TimelineCard) — individual chord or note
 *
 * Layout options:
 * 1. **Horizontal Stack** — beats laid out left-to-right in a single row (compact)
 * 2. **Vertical Grid** — beats in a 2D grid (beats per row = beatsPerBar)
 * 3. **Bar Rows** — each bar is a row, bars stack vertically
 * 4. **Section Rows** — each section is collapsible, bars nest inside
 */

// Types
interface Beat {
  index: number;
  chord: string;
  duration: number;
}

interface Bar {
  barNumber: number;
  beats: Beat[];
  beatsPerBar: number;
}

interface Section {
  id: string;
  name: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro';
  repeats: number;
  bars: Bar[];
  beatsPerBar: number;
}

// Component: Beat Card (minimal reuse from TimelineCard.stories.tsx)
const BeatCard: React.FC<{ beat: Beat; isSelected?: boolean; }> = ({ beat, isSelected }) => (
  <div
    style={{
      padding: '0.5rem',
      minHeight: '60px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      borderRadius: '0.25rem',
      border: '1px solid var(--border)',
      backgroundColor: isSelected ? 'var(--primary)' : 'var(--card)',
      color: isSelected ? 'var(--primary-foreground)' : 'var(--card-foreground)',
      fontSize: '0.75rem',
      cursor: 'pointer',
      transition: 'all 100ms ease-out',
      minWidth: '80px',
    }}
  >
    <div style={{ fontWeight: 600, opacity: 0.7 }}>Beat {beat.index}</div>
    <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'monospace' }}>
      {beat.chord}
    </div>
    <div style={{ opacity: 0.6, fontSize: '0.65rem' }}>{beat.duration}x</div>
  </div>
);

// Component: Bar (container for beats in one bar)
interface BeatBarProps {
  bar: Bar;
  isExpanded?: boolean;
  layout?: 'horizontal' | 'grid';
  onDelete?: () => void;
}

const BeatBar: React.FC<BeatBarProps> = ({ bar, isExpanded = true, layout = 'horizontal', onDelete }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      padding: '0.75rem',
      backgroundColor: 'var(--muted)',
      borderRadius: '0.375rem',
      border: '1px solid var(--border)',
    }}
  >
    {/* Bar header */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        opacity: 0.7,
      }}
    >
      <span>Bar {bar.barNumber}</span>
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--destructive)',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          title="Delete bar"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>

    {/* Beats container */}
    <div
      style={{
        display: layout === 'horizontal' ? 'flex' : 'grid',
        gridTemplateColumns: layout === 'grid' ? `repeat(${Math.min(bar.beatsPerBar, 4)}, 1fr)` : undefined,
        gap: '0.5rem',
        flexWrap: layout === 'horizontal' ? 'wrap' : undefined,
      }}
    >
      {bar.beats.map((beat) => (
        <BeatCard key={beat.index} beat={beat} />
      ))}
    </div>
  </div>
);

// Component: Progression Section (container for bars)
interface ProgressionSectionProps {
  section: Section;
  isExpanded?: boolean;
  barLayout?: 'horizontal' | 'grid';
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddBar?: () => void;
}

const ProgressionSection: React.FC<ProgressionSectionProps> = ({
  section,
  isExpanded = true,
  barLayout = 'horizontal',
  onDelete,
  onDuplicate,
  onAddBar,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const totalBeats = section.bars.reduce((sum, bar) => sum + bar.beats.length, 0);

  const sectionColors = {
    verse: 'var(--chart-1)',
    chorus: 'var(--chart-2)',
    bridge: 'var(--chart-3)',
    intro: 'var(--chart-4)',
    outro: 'var(--chart-5)',
  };

  return (
    <div
      style={{
        borderRadius: '0.5rem',
        border: `2px solid ${sectionColors[section.type]}`,
        overflow: 'hidden',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: sectionColors[section.type],
          color: 'var(--primary-foreground)',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{section.name}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
              {section.type} · {section.bars.length} bars · {totalBeats} beats · {section.repeats}x
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            opacity: 0.9,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onAddBar && (
            <button
              onClick={onAddBar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
              title="Add bar"
            >
              <Plus size={16} />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
              title="Duplicate section"
            >
              <Copy size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
              title="Delete section"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Section content (bars) */}
      {expanded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {section.bars.map((bar) => (
            <BeatBar key={bar.barNumber} bar={bar} layout={barLayout} />
          ))}
        </div>
      )}
    </div>
  );
};

// Storybook Meta
const meta: Meta = {
  title: 'Progression/Timeline Hierarchy',
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj;

// Mock data
const mockBeats: Beat[] = [
  { index: 1, chord: 'C maj7', duration: 1 },
  { index: 2, chord: 'F maj7', duration: 1 },
  { index: 3, chord: 'G maj7', duration: 1 },
  { index: 4, chord: 'C maj7', duration: 1 },
];

const mockBar: Bar = {
  barNumber: 1,
  beats: mockBeats,
  beatsPerBar: 4,
};

const mockBars: Bar[] = [
  { barNumber: 1, beats: mockBeats, beatsPerBar: 4 },
  { barNumber: 2, beats: [
    { index: 5, chord: 'A min7', duration: 1 },
    { index: 6, chord: 'D min7', duration: 1 },
    { index: 7, chord: 'G 7', duration: 1 },
    { index: 8, chord: 'C maj7', duration: 1 },
  ], beatsPerBar: 4 },
  { barNumber: 3, beats: [
    { index: 9, chord: 'C maj7', duration: 2 },
    { index: 10, chord: 'F maj7', duration: 2 },
  ], beatsPerBar: 4 },
];

const mockSection: Section = {
  id: 'verse-1',
  name: 'Verse',
  type: 'verse',
  repeats: 2,
  bars: mockBars,
  beatsPerBar: 4,
};

/**
 * Single Beat Card
 */
export const SingleBeat: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
      <h2>Single Beat</h2>
      <div style={{ maxWidth: '150px', marginTop: '1rem' }}>
        <BeatCard beat={mockBeats[0]} />
      </div>
    </div>
  ),
};

/**
 * Single Bar (4 beats in 4/4 time)
 */
export const SingleBar: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
      <h2>Single Bar (4/4 time signature)</h2>
      <div style={{ maxWidth: '600px', marginTop: '1rem' }}>
        <BeatBar bar={mockBar} layout="horizontal" />
      </div>
    </div>
  ),
};

/**
 * Bar with Grid Layout (2x2 grid of beats)
 */
export const BarGridLayout: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
      <h2>Bar with Grid Layout</h2>
      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
        Beats arranged in a 2D grid (useful for detailed editing)
      </p>
      <div style={{ maxWidth: '400px', marginTop: '1rem' }}>
        <BeatBar bar={mockBar} layout="grid" />
      </div>
    </div>
  ),
};

/**
 * Multiple Bars Stacked
 */
export const MultipleBars: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
      <h2>Multiple Bars (Linear Progression)</h2>
      <div style={{ maxWidth: '700px', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {mockBars.map((bar) => (
          <BeatBar key={bar.barNumber} bar={bar} layout="horizontal" />
        ))}
      </div>
    </div>
  ),
};

/**
 * Full Section (collapsible container)
 */
export const SingleSection: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)' }}>
      <h2>Progression Section (Collapsible)</h2>
      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
        Click header to expand/collapse. Shows section type, repeats, and bar count.
      </p>
      <div style={{ maxWidth: '800px', marginTop: '1rem' }}>
        <ProgressionSection
          section={mockSection}
          barLayout="horizontal"
          onDelete={() => alert('Delete section')}
          onDuplicate={() => alert('Duplicate section')}
          onAddBar={() => alert('Add bar')}
        />
      </div>
    </div>
  ),
};

/**
 * Full Song Structure (multiple sections)
 */
export const FullSongStructure: Story = {
  render: () => {
    const sections: Section[] = [
      {
        id: 'intro',
        name: 'Intro',
        type: 'intro',
        repeats: 1,
        bars: [
          {
            barNumber: 1,
            beats: [
              { index: 1, chord: 'C maj7', duration: 1 },
              { index: 2, chord: 'F maj7', duration: 1 },
              { index: 3, chord: 'G 7', duration: 1 },
              { index: 4, chord: 'C maj7', duration: 1 },
            ],
            beatsPerBar: 4,
          },
        ],
        beatsPerBar: 4,
      },
      {
        id: 'verse',
        name: 'Verse',
        type: 'verse',
        repeats: 2,
        bars: mockBars.slice(0, 2),
        beatsPerBar: 4,
      },
      {
        id: 'chorus',
        name: 'Chorus',
        type: 'chorus',
        repeats: 1,
        bars: [
          {
            barNumber: 5,
            beats: [
              { index: 17, chord: 'G maj7', duration: 2 },
              { index: 18, chord: 'C maj7', duration: 2 },
            ],
            beatsPerBar: 4,
          },
        ],
        beatsPerBar: 4,
      },
    ];

    return (
      <div style={{ padding: '2rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
        <h2>Full Song Structure</h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '2rem' }}>
          Complete progression: Intro → Verse (2x) → Chorus
        </p>
        <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((section) => (
            <ProgressionSection
              key={section.id}
              section={section}
              barLayout="horizontal"
              onDelete={() => alert(`Delete ${section.name}`)}
              onDuplicate={() => alert(`Duplicate ${section.name}`)}
              onAddBar={() => alert(`Add bar to ${section.name}`)}
            />
          ))}
        </div>
      </div>
    );
  },
};

/**
 * Interactive: Expand/Collapse Sections
 */
export const InteractiveStructure: Story = {
  render: () => {
    const [sections, setSections] = useState<Section[]>([
      {
        id: 'verse-1',
        name: 'Verse 1',
        type: 'verse',
        repeats: 1,
        bars: mockBars.slice(0, 2),
        beatsPerBar: 4,
      },
      {
        id: 'chorus',
        name: 'Chorus',
        type: 'chorus',
        repeats: 1,
        bars: [
          {
            barNumber: 5,
            beats: [
              { index: 17, chord: 'G maj7', duration: 2 },
              { index: 18, chord: 'C maj7', duration: 2 },
            ],
            beatsPerBar: 4,
          },
        ],
        beatsPerBar: 4,
      },
      {
        id: 'verse-2',
        name: 'Verse 2',
        type: 'verse',
        repeats: 1,
        bars: mockBars.slice(0, 2),
        beatsPerBar: 4,
      },
    ]);

    return (
      <div style={{ padding: '2rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2>Interactive Song Timeline</h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            Click section headers to expand/collapse. Use buttons to add, duplicate, or delete.
          </p>
        </div>
        <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {sections.map((section) => (
            <ProgressionSection
              key={section.id}
              section={section}
              barLayout="horizontal"
              isExpanded={true}
              onDelete={() => setSections(sections.filter((s) => s.id !== section.id))}
              onDuplicate={() => {
                const dup = { ...section, id: `${section.id}-dup` };
                setSections([...sections, dup]);
              }}
              onAddBar={() => alert(`Add bar to ${section.name}`)}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: 'var(--muted)',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}
        >
          <strong>Summary:</strong> {sections.length} sections, {sections.reduce((sum, s) => sum + s.bars.length, 0)} bars total
        </div>
      </div>
    );
  },
};

/**
 * Arrangement Lane Preview (like the real app)
 */
export const ArrangementLanePreview: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <h2>Arrangement Lane (Timeline View)</h2>
      <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '2rem' }}>
        How sections and bars appear as blocks in the arrangement lane (for playback).
      </p>
      <div
        style={{
          backgroundColor: 'var(--muted)',
          borderRadius: '0.375rem',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '1rem', opacity: 0.7 }}>
          ARRANGEMENT LANE
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: '0 0 150px',
              padding: '1rem',
              backgroundColor: 'var(--chart-1)',
              color: 'var(--primary-foreground)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            Verse 1
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 beats</div>
          </div>
          <div
            style={{
              flex: '0 0 150px',
              padding: '1rem',
              backgroundColor: 'var(--chart-2)',
              color: 'var(--primary-foreground)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            Chorus
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>4 beats</div>
          </div>
          <div
            style={{
              flex: '0 0 150px',
              padding: '1rem',
              backgroundColor: 'var(--chart-1)',
              color: 'var(--primary-foreground)',
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            Verse 2
            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>8 beats</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
        <strong>Layout Strategy:</strong>
        <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
          <li><strong>Arrangement Lane:</strong> Shows blocks (sections) as horizontal bars in playback view</li>
          <li><strong>Section Editor:</strong> Expand section to edit bars and individual beats</li>
          <li><strong>Beat Editor:</strong> Edit individual beat properties (velocity, gate, strum)</li>
        </ul>
      </div>
    </div>
  ),
};

/**
 * Layout Comparison: Horizontal vs Grid
 */
export const LayoutComparison: Story = {
  render: () => (
    <div style={{ padding: '2rem', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <h2>Layout Options: Horizontal vs Grid</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        {/* Horizontal */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Horizontal (Compact)</h3>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
            Beats flow left-to-right. Good for overview and playback.
          </p>
          <BeatBar bar={mockBar} layout="horizontal" />
        </div>

        {/* Grid */}
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Grid (Detailed)</h3>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>
            Beats in a grid. Good for rhythm and editing.
          </p>
          <BeatBar bar={mockBar} layout="grid" />
        </div>
      </div>
    </div>
  ),
};
