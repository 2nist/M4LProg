/**
 * Voicing Options Tests
 * Tests for chord inversions and drop voicings
 */

const theory = require('../src/Music Theory Engine');

// Mock post function for Node.js
if (typeof post === 'undefined') {
    global.post = function(message) {
        console.log(message.replace(/\n$/, ''));
    };
}

// Test framework
class TestAssertions {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.failures = [];
    }

    assert(condition, message) {
        if (condition) {
            this.passed++;
            post("✓ PASS: " + message + "\n");
        } else {
            this.failed++;
            this.failures.push(message);
            post("✗ FAIL: " + message + "\n");
        }
    }

    assertEqual(actual, expected, message) {
        if (actual === expected) {
            this.passed++;
            post("✓ PASS: " + message + " (expected: " + expected + ", actual: " + actual + ")\n");
        } else {
            this.failed++;
            this.failures.push(message + " (expected: " + expected + ", actual: " + actual + ")");
            post("✗ FAIL: " + message + " (expected: " + expected + ", actual: " + actual + ")\n");
        }
    }

    assertArraysEqual(actual, expected, message) {
        const equal = actual.length === expected.length &&
                     actual.every((val, index) => val === expected[index]);
        if (equal) {
            this.passed++;
            post("✓ PASS: " + message + "\n");
        } else {
            this.failed++;
            this.failures.push(message + " (expected: [" + expected + "], actual: [" + actual + "])");
            post("✗ FAIL: " + message + " (expected: [" + expected + "], actual: [" + actual + "])\n");
        }
    }

    report() {
        post("\nTest Results: " + this.passed + " passed, " + this.failed + " failed\n");
        if (this.failed > 0) {
            post("Failed tests:\n");
            this.failures.forEach(failure => post("  - " + failure + "\n"));
        }
    }
}

// Test Inversion Functions
function testInversion() {
    post("Testing Chord Inversion...\n");

    // Test root position (no change)
    const chord = [60, 64, 67]; // C major
    const inverted0 = theory.applyInversion(chord, 0);
    assertions.assertArraysEqual(inverted0, [60, 64, 67], "Root position should remain unchanged");

    // Test 1st inversion
    const inverted1 = theory.applyInversion(chord, 1);
    assertions.assertArraysEqual(inverted1, [64, 67, 72], "1st inversion should move root up an octave");

    // Test 2nd inversion
    const inverted2 = theory.applyInversion(chord, 2);
    assertions.assertArraysEqual(inverted2, [67, 72, 76], "2nd inversion should move two notes up an octave");

    // Test 3rd inversion
    const inverted3 = theory.applyInversion(chord, 3);
    assertions.assertArraysEqual(inverted3, [72, 76, 79], "3rd inversion should move three notes up an octave");

    // Test with 7th chord
    const seventhChord = [60, 64, 67, 70]; // C7
    const seventhInverted1 = theory.applyInversion(seventhChord, 1);
    assertions.assertArraysEqual(seventhInverted1, [64, 67, 70, 72], "7th chord 1st inversion");
}

// Test Drop Voicing Functions
function testDropVoicing() {
    post("Testing Drop Voicing...\n");

    // Test no drop (no change)
    const chord = [60, 64, 67, 70]; // C7
    const drop0 = theory.applyDropVoicing(chord, 0);
    assertions.assertArraysEqual(drop0, [60, 64, 67, 70], "No drop should remain unchanged");

    // Test drop 2
    const drop2 = theory.applyDropVoicing(chord, 1);
    assertions.assertArraysEqual(drop2, [55, 60, 64, 70], "Drop 2 should move second highest note down an octave");

    // Test drop 2&4
    const drop24 = theory.applyDropVoicing(chord, 2);
    assertions.assertArraysEqual(drop24, [48, 55, 64, 70], "Drop 2&4 should move second and fourth highest notes down an octave");

    // Test drop 3
    const drop3 = theory.applyDropVoicing(chord, 3);
    assertions.assertArraysEqual(drop3, [52, 60, 67, 70], "Drop 3 should move third highest note down an octave");

    // Test with triad (should not change much)
    const triad = [60, 64, 67]; // C major
    const triadDrop2 = theory.applyDropVoicing(triad, 1);
    assertions.assertArraysEqual(triadDrop2, [60, 64, 67], "Drop 2 on triad should not change (needs 4+ notes)");
}

// Test Combined Voicing
function testCombinedVoicing() {
    post("Testing Combined Voicing...\n");

    const chord = [60, 64, 67, 70]; // C7

    // Test inversion + drop
    const voicing1 = theory.applyVoicing(chord, 1, 1); // 1st inversion + drop 2
    assertions.assertArraysEqual(voicing1, [58, 64, 67, 72], "1st inversion + drop 2");

    // Test different combinations
    const voicing2 = theory.applyVoicing(chord, 2, 0); // 2nd inversion, no drop
    assertions.assertArraysEqual(voicing2, [67, 70, 72, 76], "2nd inversion, no drop");

    const voicing3 = theory.applyVoicing(chord, 0, 2); // Root position + drop 2&4
    assertions.assertArraysEqual(voicing3, [48, 55, 64, 70], "Root position + drop 2&4");
}

// Test Voicing Description
function testVoicingDescription() {
    post("Testing Voicing Description...\n");

    assertions.assertEqual(theory.getVoicingDescription(0, 0), "Root Position", "Root position, no drop");
    assertions.assertEqual(theory.getVoicingDescription(1, 0), "1st Inversion", "1st inversion, no drop");
    assertions.assertEqual(theory.getVoicingDescription(2, 1), "2nd Inversion Drop 2", "2nd inversion, drop 2");
    assertions.assertEqual(theory.getVoicingDescription(3, 3), "3rd Inversion Drop 3", "3rd inversion, drop 3");
}

// Test Integration with Chord Generation
function testVoicingIntegration() {
    post("Testing Voicing Integration...\n");

    // Get a base chord
    const baseNotes = theory.getChordNotes(60, "Maj7"); // Cmaj7
    assertions.assertArraysEqual(baseNotes, [60, 64, 67, 71], "Base Cmaj7 chord");

    // Apply voicing
    const voicedNotes = theory.applyVoicing(baseNotes, 1, 1); // 1st inversion + drop 2
    assertions.assert(voicedNotes.length === 4, "Voiced chord should have same number of notes");
    assertions.assert(voicedNotes[0] >= 48 && voicedNotes[0] <= 84, "Notes should be in reasonable MIDI range");
}

// Test Edge Cases
function testVoicingEdgeCases() {
    post("Testing Voicing Edge Cases...\n");

    // Empty chord
    const emptyVoiced = theory.applyVoicing([], 1, 1);
    assertions.assertArraysEqual(emptyVoiced, [], "Empty chord should remain empty");

    // Single note
    const singleVoiced = theory.applyVoicing([60], 1, 1);
    assertions.assertArraysEqual(singleVoiced, [72], "Single note inversion");

    // High inversion values (should clamp)
    const chord = [60, 64, 67];
    const highInversion = theory.applyVoicing(chord, 10, 0); // Should treat as 3rd inversion
    assertions.assertArraysEqual(highInversion, [72, 76, 79], "High inversion should clamp");

    // Invalid drop values
    const invalidDrop = theory.applyVoicing(chord, 0, 10);
    assertions.assertArraysEqual(invalidDrop, [60, 64, 67], "Invalid drop should be ignored");
}

// Main test runner
function runVoicingTests() {
    post("Starting Voicing Options Tests...\n");
    assertions = new TestAssertions();

    testInversion();
    testDropVoicing();
    testCombinedVoicing();
    testVoicingDescription();
    testVoicingIntegration();
    testVoicingEdgeCases();

    assertions.report();
    post("Voicing Options Tests Complete\n");
}

// Export for external use
exports.runVoicingTests = runVoicingTests;
exports.testInversion = testInversion;
exports.testDropVoicing = testDropVoicing;
exports.testCombinedVoicing = testCombinedVoicing;
exports.testVoicingDescription = testVoicingDescription;
exports.testVoicingIntegration = testVoicingIntegration;
exports.testVoicingEdgeCases = testVoicingEdgeCases;

// Auto-run if loaded directly
if (typeof max === "undefined") {
    runVoicingTests();
}