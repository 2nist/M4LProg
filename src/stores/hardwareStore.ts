import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as HardwareService from "../services/hardware/HardwareService";
import { useProgressionStore } from "./progressionStore";
import { WebMidi } from "webmidi";
import type { Chord } from "../types/chord";

interface HardwareState {
  // Connection state
  isConnected: boolean;
  midiAccessGranted: boolean;

  // Current display state
  displays: string[];
  padStates: Map<number, number>; // note -> mode
  
  // Activity indicators
  midiInputActive: boolean;
  midiOutputActive: boolean;
  lastMidiInput: string;
  lastMidiOutput: string;

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

// Debounce timer for touch strip
let touchStripTimer: NodeJS.Timeout | null = null;
let lastTouchStripValue: number | null = null;

export const useHardwareStore = create<HardwareState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    midiAccessGranted: false,
    displays: Array(5).fill(""), // 5 display lines
    padStates: new Map(),
    midiInputActive: false,
    midiOutputActive: false,
    lastMidiInput: 'None',
    lastMidiOutput: 'None',

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

          // Debug: Log all MIDI input
          console.log(`🎛️ MIDI: status=${status} data1=${data1} data2=${data2}`);
          
          // Flash input indicator and save last message
          set({ 
            midiInputActive: true,
            lastMidiInput: `${status},${data1},${data2}`
          });
          setTimeout(() => set({ midiInputActive: false }), 100);

          // Pad Note On/Off (144-159 = note on, 128-143 = note off)
          if ((status >= 144 && status <= 159) || (status >= 128 && status <= 143)) {
            const noteOn = status >= 144;
            const note = data1;
            const velocity = data2;
            console.log(`🎹 Pad: note=${note} velocity=${velocity} ${noteOn ? 'ON' : 'OFF'}`);
            
            if (noteOn && velocity > 0) {
              // Play note preview or add to chord
              // TODO: Connect to audio engine when available
              console.log(`▶️ Playing note ${note} at velocity ${velocity}`);
            }
          }

          // Encoder CC (14-21 for ATOM SQ encoders)
          if (status === 176 && data1 >= 14 && data1 <= 21) {
            const result = HardwareService.parseRelativeCC(data1, data2);
            
            console.log(`🎛️ Encoder CC: ${data1} → index=${result?.encoderIndex} delta=${result?.delta}`);
            
            if (!result) {
              console.warn(`⚠️ Failed to parse encoder CC: ${data1}=${data2}`);
              return;
            }

            const store = useProgressionStore.getState();
            const section = store.getCurrentSection();
            
            console.log(`📊 Section: ${section.id}, progression length: ${section.progression?.length ?? 0}`);
            
            // Get selected chord index (default to first chord if available)
            const chordIndex = 0; // TODO: Track selected chord in UI
            let chord = section.progression[chordIndex];
            
            // Auto-create a default chord if progression is empty
            if (!chord) {
              console.log('✨ Creating default C major chord for hardware control');
              const defaultChord: Chord = {
                notes: [60, 64, 67], // C major triad (C4, E4, G4)
                duration: 4, // 4 beats (whole note)
                metadata: {
                  root: 60,
                  quality: 'Maj', // use `ChordQuality` literal
                  velocities: [100, 100, 100],
                  gate: [1, 1, 1],
                  strum: [0, 0, 0],
                  drop: 0,
                },
              };
              
              // Add the default chord to the progression
              const updatedSection = {
                ...section,
                progression: [defaultChord],
              };
              store.updateCurrentSection(updatedSection);
              chord = defaultChord;
            }
            
            console.log(`🎵 Chord: ${chord.notes?.length ?? 0} notes, duration=${chord.duration}`);
            
            // Map Encoders to Parameters
            const encoderActions: Record<number, () => void> = {
              0: () => { // COMPLEXITY - cycle chord extensions
                // Cycle through: triad → 7th → 9th → 11th → 13th
                const extensions = ['', '7', '9', '11', '13'];
                const currentExt = chord.metadata?.quality?.match(/\d+/)?.[0] || '';
                const currentIdx = extensions.indexOf(currentExt);
                const newIdx = (currentIdx + (result.delta > 0 ? 1 : -1) + extensions.length) % extensions.length;
                console.log(`🎚️ COMPLEXITY: extension ${extensions[currentIdx]} → ${extensions[newIdx]}`);
                // Note: Actual quality change requires regenerating the chord
              },
              1: () => { // VELOCITY - adjust note velocities
                const currentVel = chord.metadata?.velocities?.[0] ?? 100;
                const newVel = Math.max(1, Math.min(127, currentVel + result.delta * 5));
                console.log(`🎚️ VELOCITY: ${currentVel} → ${newVel}`);
                
                const updatedChord = {
                  ...chord,
                  metadata: {
                    ...chord.metadata,
                    velocities: Array(chord.duration).fill(newVel),
                  },
                };
                store.updateChord(chordIndex, updatedChord);
              },
              2: () => { // DURATION - adjust chord duration
                const newDuration = Math.max(0.25, Math.min(16, chord.duration + result.delta * 0.25));
                console.log(`🎚️ DURATION: ${chord.duration.toFixed(2)} → ${newDuration.toFixed(2)} beats`);
                
                const updatedChord = {
                  ...chord,
                  duration: newDuration,
                };
                store.updateChord(chordIndex, updatedChord);
              },
              3: () => { // SPREAD - adjust voicing spread
                const currentSpread = chord.metadata?.drop ?? 0;
                const newSpread = Math.max(0, Math.min(23, currentSpread + result.delta));
                console.log(`🎚️ SPREAD: ${currentSpread} → ${newSpread}`);
                
                // Spread affects drop voicing (0=close, 2=drop2, 3=drop3, 23=drop2+3)
                const updatedChord = {
                  ...chord,
                  metadata: {
                    ...chord.metadata,
                    drop: newSpread,
                  },
                };
                store.updateChord(chordIndex, updatedChord);
              },
              4: () => { // OCTAVE - shift octave range (transpose by 12 semitones)
                const shift = result.delta * 12;
                console.log(`🎚️ OCTAVE: ${result.delta > 0 ? '+' : ''}${result.delta} octave`);
                
                const updatedChord = {
                  ...chord,
                  notes: chord.notes.map(n => Math.max(0, Math.min(127, n + shift))),
                  metadata: {
                    ...chord.metadata,
                    root: chord.metadata?.root ? Math.max(0, Math.min(127, chord.metadata.root + shift)) : undefined,
                  },
                };
                store.updateChord(chordIndex, updatedChord);
              },
              5: () => { // HUMANIZE - adjust strum/timing
                const currentStrum = chord.metadata?.strum?.[0] ?? 0;
                const newStrum = Math.max(0, Math.min(50, currentStrum + result.delta * 2));
                console.log(`🎚️ HUMANIZE: ${currentStrum}ms → ${newStrum}ms strum delay`);
                
                const updatedChord = {
                  ...chord,
                  metadata: {
                    ...chord.metadata,
                    strum: Array(chord.duration).fill(newStrum),
                  },
                };
                store.updateChord(chordIndex, updatedChord);
              },
              6: () => { // REVERB - adjust reverb amount (stored in metadata for future use)
                console.log(`🎚️ REVERB: ${result.delta > 0 ? '+' : ''}${result.delta} (audio FX not yet implemented)`);
                // TODO: Connect to audio FX engine when available
              },
              7: () => { // DELAY - adjust delay amount (stored in metadata for future use)
                console.log(`🎚️ DELAY: ${result.delta > 0 ? '+' : ''}${result.delta} (audio FX not yet implemented)`);
                // TODO: Connect to audio FX engine when available
              },
            };

            const action = encoderActions[result.encoderIndex];
            if (action) {
              action();
            }

            // Update Display with Parameter Value
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
            const param = paramNames[result.encoderIndex] || `ENC ${result.encoderIndex + 1}`;
            
            get().updateDisplay(0, param, [127, 100, 0]);
            get().updateDisplay(
              1,
              result.delta > 0 ? "INCREMENT" : "DECREMENT",
              [127, 100, 0],
            );
          }
          // Touch strip: ATOM SQ touch strip CC/LED range typically 55-79
          // Debounced to prevent rapid toggling from hardware noise
          if (status === 176 && data1 >= 55 && data1 <= 79) {
            // Clear existing timer
            if (touchStripTimer) {
              clearTimeout(touchStripTimer);
            }

            // Store the latest value
            lastTouchStripValue = data2;

            // Set new debounce timer (100ms delay)
            touchStripTimer = setTimeout(() => {
              if (lastTouchStripValue === null) return;

              // Map 0-127 -> 1-16 repeats
              const normalized = Math.max(0, Math.min(127, lastTouchStripValue)) / 127;
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

              touchStripTimer = null;
            }, 100);
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
      
      // Flash output indicator and save last message
      set({ 
        midiOutputActive: true,
        lastMidiOutput: `Display L${line}: ${Array.isArray(content) ? content.join('') : content}`
      });
      setTimeout(() => set({ midiOutputActive: false }), 100);
    },

    setPadState: (note, mode) => {
      HardwareService.setPadState(note, mode);

      // Update local state
      set((state) => {
        const newPadStates = new Map(state.padStates);
        newPadStates.set(note, mode);
        return { padStates: newPadStates };
      });
      
      // Flash output indicator and save last message
      set({ 
        midiOutputActive: true,
        lastMidiOutput: `Pad ${note}: mode ${mode}`
      });
      setTimeout(() => set({ midiOutputActive: false }), 100);
    },

    parseEncoder: (cc, value) => {
      return HardwareService.parseRelativeCC(cc, value);
    },
  })),
);
