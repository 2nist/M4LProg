/**
 * ATOM SQ Hardware Bridge
 * Handles Native Mode handshake, SysEx Display updates, and Encoder parsing.
 */

const NATIVE_MODE_HANDSHAKE = [0x8F, 0x00, 0x7F]; // Note Off, Note 0, Vel 127, Ch 16
const SYSEX_HEADER = [0xF0, 0x00, 0x01, 0x06, 0x22, 0x12];

// Special character bytes
const NOTE_ICON_BYTE = 0x0B; // Musical note icon

// Encoder CC Mapping (14-21)
const ENCODER_BASE_CC = 14;

/**
 * Initialize Native Mode
 * Should be called via live.thisdevice 'loadbang'
 */
function initializeNativeMode() {
    // Send MIDI bytes to the controller
    // In Max v8, use max.outlet or specific midiout logic
    max.outlet("midi", ...NATIVE_MODE_HANDSHAKE);
    updateDisplay(0, "CHORD GEN", [127, 255, 127]); // Green title
}

/**
 * Update ATOM SQ LCD Screen
 * @param {number} line - Target text field (0-4 typical)
 * @param {string|Array<number>} content - ASCII string or array of byte values for special characters
 * @param {Array<number>} rgb - [r, g, b] 0-127
 */
function updateDisplay(line, content, rgb = [127, 127, 127]) {
    let textBytes;
    if (Array.isArray(content)) {
        textBytes = content;
    } else {
        // Handle special character placeholders in string
        let processedContent = content;
        // Replace ♪ with note icon byte (as string for mapping)
        processedContent = processedContent.replace(/♪/g, String.fromCharCode(NOTE_ICON_BYTE));
        textBytes = processedContent.split('').map(c => c.charCodeAt(0));
    }
    
    const alignment = 0x01; // Center
    const msg = [
        ...SYSEX_HEADER,
        line,
        rgb[0], rgb[1], rgb[2],
        alignment,
        ...textBytes,
        0xF7
    ];
    max.outlet("sysex", ...msg);
}

/**
 * Parse Relative Encoders
 * Sign-bit relative: 1,2,3 (CW) | 127,126,125 (CCW)
 */
function parseRelativeCC(cc, value) {
    let delta = 0;
    if (value <= 64) {
        delta = value; // Positive increment
    } else {
        delta = value - 128; // Negative decrement
    }
    
    const encoderIndex = cc - ENCODER_BASE_CC;
    max.outlet("encoder_delta", encoderIndex, delta);
}

/**
 * Set Pad Color
 * @param {number} note - 36-67
 * @param {number} mode - 0: Off, 1: Blink, 2: Pulse, 127: Solid
 */
function setPadState(note, mode) {
    max.outlet("midi", 0x90, note, mode); // Ch 1 Note On
}

exports.initializeNativeMode = initializeNativeMode;
exports.updateDisplay = updateDisplay;
exports.parseRelativeCC = parseRelativeCC;
exports.setPadState = setPadState;
exports.NOTE_ICON_BYTE = NOTE_ICON_BYTE;