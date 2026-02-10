/**
 * Section and progression management types
 * Based on Progression_Manager.js
 */

import { Progression } from "./chord";

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
 * A section of a song with its own progression
 */
export interface Section {
  /** Unique identifier for this section */
  id: string;

  /** Section name (e.g., "Verse 1", "Chorus") */
  name: string;

  /** The chord progression for this section */
  progression: Progression;

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
