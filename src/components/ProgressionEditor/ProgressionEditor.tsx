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
import { Trash2, Plus, ArrowUp, Copy, Send, Music2, Clock } from "lucide-react";
import { InputModal, ConfirmModal } from "../Modal";
import { useProgressionStore } from "@stores/progressionStore";
import { useHardwareStore } from "@stores/hardwareStore";
import type { Chord, ChordQuality } from "@/types/chord";
import type { ModaleName } from "@services/musicTheory/MusicTheoryEngine";
import type { Section } from "@/types/progression";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";
import ArrangementLane from "./ArrangementLane";
import { LoopTimeline } from "./LoopTimeline";
import { BeatPadContextMenu } from "./BeatPadContextMenu";
import VelocityCurveDrawer from "./VelocityCurveDrawer";
import SongOverview from "./SongOverview";
import ActiveSectionEditor from "./ActiveSectionEditor";
import SongSettings from "./SongSettings";
import LeftNavMenu from "./LeftNavMenu";
import ToolsPanel from "./ToolsPanel";
import FocusTrap from "../common/FocusTrap";

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

// Drop voicings
const DROP_VOICINGS = [
  { value: 0, label: "Close" },
  { value: 2, label: "Drop 2" },
  { value: 3, label: "Drop 3" },
  { value: 23, label: "Drop 2+4" },
];

// Local interfaces to replace any types
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
    sections,
    currentSectionIndex,
    loadSection,
    createSection,
    duplicateSection,
    deleteSection,
    uiMode,
    setSections,
  } = useProgressionStore();
  const { openDrawer, setOpenDrawer } = useProgressionStore();

  const { initializeMIDI } = useHardwareStore();

  // Encoder staging state (current chord being built)
  const [encoderState, setEncoderState] = useState({
    keyRoot: keyRoot,
    mode: mode,
    degree: 0, // 0 = Free, 1-7 = I-vii°
    drop: 0, // Drop voicing: 0=close, 2=drop2, 3=drop3, 23=drop2+4
    quality: "Maj" as ChordQuality,
    extension: 0, // 0 = none, 7, 9, 11, 13
    inversion: 0,
    octave: 0,
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Context menu state for beat pad MIDI editing (velocity per beat)
  const [beatContextMenu, setBeatContextMenu] = useState<{
    x: number;
    y: number;
    beatNumber: number;
  } | null>(null);
  
  // Velocity curve drawer state for Zone 1 chord slots
  const [velocityDrawer, setVelocityDrawer] = useState<{
    slotIndex: number;
    isOpen: boolean;
  } | null>(null);

  const section = getCurrentSection();
  const progression = section.progression;
  const uiModeLabel =
    uiMode === "harmony" ? "Harmony" : uiMode === "drum" ? "Drum" : "Mode";

  // Initialize MIDI
  useEffect(() => {
    initializeMIDI();
  }, [initializeMIDI]);
  
  // Save velocity curve from drawer
  const handleVelocitySave = useCallback((velocities: number[]) => {
    if (!velocityDrawer) return;
    
    const chord = progression[velocityDrawer.slotIndex];
    if (!chord) return;
    
    updateChord(velocityDrawer.slotIndex, {
      ...chord,
      metadata: {
        ...chord.metadata,
        velocities,
      },
    });
  }, [velocityDrawer, progression, updateChord]);

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
    (field: string, value: string | number) => {
      setEncoderState((prev) => {
        const newState = { ...prev, [field]: value };

        // Sync key/mode changes to store
        if (field === "keyRoot") setKeyRoot(value as number);
        if (field === "mode") setMode(value as ModaleName);

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
      drop,
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
      duration: 4, // Default duration, can be changed via Zone 2 pads
      metadata: {
        root: chordRoot,
        quality: chordQuality,
        inversion,
        drop: drop,
      },
    };
  }, [encoderState]);

  // (getChordDisplayName removed — unused)

  // Get pad semantic class based on chord quality
  const getPadColor = useCallback((quality?: ChordQuality) => {
    if (!quality) return "pad-empty";

    // Core theme colors (most common chords)
    if (quality.includes("Maj")) return "quality-maj"; // Orange
    if (quality.includes("min")) return "quality-min"; // Turquoise
    if (quality.includes("dom")) return "quality-dom"; // Yellow
    
    // Outlier colors (special/rare chords)
    if (quality.includes("dim")) return "quality-dim"; // Purple
    if (quality.includes("aug")) return "quality-aug"; // Pink
    if (quality.includes("sus")) return "quality-sus"; // Red
    if (quality.includes("add") || quality.includes("9") || quality.includes("11") || quality.includes("13")) return "quality-ext"; // Green
    if (quality.includes("b5") || quality.includes("#5") || quality.includes("#9") || quality.includes("b9")) return "quality-alt"; // Blue

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
      const { root, quality, inversion, drop } = chord.metadata || {};

      if (root && quality) {
        setEncoderState((prev) => ({
          ...prev,
          keyRoot: root,
          quality,
          inversion: inversion || 0,
          drop: drop || 0,
          degree: 0, // Switch to free mode when loading
        }));
      }
    },
    [progression],
  );

  const makeChord = useCallback(
    (root: number, quality: ChordQuality, duration: number): Chord => {
      const notes = MusicTheory.generateChord({
        root,
        quality,
        inversion: 0,
        range: { min: 36, max: 84 },
      });
      const beatCount = Math.max(1, Math.ceil(duration));
      return {
        notes,
        duration,
        metadata: {
          root,
          quality,
          inversion: 0,
          drop: 0,
          velocities: Array(beatCount).fill(100),
          gate: Array(beatCount).fill(150),
          strum: Array(beatCount).fill(0),
        },
      };
    },
    [],
  );

  const buildSection = useCallback(
    (name: string, progressionData: Chord[], repeats = 1, beatsPerBar = 4): Section => ({
      id: crypto.randomUUID(),
      name,
      progression: progressionData,
      repeats,
      beatsPerBar,
      rootHeld: null,
      currentNotes: [],
      transitions: { type: "none", length: 1 },
    }),
    [],
  );

  const loadExampleArrangement = useCallback(
    (exampleId: "stand_by_me" | "blues_12bar") => {
      if (exampleId === "stand_by_me") {
        // Known pop form reference (I-vi-IV-V family), adapted for dev diagnostics.
        const intro = buildSection("Intro", [
          makeChord(60, "Maj", 4),
          makeChord(69, "min", 4),
          makeChord(65, "Maj", 4),
          makeChord(67, "Maj", 4),
        ]);
        const verse = buildSection("Verse", [
          makeChord(60, "Maj", 4),
          makeChord(69, "min", 4),
          makeChord(65, "Maj", 4),
          makeChord(67, "Maj", 4),
        ], 2);
        const chorus = buildSection("Chorus", [
          makeChord(65, "Maj", 4),
          makeChord(67, "Maj", 4),
          makeChord(60, "Maj", 4),
          makeChord(69, "min", 4),
        ], 2);
        setSections([intro, verse, chorus], 0);
        return;
      }

      // 12-bar blues in C (known canonical form), split into structural parts.
      const bars1to4 = buildSection("Blues A (I)", [
        makeChord(60, "dom7", 4),
        makeChord(60, "dom7", 4),
        makeChord(60, "dom7", 4),
        makeChord(60, "dom7", 4),
      ]);
      const bars5to8 = buildSection("Blues B (IV-I)", [
        makeChord(65, "dom7", 4),
        makeChord(65, "dom7", 4),
        makeChord(60, "dom7", 4),
        makeChord(60, "dom7", 4),
      ]);
      const turnaround = buildSection("Turnaround (V-IV-I-V)", [
        makeChord(67, "dom7", 4),
        makeChord(65, "dom7", 4),
        makeChord(60, "dom7", 4),
        makeChord(67, "dom7", 4),
      ], 2);
      setSections([bars1to4, bars5to8, turnaround], 0);
    },
    [buildSection, makeChord, setSections],
  );

  return (
    <div className="flex flex-col h-full bg-app">
      {/* Main Content: Left Sidebar + Right Area */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Sidebar: Info View (Section + Display + Connection) */}
        <div className="flex flex-col order-first w-56 gap-2 p-2 panel border-r">
          {/* Header — Critical info (25%) */}
          <div className="flex-none h-1/4 overflow-hidden">
            <div className="card h-full">
              <SongOverview />
            </div>
          </div>

          {/* Middle — Navigation menu (now also renders contextual drawer) */}
          <div className="flex-1 overflow-auto">
            <div className="card h-full p-2 relative">
              <div className={`flip-container ${openDrawer ? "is-flipped" : ""}`}>
                <div className="flip-inner">
                  <div className="flip-front">
                    <LeftNavMenu />
                  </div>

                  <div
                    className="flip-back"
                    role="dialog"
                    aria-label={openDrawer ? `${openDrawer} panel` : "context panel"}
                    aria-hidden={!openDrawer}
                    tabIndex={-1}
                  >
                    <div className="p-2 h-full">
                      <FocusTrap active={!!openDrawer}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-semibold capitalize">{openDrawer}</div>
                        <button
                          className="btn-muted px-2 py-1"
                          onClick={() => setOpenDrawer(null)}
                        >
                          Close
                        </button>
                      </div>

                      <div className="space-y-2 overflow-auto h-[calc(100%-3rem)]">
                        {openDrawer === "sections" && <SongOverview />}
                        {openDrawer === "settings" && <SongSettings />}
                        {openDrawer === "sections-active" && <ActiveSectionEditor />}
                        {openDrawer === "patterns" && (
                          <div className="text-xs muted-text">Patterns panel (TODO)</div>
                        )}
                        {openDrawer === "library" && (
                          <div className="text-xs muted-text">Library panel (TODO)</div>
                        )}
                        {openDrawer === "export" && (
                          <div className="text-xs muted-text">Export options (TODO)</div>
                        )}

                        <div className="pt-2 border-t border-panel/20 mt-2">
                          <ToolsPanel />
                        </div>
                      </div>
                    </FocusTrap>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex flex-col flex-1 overflow-hidden progression-editor-content">
          {/* Header intentionally removed: info moved to left toolbar */}

          {/* Encoders Card (CC 14-21) */}
          <div className="px-4 py-3 panel border-b">
            <div className="mb-2 text-[10px] uppercase tracking-wide muted-text font-semibold">
              {uiModeLabel} Controls
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="grid grid-cols-4 gap-x-3 gap-y-2">
                  {/* Key/Root */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      {encoderState.degree === 0 ? "Root Note" : "Key"}
                    </label>
                    <select
                      title={encoderState.degree === 0 ? "Root Note" : "Key"}
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

                  {/* Mode/Scale */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Mode/Scale
                    </label>
                    <select
                      title="Mode/Scale"
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

                  {/* Chord Quality */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Quality{" "}
                      {encoderState.degree > 0 && (
                        <span className="muted-text">(Auto)</span>
                      )}
                    </label>
                    <select
                      title="Quality"
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

                  {/* Extension */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Extension
                    </label>
                    <select
                      title="Extension"
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

                  {/* Diatonic Degree */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Diatonic Degree
                    </label>
                    <select
                      title="Diatonic Degree"
                      value={encoderState.degree}
                      onChange={(e) =>
                        updateEncoder("degree", Number(e.target.value))
                      }
                      className="w-full h-8 text-xs compact"
                    >
                      {DEGREES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] muted-text text-center mt-0.5">
                      {DEGREES.find(d => d.value === encoderState.degree)?.label || "Root"}
                    </div>
                  </div>

                  {/* Drop Voicing */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Voicing
                    </label>
                    <select
                      title="Drop Voicing"
                      value={encoderState.drop}
                      onChange={(e) =>
                        updateEncoder("drop", Number(e.target.value))
                      }
                      className="w-full h-8 text-xs compact"
                    >
                      {DROP_VOICINGS.map((v) => (
                        <option key={v.value} value={v.value}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-[10px] muted-text text-center mt-0.5">
                      {DROP_VOICINGS.find(v => v.value === encoderState.drop)?.label || "Close"}
                    </div>
                  </div>

                  {/* Inversion */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Inversion
                    </label>
                    <input
                      title="Inversion"
                      type="range"
                      min="0"
                      max="3"
                      value={encoderState.inversion}
                      onChange={(e) =>
                        updateEncoder("inversion", Number(e.target.value))
                      }
                      className="w-full h-2 compact"
                    />
                    <div className="text-[10px] muted-text text-center mt-0.5">
                      {["Root", "1st", "2nd", "3rd"][encoderState.inversion]}
                    </div>
                  </div>

                  {/* Octave */}
                  <div>
                    <label className="text-[10px] muted-text block mb-1">
                      Octave
                    </label>
                    <input
                      title="Octave"
                      type="range"
                      min="-2"
                      max="2"
                      value={encoderState.octave}
                      onChange={(e) =>
                        updateEncoder("octave", Number(e.target.value))
                      }
                      className="w-full h-2 compact"
                    />
                    <div className="text-[10px] muted-text text-center mt-0.5">
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
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                  title="Add chord to progression"
                >
                  <Plus size={10} />
                  ADD
                </button>

                <button
                  onClick={handleInsert}
                  disabled={selectedSlot === null}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Insert before selected"
                >
                  <ArrowUp size={10} />
                  INSERT
                </button>

                <button
                  onClick={handleReplace}
                  disabled={selectedSlot === null || !progression[selectedSlot]}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Replace selected chord"
                >
                  <Copy size={10} />
                  REPLACE
                </button>

                <button
                  onClick={handleDelete}
                  disabled={selectedSlot === null || !progression[selectedSlot]}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Delete selected chord"
                >
                  <Trash2 size={10} />
                  DELETE
                </button>

                <button
                  onClick={() => setShowClearModal(true)}
                  disabled={progression.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Clear all chords"
                >
                  <Trash2 size={10} />
                  CLEAR
                </button>

                <button
                  onClick={handleSend}
                  disabled={progression.length === 0}
                  className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact disabled:opacity-50 active:scale-95"
                  title="Send to Ableton Live"
                >
                  <Send size={10} />
                  SEND
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Pads Area */}
          <div className="flex-1 px-6 py-2">
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Music2 size={14} className="opacity-50" />
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {uiModeLabel} Matrix
                </span>
              </div>
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
                      onContextMenu={(e) => {
                        if (!chord) return;
                        e.preventDefault();
                        // TODO: Open velocity curve drawer
                        console.log('Open velocity drawer for slot', i);
                      }}
                      className={`relative w-full h-14 rounded transition-transform flex flex-col items-center justify-center text-xs font-bold compact gap-0.5 ${isEmpty ? "pad-empty" : getPadColor(chord.metadata?.quality)} ${isSelected ? "slot-selected" : ""} hover:brightness-110 active:scale-95`}
                      title={`Slot ${i + 1}${chord ? `: ${NOTE_NAMES[(chord.metadata?.root || 0) % 12]}${chord.metadata?.quality}` : " (Empty)"}`}
                    >
                      <span className="text-[10px] text-black opacity-70">{i + 1}</span>
                      {chord && (
                        <span className="text-[11px] font-bold leading-tight text-black">
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
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={14} className="opacity-50" />
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {uiMode === "harmony" ? "Duration" : "Step Length"}
                </span>
                {selectedSlot !== null && progression[selectedSlot] && (
                  <span className="text-[9px] opacity-40 ml-1">• Slot {selectedSlot + 1}</span>
                )}
              </div>
              <div className="grid gap-2 grid-cols-16">
                {Array.from({ length: PAD_COUNT }, (_, i) => {
                  const beatNumber = i + 1;
                  const selectedChord =
                    selectedSlot !== null ? progression[selectedSlot] : null;
                  const isLit =
                    selectedChord && beatNumber <= selectedChord.duration;
                  const gateValue = selectedChord?.metadata?.gate?.[beatNumber - 1] ?? 150;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (selectedSlot === null || !progression[selectedSlot]) return;
                        const chord = progression[selectedSlot];
                        updateChord(selectedSlot, {
                          ...chord,
                          duration: beatNumber,
                        });
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (selectedSlot !== null && progression[selectedSlot]) {
                          setBeatContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            beatNumber,
                          });
                        }
                      }}
                      disabled={
                        selectedSlot === null || !progression[selectedSlot]
                      }
                      className={`
                    w-full h-14 rounded flex flex-col items-center justify-center text-xs font-bold
                    transition-all transform active:scale-95 relative overflow-hidden
                    ${isLit ? "duration-pad-on" : "duration-pad-off"}
                    ${selectedSlot === null || !progression[selectedSlot] ? "cursor-not-allowed opacity-50" : "hover:brightness-110 cursor-pointer"}
                  `}
                      title={`Click to set duration to ${beatNumber} beats • Right-click for gate/velocity`}
                    >
                      <span className="relative z-10">{beatNumber}</span>
                      {/* Velocity indicator badge */}
                      {selectedChord?.metadata?.velocities?.[beatNumber - 1] !== undefined && 
                       selectedChord.metadata.velocities[beatNumber - 1] !== 100 && isLit && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] px-1 rounded bg-yellow text-black font-bold z-10">
                          V{selectedChord.metadata.velocities[beatNumber - 1]}
                        </span>
                      )}
                      {/* Gate indicator badge */}
                      {isLit && (
                        <span className="absolute top-0.5 left-0.5 text-[7px] px-1 rounded bg-yellow text-black font-bold z-10">
                          G{gateValue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrangement Lane (mode-aware structural sketchpad) */}
            <div className="w-full overflow-y-visible overflow-x-hidden pb-6 mt-3">
              <ArrangementLane
                mode={uiMode}
                sections={sections}
                currentSectionIndex={currentSectionIndex}
                onSelectSection={(index: number) => {
                  loadSection(index);
                  selectSlot(null);
                }}
                onSetCurrentSectionRepeats={(repeats: number) => {
                  const active = useProgressionStore.getState().getCurrentSection();
                  const updated = { ...active, repeats };
                  updateCurrentSection(updated);
                }}
                onCreateSection={() => createSection()}
                onDuplicateSection={(index: number) => duplicateSection(index)}
                onDeleteSection={(index: number) => deleteSection(index)}
                onLoadExample={loadExampleArrangement}
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
      
      {/* Beat Pad Context Menu */}
      {beatContextMenu && selectedSlot !== null && progression[selectedSlot] && (
        <BeatPadContextMenu
          x={beatContextMenu.x}
          y={beatContextMenu.y}
          beatNumber={beatContextMenu.beatNumber}
          velocity={progression[selectedSlot].metadata?.velocities?.[beatContextMenu.beatNumber - 1] ?? 100}
          gate={progression[selectedSlot].metadata?.gate?.[beatContextMenu.beatNumber - 1] ?? 150}
          onUpdate={({ velocity, gate }) => {
            const chord = progression[selectedSlot];
            const bufferLength = Math.max(chord.duration, beatContextMenu.beatNumber);
            const velocities =
              chord.metadata?.velocities?.slice(0, bufferLength) ||
              Array(bufferLength).fill(100);
            const gateValues =
              chord.metadata?.gate?.slice(0, bufferLength) ||
              Array(bufferLength).fill(150);
            while (velocities.length < bufferLength) velocities.push(100);
            while (gateValues.length < bufferLength) gateValues.push(150);
            velocities[beatContextMenu.beatNumber - 1] = velocity;
            gateValues[beatContextMenu.beatNumber - 1] = gate;
            updateChord(selectedSlot, {
              ...chord,
              metadata: {
                ...chord.metadata,
                velocities,
                gate: gateValues,
              },
            });
          }}
          onClose={() => setBeatContextMenu(null)}
        />
      )}
      
      {/* Velocity Curve Drawer for Zone 3 chord cards */}
      {velocityDrawer && velocityDrawer.isOpen && progression[velocityDrawer.slotIndex] && (
        <VelocityCurveDrawer
          isOpen={velocityDrawer.isOpen}
          onClose={() => setVelocityDrawer(null)}
          duration={progression[velocityDrawer.slotIndex].duration}
          velocities={progression[velocityDrawer.slotIndex].metadata?.velocities || []}
          onSave={handleVelocitySave}
          chordName={`${NOTE_NAMES[(progression[velocityDrawer.slotIndex].metadata?.root || 0) % 12]}${progression[velocityDrawer.slotIndex].metadata?.quality}`}
        />
      )}
    </div>
  );
}
