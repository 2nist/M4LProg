import { WebMidi, Input, Output } from "webmidi";

/**
 * ATOM SQ Hardware Service
 * Web MIDI API implementation for ATOM SQ controller
 * Replaces Max/MSP Hardware Bridge with browser-based MIDI
 */

const NATIVE_MODE_HANDSHAKE = [0x8f, 0x00, 0x7f]; // Note Off, Note 0, Vel 127, Ch 16
const SYSEX_HEADER = [0xf0, 0x00, 0x01, 0x06, 0x22, 0x12];

// Special character bytes
export const NOTE_ICON_BYTE = 0x0b; // Musical note icon

// Encoder CC Mapping (14-21)
const ENCODER_BASE_CC = 14;

// Color Mapping for ATOM SQ (Standard Presonus Color Palette)
export const PAD_COLORS = {
  OFF: 0,
  RED: 5,
  ORANGE: 9,
  YELLOW: 13,
  LIME: 17,
  GREEN: 21,
  TEAL: 29,
  CYAN: 33,
  BLUE: 45,
  PURPLE: 53,
  MAGENTA: 57,
  PINK: 61,
  WHITE: 127,

  // Semantic Mappings
  PLAYING: 21, // Green
  SELECTED: 127, // White
  ROOT: 45, // Blue
  IN_KEY: 5, // Red (Dim)
  OUT_OF_KEY: 0, // Off
} as const;

let output: Output | null = null;
let input: Input | null = null;

/**
 * Initialize Web MIDI Access
 * Must be called after user interaction (button click)
 */
export async function initializeMIDIAccess(): Promise<boolean> {
  try {
    if (!WebMidi.enabled || !WebMidi.sysexEnabled) {
      await WebMidi.enable({ sysex: true });
    }

    console.log("SysEx enabled:", WebMidi.sysexEnabled);
    console.log(
      "Note: SysEx permission is required for display updates and native mode. Enable it in the browser MIDI prompt.",
    );

    // Find ATOM SQ ports (or use first available)
    const outputs = WebMidi.outputs;
    const inputs = WebMidi.inputs;

    // Look for ATOM SQ in port names
    output = outputs.find((port) => port.name.includes("ATOM")) || outputs[0];
    input = inputs.find((port) => port.name.includes("ATOM")) || inputs[0];

    if (!output) {
      console.warn(
        "Available MIDI Outputs:",
        outputs.map((p) => p.name),
      );
      console.warn("ATOM SQ not found. MIDI features disabled.");
      return false;
    }

    console.log("✅ MIDI initialized:", {
      output: output.name,
      input: input?.name,
    });

    return true;
  } catch (error) {
    console.error(
      "⚠️ MIDI not available:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}

/**
 * Initialize Native Mode
 * Should be called after MIDI access is granted
 */
export function initializeNativeMode(): void {
  if (!output || output.state !== "connected") {
    console.warn("MIDI output not available");
    return;
  }

  if (!WebMidi.sysexEnabled) {
    console.warn("SysEx not enabled, skipping native mode");
    return;
  }

  // Send MIDI bytes to the controller
  try {
    output.send(NATIVE_MODE_HANDSHAKE);
    console.log("🤝 Native Mode Handshake sent");
  } catch (error) {
    console.warn("Failed to send native mode handshake:", error);
  }
  updateDisplay(0, "CHORD GEN", [127, 255, 127]); // Green title
}

/**
 * Update ATOM SQ LCD Screen
 * @param line - Target text field (0-4 typical)
 * @param content - ASCII string or array of byte values for special characters
 * @param rgb - [r, g, b] 0-127
 */
export function updateDisplay(
  line: number,
  content: string | number[],
  rgb: [number, number, number] = [127, 127, 127],
): void {
  if (!output || output.state !== "connected") {
    console.warn("MIDI output not available");
    return;
  }

  if (!WebMidi.sysexEnabled) {
    console.warn("SysEx not enabled, skipping display update");
    return;
  }

  let textBytes: number[];
  if (Array.isArray(content)) {
    textBytes = content;
  } else {
    textBytes = to7BitAscii(content);
  }

  const alignment = 0x01; // Center
  const msg = [
    ...SYSEX_HEADER,
    line,
    rgb[0],
    rgb[1],
    rgb[2],
    alignment,
    ...textBytes,
    0xf7,
  ];

  try {
    output.send(msg);
  } catch (error) {
    console.error("Failed to send display update:", error);
  }
}

/**
 * Convert string to 7-bit ASCII bytes for SysEx
 * Handles special characters and clamping
 */
function to7BitAscii(text: string): number[] {
  // Replace known special characters
  const processed = text.replace(/♪/g, String.fromCharCode(NOTE_ICON_BYTE));

  return processed.split("").map((char) => {
    const code = char.charCodeAt(0);
    // Ensure 7-bit range (0-127)
    return code > 127 ? 63 : code; // Replace invalid chars with '?'
  });
}

/**
 * Parse Relative Encoders
 * Sign-bit relative: 1,2,3 (CW) | 127,126,125 (CCW)
 */
export function parseRelativeCC(
  cc: number,
  value: number,
): { encoderIndex: number; delta: number } {
  let delta = 0;
  // ATOM SQ uses relative binary offset (Two's Complement 7-bit)
  // 0-63: Positive (+0 to +63)
  // 64-127: Negative (-64 to -1)
  if (value <= 64) {
    delta = value; // Positive increment
  } else {
    delta = value - 128; // Negative decrement
  }

  const encoderIndex = cc - ENCODER_BASE_CC;
  return { encoderIndex, delta };
}

/**
 * Set Pad Color
 * @param note - 36-67
 * @param mode - 0: Off, 1: Blink, 2: Pulse, 127: Solid
 */
export function setPadState(note: number, mode: number): void {
  if (!output || output.state !== "connected") {
    console.warn("MIDI output not available");
    return;
  }

  try {
    output.send([0x90, note, mode]); // Ch 1 Note On
  } catch (error) {
    console.error(`Failed to set pad state for note ${note}:`, error);
  }
}

/**
 * Set up MIDI input listener
 * @param onMessage - Callback for incoming MIDI messages
 */
export function setupMIDIInput(onMessage: (data: any) => void): void {
  if (!input || input.state !== "connected") {
    console.warn("MIDI input not available");
    return;
  }

  // Remove existing listeners to prevent duplicates
  input.removeListener("midimessage");

  input.addListener("midimessage", (e) => {
    // Pass the raw data array (Uint8Array)
    if (e.message && e.message.data) {
      onMessage(e.message.data);
    }
  });
}

/**
 * Get available MIDI ports
 */
export function getMIDIPorts(): {
  inputs: any[];
  outputs: any[];
} {
  return {
    inputs: WebMidi.inputs,
    outputs: WebMidi.outputs,
  };
}

export function selectMIDIPorts(inputId?: string, outputId?: string): void {
  if (inputId) {
    input = WebMidi.getInputById(inputId) || null;
  }
  if (outputId) {
    output = WebMidi.getOutputById(outputId) || null;
  }
}

/**
 * Clean up MIDI listeners and references
 */
export function disconnect(): void {
  if (input) {
    input.removeListener("midimessage");
    input = null;
  }
  output = null;
}
