import type { Meta, StoryObj } from '@storybook/react';
import { LoopTimeline } from './LoopTimeline';
import { useProgressionStore } from '../../stores/progressionStore';
import { useLiveStore } from '../../stores/liveStore';
import { useEffect } from 'react';

// Wrapper component that accepts props and sets store state
const LoopTimelineWrapper = ({
  tempo = 120,
  isPlaying = false,
  currentBeat = 0,
  sections,
}: {
  tempo?: number;
  isPlaying?: boolean;
  currentBeat?: number;
  sections: any[];
}) => {
  useEffect(() => {
    // Set progression store state
    useProgressionStore.setState({ sections });

    // Set live store state
    useLiveStore.setState({
      transport: {
        isPlaying,
        currentBeat,
        tempo,
      },
    });
  }, [sections, isPlaying, currentBeat, tempo]);

  return <LoopTimeline />;
};

// Mock data for different story variants
const mockSections = [
  {
    id: 'verse-1',
    name: 'Verse 1',
    progression: [
      { notes: [60, 64, 67], duration: 2, metadata: { root: 60, quality: 'maj' as const, velocities: [80, 80, 80], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
      { notes: [62, 65, 69], duration: 2, metadata: { root: 62, quality: 'min' as const, velocities: [80, 80, 80], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
    ],
    repeats: 2,
    beatsPerBar: 4,
    transitions: { type: 'none' as const },
    rootHeld: null,
    currentNotes: [],
  },
  {
    id: 'chorus-1',
    name: 'Chorus',
    progression: [
      { notes: [67, 71, 74], duration: 1, metadata: { root: 67, quality: 'maj' as const, velocities: [90, 90, 90], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
      { notes: [69, 72, 76], duration: 1, metadata: { root: 69, quality: 'min' as const, velocities: [90, 90, 90], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
      { notes: [65, 69, 72], duration: 2, metadata: { root: 65, quality: 'dom' as const, velocities: [85, 85, 85], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
    ],
    repeats: 1,
    beatsPerBar: 4,
    transitions: { type: 'none' as const },
    rootHeld: null,
    currentNotes: [],
  },
];

const mockSectionsComplex = [
  ...mockSections,
  {
    id: 'bridge',
    name: 'Bridge',
    progression: [
      { notes: [70, 74, 77], duration: 1.5, metadata: { root: 70, quality: 'dim' as const, velocities: [75, 75, 75], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
      { notes: [72, 75, 79], duration: 2.5, metadata: { root: 72, quality: 'maj' as const, velocities: [85, 85, 85], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
    ],
    repeats: 1,
    beatsPerBar: 4,
    transitions: { type: 'none' as const },
    rootHeld: null,
    currentNotes: [],
  },
  {
    id: 'outro',
    name: 'Outro',
    progression: [
      { notes: [67, 71, 74], duration: 4, metadata: { root: 67, quality: 'maj' as const, velocities: [70, 70, 70], gate: [1, 1, 1], strum: [0, 0, 0], drop: 0 } },
    ],
    repeats: 3,
    beatsPerBar: 4,
    transitions: { type: 'none' as const },
    rootHeld: null,
    currentNotes: [],
  },
];

// (store initialization is done directly in the wrapper)

export default {
  title: 'ProgressionEditor/LoopTimeline',
  component: LoopTimelineWrapper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive timeline component for displaying and editing musical progressions with drag-and-drop sections.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: '#1a1a1a', padding: '20px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    zoomLevel: {
      control: { type: 'range', min: 0.02, max: 1, step: 0.01 },
      description: 'Timeline zoom level (0.02 = most zoomed out, 1 = most zoomed in)',
    },
    tempo: {
      control: { type: 'range', min: 60, max: 200, step: 1 },
      description: 'Playback tempo in BPM',
    },
    isPlaying: {
      control: { type: 'boolean' },
      description: 'Whether the timeline is currently playing',
    },
    currentBeat: {
      control: { type: 'number', min: 0, max: 50, step: 0.1 },
      description: 'Current beat position in the timeline',
    },
    sections: {
      control: { type: 'object' },
      description: 'Array of progression sections to display',
    },
  },
} as Meta<typeof LoopTimelineWrapper>;

type Story = StoryObj<typeof LoopTimelineWrapper>;

export const Default: Story = {
  args: {
    sections: mockSections,
    tempo: 120,
    isPlaying: false,
    currentBeat: 0,
  },
};

export const Playing: Story = {
  args: {
    sections: mockSections,
    tempo: 120,
    isPlaying: true,
    currentBeat: 3.5,
  },
};

export const HighZoom: Story = {
  args: {
    sections: mockSections,
    tempo: 120,
    isPlaying: false,
    currentBeat: 0,
  },
  parameters: {
    docs: {
      description: 'Timeline with higher zoom level showing more detail.',
    },
  },
};

export const LowZoom: Story = {
  args: {
    sections: mockSections,
    tempo: 120,
    isPlaying: false,
    currentBeat: 0,
  },
  parameters: {
    docs: {
      description: 'Timeline with lower zoom level showing broader overview.',
    },
  },
};

export const WithActiveBeat: Story = {
  args: {
    sections: mockSections,
    tempo: 120,
    isPlaying: false,
    currentBeat: 2.5,
  },
  parameters: {
    docs: {
      description: 'Timeline showing an active beat indicator.',
    },
  },
};

export const ComplexProgression: Story = {
  args: {
    sections: mockSectionsComplex,
    tempo: 120,
    isPlaying: false,
    currentBeat: 0,
  },
  parameters: {
    docs: {
      description: 'Timeline with a more complex progression including bridge and outro sections.',
    },
  },
};

export const Playground: Story = {
  args: {
    sections: mockSectionsComplex,
    tempo: 140,
    isPlaying: true,
    currentBeat: 8.75,
  },
  parameters: {
    docs: {
      description: 'Fully interactive playground - adjust all controls to see dramatic changes!',
    },
  },
};

export const ExtremeZoom: Story = {
  args: {
    sections: mockSections,
    tempo: 200,
    isPlaying: true,
    currentBeat: 1.25,
  },
  parameters: {
    docs: {
      description: 'Maximum zoom with fast tempo - see the finest details!',
    },
  },
};

export const WideView: Story = {
  args: {
    sections: mockSectionsComplex,
    tempo: 80,
    isPlaying: false,
    currentBeat: 0,
  },
  parameters: {
    docs: {
      description: 'Ultra-wide view showing the entire song structure.',
    },
  },
};