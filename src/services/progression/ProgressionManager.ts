/**
 * Progression Manager
 * Manages song sections, progressions, pattern detection, and pattern library
 *
 * Ported from: docs/reference/Progression_Manager.js
 * Original M4L device by Matt - Craft Automation LLC
 *
 * Key Changes for Electron:
 * - Removed Max dict dependency (state managed by Zustand store)
 * - Added proper TypeScript types
 * - Simplified for direct function calls (not dict-based storage)
 */

import type {
  Pattern,
  DetectedPattern,
  ApplyPatternOptions,
} from "../../types/pattern";
import type { Section, ProgressionSnapshot } from "../../types/progression";
import type { Chord, Progression, ChordQuality } from "../../types/chord";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";

// ============================================================================
// Default Pattern Library
// ============================================================================

/**
 * Normalize a scale degree string to semitone offset
 * @param degree - Scale degree ('1', 'b7', '#4', etc.)
 * @returns Semitone offset (0-11)
 */
function normalizeDegree(degree: string): number {
  const semitone = MusicTheory.parseDegree(degree);
  return (((semitone || 0) % 12) + 12) % 12;
}

/**
 * Built-in pattern library
 * Common chord progressions used across musical genres
 */
const _DEFAULT_PATTERNS = [
  {
    id: "pop_1-5-6-4",
    name: "I-V-vi-IV (Pop Cadence)",
    description: "Classic pop progression with a hopeful resolution",
    degrees: ["1", "5", "6", "4"],
    qualities: ["Maj", "Maj", "min", "Maj"],
    semitones: [0, 7, 9, 5], // Will be computed
    duration: 4,
  },
  {
    id: "sensitive_vi-iv-i-v",
    name: "vi-IV-I-V (Sensitive Loop)",
    description: "Emotionally charged loop used in ballads",
    degrees: ["6", "4", "1", "5"],
    qualities: ["min", "Maj", "Maj", "Maj"],
    semitones: [9, 5, 0, 7],
    duration: 4,
  },
  {
    id: "50s_i-vi-ii-v",
    name: "I-vi-ii-V (50s Turnaround)",
    description: "Jazz/blues turnaround popular in classic progressions",
    degrees: ["1", "6", "2", "5"],
    qualities: ["Maj", "min", "min", "Maj"],
    semitones: [0, 9, 2, 7],
    duration: 4,
  },
  {
    id: "jazz_ii-v-i",
    name: "ii-V-I (Jazz Cadence)",
    description: "The most common progression in jazz",
    degrees: ["2", "5", "1"],
    qualities: ["min7", "dom7", "Maj7"],
    semitones: [2, 7, 0],
    duration: 4,
  },
  {
    id: "blues_12bar",
    name: "I-IV-I-V (12-Bar Blues)",
    description: "Foundation of blues music",
    degrees: ["1", "4", "1", "5"],
    qualities: ["dom7", "dom7", "dom7", "dom7"],
    semitones: [0, 5, 0, 7],
    duration: 4,
  },
  {
    id: "andalusian_cadence",
    name: "vi-V-IV-III (Andalusian)",
    description: "Descending progression common in flamenco",
    degrees: ["6", "5", "4", "3"],
    qualities: ["min", "Maj", "Maj", "Maj"],
    semitones: [9, 7, 5, 4],
    duration: 4,
  },
  {
    id: "circle_of_fifths",
    name: "vi-ii-V-I (Circle Progression)",
    description: "Follows the circle of fifths",
    degrees: ["6", "2", "5", "1"],
    qualities: ["min7", "min7", "dom7", "Maj7"],
    semitones: [9, 2, 7, 0],
    duration: 4,
  },
].map((pattern) => ({
  ...pattern,
  semitones: pattern.degrees.map((deg) => normalizeDegree(deg)),
}));

export const DEFAULT_PATTERNS: Pattern[] =
  _DEFAULT_PATTERNS as unknown as Pattern[];

// ============================================================================
// Section Management
// ============================================================================

/**
 * Create an empty section with default values
 * @param name - Section name (e.g., "Verse 1", "Chorus")
 * @returns New empty section
 */
export function createEmptySection(name: string = "New Section"): Section {
  return {
    id: crypto.randomUUID(),
    name,
    progression: [],
    // default: repeat once, common 4/4 time signature
    repeats: 1,
    beatsPerBar: 4,
    rootHeld: null,
    currentNotes: [],
    transitions: { type: "none", length: 2 },
  };
}

/**
 * Deep clone a section (for immutable updates)
 * @param section - Section to clone
 * @returns Cloned section
 */
export function cloneSection(section: Section): Section {
  return {
    id: section.id,
    name: section.name,
    progression: cloneProgression(section.progression),
    rootHeld: section.rootHeld,
    // preserve repeats and beatsPerBar when cloning
    repeats: section.repeats || 1,
    beatsPerBar: section.beatsPerBar || 4,
    currentNotes: Array.isArray(section.currentNotes)
      ? [...section.currentNotes]
      : [],
    transitions: { ...section.transitions },
  };
}

/**
 * Deep clone a progression (for immutable updates)
 * @param progression - Progression to clone
 * @returns Cloned progression
 */
export function cloneProgression(progression: Progression = []): Progression {
  return progression.map((chord) => ({
    notes: Array.isArray(chord.notes) ? [...chord.notes] : [],
    duration: chord.duration,
    metadata: chord.metadata ? { ...chord.metadata } : undefined,
  }));
}

/**
 * Flatten sections with repeats into a single progression
 * Expands each section's progression according to its repeat count
 * @param sections - Array of sections to flatten
 * @returns Flattened progression with all repeats expanded
 */
export function flattenSectionsWithRepeats(sections: Section[]): Progression {
  return sections.flatMap(section => {
    const repeatCount = section.repeats || 1;
    return Array(repeatCount).fill(section.progression).flat();
  });
}

// ============================================================================
// Pattern Detection
// ============================================================================

/**
 * Detect known patterns in an existing progression
 * Analyzes the root note intervals to find matching pattern signatures
 *
 * @param progression - Chord progression to analyze
 * @param keyRoot - Root note of the key (MIDI number)
 * @returns Array of detected patterns with their positions
 */
export function detectPatterns(
  progression: Progression,
  keyRoot?: number,
): DetectedPattern[] {
  if (!progression || progression.length === 0) {
    return [];
  }

  // Determine base root note
  const baseRoot =
    typeof keyRoot === "number" ? keyRoot : progression[0]?.notes?.[0] || 60;

  // Extract semitone offsets from each chord's root note
  const offsets = progression
    .map((chord) => {
      if (!chord || !Array.isArray(chord.notes) || chord.notes.length === 0) {
        return null;
      }
      return chord.notes[0];
    })
    .filter((note): note is number => typeof note === "number")
    .map((note) => (((note - baseRoot) % 12) + 12) % 12);

  // Need at least 2 chords to detect a pattern
  if (offsets.length < 2) {
    return [];
  }

  const definitions = getPatternDefinitions();
  const matches: DetectedPattern[] = [];

  // Check each pattern against the progression
  definitions.forEach((pattern) => {
    if (!Array.isArray(pattern.semitones) || pattern.semitones.length === 0) {
      return;
    }

    const signature = pattern.semitones;

    // Pattern can't be longer than progression
    if (signature.length > offsets.length) {
      return;
    }

    // Sliding window to find pattern matches
    for (let start = 0; start <= offsets.length - signature.length; start++) {
      let match = true;

      // Check if pattern matches at this position
      for (let i = 0; i < signature.length; i++) {
        if (signature[i] !== offsets[start + i]) {
          match = false;
          break;
        }
      }

      if (match) {
        matches.push({
          id: pattern.id,
          name: pattern.name,
          description: pattern.description,
          startIndex: start,
          length: signature.length,
          root: baseRoot,
        });
      }
    }
  });

  return matches;
}

// ============================================================================
// Pattern Library Management
// ============================================================================

/**
 * Get all available pattern definitions (built-in + custom)
 * @param customPatterns - Optional array of user-created patterns
 * @returns Combined array of all patterns
 */
export function getPatternDefinitions(
  customPatterns: Pattern[] = [],
): Pattern[] {
  return [...DEFAULT_PATTERNS, ...customPatterns];
}

/**
 * Find a pattern by ID or name
 * @param idOrName - Pattern ID or name (case-insensitive)
 * @param customPatterns - Optional custom patterns to search
 * @returns Pattern if found, undefined otherwise
 */
export function findPattern(
  idOrName: string,
  customPatterns: Pattern[] = [],
): Pattern | undefined {
  const normalized = idOrName?.toLowerCase();
  if (!normalized) return undefined;

  return getPatternDefinitions(customPatterns).find(
    (pattern) =>
      pattern.id.toLowerCase() === normalized ||
      pattern.name.toLowerCase() === normalized,
  );
}

/**
 * Apply a pattern to generate a chord progression
 * Converts scale degrees to actual MIDI notes based on root
 *
 * @param patternId - Pattern ID or name
 * @param options - Root note, duration, and voicing options
 * @param customPatterns - Optional custom patterns
 * @returns Generated progression, or null if pattern not found
 */
export function applyPattern(
  patternId: string,
  options: ApplyPatternOptions = {},
  customPatterns: Pattern[] = [],
): Progression | null {
  const pattern = findPattern(patternId, customPatterns);
  if (!pattern) return null;

  const root = options.root ?? 60; // Default to middle C
  const duration = options.duration ?? pattern.duration ?? 4;
  const inversion = options.inversion ?? 0;
  const drop = options.drop ?? 0;

  return pattern.degrees.map((degree, index) => {
    // Get chord quality for this degree
    const quality = (pattern.qualities?.[index] ||
      pattern.defaultQuality ||
      "Maj") as ChordQuality;

    // Calculate chord root from pattern root + scale degree offset
    const chordRoot = root + normalizeDegree(degree);

    // Generate chord notes
    let notes = MusicTheory.getChordNotes(chordRoot, quality);

    // Apply voicing if specified
    if (inversion !== 0 || drop !== 0) {
      notes = MusicTheory.applyVoicing(notes, inversion, drop);
    }

    return {
      notes,
      duration,
      metadata: {
        root: chordRoot,
        quality,
        degree: parseInt(degree) || undefined,
        inversion,
        drop,
      },
    };
  });
}

/**
 * Create a custom pattern from a sequence of scale degrees
 * @param name - Pattern name
 * @param degreeSequence - Space-separated scale degrees (e.g., "1 5 6 4")
 * @param description - Optional description
 * @returns Created pattern, or null if invalid
 */
export function saveCustomPattern(
  name: string,
  degreeSequence: string,
  description: string = "",
): Pattern | null {
  if (!name || !degreeSequence) return null;

  // Parse degree sequence
  const degrees = degreeSequence
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  // Need at least 2 chords for a pattern
  if (degrees.length < 2) return null;

  // Convert degrees to semitones
  const semitones = degrees.map((degree) => normalizeDegree(degree));

  // Generate unique ID
  const id = `custom_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

  const pattern: Pattern = {
    id,
    name,
    description,
    degrees,
    semitones,
    custom: true,
    duration: 4,
  };

  return pattern;
}

// ============================================================================
// Progression Snapshot Management
// ============================================================================

/**
 * Create a snapshot of a progression for saving
 * @param name - Snapshot name
 * @param progression - Progression to save
 * @param metadata - Optional metadata (tags, tempo, key)
 * @returns Progression snapshot
 */
export function createProgressionSnapshot(
  name: string,
  progression: Progression,
  metadata: Partial<ProgressionSnapshot["metadata"]> = {},
): ProgressionSnapshot {
  return {
    name,
    progression: cloneProgression(progression),
    metadata: {
      savedAt: Date.now(),
      ...metadata,
    },
  };
}

/**
 * Load a progression from a snapshot
 * @param snapshot - Snapshot to load from
 * @returns Cloned progression from snapshot
 */
export function loadProgressionFromSnapshot(
  snapshot: ProgressionSnapshot,
): Progression {
  return cloneProgression(snapshot.progression);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get progression duration in beats
 * @param progression - Progression to calculate
 * @returns Total duration in beats
 */
export function getProgressionDuration(progression: Progression): number {
  return progression.reduce((total, chord) => total + chord.duration, 0);
}

/**
 * Transpose a progression to a new root
 * @param progression - Progression to transpose
 * @param semitones - Semitones to transpose (positive = up, negative = down)
 * @returns Transposed progression
 */
export function transposeProgression(
  progression: Progression,
  semitones: number,
): Progression {
  return progression.map((chord) => ({
    ...chord,
    notes: chord.notes.map((note) => note + semitones),
    metadata: chord.metadata
      ? {
          ...chord.metadata,
          root: chord.metadata.root
            ? chord.metadata.root + semitones
            : undefined,
        }
      : undefined,
  }));
}

/**
 * Get a human-readable analysis of a chord
 * @param chord - Chord to analyze
 * @returns Analysis string (e.g., "CMaj7 - Root Position")
 */
export function analyzeChord(chord: Chord): string {
  if (!chord.metadata) {
    return `${chord.notes.length} notes`;
  }

  const { root, quality, inversion, drop } = chord.metadata;

  if (!root || !quality) {
    return `${chord.notes.length} notes`;
  }

  const chordName = MusicTheory.getChordName(root, quality);
  const voicingDesc = MusicTheory.getVoicingDescription(
    inversion || 0,
    drop || 0,
  );

  return `${chordName} - ${voicingDesc}`;
}

/**
 * Validate a progression for common issues
 * @param progression - Progression to validate
 * @returns Array of warning messages (empty if valid)
 */
export function validateProgression(progression: Progression): string[] {
  const warnings: string[] = [];

  if (progression.length === 0) {
    warnings.push("Progression is empty");
    return warnings;
  }

  // Check for chords with no notes
  progression.forEach((chord, index) => {
    if (!chord.notes || chord.notes.length === 0) {
      warnings.push(`Chord ${index + 1} has no notes`);
    }
    if (chord.duration <= 0) {
      warnings.push(`Chord ${index + 1} has invalid duration`);
    }
  });

  // Check for extreme note ranges
  const allNotes = progression.flatMap((chord) => chord.notes);
  const minNote = Math.min(...allNotes);
  const maxNote = Math.max(...allNotes);

  if (minNote < 21) {
    // Below A0
    warnings.push("Contains notes below piano range (A0)");
  }
  if (maxNote > 108) {
    // Above C8
    warnings.push("Contains notes above piano range (C8)");
  }

  return warnings;
}
