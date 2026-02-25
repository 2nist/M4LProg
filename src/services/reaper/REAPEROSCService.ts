ave in case we==================**
 * REAPER OSC Service for REAPER DAW Communication (Renderer Process)
 * Communicates with main process via IPC for OSC messaging to REAPER
 *
 * REAPER OSC Reference: https://www.reaper.fm/sdk/osc/osc.php
 */

import {
  REAPER_OSC_ADDRESSES,
  REAPERNote,
  type REAPERTransportState,
  type REAPERTrack,
  getTrackAddress,
} from "../../types/osc-reaper";

// Transport abstraction to decouple from window.electronAPI
export interface REAPEROSCTransport {
  sendREAPEROSC: (address: string, args: any[]) => Promise<void> | void;
  onREAPEROSCMessage: (cb: (message: any) => void) => (() => void) | void;
  initializeREAPEROSC?: (
    sendPort?: number,
    receivePort?: number,
  ) => Promise<boolean>;
  reconnectREAPEROSC?: () => Promise<boolean>;
  closeREAPEROSC?: () => Promise<void> | void;
  getREAPEROSCHealth?: () => Promise<REAPEROSCHealthSnapshot>;
}

let injectedTransport: REAPEROSCTransport | null = null;
let unsubscribeFromMessages: (() => void) | null = null;

// Message handlers storage
let messageHandlers: Map<string, ((msg: any) => void)[]> = new Map();
let isInitialized = false;

// Default REAPER OSC ports (different from Ableton Live)
const DEFAULT_REAPER_SEND_PORT = 11002; // Electron → REAPER
const DEFAULT_REAPER_RECEIVE_PORT = 11003; // REAPER → Electron

export interface REAPEROSCHealthSnapshot {
  status:
    | "idle"
    | "connecting"
    | "connected"
    | "degraded"
    | "retrying"
    | "error";
  isConnected: boolean;
  isStale: boolean;
  sendPort: number;
  receivePort: number;
  retryCount: number;
  nextRetryMs: number;
  lastMessageAt: number;
  lastError: string | null;
}

/**
 * Initialize REAPER OSC communication
 */
export async function initializeREAPEROSC(
  transport?: REAPEROSCTransport | null,
  sendPort: number = DEFAULT_REAPER_SEND_PORT,
  receivePort: number = DEFAULT_REAPER_RECEIVE_PORT,
): Promise<boolean> {
  if (isInitialized) {
    return true;
  }

  try {
    // If a transport was provided, store it and use it, otherwise fallback to window.electronAPI
    if (transport) {
      injectedTransport = transport;
      unsubscribeFromMessages = injectedTransport.onREAPEROSCMessage(
        (message: any) => handleIncomingMessage(message),
      ) as (() => void) | null;
      if (injectedTransport.initializeREAPEROSC) {
        const ok = await injectedTransport.initializeREAPEROSC(
          sendPort,
          receivePort,
        );
        if (!ok) return false;
      }
    } else {
      // Set up message receiver from main process
      unsubscribeFromMessages = window.electronAPI.onREAPEROSCMessage(
        (message: any) => {
          handleIncomingMessage(message);
        },
      );

      // Initialize in main process
      const ok = await window.electronAPI.initializeREAPEROSC(
        sendPort,
        receivePort,
      );
      if (!ok) return false;
    }

    isInitialized = true;
    console.log("[REAPER OSC] Initialized successfully");

    // Send handshake to verify connection
    sendHandshake();

    return isInitialized;
  } catch (error) {
    console.error("[REAPER OSC] Failed to initialize:", error);
    return false;
  }
}

/**
 * Send handshake to REAPER
 */
function sendHandshake(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.HELLO, ["ChordGenPro", "1.0.0"]);
}

/**
 * Handle incoming OSC messages from REAPER
 */
function handleIncomingMessage(oscMsg: { address: string; args: any[] }): void {
  const { address, args } = oscMsg;

  console.log("[REAPER OSC] Received:", address, args);

  // Call registered handlers
  const handlers = messageHandlers.get(address);
  if (handlers) {
    handlers.forEach((handler) => handler(args));
  }

  // Call wildcard handlers
  const wildcardHandlers = messageHandlers.get("*");
  if (wildcardHandlers) {
    wildcardHandlers.forEach((handler) => handler({ address, args }));
  }
}

/**
 * Register message handler for specific address
 */
export function onREAPEROSCMessage(
  address: string,
  handler: (msg: any) => void,
): () => void {
  if (!messageHandlers.has(address)) {
    messageHandlers.set(address, []);
  }
  messageHandlers.get(address)!.push(handler);

  // Return unsubscribe function
  return () => {
    const handlers = messageHandlers.get(address);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

/**
 * Send OSC message via main process
 */
function sendREAPEROSCMessage(address: string, args: any): void {
  if (!isInitialized) {
    console.warn("[REAPER OSC] Not initialized");
    return;
  }

  try {
    const argsArray = Array.isArray(args) ? args : [args];
    if (injectedTransport) {
      injectedTransport.sendREAPEROSC(address, argsArray);
    } else {
      window.electronAPI.sendREAPEROSC(address, argsArray);
    }
  } catch (error) {
    console.error("[REAPER OSC] Send failed:", error);
  }
}

// ==================== Transport Controls ====================

/**
 * Play transport in REAPER
 */
export function play(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.PLAY, []);
}

/**
 * Stop transport in REAPER
 */
export function stop(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.STOP, []);
}

/**
 * Pause transport in REAPER
 */
export function pause(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.PAUSE, []);
}

/**
 * Toggle play/pause in REAPER
 */
export function playPause(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.PLAY_PAUSE, []);
}

/**
 * Get current position from REAPER
 */
export function requestPosition(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.POSITION, []);
}

/**
 * Seek to position (in seconds)
 */
export function seekToPosition(position: number): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.POSITION_SEEK, [position]);
}

// ==================== Tempo & Time Signature ====================

/**
 * Get tempo from REAPER
 */
export function requestTempo(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.TEMPO, []);
}

/**
 * Set tempo in REAPER
 */
export function setTempo(tempo: number): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.TEMPO, [tempo]);
}

/**
 * Get time signature
 */
export function requestTimeSignature(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.TIME_SIGNATURE, []);
}

// ==================== Track Operations ====================

/**
 * Request track count
 */
export function requestTrackCount(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.TRACK_COUNT, []);
}

/**
 * Request track list
 */
export function requestTrackList(): void {
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.TRACK_LIST, []);
}

/**
 * Get track info
 */
export function requestTrackInfo(trackIndex: number): void {
  const address = getTrackAddress(REAPER_OSC_ADDRESSES.TRACK_GET, trackIndex);
  sendREAPEROSCMessage(address, []);
}

/**
 * Get track name
 */
export function requestTrackName(trackIndex: number): void {
  const address = getTrackAddress(REAPER_OSC_ADDRESSES.TRACK_NAME, trackIndex);
  sendREAPEROSCMessage(address, []);
}

/**
 * Set track mute
 */
export function setTrackMute(trackIndex: number, muted: boolean): void {
  const address = getTrackAddress(REAPER_OSC_ADDRESSES.TRACK_MUTE, trackIndex);
  sendREAPEROSCMessage(address, [muted ? 1 : 0]);
}

/**
 * Set track solo
 */
export function setTrackSolo(trackIndex: number, solo: boolean): void {
  const address = getTrackAddress(REAPER_OSC_ADDRESSES.TRACK_SOLO, trackIndex);
  sendREAPEROSCMessage(address, [solo ? 1 : 0]);
}

/**
 * Set track volume (0.0 to 1.0)
 */
export function setTrackVolume(trackIndex: number, volume: number): void {
  const address = getTrackAddress(
    REAPER_OSC_ADDRESSES.TRACK_VOLUME,
    trackIndex,
  );
  sendREAPEROSCMessage(address, [volume]);
}

/**
 * Set track pan (-1.0 to 1.0)
 */
export function setTrackPan(trackIndex: number, pan: number): void {
  const address = getTrackAddress(REAPER_OSC_ADDRESSES.TRACK_PAN, trackIndex);
  sendREAPEROSCMessage(address, [pan]);
}

// ==================== MIDI Item Creation ====================

/**
 * Add a new MIDI item to a track at a specific position
 * This uses ChordGen custom OSC command
 */
export function createMIDIItem(
  trackIndex: number,
  position: number, // in seconds
  notes: REAPERNote[],
): void {
  // Format: /chordgen/create_midi trackIndex position [noteCount pitch start duration velocity channel ...]
  const flatNotes: number[] = [];

  notes.forEach((note) => {
    flatNotes.push(
      note.pitch,
      note.startTime,
      note.duration,
      note.velocity,
      note.channel,
    );
  });

  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.CHORDGEN_CREATE_MIDI, [
    trackIndex,
    position,
    notes.length,
    ...flatNotes,
  ]);
}

/**
 * Create a chord progression in REAPER
 */
export function createProgression(
  trackIndex: number,
  startPosition: number, // in seconds
  progression: Array<{ notes: number[]; duration: number }>,
  options?: {
    velocity?: number;
    channel?: number;
    tempo?: number;
  },
): void {
  const velocity = options?.velocity ?? 100;
  const channel = options?.channel ?? 0;
  const tempo = options?.Tempo ?? 120;

  // Convert progression to REAPER notes
  const reaperNotes: REAPERNote[] = [];
  let currentTime = startPosition;

  // Convert beats to seconds based on tempo
  const beatsToSeconds = 60 / tempo;

  progression.forEach((chord) => {
    chord.notes.forEach((pitch) => {
      reaperNotes.push({
        pitch,
        startTime: currentTime,
        duration: chord.duration * beatsToSeconds,
        velocity,
        channel,
      });
    });
    currentTime += chord.duration * beatsToSeconds;
  });

  createMIDIItem(trackIndex, startPosition, reaperNotes);
}

/**
 * Play a chord preview note
 */
export function playChord(
  notes: number[],
  velocity: number = 100,
  duration: number = 500,
  channel: number = 0,
): void {
  // Send as list of notes
  sendREAPEROSCMessage(REAPER_OSC_ADDRESSES.CHORDGEN_PLAY_NOTE, [
    notes.length,
    ...notes,
    velocity,
    duration,
    channel,
  ]);
}

// ==================== Connection Management ====================

/**
 * Close REAPER OSC connection
 */
export function closeREAPEROSC(): void {
  if (isInitialized) {
    try {
      if (injectedTransport) {
        if (injectedTransport.closeREAPEROSC) {
          injectedTransport.closeREAPEROSC();
        } else {
          injectedTransport.sendREAPEROSC("/chordgen/reaper_close", []);
        }
      } else {
        window.electronAPI.closeREAPEROSC();
      }
      unsubscribeFromMessages?.();
      unsubscribeFromMessages = null;
      isInitialized = false;
      messageHandlers.clear();
      console.log("[REAPER OSC] Connection closed");
    } catch (error) {
      console.error("[REAPER OSC] Close failed:", error);
    }
  }
}

/**
 * Get connection status
 */
export function isREAPEROSCConnected(): boolean {
  return isInitialized;
}

/**
 * Reconnect to REAPER
 */
export async function reconnectREAPEROSC(): Promise<boolean> {
  try {
    if (injectedTransport?.reconnectREAPEROSC) {
      return await injectedTransport.reconnectREAPEROSC();
    }
    return await window.electronAPI.reconnectREAPEROSC();
  } catch (error) {
    console.error("[REAPER OSC] Reconnect failed:", error);
    return false;
  }
}

/**
 * Get health/status
 */
export async function getREAPEROSCHealth(): Promise<REAPEROSCHealthSnapshot> {
  try {
    if (injectedTransport?.getREAPEROSCHealth) {
      return await injectedTransport.getREAPEROSCHealth();
    }
    return await window.electronAPI.getREAPEROSCHealth();
  } catch (error) {
    console.error("[REAPER OSC] Health read failed:", error);
    return {
      status: isInitialized ? "connected" : "idle",
      isConnected: isInitialized,
      isStale: false,
      sendPort: DEFAULT_REAPER_SEND_PORT,
      receivePort: DEFAULT_REAPER_RECEIVE_PORT,
      retryCount: 0,
      nextRetryMs: 500,
      lastMessageAt: 0,
      lastError: error instanceof Error ? error.message : "unknown",
    };
  }
}

/**
 * Send raw OSC message (for advanced use)
 */
export function sendRawOSC(address: string, ...args: any[]): void {
  sendREAPEROSCMessage(address, args);
}
