/**
 * ProgressionEditor Component
 * ATOM SQ Diatonic Chord Builder with Modal Support
                    {
                      isLit
                        ? `${getPadColor(selectedChord?.metadata?.quality)} brightness-110`
                        : "pad-empty muted-text"
                    }
 * - Display Buttons: ADD, INSERT, REPLACE, DELETE, CLEAR, SEND
 * - Bank A-H: Song sections (Verse, Chorus, Bridge, etc.)
 */

import { useState, useEffect, useCallback } from "react";
// framer-motion: used in child components (ProgressionStrip), not directly here
import { Save, Trash2, Plus, ArrowUp, Copy, Send } from "lucide-react";
import { InputModal, ConfirmModal } from "../Modal";
import { useProgressionStore } from "@stores/progressionStore";
import { useHardwareStore } from "@stores/hardwareStore";
import type { ChordQuality } from "@/types/chord";
import type { ModaleName } from "@services/musicTheory/MusicTheoryEngine";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";
import ProgressionStrip from "./ProgressionStrip";
import { LoopTimeline } from "./LoopTimeline";

// ATOM SQ Constants
const PAD_COUNT = 16;

// Note names for display
const NOTE_NAMES = [
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

// Mode names
const MODES: ModaleName[] = [
  "Ionian",
  "Dorian",
  "Phrygian",
  "Lydian",
  "Mixolydian",
  "Aeolian",
  "Locrian",
];

// Diatonic degrees (0-7, where 0 = Free mode)
const DEGREES = [
  { value: 0, label: "[Free]" },
  { value: 1, label: "I" },
  { value: 2, label: "ii" },
  { value: 3, label: "iii" },
  { value: 4, label: "IV" },
  { value: 5, label: "V" },
  { value: 6, label: "vi" },
  { value: 7, label: "vii°" },
];

// Chord qualities for manual mode
const QUALITIES: ChordQuality[] = [
  "Maj",
  "min",
  "dim",
  "aug",
  "sus2",
  "sus4",
  "Maj7",
  "min7",
  "dom7",
  "dim7",
  "hdim7",
  "minMaj7",
  "aug7",
  "Maj9",
  "min9",
  "dom9",
];

// Extensions (0 = none)
const EXTENSIONS = [
  { value: 0, label: "None" },
  { value: 7, label: "7th" },
  { value: 9, label: "9th" },
  { value: 11, label: "11th" },
  { value: 13, label: "13th" },
];

export function ProgressionEditor() {
  const {
    getCurrentSection,
    addChord,
    removeChord,
    updateChord,
    insertChord,
    clearProgression,
    saveProgression,
    keyRoot,
    mode,
    selectedSlot,
    setKeyRoot,
    setMode,
    selectSlot,
    updateCurrentSection,
  } = useProgressionStore();

  const { initializeMIDI, isConnected } = useHardwareStore();

  // Encoder staging state (current chord being built)
  const [encoderState, setEncoderState] = useState({
    keyRoot: keyRoot,
    mode: mode,
    degree: 0, // 0 = Free, 1-7 = I-vii°
    duration: 4,
    quality: "Maj" as ChordQuality,
    extension: 0, // 0 = none, 7, 9, 11, 13
    inversion: 0,
    octave: 0,
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const section = getCurrentSection();
  const progression = section.progression;

  // Initialize MIDI
  useEffect(() => {
    initializeMIDI();
  }, [initializeMIDI]);

  // Sync encoder state with store
  useEffect(() => {
    setEncoderState((prev) => ({
      ...prev,
      keyRoot,
      mode,
    }));
  }, [keyRoot, mode]);

  // Update encoder state function
  const updateEncoder = useCallback(
    (field: string, value: any) => {
      setEncoderState((prev) => {
        const newState = { ...prev, [field]: value };

        // Sync key/mode changes to store
        if (field === "keyRoot") setKeyRoot(value);
        if (field === "mode") setMode(value);

        return newState;
      });
    },
    [setKeyRoot, setMode],
  );

  // Generate current chord from encoder state
  const generateCurrentChord = useCallback(() => {
    const {
      keyRoot,
      mode,
      degree,
      duration,
      quality,
      extension,
      inversion,
      octave,
    } = encoderState;

    let notes: number[];
    let chordRoot: number;
    let chordQuality: ChordQuality;

    if (degree === 0) {
      // Free mode - use manual root and quality
      chordRoot = keyRoot + octave * 12;
      chordQuality = quality;

      if (extension > 0) {
        chordQuality = MusicTheory.extendChordQuality(
          quality,
          extension as 7 | 9 | 11 | 13,
        );
      }

      notes = MusicTheory.generateChord({
        root: chordRoot,
        quality: chordQuality,
        inversion,
        range: { min: 36, max: 84 },
      });
    } else {
      // Diatonic mode
      notes = MusicTheory.generateDiatonicChord({
        keyRoot,
        degree,
        mode,
        extension: extension > 0 ? (extension as 7 | 9 | 11 | 13) : undefined,
        inversion,
        range: { min: 36, max: 84 },
      });

      chordRoot = MusicTheory.getScaleDegreeRoot(keyRoot, degree, mode);
      chordQuality = MusicTheory.getDiatonicQuality(degree, mode);

      if (extension > 0) {
        chordQuality = MusicTheory.extendChordQuality(
          chordQuality,
          extension as 7 | 9 | 11 | 13,
        );
      }

      // Apply octave shift
      if (octave !== 0) {
        notes = notes.map((n) => n + octave * 12);
        chordRoot += octave * 12;
      }
    }

    return {
      notes,
      duration,
      metadata: {
        root: chordRoot,
        quality: chordQuality,
        inversion,
        drop: 0,
      },
    };
  }, [encoderState]);

  // Get chord display name
  const getChordDisplayName = useCallback(() => {
    const { keyRoot, mode, degree, quality, extension } = encoderState;

    if (degree === 0) {
      // Free mode
      const noteName = NOTE_NAMES[keyRoot % 12];
      let qualityStr = quality;

      if (extension > 0) {
        qualityStr = MusicTheory.extendChordQuality(
          quality,
          extension as 7 | 9 | 11 | 13,
        );
      }

      return `${noteName}${qualityStr}`;
    } else {
      // Diatonic mode
      const romanNumeral = MusicTheory.getRomanNumeral(degree, mode);
      const chordRoot = MusicTheory.getScaleDegreeRoot(keyRoot, degree, mode);
      const noteName = NOTE_NAMES[chordRoot % 12];
      let chordQuality = MusicTheory.getDiatonicQuality(degree, mode);

      if (extension > 0) {
        chordQuality = MusicTheory.extendChordQuality(
          chordQuality,
          extension as 7 | 9 | 11 | 13,
        );
      }

      return `${romanNumeral} (${noteName}${chordQuality})`;
    }
  }, [encoderState]);

  // Get pad semantic class based on chord quality
  const getPadColor = useCallback((quality?: ChordQuality) => {
    if (!quality) return "pad-empty";

    if (quality.includes("Maj")) return "quality-maj";
    if (quality.includes("min")) return "quality-min";
    if (quality.includes("dom")) return "quality-dom";
    if (quality.includes("dim")) return "quality-dim";
    if (quality.includes("aug")) return "quality-aug";
    if (quality.includes("sus")) return "quality-maj";

    return "pad-default";
  }, []);

  // Action handlers
  const handleAdd = useCallback(() => {
    const chord = generateCurrentChord();
    addChord(chord);
  }, [generateCurrentChord, addChord]);

  const handleInsert = useCallback(() => {
    if (selectedSlot === null) return;
    const chord = generateCurrentChord();
    insertChord(selectedSlot, chord);
  }, [selectedSlot, generateCurrentChord, insertChord]);

  const handleReplace = useCallback(() => {
    if (selectedSlot === null) return;
    const chord = generateCurrentChord();
    updateChord(selectedSlot, chord);
  }, [selectedSlot, generateCurrentChord, updateChord]);

  const handleDelete = useCallback(() => {
    if (selectedSlot === null) return;
    removeChord(selectedSlot);
    selectSlot(null);
  }, [selectedSlot, removeChord, selectSlot]);

  const handleClear = useCallback(() => {
    clearProgression();
    selectSlot(null);
  }, [clearProgression, selectSlot]);

  const handleSend = useCallback(() => {
    // TODO: Send to Ableton Live via OSC
    console.log("Send to Live:", progression);
  }, [progression]);

  // Load chord from slot into encoder state
  const loadSlotIntoEncoder = useCallback(
    (index: number) => {
      if (index >= progression.length) return;

      const chord = progression[index];
      const { root, quality, inversion } = chord.metadata || {};

      if (root && quality) {
        setEncoderState((prev) => ({
          ...prev,
          keyRoot: root,
          quality,
          inversion: inversion || 0,
          duration: chord.duration,
          degree: 0, // Switch to free mode when loading
        }));
      }
    },
    [progression],
  );

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Main Content: Left Sidebar + Right Area */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Sidebar: Info View (Section + Display + Connection) */}
        <div className="flex flex-col order-first w-56 gap-2 p-2 overflow-y-auto panel border-r">
          <div className="card">
            <div className="mb-1 text-xs muted-text">Section</div>
            <div className="mb-2 text-lg font-bold quality-aug">
              {section.name}
            </div>

            <div className="font-mono text-xs quality-maj">
              {getChordDisplayName()} • {encoderState.duration} beats
            </div>
            <div className="mt-1 text-xs muted-text">
              Key: {NOTE_NAMES[keyRoot % 12]} {mode} • {progression.length}{" "}
              chords • {progression.reduce((sum, c) => sum + c.duration, 0)}{" "}
              beats total
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1 status-pill">
              <div className="w-2 h-2 status-on rounded-full animate-pulse" />
              <span className="text-xs font-medium status-on-text">
                ATOM SQ
              </span>
            </div>
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden progression-editor-content">
          {/* Header intentionally removed: info moved to left toolbar */}

          {/* Encoders Card (CC 14-21) */}
          <div className="px-4 py-3 panel border-b">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                  {/* Encoder 1: Key/Root */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 1:{" "}
                      {encoderState.degree === 0 ? "Root Note" : "Key"}
                    </label>
                    <select
                      title={`Encoder 1: ${encoderState.degree === 0 ? "Root Note" : "Key"}`}
                      value={encoderState.keyRoot}
                      onChange={(e) =>
                        updateEncoder("keyRoot", Number(e.target.value))
                      }
                      className="w-full text-xs rounded px-2 py-1 compact input"
                    >
                      {NOTE_NAMES.map((noteName, i) => (
                        <option key={i} value={60 + i}>
                          {noteName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Encoder 2: Mode/Scale */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 2: Mode/Scale
                    </label>
                    <select
                      title="Encoder 2: Mode/Scale"
                      value={encoderState.mode}
                      onChange={(e) =>
                        updateEncoder("mode", e.target.value as ModaleName)
                      }
                      className="w-full text-xs rounded px-2 py-1 compact input"
                    >
                      {MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="Ionian">[Chromatic]</option>
                    </select>
                  </div>

                  {/* Encoder 3: Diatonic Degree */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 3: Diatonic Degree
                    </label>
                    <select
                      title="Encoder 3: Diatonic Degree"
                      value={encoderState.degree}
                      onChange={(e) =>
                        updateEncoder("degree", Number(e.target.value))
                      }
                      className="w-full text-xs rounded px-2 py-1 compact input"
                    >
                      {DEGREES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Encoder 4: Duration */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 4: Duration
                    </label>
                    <input
                      title="Encoder 4: Duration"
                      type="range"
                      min="1"
                      max="16"
                      value={encoderState.duration}
                      onChange={(e) =>
                        updateEncoder("duration", Number(e.target.value))
                      }
                      className="w-full h-2 compact"
                    />
                    <div className="text-xs muted-text text-center mt-0.5">
                      {encoderState.duration} beat
                      {encoderState.duration !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Encoder 5: Chord Quality */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 5: Quality{" "}
                      {encoderState.degree > 0 && (
                        <span className="muted-text">(Auto)</span>
                      )}
                    </label>
                    <select
                      title="Encoder 5: Quality"
                      value={encoderState.quality}
                      onChange={(e) =>
                        updateEncoder("quality", e.target.value as ChordQuality)
                      }
                      disabled={encoderState.degree > 0}
                      className="w-full text-xs rounded px-2 py-1 compact input disabled:opacity-50"
                    >
                      {QUALITIES.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Encoder 6: Extension */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 6: Extension
                    </label>
                    <select
                      title="Encoder 6: Extension"
                      value={encoderState.extension}
                      onChange={(e) =>
                        updateEncoder("extension", Number(e.target.value))
                      }
                      className="w-full text-xs rounded px-2 py-1 compact input"
                    >
                      {EXTENSIONS.map((e) => (
                        <option key={e.value} value={e.value}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Encoder 7: Inversion */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 7: Inversion
                    </label>
                    <input
                      title="Encoder 7: Inversion"
                      type="range"
                      min="0"
                      max="3"
                      value={encoderState.inversion}
                      onChange={(e) =>
                        updateEncoder("inversion", Number(e.target.value))
                      }
                      className="w-full h-2 compact"
                    />
                    <div className="text-xs muted-text text-center mt-0.5">
                      {["Root", "1st", "2nd", "3rd"][encoderState.inversion]}
                    </div>
                  </div>

                  {/* Encoder 8: Octave */}
                  <div>
                    <label className="text-xs muted-text block mb-1.5">
                      Encoder 8: Octave
                    </label>
                    <input
                      title="Encoder 8: Octave"
                      type="range"
                      min="-2"
                      max="2"
                      value={encoderState.octave}
                      onChange={(e) =>
                        updateEncoder("octave", Number(e.target.value))
                      }
                      className="w-full h-2 compact"
                    />
                    <div className="text-xs muted-text text-center mt-0.5">
                      {encoderState.octave > 0
                        ? `+${encoderState.octave}`
                        : encoderState.octave}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Two Column Layout */}
              <div className="w-32 grid grid-cols-2 gap-2 mt-1.5">
                <button
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-maj rounded shadow compact active:scale-95"
                  title="Add chord to progression"
                >
                  <Plus size={12} />
                  ADD
                </button>

                <button
                  onClick={handleInsert}
                  disabled={selectedSlot === null}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-maj rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Insert before selected"
                >
                  <ArrowUp size={12} />
                  INSERT
                </button>

                <button
                  onClick={handleReplace}
                  disabled={selectedSlot === null || !progression[selectedSlot]}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-aug rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Replace selected chord"
                >
                  <Copy size={12} />
                  REPLACE
                </button>

                <button
                  onClick={handleDelete}
                  disabled={selectedSlot === null || !progression[selectedSlot]}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-dim rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Delete selected chord"
                >
                  <Trash2 size={12} />
                  DELETE
                </button>

                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={progression.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-dim rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Clear all chords"
                >
                  <Trash2 size={12} />
                  CLEAR
                </button>

                <button
                  onClick={handleSend}
                  disabled={progression.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold transition-all quality-min rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Send to Ableton Live"
                >
                  <Send size={12} />
                  SEND
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Pads Area */}
          <div className="flex-1 px-6 py-2">
            <div className="mb-2">
              <h3 className="mb-2 text-sm font-semibold muted-text">
                Progression Slots (Upper Pads 52-67)
              </h3>
              <div className="grid max-w-full gap-2 grid-cols-16">
                {Array.from({ length: PAD_COUNT }, (_, i) => {
                  const chord = progression[i];
                  const isSelected = selectedSlot === i;
                  const isEmpty = !chord;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        selectSlot(i);
                        if (chord) loadSlotIntoEncoder(i);
                      }}
                      className={`w-full h-12 sm:h-14 rounded flex flex-col items-center justify-center transition-transform transform active:scale-95 ${isEmpty ? "pad-empty slot-border" : `${getPadColor(chord.metadata?.quality)} slot-border`} ${isSelected ? "slot-selected" : ""} hover:brightness-110 text-xs font-bold compact gap-0.5`}
                      title={`Slot ${i + 1}${chord ? `: ${NOTE_NAMES[(chord.metadata?.root || 0) % 12]}${chord.metadata?.quality}` : " (Empty)"}`}
                    >
                      <span className="text-[10px] opacity-60">{i + 1}</span>
                      {chord && (
                        <span className="text-[11px] font-bold leading-tight">
                          {NOTE_NAMES[(chord.metadata?.root || 0) % 12]}
                          <br />
                          {chord.metadata?.quality || ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lower Pads: Duration Visualization */}
            <div className="mb-2">
              <h3 className="mb-2 text-sm font-semibold muted-text">
                Duration (Lower Pads 36-51) -{" "}
                {selectedSlot !== null && progression[selectedSlot]
                  ? `Slot ${selectedSlot + 1}`
                  : "No slot selected"}
              </h3>
              <div className="grid gap-2 grid-cols-16">
                {Array.from({ length: PAD_COUNT }, (_, i) => {
                  const beatNumber = i + 1;
                  const selectedChord =
                    selectedSlot !== null ? progression[selectedSlot] : null;
                  const isLit =
                    selectedChord && beatNumber <= selectedChord.duration;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (
                          selectedSlot !== null &&
                          progression[selectedSlot]
                        ) {
                          const chord = progression[selectedSlot];
                          updateChord(selectedSlot, {
                            ...chord,
                            duration: beatNumber,
                          });
                        }
                      }}
                      disabled={
                        selectedSlot === null || !progression[selectedSlot]
                      }
                      className={`
                    aspect-square rounded flex items-center justify-center text-xs font-bold
                    transition-all transform active:scale-95
                    ${
                      isLit
                        ? `${getPadColor(selectedChord?.metadata?.quality)} brightness-110 duration-lit`
                        : "pad-empty muted-text"
                    }
                    ${selectedSlot === null || !progression[selectedSlot] ? "cursor-not-allowed opacity-50" : "hover:brightness-125"}
                  `}
                      title={`Set duration to ${beatNumber} beat${beatNumber !== 1 ? "s" : ""}`}
                    >
                      {beatNumber}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Progression Strip - placed under Duration as a visual reference */}
            <div className="w-full overflow-y-visible overflow-x-hidden pb-6">
              <ProgressionStrip
                section={section}
                selectedSlot={selectedSlot}
                onSelect={(i: number) => {
                  selectSlot(i);
                  loadSlotIntoEncoder(i);
                }}
                compact
                onUpdateSlot={(idx: number, patch) => {
                  const chord = progression[idx];
                  if (!chord) return;
                  const merged = {
                    ...chord,
                    ...patch,
                    metadata: {
                      ...(chord.metadata || {}),
                      ...(patch && (patch as any).metadata
                        ? (patch as any).metadata
                        : {}),
                    },
                  };
                  updateChord(idx, merged as any);
                }}
                onSetSectionRepeats={(repeats: number) => {
                  const updated = { ...section, repeats };
                  updateCurrentSection(updated);
                }}
                onSetSectionBeatsPerBar={(beats: number) => {
                  const updated = { ...section, beatsPerBar: beats };
                  updateCurrentSection(updated);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Timeline */}
      <LoopTimeline />

      {/* Modals */}
      <InputModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={(name) => {
          saveProgression(name, { tempo: 120, tags: ["custom"] });
          setShowSaveModal(false);
        }}
        title="Save Progression"
        label="Progression Name"
        placeholder="e.g., My Jazz Progression"
      />

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={() => {
          handleClear();
          setShowClearModal(false);
        }}
        title="Clear Progression"
        message="Are you sure you want to clear all chords? This action cannot be undone."
        confirmText="Clear All"
        variant="danger"
      />
    </div>
  );
}
