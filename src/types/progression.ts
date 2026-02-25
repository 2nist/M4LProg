/**
 * Section and progression management types
 * Based on Progression_Manager.js
 */

import { Progression } from "./chord";
import type { ModeId } from "./arrangement";

/**
 * Transition types between chords or sections
 */
export type TransitionType =
  | "none"
  | "backdoor_dominant"
  | "plagal"
  | "modal_borrow";

/**
 * Transition configuration for a section
 */
export interface TransitionConfig {
  /** Type of transition to use */
  type: TransitionType;

  /** Length of transition in beats */
  length: number;
}

/**
 * Section type markers for song form analysis
 */
export type SectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "outro"
  | "solo"
  | "interlude"
  | "tag"
  | "custom";

/**
 * Standard song form templates
 */
export interface SongFormTemplate {
  id: string;
  name: string;
  description: string;
  /** Array of section identifiers (e.g., ['A', 'A', 'B', 'A']) */
  structure: string[];
  /** Section definitions with their types */
  sections: Record<
    string,
    { name: string; type: SectionType; defaultRepeats?: number }
  >;
  /** Default beats per bar for this form */
  defaultBeatsPerBar?: number;
}

/** Built-in song form templates */
export const SONG_FORM_TEMPLATES: SongFormTemplate[] = [
  {
    id: "aaba",
    name: "AABA (32-bar)",
    description: "Classic jazz/pop form - 32 bars total",
    structure: ["A", "A", "B", "A"],
    sections: {
      A: { name: "Main Theme", type: "verse", defaultRepeats: 2 },
      B: { name: "Bridge", type: "bridge", defaultRepeats: 1 },
    },
    defaultBeatsPerBar: 4,
  },
  {
    id: "abab",
    name: "ABAB (Pop)",
    description: "Standard pop form with verse-chorus alternation",
    structure: ["verse", "chorus", "verse", "chorus"],
    sections: {
      verse: { name: "Verse", type: "verse", defaultRepeats: 2 },
      chorus: { name: "Chorus", type: "chorus", defaultRepeats: 2 },
    },
    defaultBeatsPerBar: 4,
  },
  {
    id: "abac",
    name: "ABAC (Modern)",
    description: "Pop/rock form with contrasting middle section",
    structure: ["verse", "chorus", "bridge", "chorus"],
    sections: {
      verse: { name: "Verse", type: "verse", defaultRepeats: 2 },
      chorus: { name: "Chorus", type: "chorus", defaultRepeats: 2 },
      bridge: { name: "Bridge", type: "bridge", defaultRepeats: 1 },
    },
    defaultBeatsPerBar: 4,
  },
  {
    id: "intro-verse-chorus-bridge-outro",
    name: "IVCB (Full Song)",
    description: "Complete song with intro, verse, chorus, bridge, and outro",
    structure: [
      "intro",
      "verse",
      "chorus",
      "verse",
      "chorus",
      "bridge",
      "chorus",
      "outro",
    ],
    sections: {
      intro: { name: "Intro", type: "intro", defaultRepeats: 1 },
      verse: { name: "Verse", type: "verse", defaultRepeats: 2 },
      chorus: { name: "Chorus", type: "chorus", defaultRepeats: 2 },
      bridge: { name: "Bridge", type: "bridge", defaultRepeats: 1 },
      outro: { name: "Outro", type: "outro", defaultRepeats: 1 },
    },
    defaultBeatsPerBar: 4,
  },
  {
    id: "12bar-blues",
    name: "12-Bar Blues",
    description: "Classic blues progression - 12 bars",
    structure: ["blues1", "blues1", "blues2", "blues1"],
    sections: {
      blues1: { name: "Blues Line 1", type: "verse", defaultRepeats: 1 },
      blues2: { name: "Blues Line 2", type: "verse", defaultRepeats: 1 },
    },
    defaultBeatsPerBar: 4,
  },
  {
    id: "simple-loop",
    name: "Simple Loop",
    description: "Single section looping - perfect for ambient/experimental",
    structure: ["loop"],
    sections: {
      loop: { name: "Loop", type: "custom", defaultRepeats: 4 },
    },
    defaultBeatsPerBar: 4,
  },
];

/**
 * A section of a song with its own progression
 */
export interface Section {
  /** Unique identifier for this section */
  id: string;

  /** Section name (e.g., "Verse 1", "Chorus") */
  name: string;

  /** Section type marker for song form analysis */
  sectionType?: SectionType;

  /** The chord progression for this section */
  progression: Progression;
  /** Per-mode sequence buffers (harmony/drum/other) sharing one arrangement timeline */
  modeProgressions?: Partial<Record<ModeId, Progression>>;

  /** How many times this section repeats when rendering the song timeline */
  repeats?: number;
  /** Beats per bar (time signature). Defaults to 4 (4/4). */
  beatsPerBar?: number;

  /** Currently held root note (for live input mode) */
  rootHeld: number | null;

  /** Currently playing notes (for live preview) */
  currentNotes: number[];

  /** Transition settings for this section */
  transitions: TransitionConfig;
}

/**
 * Saved progression snapshot
 */
export interface ProgressionSnapshot {
  /** Snapshot name */
  name: string;

  /** The saved progression */
  progression: Progression;

  /** Metadata about when/how it was saved */
  metadata: {
    /** Timestamp when saved */
    savedAt: number;

    /** Optional tags for categorization */
    tags?: string[];

    /** Optional tempo suggestion */
    tempo?: number;

    /** Optional key signature */
    key?: string;
  };
}
