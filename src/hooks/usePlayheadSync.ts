import { useEffect, useState, useCallback } from "react";
import { useLiveStore } from "../stores/liveStore";

interface UsePlayheadSyncOpts {
  pixelsPerBeat?: number;
  totalBeats?: number;
}

type MockSnapshot = { playing: boolean; beat: number };

const mockClock = {
  playing: false,
  beat: 0,
  rafId: null as number | null,
  lastTime: null as number | null,
  listeners: new Set<(snapshot: MockSnapshot) => void>(),
};

function publishMock() {
  const snapshot = { playing: mockClock.playing, beat: mockClock.beat };
  mockClock.listeners.forEach((listener) => listener(snapshot));
}

export function usePlayheadSync(opts: UsePlayheadSyncOpts = {}) {
  const { pixelsPerBeat = 40, totalBeats = 0 } = opts;

  // Subscribe to live store transport and connection status
  const transport = useLiveStore((s: any) => s.transport);
  const isConnected = useLiveStore((s: any) => s.isConnected);

  const [mockState, setMockState] = useState<MockSnapshot>({
    playing: mockClock.playing,
    beat: mockClock.beat,
  });

  useEffect(() => {
    const listener = (snapshot: MockSnapshot) => {
      setMockState(snapshot);
    };
    mockClock.listeners.add(listener);
    listener({ playing: mockClock.playing, beat: mockClock.beat });
    return () => {
      mockClock.listeners.delete(listener);
    };
  }, []);

  const stopMock = useCallback(() => {
    mockClock.playing = false;
    if (mockClock.rafId) {
      cancelAnimationFrame(mockClock.rafId);
      mockClock.rafId = null;
    }
    mockClock.lastTime = null;
    publishMock();
  }, []);

  const startMock = useCallback(() => {
    if (isConnected) return; // don't start mock when connected
    mockClock.playing = true;
    publishMock();

    if (mockClock.rafId) return; // already running

    const step = (time: number) => {
      if (!mockClock.playing) {
        mockClock.rafId = null;
        return;
      }
      if (mockClock.lastTime == null) mockClock.lastTime = time;
      const dt = time - mockClock.lastTime; // ms
      mockClock.lastTime = time;

      // tempo is beats per minute
      const tempo = useLiveStore.getState().transport?.tempo || 120;
      const beatsPerMs = tempo / 60000; // beats per millisecond
      const deltaBeats = dt * beatsPerMs;

      mockClock.beat += deltaBeats;
      publishMock();

      mockClock.rafId = requestAnimationFrame(step);
    };

    mockClock.rafId = requestAnimationFrame(step);
  }, [isConnected]);

  // Stop mock if connection becomes live
  useEffect(() => {
    if (isConnected && mockState.playing) {
      stopMock();
    }
  }, [isConnected, mockState.playing, stopMock]);

  // Expose current beat and playing status
  const currentBeat = isConnected ? transport.currentBeat : mockState.beat;
  const isPlaying = isConnected ? transport.isPlaying : mockState.playing;

  const playheadX =
    totalBeats > 0
      ? (currentBeat % totalBeats) * pixelsPerBeat
      : currentBeat * pixelsPerBeat;

  return {
    currentBeat,
    isPlaying,
    playheadX,
    startMock,
    stopMock,
    mockActive: mockState.playing,
  };
}

export default usePlayheadSync;
