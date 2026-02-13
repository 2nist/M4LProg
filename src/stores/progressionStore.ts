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
import type { ArrangementBlock, ModeId } from "@/types/arrangement";
import * as ProgressionManager from "@services/progression/ProgressionManager";

const getSectionBaseBeats = (section: Section): number =>
  Math.max(
    1,
    section.progression.reduce((sum, chord) => sum + (chord.duration || 0), 0),
  );

const sanitizeMidiChannel = (value?: number): number | undefined => {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(1, Math.min(16, Math.floor(value)));
};

const normalizeArrangementBlocks = (
  blocks: ArrangementBlock[],
  sections: Section[],
  fallbackMode: ModeId,
  seedIfEmpty: boolean,
): ArrangementBlock[] => {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  let filtered = blocks.filter((block) => sectionMap.has(block.sourceId));

  if (filtered.length === 0 && seedIfEmpty) {
    let startBeat = 0;
    filtered = sections.map((section) => {
      const repeats = Math.max(1, section.repeats || 1);
      const lengthBeats = getSectionBaseBeats(section) * repeats;
      const block: ArrangementBlock = {
        id: `arr-${section.id}-${Math.random().toString(36).slice(2, 8)}`,
        sourceId: section.id,
        mode: fallbackMode,
        startBeat,
        lengthBeats,
        label: section.name || "Section",
        repeats,
        intent: "main",
      };
      startBeat += lengthBeats;
      return block;
    });
  }

  let cursor = 0;
  return filtered.map((block) => {
    const section = sectionMap.get(block.sourceId);
    const repeats = Math.max(1, block.repeats || section?.repeats || 1);
    const baseBeats = Math.max(1, section ? getSectionBaseBeats(section) : 4);
    const lengthBeats = baseBeats * repeats;
    const next: ArrangementBlock = {
      ...block,
      mode: block.mode || fallbackMode,
      midiChannel: sanitizeMidiChannel(block.midiChannel),
      startBeat: cursor,
      lengthBeats,
      label: section?.name || block.label || "Section",
      repeats,
    };
    cursor += lengthBeats;
    return next;
  });
};

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

  /** Global editor mode (affects Mode Controls, Mode Matrix, Arrangement Lane) */
  uiMode: ModeId;
  setUiMode: (mode: ModeId) => void;

  /** Arrangement source of truth (shared timeline across all modes) */
  arrangementBlocks: ArrangementBlock[];
  selectedArrangementBlockId: string | null;
  selectArrangementBlock: (blockId: string | null) => void;
  setArrangementBlocks: (blocks: ArrangementBlock[]) => void;
  rebuildArrangementFromSections: () => void;
  addArrangementBlockFromSection: (sectionId: string, mode?: ModeId) => void;
  duplicateArrangementBlock: (blockId: string) => void;
  deleteArrangementBlock: (blockId: string) => void;
  reorderArrangementBlock: (fromIndex: number, toIndex: number) => void;
  setArrangementBlockRepeats: (blockId: string, repeats: number) => void;
  setArrangementBlockMidiChannel: (
    blockId: string,
    channel?: number,
  ) => void;

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

  /** UI: currently open left drawer (null | 'sections' | 'patterns' | 'settings' | 'library') */
  openDrawer: string | null;

  /** Open a named drawer */
  setOpenDrawer: (name: string | null) => void;

  /** Load a section by index */
  loadSection: (index: number) => void;

  /** Replace entire song section list (dev/tools import path) */
  setSections: (sections: Section[], currentSectionIndex?: number) => void;

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
  /** Rename a section by index */
  renameSectionAt: (index: number, name: string) => void;

  /** Reorder a section (drag/drop or keyboard) */
  reorderSection: (fromIndex: number, toIndex: number) => void;

  /** Duplicate a section */
  duplicateSection: (index: number) => void;

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

const initialSection = ProgressionManager.createEmptySection("Section 1");
const initialState = {
  keyRoot: 60, // C
  mode: "Ionian" as ModaleName,
  uiMode: "harmony" as ModeId,
  selectedSlot: null,
  sections: [initialSection],
  arrangementBlocks: normalizeArrangementBlocks(
    [],
    [initialSection],
    "harmony",
    true,
  ),
  selectedArrangementBlockId: null as string | null,
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

      setUiMode: (mode: ModeId) => {
        set({ uiMode: mode });
      },

      selectArrangementBlock: (blockId: string | null) => {
        set({ selectedArrangementBlockId: blockId });
      },

      setArrangementBlocks: (blocks: ArrangementBlock[]) => {
        const { sections, uiMode } = get();
        const nextBlocks = normalizeArrangementBlocks(
          blocks,
          sections,
          uiMode,
          false,
        );
        const selected = get().selectedArrangementBlockId;
        const keepSelected =
          selected && nextBlocks.some((block) => block.id === selected)
            ? selected
            : null;
        set({
          arrangementBlocks: nextBlocks,
          selectedArrangementBlockId: keepSelected,
        });
      },

      rebuildArrangementFromSections: () => {
        const { sections, uiMode } = get();
        set({
          arrangementBlocks: normalizeArrangementBlocks(
            [],
            sections,
            uiMode,
            true,
          ),
          selectedArrangementBlockId: null,
        });
      },

      addArrangementBlockFromSection: (sectionId: string, mode?: ModeId) => {
        const { sections, arrangementBlocks, uiMode } = get();
        const section = sections.find((s) => s.id === sectionId);
        if (!section) return;
        const repeats = Math.max(1, section.repeats || 1);
        const nextBlock: ArrangementBlock = {
          id: `arr-${section.id}-${Math.random().toString(36).slice(2, 8)}`,
          sourceId: section.id,
          mode: mode || uiMode,
          startBeat: 0,
          lengthBeats: getSectionBaseBeats(section) * repeats,
          label: section.name || "Section",
          repeats,
          intent: "main",
        };
        const nextBlocks = normalizeArrangementBlocks(
          [...arrangementBlocks, nextBlock],
          sections,
          uiMode,
          false,
        );
        set({ arrangementBlocks: nextBlocks });
      },

      duplicateArrangementBlock: (blockId: string) => {
        const { arrangementBlocks, sections, uiMode } = get();
        const index = arrangementBlocks.findIndex((block) => block.id === blockId);
        if (index < 0) return;
        const source = arrangementBlocks[index];
        const duplicate: ArrangementBlock = {
          ...source,
          id: `arr-${source.sourceId}-${Math.random().toString(36).slice(2, 8)}`,
        };
        const next = [
          ...arrangementBlocks.slice(0, index + 1),
          duplicate,
          ...arrangementBlocks.slice(index + 1),
        ];
        set({
          arrangementBlocks: normalizeArrangementBlocks(next, sections, uiMode, false),
        });
      },

      deleteArrangementBlock: (blockId: string) => {
        const { arrangementBlocks, sections, uiMode } = get();
        const next = arrangementBlocks.filter((block) => block.id !== blockId);
        const selected = get().selectedArrangementBlockId;
        set({
          arrangementBlocks: normalizeArrangementBlocks(next, sections, uiMode, false),
          selectedArrangementBlockId:
            selected === blockId ? null : selected,
        });
      },

      reorderArrangementBlock: (fromIndex: number, toIndex: number) => {
        const { arrangementBlocks, sections, uiMode } = get();
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= arrangementBlocks.length ||
          toIndex >= arrangementBlocks.length
        ) {
          return;
        }
        const next = [...arrangementBlocks];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        set({
          arrangementBlocks: normalizeArrangementBlocks(next, sections, uiMode, false),
        });
      },

      setArrangementBlockRepeats: (blockId: string, repeats: number) => {
        const { arrangementBlocks, sections, uiMode } = get();
        const safeRepeats = Math.max(1, Math.floor(repeats || 1));
        const next = arrangementBlocks.map((block) =>
          block.id === blockId ? { ...block, repeats: safeRepeats } : block,
        );
        set({
          arrangementBlocks: normalizeArrangementBlocks(next, sections, uiMode, false),
        });
      },

      setArrangementBlockMidiChannel: (blockId: string, channel?: number) => {
        const { arrangementBlocks, sections, uiMode } = get();
        const safeChannel = sanitizeMidiChannel(channel);
        const next = arrangementBlocks.map((block) =>
          block.id === blockId
            ? { ...block, midiChannel: safeChannel }
            : block,
        );
        set({
          arrangementBlocks: normalizeArrangementBlocks(next, sections, uiMode, false),
        });
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

      // Left drawer UI state
      openDrawer: null,
      setOpenDrawer: (name: string | null) => {
        set(() => ({ openDrawer: name }));
      },

      loadSection: (index: number) => {
        const { sections } = get();
        if (index >= 0 && index < sections.length) {
          set({ currentSectionIndex: index });
        }
      },

      setSections: (sections: Section[], nextIndex?: number) => {
        const safeSections =
          sections.length > 0
            ? sections.map((section) => ProgressionManager.cloneSection(section))
            : [ProgressionManager.createEmptySection("Section 1")];
        const safeIndex = Math.max(
          0,
          Math.min(
            safeSections.length - 1,
            nextIndex ?? get().currentSectionIndex,
          ),
        );
        set({
          sections: safeSections,
          arrangementBlocks: normalizeArrangementBlocks(
            [],
            safeSections,
            get().uiMode,
            true,
          ),
          selectedArrangementBlockId: null,
          currentSectionIndex: safeIndex,
          selectedSlot: null,
        });
      },

      updateCurrentSection: (section: Section) => {
        const { sections, currentSectionIndex, arrangementBlocks, uiMode } = get();
        const newSections = [...sections];
        newSections[currentSectionIndex] =
          ProgressionManager.cloneSection(section);
        set({
          sections: newSections,
          arrangementBlocks: normalizeArrangementBlocks(
            arrangementBlocks,
            newSections,
            uiMode,
            false,
          ),
        });
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
        const {
          sections,
          currentSectionIndex,
          arrangementBlocks,
          selectedArrangementBlockId,
          uiMode,
        } = get();

        // Don't delete if it's the last section
        if (sections.length <= 1) return;

        const removedSectionId = sections[index]?.id;
        const newSections = sections.filter((_, i) => i !== index);
        const newIndex =
          currentSectionIndex >= newSections.length
            ? newSections.length - 1
            : currentSectionIndex;
        const filteredBlocks = arrangementBlocks.filter(
          (block) => block.sourceId !== removedSectionId,
        );
        const nextBlocks = normalizeArrangementBlocks(
          filteredBlocks,
          newSections,
          uiMode,
          false,
        );
        const nextSelected =
          selectedArrangementBlockId &&
          nextBlocks.some((block) => block.id === selectedArrangementBlockId)
            ? selectedArrangementBlockId
            : null;

        set({
          sections: newSections,
          arrangementBlocks: nextBlocks,
          selectedArrangementBlockId: nextSelected,
          currentSectionIndex: newIndex,
        });
      },

      renameSection: (name: string) => {
        const { sections, currentSectionIndex, arrangementBlocks, uiMode } = get();
        const newSections = [...sections];
        newSections[currentSectionIndex] = {
          ...newSections[currentSectionIndex],
          name,
        };
        set({
          sections: newSections,
          arrangementBlocks: normalizeArrangementBlocks(
            arrangementBlocks,
            newSections,
            uiMode,
            false,
          ),
        });
      },

      renameSectionAt: (index: number, name: string) => {
        const { sections, arrangementBlocks, uiMode } = get();
        if (index < 0 || index >= sections.length) return;
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], name };
        set({
          sections: newSections,
          arrangementBlocks: normalizeArrangementBlocks(
            arrangementBlocks,
            newSections,
            uiMode,
            false,
          ),
        });
      },

      reorderSection: (fromIndex: number, toIndex: number) => {
        const { sections, currentSectionIndex } = get();
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          fromIndex >= sections.length ||
          toIndex < 0 ||
          toIndex >= sections.length
        ) {
          return;
        }

        const newSections = [...sections];
        const [movedSection] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, movedSection);

        // Update current section index if needed
        let newCurrentIndex = currentSectionIndex;
        if (currentSectionIndex === fromIndex) {
          newCurrentIndex = toIndex;
        } else if (
          fromIndex < currentSectionIndex &&
          toIndex >= currentSectionIndex
        ) {
          newCurrentIndex = currentSectionIndex - 1;
        } else if (
          fromIndex > currentSectionIndex &&
          toIndex <= currentSectionIndex
        ) {
          newCurrentIndex = currentSectionIndex + 1;
        }

        set({
          sections: newSections,
          currentSectionIndex: newCurrentIndex,
        });
      },

      duplicateSection: (index: number) => {
        const { sections } = get();
        if (index < 0 || index >= sections.length) return;

        const sectionToDuplicate = sections[index];
        const duplicated = {
          ...ProgressionManager.cloneSection(sectionToDuplicate),
          id: crypto.randomUUID(), // New UUID for duplicate
          name: `${sectionToDuplicate.name} (Copy)`,
        };

        const newSections = [
          ...sections.slice(0, index + 1),
          duplicated,
          ...sections.slice(index + 1),
        ];

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
        uiMode: state.uiMode,
        sections: state.sections,
        arrangementBlocks: state.arrangementBlocks,
        currentSectionIndex: state.currentSectionIndex,
        customPatterns: state.customPatterns,
        savedProgressions: state.savedProgressions,
      }),
    },
  ),
);

// Sanitize persisted sections in localStorage (assign UUIDs if missing)
// This runs once on module load to avoid react-beautiful-dnd errors from old persisted data.
(() => {
  try {
    const keysToTry = ["progression-storage", "zustand:progression-storage"];

    for (const key of keysToTry) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        continue;
      }

      // Zustand persist may wrap state under { state: {...} }
      const stateObj = parsed.state ?? parsed;
      if (!stateObj || !Array.isArray(stateObj.sections)) continue;

      const needFix = stateObj.sections.some((s: any) => !s || !s.id);
      if (!needFix) continue;

      stateObj.sections = stateObj.sections.map((s: any) => ({
        ...(s || {}),
        id: s?.id ?? crypto.randomUUID(),
      }));

      const out = parsed.state ? { ...parsed, state: stateObj } : stateObj;
      localStorage.setItem(key, JSON.stringify(out));
      // Once fixed, no need to try other keys
      break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      "progressionStore: failed to sanitize persisted sections",
      err,
    );
  }
})();
