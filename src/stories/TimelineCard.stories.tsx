import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Music, Lock, AlertCircle, Copy, Trash2, Edit } from 'lucide-react';

/**
 * TimelineCard Storybook
 * 
 * A "beat card" or "timeline cell" representing a single beat in the progression timeline.
 * Each card displays chord info, metadata, and responds to user interactions.
 * 
 * Purpose: Design, test, and document the visual and interactive states of timeline cards.
 */

// Mock Chord type
interface MockChord {
  root: number;
  quality: string;
  duration: number;
  notes: number[];
  metadata?: {
    velocity?: number;
    gate?: number;
    strum?: number;
    inPattern?: string;
    locked?: boolean;
  };
}

interface TimelineCardProps {
  beatIndex: number;
  chord: MockChord | null;
  isSelected?: boolean;
  isHovered?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  isLocked?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showMetadata?: boolean;
  theme?: 'light' | 'dark' | 'example';
}

/**
 * TimelineCard Component
 * Represents a single beat in the timeline with chord and metadata display.
 */
const TimelineCard: React.FC<TimelineCardProps> = ({
  beatIndex,
  chord,
  isSelected = false,
  isHovered = false,
  isEmpty = false,
  isError = false,
  isLocked = false,
  isDragging = false,
  onClick,
  onDelete,
  onEdit,
  onDuplicate,
  size = 'md',
  showMetadata = true,
  theme = 'light',
}) => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const chordName = chord ? `${noteNames[chord.root % 12]}${chord.quality}` : '—';

  // Size styles
  const sizeStyles = {
    sm: { padding: '0.5rem', minHeight: '60px' },
    md: { padding: '0.75rem', minHeight: '90px' },
    lg: { padding: '1rem', minHeight: '120px' },
  };

  // Base styles
  const baseStyle: React.CSSProperties = {
    ...sizeStyles[size],
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    borderRadius: '0.375rem',
    border: '1px solid var(--border)',
    cursor: isEmpty ? 'default' : 'pointer',
    transition: 'all 150ms ease-out',
    position: 'relative',
    backgroundColor: isEmpty ? 'var(--muted)' : 'var(--card)',
    color: isEmpty ? 'var(--muted-foreground)' : 'var(--card-foreground)',
    minWidth: '100%',
    boxSizing: 'border-box',
  };

  // Apply state styles
  if (isError) {
    baseStyle.backgroundColor = 'var(--destructive)';
    baseStyle.color = 'var(--destructive-foreground)';
    baseStyle.borderColor = 'var(--destructive)';
  } else if (isSelected) {
    baseStyle.backgroundColor = 'var(--primary)';
    baseStyle.color = 'var(--primary-foreground)';
    baseStyle.borderColor = 'var(--primary)';
    baseStyle.boxShadow = '0 0 0 3px var(--ring)';
  } else if (isHovered && !isEmpty) {
    baseStyle.backgroundColor = 'var(--accent)';
    baseStyle.color = 'var(--accent-foreground)';
    baseStyle.borderColor = 'var(--accent)';
  }

  if (isDragging) {
    baseStyle.opacity = 0.6;
    baseStyle.transform = 'scale(0.95)';
  }

  // Beat info header
  const beatHeader: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // Chord name main
  const chordMain: React.CSSProperties = {
    fontSize: size === 'sm' ? '0.875rem' : size === 'md' ? '1rem' : '1.125rem',
    fontWeight: 700,
    fontFamily: 'var(--font-mono, monospace)',
    lineHeight: 1,
  };

  // Metadata row
  const metadataStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    opacity: 0.6,
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginTop: 'auto',
  };

  return (
    <div style={baseStyle} onClick={onClick}>
      {/* Beat index header */}
      <div style={beatHeader}>Beat {beatIndex}</div>

      {/* Chord name or empty state */}
      {isEmpty ? (
        <div style={{ ...chordMain, opacity: 0.5 }}>∅ Empty</div>
      ) : (
        <>
          <div style={chordMain}>{chordName}</div>

          {/* Duration display */}
          <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>
            {chord?.duration || '1'}x beat
            {chord && chord.duration > 1 ? 's' : ''}
          </div>

          {/* Metadata row */}
          {showMetadata && chord?.metadata && (
            <div style={metadataStyle}>
              {chord.metadata.velocity && (
                <span title="Velocity">
                  <strong>V:</strong> {chord.metadata.velocity}
                </span>
              )}
              {chord.metadata.gate && (
                <span title="Gate">
                  <strong>G:</strong> {chord.metadata.gate}%
                </span>
              )}
              {chord.metadata.strum && (
                <span title="Strum">
                  <strong>S:</strong> {chord.metadata.strum}ms
                </span>
              )}
              {chord.metadata.inPattern && (
                <span title="Pattern" style={{ fontStyle: 'italic' }}>
                  {chord.metadata.inPattern}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            opacity: 0.6,
          }}
        >
          <Lock size={14} />
        </div>
      )}

      {/* Error indicator */}
      {isError && (
        <div
          style={{
            position: 'absolute',
            top: '0.25rem',
            right: '0.25rem',
            opacity: 0.8,
          }}
        >
          <AlertCircle size={14} />
        </div>
      )}

      {/* Quick action buttons (show on hover) */}
      {isHovered && !isEmpty && (
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            justifyContent: 'flex-end',
            marginTop: 'auto',
            paddingTop: '0.5rem',
            borderTop: '1px solid currentColor',
            opacity: 0.7,
          }}
        >
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              title="Edit"
            >
              <Edit size={12} />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              title="Duplicate"
            >
              <Copy size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Storybook Meta
const meta: Meta<typeof TimelineCard> = {
  title: 'Progression/TimelineCard',
  component: TimelineCard,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    beatIndex: { control: 'number' },
    isEmpty: { control: 'boolean' },
    isSelected: { control: 'boolean' },
    isHovered: { control: 'boolean' },
    isError: { control: 'boolean' },
    isLocked: { control: 'boolean' },
    isDragging: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    showMetadata: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TimelineCard>;

// Mock chord data
const mockChordMaj = { root: 0, quality: 'maj7', duration: 1, notes: [0, 4, 7, 11] };
const mockChordMin = { root: 2, quality: 'min7', duration: 1, notes: [2, 5, 9, 0] };
const mockChordDom = { root: 7, quality: '7', duration: 2, notes: [7, 11, 2, 5] };
const mockChordWithMetadata = {
  ...mockChordMaj,
  metadata: {
    velocity: 100,
    gate: 90,
    strum: 120,
    inPattern: 'A',
  },
};

/**
 * Default beat card with a standard chord
 */
export const Default: Story = {
  args: {
    beatIndex: 1,
    chord: mockChordMaj,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Empty beat with no chord assigned
 */
export const Empty: Story = {
  args: {
    beatIndex: 2,
    chord: null,
    isEmpty: true,
    size: 'md',
  },
};

/**
 * Selected card state (primary color, ring shadow)
 */
export const Selected: Story = {
  args: {
    beatIndex: 3,
    chord: mockChordMin,
    isSelected: true,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Hovered state shows accent color and quick action buttons
 */
export const Hovered: Story = {
  args: {
    beatIndex: 4,
    chord: mockChordDom,
    isHovered: true,
    size: 'md',
    showMetadata: true,
    onEdit: () => alert('Edit clicked'),
    onDuplicate: () => alert('Duplicate clicked'),
    onDelete: () => alert('Delete clicked'),
  },
};

/**
 * Locked card cannot be edited
 */
export const Locked: Story = {
  args: {
    beatIndex: 5,
    chord: mockChordMaj,
    isLocked: true,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Error state for out-of-key or invalid chords
 */
export const Error: Story = {
  args: {
    beatIndex: 6,
    chord: { root: 1, quality: 'invalid', duration: 1, notes: [] },
    isError: true,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Dragging state (reduced opacity, scale)
 */
export const Dragging: Story = {
  args: {
    beatIndex: 7,
    chord: mockChordMin,
    isDragging: true,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Card with full metadata (velocity, gate, strum, pattern)
 */
export const WithMetadata: Story = {
  args: {
    beatIndex: 8,
    chord: mockChordWithMetadata,
    size: 'md',
    showMetadata: true,
  },
};

/**
 * Card without metadata display (cleaner look for compact mode)
 */
export const NoMetadata: Story = {
  args: {
    beatIndex: 9,
    chord: mockChordMaj,
    size: 'md',
    showMetadata: false,
  },
};

/**
 * Small size card for compact timelines
 */
export const SizeSmall: Story = {
  args: {
    beatIndex: 10,
    chord: mockChordMaj,
    size: 'sm',
    showMetadata: false,
  },
};

/**
 * Large size card for detailed editing
 */
export const SizeLarge: Story = {
  args: {
    beatIndex: 11,
    chord: mockChordDom,
    size: 'lg',
    showMetadata: true,
  },
};

/**
 * Grid of multiple cards showing variety of states
 */
export const Grid: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        padding: '2rem',
        backgroundColor: 'var(--background)',
        minHeight: '100vh',
      }}
    >
      <TimelineCard beatIndex={1} chord={mockChordMaj} size="md" />
      <TimelineCard beatIndex={2} chord={null} isEmpty size="md" />
      <TimelineCard beatIndex={3} chord={mockChordMin} isSelected size="md" />
      <TimelineCard beatIndex={4} chord={mockChordDom} isLocked size="md" />
      <TimelineCard beatIndex={5} chord={mockChordMaj} isHovered size="md" onEdit={() => {}} onDelete={() => {}} />
      <TimelineCard
        beatIndex={6}
        chord={{ root: 1, quality: 'invalid', duration: 1, notes: [] }}
        isError
        size="md"
      />
      <TimelineCard beatIndex={7} chord={mockChordMin} isDragging size="md" />
      <TimelineCard beatIndex={8} chord={mockChordWithMetadata} size="md" showMetadata={true} />
    </div>
  ),
};

/**
 * Interactive demo: Click to toggle selection, hover for actions
 */
export const InteractiveDemo: Story = {
  render: () => {
    const [selected, setSelected] = useState<number | null>(null);
    const [hovered, setHovered] = useState<number | null>(null);

    const beats = [
      { index: 1, chord: mockChordMaj },
      { index: 2, chord: null },
      { index: 3, chord: mockChordMin },
      { index: 4, chord: mockChordDom },
      { index: 5, chord: mockChordWithMetadata },
    ];

    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'var(--background)',
          minHeight: '100vh',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>Timeline Beat Sequence</h2>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            maxWidth: '100%',
          }}
        >
          {beats.map(({ index, chord }) => (
            <div key={index} style={{ minWidth: '150px' }}>
              <TimelineCard
                beatIndex={index}
                chord={chord || undefined}
                isEmpty={!chord}
                isSelected={selected === index}
                isHovered={hovered === index}
                onClick={() => setSelected(selected === index ? null : index)}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onEdit={() => alert(`Edit beat ${index}`)}
                onDuplicate={() => alert(`Duplicate beat ${index}`)}
                onDelete={() => alert(`Delete beat ${index}`)}
                size="md"
                showMetadata={true}
              />
            </div>
          ))}
        </div>
        {selected !== null && (
          <div
            style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: 'var(--muted)',
              borderRadius: '0.375rem',
              color: 'var(--muted-foreground)',
            }}
          >
            <strong>Selected beat:</strong> {selected}
          </div>
        )}
      </div>
    );
  },
};

/**
 * Long-duration chord spanning multiple beats
 */
export const LongChord: Story = {
  args: {
    beatIndex: 12,
    chord: {
      root: 5,
      quality: 'maj9',
      duration: 4,
      notes: [5, 9, 0, 4, 7],
      metadata: { velocity: 85, gate: 100 },
    },
    size: 'lg',
    showMetadata: true,
  },
};

/**
 * Pattern-based chord with metadata
 */
export const PatternChord: Story = {
  args: {
    beatIndex: 13,
    chord: {
      root: 4,
      quality: 'min7b5',
      duration: 2,
      notes: [4, 7, 11, 2],
      metadata: {
        velocity: 70,
        gate: 80,
        strum: 50,
        inPattern: 'B',
      },
    },
    size: 'md',
    showMetadata: true,
  },
};
