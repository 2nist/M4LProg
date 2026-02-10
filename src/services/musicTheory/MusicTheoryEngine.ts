/**
 * Music Theory Engine
 * Core music theory calculations for chord generation and voicing
 *
 * Ported from: docs/reference/Music_Theory_Engine.js
 * Original M4L device by Matt - Craft Automation LLC
 */

import type { ChordQuality } from "../../types/chord";

/**
 * Chord interval formulas (semitones from root)
 * Maps chord qualities to their constituent intervals
 */
const CHORD_FORMULAS: Record<ChordQuality, number[]> = {
  // Triads
  Maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],

  // Seventh chords
  Maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  hdim7: [0, 3, 6, 10], // Half-diminished (m7b5)
  minMaj7: [0, 3, 7, 11],
  aug7: [0, 4, 8, 10],

  // Extended chords
  Maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14],
  Maj11: [0, 4, 7, 11, 14, 17],
  min11: [0, 3, 7, 10, 14, 17],
  dom11: [0, 4, 7, 10, 14, 17],
  Maj13: [0, 4, 7, 11, 14, 17, 21],
  min13: [0, 3, 7, 10, 14, 17, 21],
  dom13: [0, 4, 7, 10, 14, 17, 21],
};

/**
 * Modal scale profiles
 * Defines interval patterns for different modes
 */
export type ModaleName =
  | "Ionian"
  | "Dorian"
  | "Phrygian"
  | "Lydian"
  | "Mixolydian"
  | "Aeolian"
  | "Locrian";

interface ModeProfile {
  /** Interval steps in semitones */
  steps: number[];
  /** Overall character of the mode */
  type: "Major" | "minor" | "diminished";
}

const MODAL_PROFILES: Record<ModaleName, ModeProfile> = {
  Ionian: { steps: [2, 2, 1, 2, 2, 2, 1], type: "Major" },
  Dorian: { steps: [2, 1, 2, 2, 2, 1, 2], type: "minor" },
  Phrygian: { steps: [1, 2, 2, 2, 1, 2, 2], type: "minor" },
  Lydian: { steps: [2, 2, 2, 1, 2, 2, 1], type: "Major" },
  Mixolydian: { steps: [2, 2, 1, 2, 2, 1, 2], type: "Major" },
  Aeolian: { steps: [2, 1, 2, 2, 1, 2, 2], type: "minor" },
  Locrian: { steps: [1, 2, 2, 1, 2, 2, 2], type: "diminished" },
};

/**
 * Generate MIDI notes for a chord
 * @param root - Root note as MIDI number (0-127)
 * @param quality - Chord quality/type
 * @returns Array of MIDI note numbers
 */
export function getChordNotes(root: number, quality: ChordQuality): number[] {
  const intervals = CHORD_FORMULAS[quality] || CHORD_FORMULAS["Maj"];
  return intervals.map((interval) => root + interval);
}

/**
 * Get diatonic chord quality for a scale degree
 * @param degree - Scale degree (1-7)
 * @param mode - Mode name (default: Ionian/Major)
 * @returns Chord quality for that degree
 */
export function getDiatonicQuality(
  degree: number,
  mode: ModaleName = "Ionian",
): ChordQuality {
  // Standard diatonic chord qualities in major scale
  const majorQualities: ChordQuality[] = [
    "Maj", // I
    "min", // ii
    "min", // iii
    "Maj", // IV
    "dom7", // V7
    "min", // vi
    "hdim7", // vii°
  ];

  // Mode offsets relative to Ionian
  const modeOffsets: Record<ModaleName, number> = {
    Ionian: 0,
    Dorian: 1,
    Phrygian: 2,
    Lydian: 3,
    Mixolydian: 4,
    Aeolian: 5,
    Locrian: 6,
  };

  const offset = modeOffsets[mode] || 0;
  const index = (degree - 1 + offset) % 7;

  return majorQualities[index];
}

/**
 * Apply inversion to chord notes
 * Moves bottom notes up by octaves to create inversions
 *
 * @param notes - Original chord notes (MIDI)
 * @param inversion - Inversion level (0 = root, 1 = first, 2 = second, etc.)
 * @returns Inverted chord notes
 */
export function applyInversion(notes: number[], inversion: number): number[] {
  if (!notes || notes.length === 0 || inversion === 0) {
    return [...notes];
  }

  const sortedNotes = [...notes].sort((a, b) => a - b);
  const invertedNotes = [...sortedNotes];

  // Move specified number of bottom notes up by octave
  for (let i = 0; i < inversion && i < sortedNotes.length; i++) {
    invertedNotes[i] += 12;
  }

  return invertedNotes.sort((a, b) => a - b);
}

/**
 * Apply drop voicing to chord notes
 * Creates drop voicings by moving upper notes down an octave
 *
 * @param notes - Original chord notes (MIDI)
 * @param dropType - Drop voicing type (0 = none, 2 = drop 2, 3 = drop 3, 23 = drop 2&4)
 * @returns Drop-voiced chord notes
 */
export function applyDropVoicing(notes: number[], dropType: number): number[] {
  if (!notes || notes.length < 4 || dropType === 0) {
    return [...notes];
  }

  const sortedNotes = [...notes].sort((a, b) => a - b);
  const dropNotes = [...sortedNotes];

  if (dropType === 2 && sortedNotes.length >= 4) {
    // Drop 2: Move second-highest note down an octave
    dropNotes[sortedNotes.length - 2] -= 12;
  } else if (dropType === 3 && sortedNotes.length >= 4) {
    // Drop 3: Move third-highest note down an octave
    dropNotes[sortedNotes.length - 3] -= 12;
  } else if (dropType === 23 && sortedNotes.length >= 4) {
    // Drop 2&4: Move second and fourth-highest notes down
    dropNotes[sortedNotes.length - 2] -= 12;
    if (sortedNotes.length >= 4) {
      dropNotes[sortedNotes.length - 4] -= 12;
    }
  }

  return dropNotes.sort((a, b) => a - b);
}

/**
 * Apply complete voicing (inversion + drop)
 * Combines inversion and drop voicing for full control
 *
 * @param baseNotes - Base chord notes
 * @param inversion - Inversion level (0-3)
 * @param dropType - Drop voicing type (0, 2, 3, 23)
 * @returns Fully voiced chord notes
 */
export function applyVoicing(
  baseNotes: number[],
  inversion: number = 0,
  dropType: number = 0,
): number[] {
  let notes = [...baseNotes];

  // Apply inversion first
  if (inversion > 0) {
    notes = applyInversion(notes, inversion);
  }

  // Then apply drop voicing
  if (dropType > 0) {
    notes = applyDropVoicing(notes, dropType);
  }

  return notes;
}

/**
 * Get human-readable voicing description
 * @param inversion - Inversion level
 * @param dropType - Drop voicing type
 * @returns Description string
 */
export function getVoicingDescription(
  inversion: number,
  dropType: number,
): string {
  const inversionNames = [
    "Root Position",
    "1st Inversion",
    "2nd Inversion",
    "3rd Inversion",
  ];
  let description = inversionNames[Math.min(inversion, 3)] || "Root Position";

  if (dropType === 2) description += " Drop 2";
  else if (dropType === 3) description += " Drop 3";
  else if (dropType === 23) description += " Drop 2&4";

  return description;
}

/**
 * Get chord name from root and quality
 * @param root - MIDI root note
 * @param quality - Chord quality
 * @returns Chord name (e.g., "CMaj7")
 */
export function getChordName(root: number, quality: ChordQuality): string {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const noteName = noteNames[root % 12];
  return `${noteName}${quality}`;
}

/**
 * Parse scale degree string to semitone offset
 * Handles flat/sharp notation (e.g., "b7", "#4")
 *
 * @param degree - Scale degree as string (e.g., "1", "b7", "#4")
 * @returns Semitone offset from root
 */
export function parseDegree(degree: string): number {
  const degreeMap: Record<string, number> = {
    "1": 0,
    b2: 1,
    "2": 2,
    b3: 3,
    "3": 4,
    "4": 5,
    "#4": 6,
    b5: 6,
    "5": 7,
    "#5": 8,
    b6: 8,
    "6": 9,
    b7: 10,
    "7": 11,
  };

  return degreeMap[degree] ?? 0;
}

/**
 * Get scale notes for a given mode
 * @param root - Root note (MIDI)
 * @param mode - Mode name
 * @returns Array of MIDI notes in the scale
 */
export function getScaleNotes(
  root: number,
  mode: ModaleName = "Ionian",
): number[] {
  const profile = MODAL_PROFILES[mode];
  const notes: number[] = [root];
  let currentNote = root;

  for (const step of profile.steps.slice(0, -1)) {
    // Exclude octave step
    currentNote += step;
    notes.push(currentNote);
  }

  return notes;
}

/**
 * Constrain notes to a specific range
 * @param notes - Original notes
 * @param min - Minimum MIDI note
 * @param max - Maximum MIDI note
 * @returns Notes within range
 */
export function constrainToRange(
  notes: number[],
  min: number,
  max: number,
): number[] {
  return notes.map((note) => {
    let constrainedNote = note;

    // Bring note up to minimum
    while (constrainedNote < min) {
      constrainedNote += 12;
    }

    // Bring note down to maximum
    while (constrainedNote > max) {
      constrainedNote -= 12;
    }

    return constrainedNote;
  });
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
  range?: {
    min: number;
    max: number;
  };
}

/**
 * Generate a complete chord with voicing
 * Combines chord generation, voicing, and range constraints
 *
 * @param params - Voicing parameters
 * @returns Array of MIDI note numbers
 */
export function generateChord(params: VoicingParams): number[] {
  const { root, quality, inversion = 0, drop = 0, range } = params;

  // Generate base chord notes
  let notes = getChordNotes(root, quality);

  // Apply voicing (inversion + drop)
  notes = applyVoicing(notes, inversion, drop);

  // Constrain to range if specified
  if (range) {
    notes = constrainToRange(notes, range.min, range.max);
  }

  return notes;
}

/**
 * Get the root note for a scale degree in a given key and mode
 * @param keyRoot - Root note of the key (MIDI 0-127)
 * @param degree - Scale degree (1-7)
 * @param mode - Mode name (default: Ionian)
 * @returns MIDI note number for that degree's root
 */
export function getScaleDegreeRoot(
  keyRoot: number,
  degree: number,
  mode: ModaleName = "Ionian",
): number {
  const scaleNotes = getScaleNotes(keyRoot, mode);
  const index = (degree - 1) % 7;
  return scaleNotes[index];
}

/**
 * Extend a chord quality with 7th, 9th, 11th, or 13th extensions
 * @param baseQuality - Base chord quality (triad or 7th)
 * @param extension - Extension to add (7, 9, 11, or 13)
 * @returns Extended chord quality
 */
export function extendChordQuality(
  baseQuality: ChordQuality,
  extension: 7 | 9 | 11 | 13,
): ChordQuality {
  // Extension mapping
  const extensionMap: Record<string, Record<number, ChordQuality>> = {
    Maj: { 7: "Maj7", 9: "Maj9", 11: "Maj11", 13: "Maj13" },
    min: { 7: "min7", 9: "min9", 11: "min11", 13: "min13" },
    dim: { 7: "dim7", 9: "dim7", 11: "dim7", 13: "dim7" },
    aug: { 7: "aug7", 9: "aug7", 11: "aug7", 13: "aug7" },
    sus2: { 7: "dom7", 9: "dom9", 11: "dom11", 13: "dom13" },
    sus4: { 7: "dom7", 9: "dom9", 11: "dom11", 13: "dom13" },
    dom7: { 7: "dom7", 9: "dom9", 11: "dom11", 13: "dom13" },
    Maj7: { 7: "Maj7", 9: "Maj9", 11: "Maj11", 13: "Maj13" },
    min7: { 7: "min7", 9: "min9", 11: "min11", 13: "min13" },
    hdim7: { 7: "hdim7", 9: "hdim7", 11: "hdim7", 13: "hdim7" },
  };

  const mapping = extensionMap[baseQuality];
  if (mapping && mapping[extension]) {
    return mapping[extension];
  }

  // If already extended or no mapping, return as-is
  return baseQuality;
}

/**
 * Get Roman numeral representation of a scale degree
 * @param degree - Scale degree (1-7)
 * @param mode - Mode name (affects quality determination)
 * @returns Roman numeral string (e.g., "I", "ii", "vii°")
 */
export function getRomanNumeral(
  degree: number,
  mode: ModaleName = "Ionian",
): string {
  const quality = getDiatonicQuality(degree, mode);
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const numeral = numerals[(degree - 1) % 7];

  // Lowercase for minor chords
  if (quality.includes("min") || quality === "hdim7") {
    const lower = numeral.toLowerCase();
    return quality === "hdim7" ? `${lower}°` : lower;
  }

  // Diminished symbol
  if (quality.includes("dim")) {
    return `${numeral.toLowerCase()}°`;
  }

  // Augmented symbol
  if (quality.includes("aug")) {
    return `${numeral}+`;
  }

  // Major/Dominant - uppercase
  return numeral;
}

/**
 * Diatonic chord generation parameters
 */
export interface DiatonicChordParams {
  /** Root note of the key */
  keyRoot: number;

  /** Scale degree (1-7) */
  degree: number;

  /** Mode name */
  mode?: ModaleName;

  /** Extension to add (7, 9, 11, 13) */
  extension?: 7 | 9 | 11 | 13;

  /** Inversion (0-3) */
  inversion?: number;

  /** Drop voicing (0, 2, 3, 23) */
  drop?: number;

  /** Note range constraints */
  range?: {
    min: number;
    max: number;
  };
}

/**
 * Generate a diatonic chord from key, degree, and mode
 * Main workflow function for diatonic chord building
 *
 * @param params - Diatonic chord parameters
 * @returns Array of MIDI note numbers
 */
export function generateDiatonicChord(params: DiatonicChordParams): number[] {
  const {
    keyRoot,
    degree,
    mode = "Ionian",
    extension,
    inversion = 0,
    drop = 0,
    range,
  } = params;

  // 1. Get the root note for this scale degree
  const chordRoot = getScaleDegreeRoot(keyRoot, degree, mode);

  // 2. Get the diatonic quality for this degree
  let quality = getDiatonicQuality(degree, mode);

  // 3. Apply extension if specified
  if (extension) {
    quality = extendChordQuality(quality, extension);
  }

  // 4. Generate the chord with voicing
  return generateChord({
    root: chordRoot,
    quality,
    inversion,
    drop,
    range,
  });
}
