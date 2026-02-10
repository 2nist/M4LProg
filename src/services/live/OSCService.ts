/**
 * OSC Service for Ableton Live Communication
 * Bidirectional OSC messaging between Electron and M4L helper device
 */

// Use require for osc to avoid missing declaration issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const oscAny: any = require("osc");
import { OSC_ADDRESSES, OSCNote } from "../../types/osc";

// Default ports (configurable)
const DEFAULT_SEND_PORT = 11000; // Electron → Max
const DEFAULT_RECEIVE_PORT = 11001; // Max → Electron

let udpPort: any = null;
let isConnected = false;
let messageHandlers: Map<string, ((msg: any) => void)[]> = new Map();

/**
 * Initialize OSC communication
 */
export function initializeOSC(
  sendPort: number = DEFAULT_SEND_PORT,
  receivePort: number = DEFAULT_RECEIVE_PORT,
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      udpPort = new oscAny.UDPPort({
        localAddress: "127.0.0.1",
        localPort: receivePort,
        remoteAddress: "127.0.0.1",
        remotePort: sendPort,
        metadata: true,
      });

      udpPort.on("ready", () => {
        console.log("OSC Server ready on port", receivePort);
        isConnected = true;

        // Send handshake
        sendHandshake();
        resolve(true);
      });

      udpPort.on("message", (oscMsg: any) => {
        handleIncomingMessage(oscMsg);
      });

      udpPort.on("error", (error: any) => {
        console.error("OSC Error:", error);
        isConnected = false;
        resolve(false);
      });

      udpPort.open();
    } catch (error) {
      console.error("Failed to initialize OSC:", error);
      resolve(false);
    }
  });
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
function handleIncomingMessage(oscMsg: any): void {
  const address = oscMsg.address;
  const args = oscMsg.args;

  console.log("OSC Received:", address, args);

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
 * Send OSC message
 */
function sendOSCMessage(address: string, args: any): void {
  if (!udpPort || !isConnected) {
    console.warn("OSC not connected");
    return;
  }

  const oscMsg: any = {
    address,
    args: Array.isArray(args) ? args : [args],
  };

  if (udpPort && typeof udpPort.send === "function") {
    udpPort.send(oscMsg);
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
 * Close OSC connection
 */
export function closeOSC(): void {
  if (udpPort) {
    udpPort.close();
    udpPort = null;
    isConnected = false;
  }
}

/**
 * Get connection status
 */
export function isOSCConnected(): boolean {
  return isConnected;
}

/**
 * Send raw OSC message (for advanced use)
 */
export function sendRawOSC(address: string, ...args: any[]): void {
  sendOSCMessage(address, args);
}
