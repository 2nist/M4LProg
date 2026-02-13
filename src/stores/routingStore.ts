import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getAdapterById } from "@services/output/OutputAdapters";
import type { ModeId } from "@/types/arrangement";

export type RoutingKey =
  | "oscOutRoute"
  | "midiOutRoute"
  | "jsonExportRoute"
  | "midiExportRoute";

interface RoutingState {
  oscOutRoute: string;
  midiOutRoute: string;
  midiOutDeviceId: string | null;
  midiOutChannel: number;
  modeDefaultChannels: Record<ModeId, number>;
  midiOutPulseAt: number;
  midiLastSignal: string;
  midiLastSignalAt: number;
  connectionEvents: Array<{ id: string; at: number; source: string; message: string }>;
  showHeaderConnectionCards: boolean;
  jsonExportRoute: string;
  midiExportRoute: string;
  setRoute: (key: RoutingKey, routeId: string) => void;
  setMidiOutDeviceId: (deviceId: string | null) => void;
  setMidiOutChannel: (channel: number) => void;
  setModeDefaultChannel: (mode: ModeId, channel: number) => void;
  pulseMidiOut: () => void;
  setMidiOutSignal: (signal: string) => void;
  pushConnectionEvent: (source: string, message: string) => void;
  clearConnectionEvents: () => void;
  setShowHeaderConnectionCards: (show: boolean) => void;
}

const defaults = {
  oscOutRoute: "live-osc",
  midiOutRoute: "webmidi-out",
  midiOutDeviceId: null as string | null,
  midiOutChannel: 1,
  modeDefaultChannels: {
    harmony: 1,
    drum: 10,
    other: 2,
  } as Record<ModeId, number>,
  midiOutPulseAt: 0,
  midiLastSignal: "idle",
  midiLastSignalAt: 0,
  connectionEvents: [],
  showHeaderConnectionCards: true,
  jsonExportRoute: "json-file",
  midiExportRoute: "midi-file",
};

export const useRoutingStore = create<RoutingState>()(
  persist(
    (set) => ({
      ...defaults,
      setRoute: (key: RoutingKey, routeId: string) => {
        // Keep existing value if adapter id is invalid
        if (!getAdapterById(routeId)) return;
        set({ [key]: routeId } as Partial<RoutingState>);
      },
      setMidiOutDeviceId: (deviceId: string | null) => {
        set({ midiOutDeviceId: deviceId });
      },
      setMidiOutChannel: (channel: number) => {
        const safe = Math.max(1, Math.min(16, Math.floor(channel || 1)));
        set({ midiOutChannel: safe });
      },
      setModeDefaultChannel: (mode: ModeId, channel: number) => {
        const safe = Math.max(1, Math.min(16, Math.floor(channel || 1)));
        set((state) => ({
          modeDefaultChannels: {
            ...state.modeDefaultChannels,
            [mode]: safe,
          },
        }));
      },
      pulseMidiOut: () => {
        set({ midiOutPulseAt: Date.now() });
      },
      setMidiOutSignal: (signal: string) => {
        const now = Date.now();
        set((state) => ({
          midiLastSignal: signal,
          midiLastSignalAt: now,
          connectionEvents: [
            {
              id: `evt-${now}-${Math.random().toString(36).slice(2, 8)}`,
              at: now,
              source: "midi",
              message: signal,
            },
            ...state.connectionEvents,
          ].slice(0, 40),
        }));
      },
      pushConnectionEvent: (source: string, message: string) => {
        const now = Date.now();
        set((state) => ({
          connectionEvents: [
            {
              id: `evt-${now}-${Math.random().toString(36).slice(2, 8)}`,
              at: now,
              source,
              message,
            },
            ...state.connectionEvents,
          ].slice(0, 40),
        }));
      },
      clearConnectionEvents: () => {
        set({ connectionEvents: [] });
      },
      setShowHeaderConnectionCards: (show: boolean) => {
        set({ showHeaderConnectionCards: !!show });
      },
    }),
    {
      name: "routing-storage",
    },
  ),
);
