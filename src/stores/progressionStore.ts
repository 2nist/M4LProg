/**
 * Progression Store
 * Manages application state for sections, progressions, and patterns
 *
 * Replaces Max dict from original M4L device
 * Uses Zustand for state management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Section, ProgressionSnapshot } from "../types/progression";
import type { Pattern } from "../types/pattern";
import type { Progression, Chord } from "../types/chord";
import type { ModaleName } from "@services/musicTheory/MusicTheoryEngine";
import * as ProgressionManager from "@services/progression/ProgressionManager";

interface ProgressionState {
  // ============================================================================
  // Diatonic Chord Builder State
  // ============================================================================

  /** Current key root note (MIDI 0-127) */
  keyRoot: number;

  /** Current mode/scale */
  mode: ModaleName;

  /** Selected progression slot (0-15, null = none) */
  selectedSlot: number | null;

  /** Set key root */
  setKeyRoot: (root: number) => void;

  /** Set mode */
  setMode: (mode: ModaleName) => void;

  /** Select a progression slot for editing */
  selectSlot: (index: number | null) => void;

  // ============================================================================
  // Section Management
  // ============================================================================

  /** All sections in the song */
  sections: Section[];

  /** Index of currently active section */
  currentSectionIndex: number;

  /** Get current section */
  getCurrentSection: () => Section;

  /** Load a section by index */
  loadSection: (index: number) => void;

  /** Update current section */
  updateCurrentSection: (section: Section) => void;

  /** Move to previous/next section */
  moveSection: (offset: number) => void;

  /** Create a new section */
  createSection: (name?: string) => void;

  /** Delete a section */
  deleteSection: (index: number) => void;

  /** Rename current section */
  renameSection: (name: string) => void;

  // ============================================================================
  // Progression Editing
  // ============================================================================

  /** Add a chord to current section */
  addChord: (chord: Chord) => void;

  /** Remove a chord from current section */
  removeChord: (index: number) => void;

  /** Update a chord in current section */
  updateChord: (index: number, chord: Chord) => void;

  /** Insert a chord at a specific position */
  insertChord: (index: number, chord: Chord) => void;

  /** Clear all chords in current section */
  clearProgression: () => void;

  /** Replace entire progression in current section */
  setProgression: (progression: Progression) => void;

  // ============================================================================
  // Pattern Management
  // ============================================================================

  /** User-created custom patterns */
  customPatterns: Pattern[];

  /** Add a custom pattern */
  addCustomPattern: (pattern: Pattern) => void;

  /** Remove a custom pattern */
  removeCustomPattern: (patternId: string) => void;

  /** Get all patterns (built-in + custom) */
  getAllPatterns: () => Pattern[];

  /** Apply a pattern to current section */
  applyPatternToSection: (patternId: string, root?: number) => void;

  // ============================================================================
  // Saved Progressions
  // ============================================================================

  /** Saved progression snapshots */
  savedProgressions: Record<string, ProgressionSnapshot>;

  /** Save current progression as snapshot */
  saveProgression: (
    name: string,
    metadata?: Partial<ProgressionSnapshot["metadata"]>,
  ) => void;

  /** Load a saved progression into current section */
  loadProgression: (name: string) => void;

  /** Delete a saved progression */
  deleteProgression: (name: string) => void;

  /** Get list of all saved progression names */
  getSavedProgressionNames: () => string[];

  // ============================================================================
  // Utility Actions
  // ============================================================================

  /** Reset entire store to defaults */
  reset: () => void;
}

const initialState = {
  keyRoot: 60, // C
  mode: "Ionian" as ModaleName,
  selectedSlot: null,
  sections: [ProgressionManager.createEmptySection("Section 1")],
  currentSectionIndex: 0,
  customPatterns: [],
  savedProgressions: {},
};

export const useProgressionStore = create<ProgressionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================================================
      // Diatonic Chord Builder State
      // ============================================================================

      setKeyRoot: (root: number) => {
        set({ keyRoot: root });
      },

      setMode: (mode: ModaleName) => {
        set({ mode });
      },

      selectSlot: (index: number | null) => {
        set({ selectedSlot: index });
      },

      // ============================================================================
      // Section Management
      // ============================================================================

      getCurrentSection: () => {
        const { sections, currentSectionIndex } = get();
        return sections[currentSectionIndex] || sections[0];
      },

      loadSection: (index: number) => {
        const { sections } = get();
        if (index >= 0 && index < sections.length) {
          set({ currentSectionIndex: index });
        }
      },

      updateCurrentSection: (section: Section) => {
        const { sections, currentSectionIndex } = get();
        const newSections = [...sections];
        newSections[currentSectionIndex] =
          ProgressionManager.cloneSection(section);
        set({ sections: newSections });
      },

      moveSection: (offset: number) => {
        const { sections, currentSectionIndex } = get();
        const newIndex = Math.max(
          0,
          Math.min(sections.length - 1, currentSectionIndex + offset),
        );
        set({ currentSectionIndex: newIndex });
      },

      createSection: (name?: string) => {
        const { sections } = get();
        const sectionName = name || `Section ${sections.length + 1}`;
        const newSection = ProgressionManager.createEmptySection(sectionName);
        set({
          sections: [...sections, newSection],
          currentSectionIndex: sections.length,
        });
      },

      deleteSection: (index: number) => {
        const { sections, currentSectionIndex } = get();

        // Don't delete if it's the last section
        if (sections.length <= 1) return;

        const newSections = sections.filter((_, i) => i !== index);
        const newIndex =
          currentSectionIndex >= newSections.length
            ? newSections.length - 1
            : currentSectionIndex;

        set({
          sections: newSections,
          currentSectionIndex: newIndex,
        });
      },

      renameSection: (name: string) => {
        const { sections, currentSectionIndex } = get();
        const newSections = [...sections];
        newSections[currentSectionIndex] = {
          ...newSections[currentSectionIndex],
          name,
        };
        set({ sections: newSections });
      },

      // ============================================================================
      // Progression Editing
      // ============================================================================

      addChord: (chord: Chord) => {
        const section = get().getCurrentSection();
        const updatedSection = {
          ...section,
          progression: [...section.progression, chord],
        };
        get().updateCurrentSection(updatedSection);
      },

      removeChord: (index: number) => {
        const section = get().getCurrentSection();
        const updatedSection = {
          ...section,
          progression: section.progression.filter((_, i) => i !== index),
        };
        get().updateCurrentSection(updatedSection);
      },

      updateChord: (index: number, chord: Chord) => {
        const section = get().getCurrentSection();
        const newProgression = [...section.progression];
        newProgression[index] = chord;
        const updatedSection = {
          ...section,
          progression: newProgression,
        };
        get().updateCurrentSection(updatedSection);
      },

      insertChord: (index: number, chord: Chord) => {
        const section = get().getCurrentSection();
        const newProgression = [...section.progression];
        newProgression.splice(index, 0, chord);
        const updatedSection = {
          ...section,
          progression: newProgression,
        };
        get().updateCurrentSection(updatedSection);
      },

      clearProgression: () => {
        const section = get().getCurrentSection();
        const updatedSection = {
          ...section,
          progression: [],
        };
        get().updateCurrentSection(updatedSection);
      },

      setProgression: (progression: Progression) => {
        const section = get().getCurrentSection();
        const updatedSection = {
          ...section,
          progression: ProgressionManager.cloneProgression(progression),
        };
        get().updateCurrentSection(updatedSection);
      },

      // ============================================================================
      // Pattern Management
      // ============================================================================

      addCustomPattern: (pattern: Pattern) => {
        const { customPatterns } = get();

        // Check if pattern with this ID already exists
        const exists = customPatterns.some((p) => p.id === pattern.id);
        if (exists) {
          // Replace existing pattern
          set({
            customPatterns: customPatterns.map((p) =>
              p.id === pattern.id ? pattern : p,
            ),
          });
        } else {
          // Add new pattern
          set({
            customPatterns: [...customPatterns, pattern],
          });
        }
      },

      removeCustomPattern: (patternId: string) => {
        const { customPatterns } = get();
        set({
          customPatterns: customPatterns.filter((p) => p.id !== patternId),
        });
      },

      getAllPatterns: () => {
        const { customPatterns } = get();
        return ProgressionManager.getPatternDefinitions(customPatterns);
      },

      applyPatternToSection: (patternId: string, root: number = 60) => {
        const { customPatterns } = get();
        const progression = ProgressionManager.applyPattern(
          patternId,
          { root },
          customPatterns,
        );

        if (progression) {
          get().setProgression(progression);
        }
      },

      // ============================================================================
      // Saved Progressions
      // ============================================================================

      saveProgression: (
        name: string,
        metadata?: Partial<ProgressionSnapshot["metadata"]>,
      ) => {
        const section = get().getCurrentSection();
        const snapshot = ProgressionManager.createProgressionSnapshot(
          name,
          section.progression,
          metadata,
        );

        const { savedProgressions } = get();
        set({
          savedProgressions: {
            ...savedProgressions,
            [name]: snapshot,
          },
        });
      },

      loadProgression: (name: string) => {
        const { savedProgressions } = get();
        const snapshot = savedProgressions[name];

        if (snapshot) {
          const progression =
            ProgressionManager.loadProgressionFromSnapshot(snapshot);
          get().setProgression(progression);
        }
      },

      deleteProgression: (name: string) => {
        const { savedProgressions } = get();
        const newProgressions = { ...savedProgressions };
        delete newProgressions[name];
        set({ savedProgressions: newProgressions });
      },

      getSavedProgressionNames: () => {
        const { savedProgressions } = get();
        return Object.keys(savedProgressions).sort();
      },

      // ============================================================================
      // Utility Actions
      // ============================================================================

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: "progression-storage", // LocalStorage key
      partialize: (state) => ({
        // Only persist these fields
        keyRoot: state.keyRoot,
        mode: state.mode,
        sections: state.sections,
        currentSectionIndex: state.currentSectionIndex,
        customPatterns: state.customPatterns,
        savedProgressions: state.savedProgressions,
      }),
    },
  ),
);
