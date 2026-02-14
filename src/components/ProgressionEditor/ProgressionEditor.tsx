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

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
// framer-motion: used in child components (ProgressionStrip), not directly here
import { Trash2, Plus, ArrowUp, Copy, Send, Music2, Clock } from "lucide-react";
import { InputModal, ConfirmModal } from "../Modal";
import { useProgressionStore } from "@stores/progressionStore";
import { useHardwareStore } from "@stores/hardwareStore";
import type { Chord, ChordQuality } from "@/types/chord";
import type { ModaleName } from "@services/musicTheory/MusicTheoryEngine";
import type { Section } from "@/types/progression";
import type { ModeId } from "@/types/arrangement";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";
import ArrangementLane from "./ArrangementLane";
import { LoopTimeline } from "./LoopTimeline";
import { BeatPadContextMenu } from "./BeatPadContextMenu";
import VelocityCurveDrawer from "./VelocityCurveDrawer";
import SongOverview from "./SongOverview";
import SongMetaCard from "./SongMetaCard";
import ActiveSectionEditor from "./ActiveSectionEditor";
import SongSettings from "./SongSettings";
import LeftNavMenu from "./LeftNavMenu";
import ToolsPanel from "./ToolsPanel";
import FocusTrap from "../common/FocusTrap";
import ConnectionMonitorPanel from "./ConnectionMonitorPanel";
import { FloatingSliderPicker } from "../common/FloatingSliderPicker";
import { useLiveStore } from "@stores/liveStore";
import { GroveWandererModule } from "@/modules/drums/GroveWandererModule";
import { seedGrooveLibrary } from "@/modules/drums/seedGrooveLibrary";
import {
  buildArrangedChordEvents,
  toOscProgression,
} from "@services/output/ArrangementOutput";
import { getAdapterById } from "@services/output/OutputAdapters";
import { useRoutingStore } from "@stores/routingStore";
import { sendArrangedEventsToWebMidi } from "@services/output/WebMidiOutService";

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

const getSectionProgressionForMode = (section: Section, mode: ModeId): Chord[] => {
  const modeProgression = section.modeProgressions?.[mode];
  if (Array.isArray(modeProgression)) return modeProgression;
  if (mode === "harmony") return section.progression || [];
  return [];
};

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
    arrangementBlocks,
  } = useProgressionStore();
  const { openDrawer, setOpenDrawer } = useProgressionStore();
  const createProgressionInLive = useLiveStore((s) => s.createProgression);
  const oscOutRoute = useRoutingStore((s) => s.oscOutRoute);
  const midiOutRoute = useRoutingStore((s) => s.midiOutRoute);
  const midiOutDeviceId = useRoutingStore((s) => s.midiOutDeviceId);
  const midiOutChannel = useRoutingStore((s) => s.midiOutChannel);
  const modeDefaultChannels = useRoutingStore((s) => s.modeDefaultChannels);
  const pulseMidiOut = useRoutingStore((s) => s.pulseMidiOut);
  const setMidiOutSignal = useRoutingStore((s) => s.setMidiOutSignal);
  const pushConnectionEvent = useRoutingStore((s) => s.pushConnectionEvent);

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

  const modeIndex = Math.max(0, MODES.indexOf(encoderState.mode));
  const qualityIndex = Math.max(0, QUALITIES.indexOf(encoderState.quality));
  const extensionIndex = Math.max(
    0,
    EXTENSIONS.findIndex((entry) => entry.value === encoderState.extension),
  );
  const degreeIndex = Math.max(
    0,
    DEGREES.findIndex((entry) => entry.value === encoderState.degree),
  );
  const dropIndex = Math.max(
    0,
    DROP_VOICINGS.findIndex((entry) => entry.value === encoderState.drop),
  );

  const grooveModuleRef = useRef<GroveWandererModule | null>(null);
  const [drumComplexity, setDrumComplexity] = useState(52);
  const [drumChangeRate, setDrumChangeRate] = useState(40);
  const [drumSwing, setDrumSwing] = useState(10);
  const [drumHumanization, setDrumHumanization] = useState(12);
  const [drumBars, setDrumBars] = useState(4);
  const [drumKickLevel, setDrumKickLevel] = useState(78);
  const [drumSnareLevel, setDrumSnareLevel] = useState(74);
  const [drumTopLevel, setDrumTopLevel] = useState(68);
  const [isDrumPreviewing, setIsDrumPreviewing] = useState(false);
  const [lastDrumTotalBeats, setLastDrumTotalBeats] = useState(16);
  
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
  const progression = useMemo(
    () => getSectionProgressionForMode(section, uiMode),
    [section, uiMode],
  );
  const arrangedEvents = useMemo(
    () => buildArrangedChordEvents(sections, arrangementBlocks),
    [sections, arrangementBlocks],
  );
  const uiModeLabel =
    uiMode === "harmony" ? "Harmony" : uiMode === "drum" ? "Drum" : "Mode";

  // Initialize MIDI
  useEffect(() => {
    initializeMIDI();
  }, [initializeMIDI]);

  useEffect(() => {
    const module = new GroveWandererModule();
    grooveModuleRef.current = module;
    module
      .initialize(seedGrooveLibrary)
      .catch((err: unknown) => console.warn("GrooveWanderer init failed:", err));
    return () => {
      module.destroy().catch(() => undefined);
      grooveModuleRef.current = null;
    };
  }, []);

  useEffect(() => {
    const module = grooveModuleRef.current;
    if (!module) return;
    const toVelocityScale = (value: number) =>
      Math.max(0.2, Math.min(1.6, value / 62.5));
    module.setConfig({
      tempo: 120,
      patternLengthBars: drumBars,
      // Swing/humanize are temporary here; long-term these should be owned by the MIDI FX engine.
      swing: drumSwing,
      humanization: drumHumanization,
      complexity: {
        kick: drumComplexity,
        snare: drumComplexity,
        hats_ride: Math.min(100, drumComplexity + 10),
        percussion: Math.max(0, drumComplexity - 8),
      },
      changeRate: {
        kick: drumChangeRate,
        snare: drumChangeRate,
        hats_ride: Math.min(100, drumChangeRate + 8),
        percussion: Math.min(100, drumChangeRate + 16),
      },
      velocityScale: {
        kick: toVelocityScale(drumKickLevel),
        snare: toVelocityScale(drumSnareLevel),
        hats_ride: toVelocityScale(drumTopLevel),
        percussion: toVelocityScale(Math.max(0, drumTopLevel - 6)),
      },
    });
  }, [
    drumBars,
    drumChangeRate,
    drumComplexity,
    drumHumanization,
    drumKickLevel,
    drumSnareLevel,
    drumSwing,
    drumTopLevel,
  ]);
  
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

  const applyDrumPatternToSection = useCallback((totalBeats: number, events: Array<{
    beat: number;
    note: number;
    velocity: number;
  }>) => {
    const stepCount = Math.max(16, Math.round(totalBeats));
    const byStep = new Map<number, { notes: Set<number>; velocity: number }>();
    events.forEach((event) => {
      const step = Math.max(0, Math.min(stepCount - 1, Math.floor(event.beat)));
      if (!byStep.has(step)) {
        byStep.set(step, { notes: new Set<number>(), velocity: event.velocity });
      }
      const row = byStep.get(step);
      if (!row) return;
      row.notes.add(event.note);
      row.velocity = Math.max(row.velocity, event.velocity);
    });

    const nextProgression = [] as Chord[];
    for (let step = 0; step < stepCount; step += 1) {
      const row = byStep.get(step);
      if (!row || row.notes.size === 0) continue;
      const notes = [...row.notes].sort((a, b) => a - b);
      nextProgression[step] = {
        notes,
        duration: 1,
        metadata: {
          root: notes[0],
          quality: "dom7",
          velocities: [Math.max(1, Math.min(127, row.velocity))],
          gate: [100],
        },
      };
    }

    updateCurrentSection({
      ...section,
      progression: section.modeProgressions?.harmony || section.progression,
      modeProgressions: {
        ...(section.modeProgressions || {}),
        drum: nextProgression,
      },
    });
    selectSlot(0);
  }, [section, selectSlot, updateCurrentSection]);

  const handleEvolveDrumPattern = useCallback(() => {
    const module = grooveModuleRef.current;
    if (!module) return;
    const result = module.generatePattern();
    setLastDrumTotalBeats(result.totalBeats);
    applyDrumPatternToSection(result.totalBeats, result.events);
  }, [applyDrumPatternToSection]);

  const handlePreviewDrumPattern = useCallback(async () => {
    const module = grooveModuleRef.current;
    if (!module) return;
    if (isDrumPreviewing) {
      module.stopPlayback();
      setIsDrumPreviewing(false);
      return;
    }
    setIsDrumPreviewing(true);
    const ok = await module.startPlayback({
      outputId: midiOutDeviceId,
      midiChannel: modeDefaultChannels.drum || midiOutChannel,
      modeChannels: modeDefaultChannels,
    });
    if (!ok) {
      setIsDrumPreviewing(false);
      return;
    }
    const timeoutMs = (lastDrumTotalBeats * 60000) / 120 + 180;
    window.setTimeout(() => {
      setIsDrumPreviewing(false);
    }, timeoutMs);
  }, [isDrumPreviewing, lastDrumTotalBeats, midiOutChannel, midiOutDeviceId, modeDefaultChannels]);

  const handleDrumCustomAction = useCallback(
    (action: "capture" | "mutate" | "lock" | "reset") => {
      pushConnectionEvent("drum", `${action} action queued`);
      if (action === "reset") {
        setDrumComplexity(52);
        setDrumChangeRate(40);
        setDrumSwing(10);
        setDrumHumanization(12);
        setDrumBars(4);
        setDrumKickLevel(78);
        setDrumSnareLevel(74);
        setDrumTopLevel(68);
      }
    },
    [pushConnectionEvent],
  );

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

  const handleSend = useCallback(async () => {
    const oscPayload = toOscProgression(arrangedEvents);
    if (oscPayload.length === 0 || arrangedEvents.length === 0) {
      console.warn("No arranged events available to send");
      return;
    }

    const oscRoute = getAdapterById(oscOutRoute);
    if (oscRoute && oscRoute.availability === "available") {
      createProgressionInLive(oscPayload);
      pushConnectionEvent(
        "osc",
        `sent ${oscPayload.length} items (${arrangedEvents.length} events)`,
      );
    }

    const midiRoute = getAdapterById(midiOutRoute);
    if (midiRoute && midiRoute.availability === "available") {
      await sendArrangedEventsToWebMidi(arrangedEvents, {
        outputId: midiOutDeviceId,
        channel: midiOutChannel,
        modeChannels: modeDefaultChannels,
        onEventSent: pulseMidiOut,
        onSignal: ({ type, note, channel, velocity }) => {
          if (type === "all_off") {
            setMidiOutSignal(`all off ch${channel}`);
            return;
          }
          const noteLabel =
            typeof note === "number"
              ? `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`
              : "note";
          const vel = typeof velocity === "number" ? velocity : 0;
          setMidiOutSignal(`${type} ${noteLabel} v${vel} ch${channel}`);
        },
      });
    }

    console.log("Sent arranged timeline:", {
      eventCount: arrangedEvents.length,
      progressionLength: oscPayload.length,
      oscRoute: oscRoute?.id || "none",
      midiRoute: midiRoute?.id || "none",
      midiChannel: midiOutChannel,
    });
  }, [
    arrangedEvents,
    createProgressionInLive,
    midiOutChannel,
    midiOutDeviceId,
    midiOutRoute,
    modeDefaultChannels,
    oscOutRoute,
    pulseMidiOut,
    setMidiOutSignal,
    pushConnectionEvent,
  ]);

  const canSendArrangement = arrangedEvents.length > 0;

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
              <SongMetaCard />
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
                        {openDrawer === "monitor" && <ConnectionMonitorPanel />}

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
          <div className="harmony-controls-panel h-1/4 shrink-0 px-4 py-3 panel border-b">
            <div className="mb-2 text-[10px] uppercase tracking-wide muted-text font-semibold">
              {uiModeLabel} Controls
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                {uiMode === "drum" ? (
                  <div className="harmony-controls-grid grid grid-cols-4 gap-x-3 gap-y-2">
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Complexity</label>
                      <FloatingSliderPicker
                        ariaLabel="Drum complexity"
                        value={drumComplexity}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumComplexity}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Change Rate</label>
                      <FloatingSliderPicker
                        ariaLabel="Drum change rate"
                        value={drumChangeRate}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumChangeRate}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Swing</label>
                      <FloatingSliderPicker
                        ariaLabel="Drum swing"
                        value={drumSwing}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumSwing}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Humanize</label>
                      <FloatingSliderPicker
                        ariaLabel="Drum humanization"
                        value={drumHumanization}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumHumanization}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Bars</label>
                      <FloatingSliderPicker
                        ariaLabel="Drum bars"
                        value={drumBars}
                        min={1}
                        max={8}
                        step={1}
                        onChange={setDrumBars}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Kick Lvl</label>
                      <FloatingSliderPicker
                        ariaLabel="Kick level"
                        value={drumKickLevel}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumKickLevel}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Snare Lvl</label>
                      <FloatingSliderPicker
                        ariaLabel="Snare level"
                        value={drumSnareLevel}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumSnareLevel}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] muted-text block mb-1">Hat/Perc Lvl</label>
                      <FloatingSliderPicker
                        ariaLabel="Hat and percussion level"
                        value={drumTopLevel}
                        min={0}
                        max={100}
                        step={1}
                        onChange={setDrumTopLevel}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="harmony-controls-grid grid grid-cols-4 gap-x-3 gap-y-2">
                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        {encoderState.degree === 0 ? "Root Note" : "Key"}
                      </label>
                      <FloatingSliderPicker
                        ariaLabel={encoderState.degree === 0 ? "Root Note" : "Key"}
                        value={encoderState.keyRoot}
                        min={60}
                        max={71}
                        step={1}
                        onChange={(next) => updateEncoder("keyRoot", next)}
                        formatValue={(midiNote) => NOTE_NAMES[(midiNote - 60 + 12) % 12]}
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {NOTE_NAMES[(encoderState.keyRoot - 60 + 12) % 12]}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Mode/Scale
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Mode/Scale"
                        value={modeIndex}
                        min={0}
                        max={MODES.length - 1}
                        step={1}
                        onChange={(next) =>
                          updateEncoder(
                            "mode",
                            MODES[Math.max(0, Math.min(MODES.length - 1, next))],
                          )
                        }
                        formatValue={(index) =>
                          MODES[Math.max(0, Math.min(MODES.length - 1, index))]
                        }
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {encoderState.mode}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Quality{" "}
                        {encoderState.degree > 0 && (
                          <span className="muted-text">(Auto)</span>
                        )}
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Quality"
                        value={qualityIndex}
                        min={0}
                        max={QUALITIES.length - 1}
                        step={1}
                        onChange={(next) =>
                          updateEncoder(
                            "quality",
                            QUALITIES[
                              Math.max(0, Math.min(QUALITIES.length - 1, next))
                            ] as ChordQuality,
                          )
                        }
                        disabled={encoderState.degree > 0}
                        formatValue={(index) =>
                          QUALITIES[Math.max(0, Math.min(QUALITIES.length - 1, index))]
                        }
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {encoderState.quality}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Extension
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Extension"
                        value={extensionIndex}
                        min={0}
                        max={EXTENSIONS.length - 1}
                        step={1}
                        onChange={(next) =>
                          updateEncoder(
                            "extension",
                            EXTENSIONS[
                              Math.max(0, Math.min(EXTENSIONS.length - 1, next))
                            ].value,
                          )
                        }
                        formatValue={(index) =>
                          EXTENSIONS[Math.max(0, Math.min(EXTENSIONS.length - 1, index))]
                            .label
                        }
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {EXTENSIONS[extensionIndex]?.label || "None"}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Diatonic Degree
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Diatonic Degree"
                        value={degreeIndex}
                        min={0}
                        max={DEGREES.length - 1}
                        step={1}
                        onChange={(next) =>
                          updateEncoder(
                            "degree",
                            DEGREES[Math.max(0, Math.min(DEGREES.length - 1, next))]
                              .value,
                          )
                        }
                        formatValue={(index) =>
                          DEGREES[Math.max(0, Math.min(DEGREES.length - 1, index))]
                            .label
                        }
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {DEGREES.find((d) => d.value === encoderState.degree)?.label || "Root"}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Voicing
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Drop Voicing"
                        value={dropIndex}
                        min={0}
                        max={DROP_VOICINGS.length - 1}
                        step={1}
                        onChange={(next) =>
                          updateEncoder(
                            "drop",
                            DROP_VOICINGS[
                              Math.max(0, Math.min(DROP_VOICINGS.length - 1, next))
                            ].value,
                          )
                        }
                        formatValue={(index) =>
                          DROP_VOICINGS[
                            Math.max(0, Math.min(DROP_VOICINGS.length - 1, index))
                          ].label
                        }
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {DROP_VOICINGS.find((v) => v.value === encoderState.drop)?.label ||
                          "Close"}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Inversion
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Inversion"
                        value={encoderState.inversion}
                        min={0}
                        max={3}
                        step={1}
                        onChange={(next) => updateEncoder("inversion", next)}
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {["Root", "1st", "2nd", "3rd"][encoderState.inversion]}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] muted-text block mb-1">
                        Octave
                      </label>
                      <FloatingSliderPicker
                        ariaLabel="Octave"
                        value={encoderState.octave}
                        min={-2}
                        max={2}
                        step={1}
                        onChange={(next) => updateEncoder("octave", next)}
                      />
                      <div className="text-[10px] muted-text text-center mt-0.5">
                        {encoderState.octave > 0
                          ? `+${encoderState.octave}`
                          : encoderState.octave}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Two Column Layout */}
              <div className="harmony-controls-actions w-32 grid grid-cols-2 gap-2 mt-1.5">
                {uiMode === "drum" && (
                  <>
                    <button
                      onClick={handleEvolveDrumPattern}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Generate and apply drum pattern"
                    >
                      <Music2 size={10} />
                      EVOLVE
                    </button>

                    <button
                      onClick={handlePreviewDrumPattern}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Preview generated drum MIDI"
                    >
                      <Send size={10} />
                      {isDrumPreviewing ? "STOP" : "PREVIEW"}
                    </button>

                    <button
                      onClick={() => handleDrumCustomAction("capture")}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Capture groove state (placeholder)"
                    >
                      CAPTURE
                    </button>

                    <button
                      onClick={() => handleDrumCustomAction("mutate")}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Mutate groove (placeholder)"
                    >
                      MUTATE
                    </button>

                    <button
                      onClick={() => handleDrumCustomAction("lock")}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Lock groove voice lanes (placeholder)"
                    >
                      LOCK
                    </button>

                    <button
                      onClick={() => handleDrumCustomAction("reset")}
                      className="flex items-center justify-center gap-1 px-2 py-1 text-[8px] font-bold text-black transition-all btn-yellow rounded shadow compact active:scale-95"
                      title="Reset drum controls to defaults"
                    >
                      RESET
                    </button>
                  </>
                )}
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
                  disabled={!canSendArrangement}
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
              <div className="sequencer-lane-header flex items-center gap-1.5 mb-1.5">
                <Music2 size={14} className="opacity-50" />
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {uiModeLabel} Matrix
                </span>
              </div>
              <div className="sequencer-lane sequencer-lane-harmony grid max-w-full gap-2 grid-cols-16">
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
                      className={`sequencer-cell matrix-pad relative w-full h-14 rounded transition-transform flex flex-col items-center justify-center text-xs font-bold compact gap-0.5 ${isEmpty ? "pad-empty sequencer-cell-off" : `matrix-pad-filled sequencer-cell-on ${getPadColor(chord.metadata?.quality)}`} ${isSelected ? "slot-selected matrix-pad-selected" : ""} hover:brightness-110 active:scale-95`}
                      title={`Slot ${i + 1}${chord ? `: ${NOTE_NAMES[(chord.metadata?.root || 0) % 12]}${chord.metadata?.quality}` : " (Empty)"}`}
                    >
                      <span className="matrix-pad-index">{i + 1}</span>
                      {chord && (
                        <span className="matrix-pad-label text-[11px] font-bold leading-tight">
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
              <div className="sequencer-lane-header flex items-center gap-1.5 mb-1.5">
                <Clock size={14} className="opacity-50" />
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                  {uiMode === "harmony" ? "Duration" : "Step Length"}
                </span>
                {selectedSlot !== null && progression[selectedSlot] && (
                  <span className="text-[9px] opacity-40 ml-1">• Slot {selectedSlot + 1}</span>
                )}
              </div>
              <div className="sequencer-lane sequencer-lane-duration grid gap-2 grid-cols-16">
                {Array.from({ length: PAD_COUNT }, (_, i) => {
                  const beatNumber = i + 1;
                  const drumStepChord = progression[i];
                  const selectedChord =
                    uiMode === "drum"
                      ? drumStepChord
                      : selectedSlot !== null
                        ? progression[selectedSlot]
                        : null;
                  const isLit =
                    uiMode === "drum"
                      ? !!drumStepChord
                      : !!(selectedChord && beatNumber <= selectedChord.duration);

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (uiMode === "drum") {
                          const chord = progression[i];
                          if (!chord) return;
                          const nextDuration =
                            chord.duration >= 2
                              ? 0.25
                              : Number((chord.duration * 2).toFixed(2));
                          updateChord(i, {
                            ...chord,
                            duration: nextDuration,
                          });
                          selectSlot(i);
                          return;
                        }
                        if (selectedSlot === null || !progression[selectedSlot]) return;
                        const chord = progression[selectedSlot];
                        updateChord(selectedSlot, {
                          ...chord,
                          duration: beatNumber,
                        });
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        if (uiMode === "drum" && progression[i]) {
                          selectSlot(i);
                          setBeatContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            beatNumber: 1,
                          });
                          return;
                        }
                        if (selectedSlot !== null && progression[selectedSlot]) {
                          setBeatContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            beatNumber,
                          });
                        }
                      }}
                      disabled={
                        uiMode === "drum"
                          ? !progression[i]
                          : selectedSlot === null || !progression[selectedSlot]
                      }
                      className={`
                    sequencer-cell sequencer-step-pad w-full h-14 rounded flex flex-col items-center justify-center text-xs font-bold
                    transition-all transform active:scale-95 relative
                    ${isLit ? "duration-pad-on" : "duration-pad-off"}
                    ${selectedSlot === null || !progression[selectedSlot] ? "cursor-not-allowed opacity-50" : "hover:brightness-110 cursor-pointer"}
                  `}
                      title={
                        uiMode === "drum"
                          ? "Click to cycle step length • Right-click for gate/velocity"
                          : `Click to set duration to ${beatNumber} beats • Right-click for gate/velocity`
                      }
                    >
                      <span className="sequencer-step-index relative z-10">{beatNumber}</span>
                      {/* Velocity indicator badge */}
                      {selectedChord?.metadata?.velocities?.[
                        uiMode === "drum" ? 0 : beatNumber - 1
                      ] !== undefined &&
                       selectedChord.metadata.velocities[
                         uiMode === "drum" ? 0 : beatNumber - 1
                       ] !== 100 && isLit && (
                        <span className="absolute top-0.5 right-0.5 text-[7px] px-1 rounded bg-yellow text-black font-bold z-10">
                          V{
                            selectedChord.metadata.velocities[
                              uiMode === "drum" ? 0 : beatNumber - 1
                            ]
                          }
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
