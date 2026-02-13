/**
 * Core type definitions for chord representation
 * Based on Music_Theory_Engine.js from legacy M4L device
 */

/** 
 * Chord quality types supported by the engine 
 * Reference: docs/reference/Music_Theory_Engine.js
 */
export type ChordQuality =
  | 'Maj'      // Major triad
  | 'min'      // Minor triad
  | 'dim'      // Diminished triad
  | 'aug'      // Augmented triad
  | 'sus2'     // Suspended 2nd
  | 'sus4'     // Suspended 4th
  | 'Maj7'     // Major 7th
  | 'min7'     // Minor 7th
  | 'dom7'     // Dominant 7th
  | 'dim7'     // Diminished 7th
  | 'hdim7'    // Half-diminished 7th
  | 'minMaj7'  // Minor-major 7th
  | 'aug7'     // Augmented 7th
  | 'Maj9'     // Major 9th
  | 'min9'     // Minor 9th
  | 'dom9'     // Dominant 9th
  | 'Maj11'    // Major 11th
  | 'min11'    // Minor 11th
  | 'dom11'    // Dominant 11th
  | 'Maj13'    // Major 13th
  | 'min13'    // Minor 13th
  | 'dom13';   // Dominant 13th

/**
 * A single chord in a progression
 */
export interface Chord {
  /** MIDI note numbers that make up the chord */
  notes: number[];
  
  /** Duration in beats */
  duration: number;
  
  /** Optional metadata about the chord */
  metadata?: ChordMetadata;
}

/**
 * Metadata about how a chord was generated or its theoretical properties
 */
export interface ChordMetadata {
  /** Root note (MIDI number 0-127) */
  root?: number;
  
  /** Chord quality/type */
  quality?: ChordQuality;
  
  /** Inversion number (0 = root position, 1 = first inversion, etc.) */
  inversion?: number;
  
  /** Drop voicing (0 = close, 2 = drop 2, 3 = drop 3, 23 = drop 2+3) */
  drop?: number;
  
  /** Scale degree in current key (1-7) */
  degree?: number;
  
  /** Roman numeral analysis (e.g., "I", "V", "vi") */
  romanNumeral?: string;
  
  /** Per-beat MIDI velocities (0-127, index 0 = beat 1, etc. Default 100 for all) */
  velocities?: number[];
  
  /** Per-beat strum delay in milliseconds (0-50ms, index 0 = beat 1, etc. Default 0 for all) */
  strum?: number[];
  
  /** Per-beat gate length as percentage (0-200%, index 0 = beat 1, etc. Default 150 for legato)
   * <100% = staccato, 100% = normal, >100% = legato/tied */
  gate?: number[];
}

/**
 * A complete chord progression
 */
export type Progression = Chord[];

/**
 * Note range constraints for voicing
 */
export interface NoteRange {
  /** Lowest allowed MIDI note */
  min: number;
  
  /** Highest allowed MIDI note */
  max: number;
}

/**
 * Voicing parameters for chord generation
 */
export interface VoicingParams {
  /** Root note (MIDI number) */
  root: number;
  
  /** Chord quality */
  quality: ChordQuality;
  
  /** Inversion (0 = root position) */
  inversion?: number;
  
  /** Drop voicing */
  drop?: number;
  
  /** Note range constraints */
  range?: NoteRange;
  
  /** Number of octaves to span */
  spread?: number;
}
