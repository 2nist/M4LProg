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
  connectionStatus: "idle" | "connecting" | "connected" | "degraded" | "retrying" | "error";
  isConnectionStale: boolean;
  lastError: string | null;
  lastMessageAt: number;
  retryCount: number;
  sendPort: number;
  receivePort: number;

  // Transport state
  transport: TransportState;

  // Track state
  tracks: Track[];
  selectedTrackIndex: number;

  // Actions
  initializeOSC: () => Promise<boolean>;
  reconnectOSC: () => Promise<boolean>;
  refreshConnectionHealth: () => Promise<void>;
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

let handlersInitialized = false;
let healthPollTimer: ReturnType<typeof setInterval> | null = null;

export const useLiveStore = create<LiveState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    connectionStatus: "idle",
    isConnectionStale: false,
    lastError: null,
    lastMessageAt: 0,
    retryCount: 0,
    sendPort: 11000,
    receivePort: 11001,
    transport: {
      isPlaying: false,
      currentBeat: 0,
      tempo: 120,
    },
    tracks: [],
    selectedTrackIndex: 0,

    // Actions
    initializeOSC: async () => {
      set({ connectionStatus: "connecting", lastError: null });
      const connected = await OSCService.initializeOSC();

      if (connected) {
        // Set up message handlers once
        if (!handlersInitialized) {
          OSCService.onOSCMessage(OSC_ADDRESSES.TRANSPORT_UPDATE, (args: any) => {
            set({
              transport: {
                isPlaying: args[0] === 1,
                currentBeat: args[1],
                tempo: args[2],
              },
              lastMessageAt: Date.now(),
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

              return { tracks: updatedTracks, lastMessageAt: Date.now() };
            });
          });

          OSCService.onOSCMessage(OSC_ADDRESSES.RESPONSE, (args: any) => {
            const success = args[0] === 1;
            const message = args[1];
            console.log("Live Response:", success ? "Success" : "Error", message);
            set({ lastMessageAt: Date.now() });
          });

          OSCService.onOSCMessage(OSC_ADDRESSES.ERROR, (args: any) => {
            const errorMessage = args[0];
            console.error("Live Error:", errorMessage);
            set({ lastError: String(errorMessage), lastMessageAt: Date.now() });
          });

          handlersInitialized = true;
        }

        // Request initial state
        OSCService.requestTransportState();
        OSCService.requestTrackList();
        await get().refreshConnectionHealth();
        if (!healthPollTimer) {
          healthPollTimer = setInterval(() => {
            useLiveStore.getState().refreshConnectionHealth().catch(() => undefined);
          }, 1000);
        }
      } else {
        set({
          isConnected: false,
          connectionStatus: "error",
          lastError: "OSC initialization failed",
        });
      }

      return connected;
    },

    reconnectOSC: async () => {
      const ok = await OSCService.reconnectOSC();
      if (ok) {
        await get().refreshConnectionHealth();
        OSCService.requestTransportState();
        OSCService.requestTrackList();
      } else {
        set({ connectionStatus: "error", lastError: "OSC reconnect failed" });
      }
      return ok;
    },

    refreshConnectionHealth: async () => {
      const health = await OSCService.getOSCHealth();
      set({
        isConnected: health.status === "connected" || health.status === "degraded",
        connectionStatus: health.status,
        isConnectionStale: health.isStale,
        lastError: health.lastError,
        lastMessageAt: health.lastMessageAt,
        retryCount: health.retryCount,
        sendPort: health.sendPort,
        receivePort: health.receivePort,
      });
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
      if (healthPollTimer) {
        clearInterval(healthPollTimer);
        healthPollTimer = null;
      }
      set({
        isConnected: false,
        connectionStatus: "idle",
        isConnectionStale: false,
        lastError: null,
        retryCount: 0,
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
