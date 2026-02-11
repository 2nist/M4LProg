import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import * as OSCService from "../services/live/OSCService";
import { OSC_ADDRESSES } from "../types/osc";

interface Track {
  index: number;
  name: string;
  color: number;
}

interface TransportState {
  isPlaying: boolean;
  currentBeat: number;
  tempo: number;
}

interface LiveState {
  // Connection state
  isConnected: boolean;

  // Transport state
  transport: TransportState;

  // Track state
  tracks: Track[];
  selectedTrackIndex: number;

  // Actions
  initializeOSC: () => Promise<boolean>;
  createProgression: (
    progression: Array<{ notes: number[]; duration: number }>,
    trackIndex?: number,
    startBeat?: number,
  ) => void;
  requestTransportState: () => void;
  requestTrackList: () => void;
  setTempo: (tempo: number) => void;
  selectTrack: (index: number) => void;
  disconnect: () => void;
  
  // Transport controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  jumpByBars: (bars: number) => void;
  jumpToBeat: (beat: number) => void;
}

export const useLiveStore = create<LiveState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    transport: {
      isPlaying: false,
      currentBeat: 0,
      tempo: 120,
    },
    tracks: [],
    selectedTrackIndex: 0,

    // Actions
    initializeOSC: async () => {
      const connected = await OSCService.initializeOSC();

      if (connected) {
        // Set up message handlers
        OSCService.onOSCMessage(OSC_ADDRESSES.TRANSPORT_UPDATE, (args: any) => {
          set({
            transport: {
              isPlaying: args[0] === 1,
              currentBeat: args[1],
              tempo: args[2],
            },
          });
        });

        OSCService.onOSCMessage(OSC_ADDRESSES.TRACK_INFO, (args: any) => {
          const trackIndex = args[0];
          const trackName = args[1];
          const trackColor = args[2];

          set((state) => {
            const updatedTracks = [...state.tracks];
            const existingIndex = updatedTracks.findIndex(
              (t) => t.index === trackIndex,
            );

            if (existingIndex >= 0) {
              updatedTracks[existingIndex] = {
                index: trackIndex,
                name: trackName,
                color: trackColor,
              };
            } else {
              updatedTracks.push({
                index: trackIndex,
                name: trackName,
                color: trackColor,
              });
            }

            return { tracks: updatedTracks };
          });
        });

        OSCService.onOSCMessage(OSC_ADDRESSES.RESPONSE, (args: any) => {
          const success = args[0] === 1;
          const message = args[1];
          console.log("Live Response:", success ? "Success" : "Error", message);
        });

        OSCService.onOSCMessage(OSC_ADDRESSES.ERROR, (args: any) => {
          const errorMessage = args[0];
          console.error("Live Error:", errorMessage);
        });

        // Request initial state
        OSCService.requestTransportState();
        OSCService.requestTrackList();

        set({ isConnected: true });
      }

      return connected;
    },

    createProgression: (progression, trackIndex, startBeat) => {
      const { selectedTrackIndex } = get();
      OSCService.createProgression(
        progression,
        trackIndex ?? selectedTrackIndex,
        startBeat,
      );
    },

    requestTransportState: () => {
      OSCService.requestTransportState();
    },

    requestTrackList: () => {
      OSCService.requestTrackList();
    },

    setTempo: (tempo) => {
      OSCService.setTempo(tempo);
      set((state) => ({
        transport: { ...state.transport, tempo },
      }));
    },

    selectTrack: (index) => {
      set({ selectedTrackIndex: index });
    },

    disconnect: () => {
      OSCService.closeOSC();
      set({
        isConnected: false,
        tracks: [],
      });
    },
    
    // Transport controls
    play: () => {
      // Update local transport state immediately for offline/dev mode
      set((state) => ({ transport: { ...state.transport, isPlaying: true } }));
      if (OSCService.isOSCConnected()) {
        OSCService.play();
      }
    },

    pause: () => {
      set((state) => ({ transport: { ...state.transport, isPlaying: false } }));
      if (OSCService.isOSCConnected()) {
        OSCService.pause();
      }
    },

    stop: () => {
      set((state) => ({ transport: { ...state.transport, isPlaying: false, currentBeat: 0 } }));
      if (OSCService.isOSCConnected()) {
        OSCService.stop();
      }
    },

    jumpByBars: (bars: number) => {
      if (OSCService.isOSCConnected()) {
        OSCService.jumpByBars(bars);
      } else {
        // adjust currentBeat locally (assume 4 beats per bar)
        set((state) => ({ transport: { ...state.transport, currentBeat: Math.max(0, state.transport.currentBeat + bars * 4) } }));
      }
    },

    jumpToBeat: (beat: number) => {
      if (OSCService.isOSCConnected()) {
        OSCService.jumpToBeat(beat);
      } else {
        set((state) => ({ transport: { ...state.transport, currentBeat: Math.max(0, beat) } }));
      }
    },
  })),
);
