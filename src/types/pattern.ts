/**
 * Pattern and progression analysis types
 * Based on Progression_Manager.js
 */

import { ChordQuality } from './chord';

/**
 * A pattern definition - a reusable chord progression template
 */
export interface Pattern {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Description of the pattern's character/usage */
  description: string;
  
  /** Scale degrees as strings (e.g., ['1', '5', '6', '4']) */
  degrees: string[];
  
  /** Chord qualities for each degree */
  qualities?: ChordQuality[];
  
  /** Semitone intervals from root (computed from degrees) */
  semitones: number[];
  
  /** Default duration in beats for each chord */
  duration?: number;
  
  /** Default quality if qualities array not provided */
  defaultQuality?: ChordQuality;
  
  /** Whether this is a user-created custom pattern */
  custom?: boolean;
}

/**
 * A pattern that was detected in an existing progression
 */
export interface DetectedPattern {
  /** Pattern ID that was matched */
  id: string;
  
  /** Pattern name */
  name: string;
  
  /** Pattern description */
  description: string;
  
  /** Starting index in the progression */
  startIndex: number;
  
  /** Length in number of chords */
  length: number;
  
  /** Root note of the pattern instance */
  root: number;
}

/**
 * Options for applying a pattern
 */
export interface ApplyPatternOptions {
  /** Root note (MIDI number) to start the pattern on */
  root?: number;
  
  /** Duration in beats for each chord */
  duration?: number;
  
  /** Inversion to apply to chords */
  inversion?: number;
  
  /** Drop voicing to apply */
  drop?: number;
}
