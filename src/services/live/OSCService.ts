/**
 * OSC Service for Ableton Live Communication (Renderer Process)
 * Communicates with main process via IPC for OSC messaging
 */

import { OSC_ADDRESSES, OSCNote } from "../../types/osc";

// Transport abstraction to decouple from window.electronAPI
export interface OSCTransport {
  sendOSC: (address: string, args: any[]) => Promise<void> | void;
  onOSCMessage: (cb: (message: any) => void) => void;
}

let injectedTransport: OSCTransport | null = null;

// Message handlers storage
let messageHandlers: Map<string, ((msg: any) => void)[]> = new Map();
let isInitialized = false;

/**
 * Initialize OSC communication
 */
export async function initializeOSC(
  transport?: OSCTransport | null,
  _sendPort: number = 11000,
  _receivePort: number = 11001,
): Promise<boolean> {
  if (isInitialized) {
    return true;
  }

  try {
    // If a transport was provided, store it and use it, otherwise fallback to window.electronAPI
    if (transport) {
      injectedTransport = transport;
      injectedTransport.onOSCMessage((message: any) => handleIncomingMessage(message));
      await injectedTransport.sendOSC("/chordgen/initialize", []);
    } else {
      // Set up message receiver from main process
      window.electronAPI.onOSCMessage((message: any) => {
        handleIncomingMessage(message);
      });

      // Initialize in main process
      await window.electronAPI.sendOSC("/chordgen/initialize", []);
    }

    isInitialized = true;
    console.log("[OSC Renderer] Initialized successfully");

    // Send handshake
    sendHandshake();

    return isInitialized;
  } catch (error) {
    console.error("[OSC Renderer] Failed to initialize:", error);
    return false;
  }
}

/**
 * Send handshake to M4L helper
 */
function sendHandshake(): void {
  sendOSCMessage(OSC_ADDRESSES.HANDSHAKE, {
    version: "1.0.0",
    clientId: "chordgen-pro",
  });
}

/**
 * Handle incoming OSC messages
 */
function handleIncomingMessage(oscMsg: { address: string; args: any[] }): void {
  const { address, args } = oscMsg;

  console.log("[OSC Renderer] Received:", address, args);

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
export function onOSCMessage(
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
function sendOSCMessage(address: string, args: any): void {
  if (!isInitialized) {
    console.warn("[OSC Renderer] Not initialized");
    return;
  }

  try {
    const argsArray = Array.isArray(args) ? args : [args];
    if (injectedTransport) {
      injectedTransport.sendOSC(address, argsArray);
    } else {
      window.electronAPI.sendOSC(address, argsArray);
    }
  } catch (error) {
    console.error("[OSC Renderer] Send failed:", error);
  }
}

/**
 * Create progression in Live
 */
export function createProgression(
  progression: Array<{ notes: number[]; duration: number }>,
  trackIndex: number = 0,
  startBeat?: number,
): void {
  // Convert progression to flat note list
  const notes: OSCNote[] = [];
  let currentBeat = 0;

  progression.forEach((chord) => {
    chord.notes.forEach((pitch) => {
      notes.push({
        pitch,
        startTime: currentBeat,
        duration: chord.duration,
        velocity: 100,
      });
    });
    currentBeat += chord.duration;
  });

  sendOSCMessage(OSC_ADDRESSES.CREATE_PROGRESSION, {
    trackIndex,
    startBeat: startBeat ?? -1, // -1 means "current position"
    notes,
  });
}

/**
 * Request transport state
 */
export function requestTransportState(): void {
  sendOSCMessage(OSC_ADDRESSES.GET_TRANSPORT, []);
}

/**
 * Request track list
 */
export function requestTrackList(): void {
  sendOSCMessage(OSC_ADDRESSES.GET_TRACKS, []);
}

/**
 * Set Live tempo
 */
export function setTempo(tempo: number): void {
  sendOSCMessage(OSC_ADDRESSES.SET_TEMPO, [tempo]);
}

/**
 * Play transport
 */
export function play(): void {
  sendOSCMessage(OSC_ADDRESSES.PLAY, []);
}

/**
 * Pause transport
 */
export function pause(): void {
  sendOSCMessage(OSC_ADDRESSES.PAUSE, []);
}

/**
 * Stop transport
 */
export function stop(): void {
  sendOSCMessage(OSC_ADDRESSES.STOP, []);
}

/**
 * Jump by bars (positive or negative)
 */
export function jumpByBars(bars: number): void {
  sendOSCMessage(OSC_ADDRESSES.JUMP_BY, [bars]);
}

/**
 * Jump to specific beat
 */
export function jumpToBeat(beat: number): void {
  sendOSCMessage(OSC_ADDRESSES.JUMP_TO, [beat]);
}

/**
 * Play a specific chord immediately (Preview)
 */
export function playChord(
  notes: number[],
  velocity: number = 100,
  duration: number = 500,
): void {
  sendOSCMessage("/chordgen/play_chord", {
    notes,
    velocity,
    duration,
  });
}

/**
 * Close OSC connection
 */
export function closeOSC(): void {
  if (isInitialized) {
    try {
      if (injectedTransport) {
        injectedTransport.sendOSC("/chordgen/close", []);
      } else {
        window.electronAPI.sendOSC("/chordgen/close", []);
      }
      isInitialized = false;
      messageHandlers.clear();
      console.log("[OSC Renderer] Connection closed");
    } catch (error) {
      console.error("[OSC Renderer] Close failed:", error);
    }
  }
}

/**
 * Get connection status
 */
export function isOSCConnected(): boolean {
  return isInitialized;
}

/**
 * Send raw OSC message (for advanced use)
 */
export function sendRawOSC(address: string, ...args: any[]): void {
  sendOSCMessage(address, args);
}
