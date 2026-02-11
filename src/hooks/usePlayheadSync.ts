import { useEffect, useRef, useState, useCallback } from "react";
import { useLiveStore } from "../stores/liveStore";

interface UsePlayheadSyncOpts {
  pixelsPerBeat?: number;
  totalBeats?: number;
}

export function usePlayheadSync(opts: UsePlayheadSyncOpts = {}) {
  const { pixelsPerBeat = 40, totalBeats = 0 } = opts;

  // Subscribe to live store transport and connection status
  const transport = useLiveStore((s: any) => s.transport);
  const isConnected = useLiveStore((s: any) => s.isConnected);

  // Mock clock state for offline/dev mode
  const [mockPlaying, setMockPlaying] = useState(false);
  const [mockBeat, setMockBeat] = useState<number>(0);

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const stopMock = useCallback(() => {
    setMockPlaying(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  const startMock = useCallback(() => {
    if (isConnected) return; // don't start mock when connected
    setMockPlaying(true);

    if (rafRef.current) return; // already running

    const step = (time: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current; // ms
      lastTimeRef.current = time;

      // tempo is beats per minute
      const tempo = transport?.tempo || 120;
      const beatsPerMs = tempo / 60000; // beats per millisecond
      const deltaBeats = dt * beatsPerMs;

      setMockBeat((b) => {
        const next = b + deltaBeats;
        if (totalBeats > 0) return next % totalBeats;
        return next;
      });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [isConnected, transport, totalBeats]);

  // Stop mock if connection becomes live
  useEffect(() => {
    if (isConnected && mockPlaying) {
      stopMock();
    }
  }, [isConnected, mockPlaying, stopMock]);

  // Expose current beat and playing status
  const currentBeat = isConnected ? transport.currentBeat : mockBeat;
  const isPlaying = isConnected ? transport.isPlaying : mockPlaying;

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
    mockActive: mockPlaying,
  };
}

export default usePlayheadSync;
