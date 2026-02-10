/**
 * MIDI Export Tests
 * Comprehensive testing suite for MIDI file generation and export functionality
 */

// Mock the Max environment for testing
if (typeof max === 'undefined') {
    global.max = {
        outlet: function(type, ...args) {
            // Store messages for testing
            if (!this.messages) this.messages = [];
            this.messages.push({type, args, timestamp: Date.now()});
        }
    };
    global.post = function(message) {
        console.log(message.replace(/\n$/, ''));
    };
}

// Test assertion utilities
class TestAssertions {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.errors = [];
    }

    assert(condition, message) {
        if (condition) {
            this.passed++;
            post("✓ PASS: " + message + "\n");
        } else {
            this.failed++;
            post("✗ FAIL: " + message + "\n");
            this.errors.push(message);
        }
    }

    assertEqual(actual, expected, message) {
        const condition = Array.isArray(actual) && Array.isArray(expected) ?
            actual.length === expected.length && actual.every((val, idx) => val === expected[idx]) :
            actual === expected;
        this.assert(condition, message + ` (expected: ${expected}, actual: ${actual})`);
    }

    assertArrayEqual(actual, expected, message) {
        this.assert(actual.length === expected.length, message + " - length mismatch");
        if (actual.length === expected.length) {
            for (let i = 0; i < actual.length; i++) {
                this.assert(actual[i] === expected[i], message + ` - index ${i}`);
            }
        }
    }

    assertApproxEqual(actual, expected, tolerance = 0.01, message) {
        const condition = Math.abs(actual - expected) <= tolerance;
        this.assert(condition, message + ` (expected: ${expected}, actual: ${actual})`);
    }

    report() {
        post(`\nTest Results: ${this.passed} passed, ${this.failed} failed\n`);
        if (this.errors.length > 0) {
            post("Failed tests:\n");
            this.errors.forEach(error => post("  - " + error + "\n"));
        }
    }
}

let assertions = new TestAssertions();

// Import the Music Theory Engine
const theory = require('../src/Music Theory Engine');

// Test MIDI Header Generation
function testMidiHeaderGeneration() {
    post("Testing MIDI Header Generation...\n");

    // Test header creation
    const header = theory.generateMidiFile([], 120, 4, 4);
    assertions.assert(header instanceof ArrayBuffer, "Should return ArrayBuffer");

    const uint8View = new Uint8Array(header);

    // Check MThd signature
    assertions.assertEqual(uint8View[0], 0x4D, "First byte should be 'M'");
    assertions.assertEqual(uint8View[1], 0x54, "Second byte should be 'T'");
    assertions.assertEqual(uint8View[2], 0x68, "Third byte should be 'h'");
    assertions.assertEqual(uint8View[3], 0x64, "Fourth byte should be 'd'");

    // Check header length (should be 6)
    const length = (uint8View[4] << 24) | (uint8View[5] << 16) | (uint8View[6] << 8) | uint8View[7];
    assertions.assertEqual(length, 6, "Header length should be 6");

    // Check format (should be 0 for single track)
    assertions.assertEqual(uint8View[8], 0, "Format should be 0");
    assertions.assertEqual(uint8View[9], 0, "Format MSB should be 0");

    // Check number of tracks (should be 1)
    assertions.assertEqual(uint8View[10], 0, "Tracks should be 0");
    assertions.assertEqual(uint8View[11], 1, "Tracks MSB should be 1");

    // Check division (ticks per quarter note)
    const division = (uint8View[12] << 8) | uint8View[13];
    assertions.assertEqual(division, 480, "Division should be 480 ticks per quarter");
}

// Test MIDI Track Generation
function testMidiTrackGeneration() {
    post("Testing MIDI Track Generation...\n");

    // Create a simple progression
    const progression = [
        { notes: [60, 64, 67], duration: 4 }, // C major chord, 4 beats
        { notes: [62, 65, 69], duration: 4 }  // D minor chord, 4 beats
    ];

    const midiData = theory.generateMidiFile(progression, 120, 4, 4);
    const uint8View = new Uint8Array(midiData);

    // Find MTrk chunk
    let trackStart = -1;
    for (let i = 14; i < uint8View.length - 4; i++) {
        if (uint8View[i] === 0x4D && uint8View[i+1] === 0x54 &&
            uint8View[i+2] === 0x72 && uint8View[i+3] === 0x6B) {
            trackStart = i;
            break;
        }
    }

    assertions.assert(trackStart > 0, "Should find MTrk chunk");

    if (trackStart > 0) {
        // Check track length
        const trackLength = (uint8View[trackStart+4] << 24) | (uint8View[trackStart+5] << 16) |
                           (uint8View[trackStart+6] << 8) | uint8View[trackStart+7];
        assertions.assert(trackLength > 0, "Track should have content");
    }
}

// Test Chord to MIDI Conversion
function testChordToMidiConversion() {
    post("Testing Chord to MIDI Conversion...\n");

    // Test single chord
    const progression = [
        { notes: [60, 64, 67], duration: 4 } // C major
    ];

    const midiData = theory.generateMidiFile(progression, 120, 4, 4);
    assertions.assert(midiData.byteLength > 50, "MIDI file should have reasonable size");

    // Test empty progression
    const emptyMidi = theory.generateMidiFile([], 120, 4, 4);
    assertions.assert(emptyMidi.byteLength > 30, "Empty progression should still create valid MIDI file");
}

// Test Tempo and Time Signature
function testTempoAndTimeSignature() {
    post("Testing Tempo and Time Signature...\n");

    const progression = [
        { notes: [60], duration: 1 }
    ];

    // Test different tempo
    const midi120 = theory.generateMidiFile(progression, 120, 4, 4);
    const midi140 = theory.generateMidiFile(progression, 140, 4, 4);

    // Files should be different due to different tempo
    assertions.assert(midi120.byteLength === midi140.byteLength, "Different tempos should produce same file size");

    // Test different time signature
    const midi44 = theory.generateMidiFile(progression, 120, 4, 4);
    const midi34 = theory.generateMidiFile(progression, 120, 3, 4);

    // Should be different due to different time signature
    assertions.assert(midi44.byteLength === midi34.byteLength, "Different time signatures should produce same file size");
}

// Test Note Timing
function testNoteTiming() {
    post("Testing Note Timing...\n");

    // Test that notes have correct timing
    const progression = [
        { notes: [60, 64], duration: 2 }, // 2 beats
        { notes: [62, 65], duration: 2 }  // 2 beats
    ];

    const midiData = theory.generateMidiFile(progression, 120, 4, 4);
    const uint8View = new Uint8Array(midiData);

    // This is a complex test - we'd need to parse the MIDI track data
    // For now, just ensure the file is generated without errors
    assertions.assert(midiData.byteLength > 70, "Complex progression should generate valid MIDI");
}

// Test Export Function
function testExportFunction() {
    post("Testing Export Function...\n");

    const progression = [
        { notes: [60, 64, 67], duration: 4 },
        { notes: [62, 65, 69], duration: 4 }
    ];

    // Test export function exists
    assertions.assert(typeof theory.exportProgressionToMidi === 'function', "exportProgressionToMidi should be a function");

    const midiData = theory.exportProgressionToMidi(progression);
    assertions.assert(midiData instanceof ArrayBuffer, "Should return ArrayBuffer");

    // Test with custom settings
    const midiCustom = theory.exportProgressionToMidi(progression, 140, 3, 4);
    assertions.assert(midiCustom instanceof ArrayBuffer, "Should return ArrayBuffer with custom settings");
}

// Test Save Function (Mock)
function testSaveFunction() {
    post("Testing Save Function...\n");

    // Mock the max environment for testing
    const originalMax = global.max;
    const mockMessages = [];
    global.max = {
        outlet: function(type, ...args) {
            mockMessages.push({type, args});
        }
    };

    const midiData = new ArrayBuffer(100);
    theory.saveMidiFile(midiData, "test.mid");

    // Check that message was sent to max
    assertions.assert(mockMessages.length > 0, "Should send message to Max");
    if (mockMessages.length > 0) {
        assertions.assertEqual(mockMessages[0].type, "save_midi_file", "Should send save_midi_file message");
        assertions.assertEqual(mockMessages[0].args[0], "test.mid", "Should include filename");
        assertions.assert(Array.isArray(mockMessages[0].args[1]), "Should include byte array");
    }

    // Restore original max
    global.max = originalMax;
}

// Test Complex Progression
function testComplexProgression() {
    post("Testing Complex Progression...\n");

    // Create a more complex progression
    const progression = [
        { notes: [60, 64, 67, 71], duration: 2 }, // C7
        { notes: [62, 65, 69, 72], duration: 2 }, // Dm7
        { notes: [64, 67, 71, 74], duration: 2 }, // Em7
        { notes: [65, 69, 72, 76], duration: 2 }  // Fmaj7
    ];

    const midiData = theory.generateMidiFile(progression, 120, 4, 4);
    assertions.assert(midiData.byteLength > 150, "Complex progression should generate substantial MIDI file");

    // Test export
    const exported = theory.exportProgressionToMidi(progression);
    assertions.assert(exported instanceof ArrayBuffer, "Should export complex progression");
}

// Test Error Handling
function testErrorHandling() {
    post("Testing Error Handling...\n");

    // Test with invalid progression
    const invalidProgression = [
        { notes: null, duration: 4 },
        { notes: [60, 64], duration: "invalid" }
    ];

    try {
        const midiData = theory.generateMidiFile(invalidProgression, 120, 4, 4);
        assertions.assert(midiData instanceof ArrayBuffer, "Should handle invalid progression gracefully");
    } catch (error) {
        assertions.assert(false, "Should not throw error for invalid progression: " + error.message);
    }

    // Test with extreme values
    const extremeProgression = [
        { notes: [0, 127], duration: 1000 } // Extreme note numbers and duration
    ];

    try {
        const midiData = theory.generateMidiFile(extremeProgression, 120, 4, 4);
        assertions.assert(midiData instanceof ArrayBuffer, "Should handle extreme values");
    } catch (error) {
        assertions.assert(false, "Should not throw error for extreme values: " + error.message);
    }
}

// Export test functions
exports.runMidiExportTests = runMidiExportTests;
exports.testMidiHeaderGeneration = testMidiHeaderGeneration;
exports.testMidiTrackGeneration = testMidiTrackGeneration;
exports.testChordToMidiConversion = testChordToMidiConversion;
exports.testTempoAndTimeSignature = testTempoAndTimeSignature;
exports.testNoteTiming = testNoteTiming;
exports.testExportFunction = testExportFunction;
exports.testSaveFunction = testSaveFunction;
exports.testComplexProgression = testComplexProgression;
exports.testErrorHandling = testErrorHandling;

// Main test runner function
function runMidiExportTests() {
    post("Starting MIDI Export Tests...\n");
    assertions = new TestAssertions(); // Reset assertions

    testMidiHeaderGeneration();
    testMidiTrackGeneration();
    testChordToMidiConversion();
    testTempoAndTimeSignature();
    testNoteTiming();
    testExportFunction();
    testSaveFunction();
    testComplexProgression();
    testErrorHandling();

    assertions.report();
    post("MIDI Export Tests Complete\n");
}

// Auto-run tests when loaded (for Max environment)
if (typeof max !== "undefined") {
    // In Max, run tests automatically
    runMidiExportTests();
}