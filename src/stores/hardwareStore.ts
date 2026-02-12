import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as HardwareService from "../services/hardware/HardwareService";
import { useProgressionStore } from "./progressionStore";
import { WebMidi } from "webmidi";

interface HardwareState {
  // Connection state
  isConnected: boolean;
  midiAccessGranted: boolean;

  // Current display state
  displays: string[];
  padStates: Map<number, number>; // note -> mode

  // Actions
  initializeMIDI: () => Promise<boolean>;
  updateDisplay: (
    line: number,
    content: string | number[],
    rgb?: [number, number, number],
  ) => void;
  setPadState: (note: number, mode: number) => void;
  parseEncoder: (
    cc: number,
    value: number,
  ) => { encoderIndex: number; delta: number } | null;
}

export const useHardwareStore = create<HardwareState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    midiAccessGranted: false,
    displays: Array(5).fill(""), // 5 display lines
    padStates: new Map(),

    // Actions
    initializeMIDI: async () => {
      const granted = await HardwareService.initializeMIDIAccess();
      if (granted) {
        if (!WebMidi.sysexEnabled) {
          console.warn("SysEx not enabled, native mode may not work");
        }
        HardwareService.initializeNativeMode();
        HardwareService.setupMIDIInput((message) => {
          // Handle incoming MIDI messages
          const status = message[0];
          const data1 = message[1];
          const data2 = message[2];

          if (status === 176 && data1 >= 14 && data1 <= 21) {
            // Encoder CC
            const result = HardwareService.parseRelativeCC(data1, data2);

            // Map Encoders to Parameters (Placeholder Logic)
            const paramNames = [
              "COMPLEXITY",
              "VELOCITY",
              "DURATION",
              "SPREAD",
              "OCTAVE",
              "HUMANIZE",
              "REVERB",
              "DELAY",
            ];
            const param =
              paramNames[result.encoderIndex] ||
              `ENC ${result.encoderIndex + 1}`;

            // Update Display with Parameter Value
            get().updateDisplay(0, param, [255, 200, 0]); // Orange
            get().updateDisplay(
              1,
              result.delta > 0 ? "INCREMENT" : "DECREMENT",
              [255, 200, 0],
            );

            // TODO: Connect to ProgressionStore actions
            // e.g., useProgressionStore.getState().setComplexity(...)
          }
          // Touch strip: ATOM SQ touch strip CC/LED range typically 55-79
          if (status === 176 && data1 >= 55 && data1 <= 79) {
            // Map 0-127 -> 1-16 repeats
            const normalized = Math.max(0, Math.min(127, data2)) / 127;
            const repeats = Math.min(
              16,
              Math.max(1, Math.floor(normalized * 15) + 1),
            );

            try {
              const section = useProgressionStore
                .getState()
                .getCurrentSection();
              const updatedSection = { ...section, repeats };
              useProgressionStore
                .getState()
                .updateCurrentSection(updatedSection);
              console.log("Touch strip -> repeats:", repeats);
            } catch (err) {
              console.warn(
                "Failed to update section repeats from touch strip:",
                err,
              );
            }
          }
        });

        set({ midiAccessGranted: true, isConnected: true });

        // Initialize Pad Colors (Visual Scale Map)
        // Simple C Major Map for now: Root = Blue, Others = White
        for (let i = 0; i < 16; i++) {
          const note = 36 + i;
          const degree = i % 7;
          const color =
            degree === 0
              ? HardwareService.PAD_COLORS.ROOT
              : HardwareService.PAD_COLORS.WHITE;
          HardwareService.setPadState(note, color);
        }
      } else {
        set({ midiAccessGranted: false, isConnected: false });
      }
      return granted;
    },

    updateDisplay: (line, content, rgb) => {
      HardwareService.updateDisplay(line, content, rgb);

      // Update local state
      set((state) => {
        const newDisplays = [...state.displays];
        newDisplays[line] = Array.isArray(content) ? content.join("") : content;
        return { displays: newDisplays };
      });
    },

    setPadState: (note, mode) => {
      HardwareService.setPadState(note, mode);

      // Update local state
      set((state) => {
        const newPadStates = new Map(state.padStates);
        newPadStates.set(note, mode);
        return { padStates: newPadStates };
      });
    },

    parseEncoder: (cc, value) => {
      return HardwareService.parseRelativeCC(cc, value);
    },
  })),
);
