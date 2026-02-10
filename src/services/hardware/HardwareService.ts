import { WebMidi } from "webmidi";

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

let output: any = null;
let input: any = null;

/**
 * Initialize Web MIDI Access
 * Must be called after user interaction (button click)
 */
export async function initializeMIDIAccess(): Promise<boolean> {
  try {
    await WebMidi.enable({ sysex: true });

    console.log("SysEx enabled:", WebMidi.sysexEnabled);
    console.log("Note: SysEx permission is required for display updates and native mode. Enable it in the browser MIDI prompt.");

    // Find ATOM SQ ports (or use first available)
    const outputs = WebMidi.outputs;
    const inputs = WebMidi.inputs;

    // Look for ATOM SQ in port names
    output = outputs.find((port) => port.name?.includes("ATOM")) || outputs[0];
    input = inputs.find((port) => port.name?.includes("ATOM")) || inputs[0];

    if (!output) {
      console.warn("⚠️ No MIDI output found. Connect ATOM SQ and refresh.");
      return false;
    }

    console.log("✅ MIDI initialized:", {
      output: output.name,
      input: input?.name,
    });

    return true;
  } catch (error) {
    console.warn(
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
  if (!output) {
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
  if (!output) {
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
    // Handle special character placeholders in string
    let processedContent = content;
    // Replace ♪ with note icon byte (as string for mapping)
    processedContent = processedContent.replace(
      /♪/g,
      String.fromCharCode(NOTE_ICON_BYTE),
    );
    textBytes = processedContent.split("").map((c) => c.charCodeAt(0));
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
    console.warn("Failed to send display update:", error);
  }
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
  if (!output) {
    console.warn("MIDI output not available");
    return;
  }

  output.send([0x90, note, mode]); // Ch 1 Note On
}

/**
 * Set up MIDI input listener
 * @param onMessage - Callback for incoming MIDI messages
 */
export function setupMIDIInput(onMessage: (data: any) => void): void {
  if (!input) {
    console.warn("MIDI input not available");
    return;
  }

  input.addListener("midimessage", (e: any) => {
    onMessage(e.message);
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

/**
 * Select specific MIDI ports
 */
export function selectMIDIPorts(inputId?: string, outputId?: string): void {
  if (inputId) {
    input = WebMidi.getInputById(inputId);
  }
  if (outputId) {
    output = WebMidi.getOutputById(outputId);
  }
}
