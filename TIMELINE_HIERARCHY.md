# Timeline & Bar Hierarchy

## Organization Structure

Your timeline is organized in a **3-level hierarchy**:

```
Section (e.g., "Verse 1", "Chorus")
├─ Bar 1 (time signature: 4/4)
│  ├─ Beat 1 → C maj7
│  ├─ Beat 2 → F maj7
│  ├─ Beat 3 → G 7
│  └─ Beat 4 → C maj7
│
├─ Bar 2 (4/4)
│  ├─ Beat 5 → A min7
│  ├─ Beat 6 → D min7
│  ├─ Beat 7 → G 7
│  └─ Beat 8 → C maj7
│
└─ Bar 3 (4/4)
   ├─ Beat 9 → C maj7 (2x duration)
   └─ Beat 10 → F maj7 (2x duration)
```

## The Three Levels

### 1. **Beat** (TimelineCard)
- **What:** Individual chord cell
- **Contains:** Chord name, duration, metadata (velocity, gate, strum)
- **Typical duration:** 1 beat (can be longer)
- **Count per bar:** Varies (usually 4 in 4/4 time)
- **Story:** `TimelineCard.stories.tsx` — 15+ variants

### 2. **Bar** (BeatBar)
- **What:** Group of beats (one measure)
- **Contains:** `beatsPerBar` beats (default: 4)
- **Time signature:** `beatsPerBar` defines it (e.g., 4 = 4/4, 3 = 3/4)
- **Count per section:** Typically 2–8 bars
- **Layouts:** 
  - **Horizontal:** Beats flow left-to-right (compact, playback view)
  - **Grid:** 2D grid of beats (detailed, editing view)
- **Story:** `TimelineHierarchy.stories.tsx` — SingleBar, BarGridLayout, etc.

### 3. **Section** (ProgressionSection)
- **What:** Logical grouping of bars (song structure)
- **Contains:** Multiple bars + metadata
- **Types:** Intro, Verse, Pre-Chorus, Chorus, Bridge, Outro, Solo, Interlude, Tag, Custom
- **Properties:**
  - `name` — e.g., "Verse 1", "Chorus"
  - `sectionType` — semantic type for analysis
  - `repeats` — how many times this section plays
  - `beatsPerBar` — time signature for all bars in section
- **Count per song:** Typically 5–10 sections
- **Story:** `TimelineHierarchy.stories.tsx` — SingleSection, FullSongStructure, etc.

## Data Flow (from types)

### Beat → Types
```typescript
interface Section {
  id: string;
  name: string;                    // "Verse", "Chorus"
  sectionType: SectionType;         // "verse" | "chorus" | etc.
  progression: Progression;         // Array of chords
  repeats?: number;                 // How many times to repeat
  beatsPerBar?: number;             // Time signature (e.g., 4 for 4/4)
  transitions: TransitionConfig;    // How to transition to next section
}

type Progression = Chord[];

interface Chord {
  root: number;                     // MIDI note (0–11)
  quality: string;                  // "maj7", "min7", etc.
  duration: number;                 // Beats (e.g., 1, 2, 4)
  notes: number[];                  // MIDI notes in voicing
  metadata?: {
    velocity?: number;              // MIDI velocity (0–127)
    gate?: number;                  // Gate length (%)
    strum?: number;                 // Strum delay (ms)
    inPattern?: string;             // Pattern name
  };
}
```

### Arrangement Lane (Playback View)
- **ArrangementBlock:** Links a section to the timeline
- **Timeline:** Sequence of blocks (sections) with `startBeat` and `lengthBeats`
- **Display:** Horizontal blocks showing section order and duration

```typescript
interface ArrangementBlock {
  id: string;
  sourceId: string;                 // Links to section
  startBeat: number;                // When this block starts
  lengthBeats: number;              // Total beats (all bars in section × repeats)
  label: string;                    // Display name
  repeats?: number;                 // Override section repeats
  color?: string;                   // Visual color
}
```

## Layout Strategies

### Strategy 1: Horizontal (Playback / Overview)
```
[Verse 1: 8 beats] [Chorus: 4 beats] [Verse 2: 8 beats]
```
- **Used in:** Arrangement lane, playback timeline
- **Benefit:** See full structure at a glance
- **Interaction:** Click to select, drag to reorder

### Strategy 2: Grid (Editing / Detail)
```
Beat 1   Beat 2   Beat 3   Beat 4
C maj7   F maj7   G 7      C maj7

Beat 5   Beat 6   Beat 7   Beat 8
A min7   D min7   G 7      C maj7
```
- **Used in:** Section editor, beat-by-beat editing
- **Benefit:** Edit individual beat properties
- **Interaction:** Click beat to select, edit velocity/gate/strum

## How They Connect in the App

### Full Signal Chain:
1. **User defines sections** (Verse, Chorus, Bridge) in `ProgressionEditor`
   ↓
2. **Each section contains a `Progression`** (array of chords)
   ↓
3. **`beatsPerBar`** defines how chords are grouped into bars
   ↓
4. **Bars are displayed horizontally or in a grid** (BeatBar layout)
   ↓
5. **Sections are combined into an `ArrangementBlock`** in the timeline
   ↓
6. **Arrangement lane shows blocks** as draggable sections for playback

### Example: Rendering "Verse" with 8 chords in 4/4 time:

```
Input: Section "Verse" with 8-chord progression, beatsPerBar=4
   ↓
Output:
   Bar 1: Chord 1, 2, 3, 4 → horizontal layout or grid
   Bar 2: Chord 5, 6, 7, 8 → horizontal layout or grid
   ↓
ArrangementBlock displays as one draggable "Verse" box spanning 8 beats
```

## UI Components (From Storybook)

| Component | File | Purpose | Layout |
|-----------|------|---------|--------|
| **TimelineCard** | `TimelineCard.stories.tsx` | Single beat cell | N/A (individual) |
| **BeatBar** | `TimelineHierarchy.stories.tsx` | Group of beats | Horizontal or Grid |
| **ProgressionSection** | `TimelineHierarchy.stories.tsx` | Collapsible section | Vertical stack |
| **ArrangementBlock** | (in app) | Playback timeline cell | Horizontal lane |

## Next Steps

- [ ] Build **actual BeatBar component** from Storybook story
- [ ] Build **actual ProgressionSection component** with state management
- [ ] Wire `Section` + `Chord` data to display correctly
- [ ] Add drag-to-reorder bars within sections
- [ ] Add context menus (add bar, delete, duplicate)
- [ ] Implement arrangement lane block rendering
