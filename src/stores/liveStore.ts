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
  })),
);
