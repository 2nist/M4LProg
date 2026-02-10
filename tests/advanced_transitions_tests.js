/**
 * Advanced Transitions Unit Tests
 * Comprehensive testing suite for probabilistic transitions and custom transition builders
 */

// Mock the Max environment for testing
if (typeof max === "undefined") {
  global.max = {
    outlet: function (type, ...args) {
      // Store messages for testing
      if (!this.messages) this.messages = [];
      this.messages.push({ type, args, timestamp: Date.now() });
    },
  };
  global.post = function (message) {
    console.log(message.replace(/\n$/, ""));
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
    const condition =
      Array.isArray(actual) && Array.isArray(expected)
        ? actual.length === expected.length &&
          actual.every((val, idx) => val === expected[idx])
        : actual === expected;
    this.assert(
      condition,
      message + ` (expected: ${expected}, actual: ${actual})`,
    );
  }

  assertArrayEqual(actual, expected, message) {
    this.assert(
      actual.length === expected.length,
      message + " - length mismatch",
    );
    if (actual.length === expected.length) {
      for (let i = 0; i < actual.length; i++) {
        this.assert(actual[i] === expected[i], message + ` - index ${i}`);
      }
    }
  }

  assertApproxEqual(actual, expected, tolerance = 0.01, message) {
    const condition = Math.abs(actual - expected) <= tolerance;
    this.assert(
      condition,
      message + ` (expected: ${expected}, actual: ${actual})`,
    );
  }

  report() {
    post(`\nTest Results: ${this.passed} passed, ${this.failed} failed\n`);
    if (this.errors.length > 0) {
      post("Failed tests:\n");
      this.errors.forEach((error) => post("  - " + error + "\n"));
    }
  }
}

let assertions = new TestAssertions();

// Import the Music Theory Engine
const theory = require("../src/Music Theory Engine.js");

// Test Probabilistic Selection
function testProbabilisticSelection() {
  post("Testing Probabilistic Selection...\n");

  const options = [
    { name: "A", weight: 0.5 },
    { name: "B", weight: 0.3 },
    { name: "C", weight: 0.2 },
  ];

  // Test weighted selection (run multiple times for statistical significance)
  let counts = { A: 0, B: 0, C: 0 };
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const selected = theory.selectWeightedOption(options);
    counts[selected.name]++;
  }

  // Check that distribution is roughly correct (within 10% tolerance)
  const expectedA = iterations * 0.5;
  const expectedB = iterations * 0.3;
  const expectedC = iterations * 0.2;

  assertions.assertApproxEqual(
    counts.A / iterations,
    0.5,
    0.1,
    "Option A should be selected ~50% of the time",
  );
  assertions.assertApproxEqual(
    counts.B / iterations,
    0.3,
    0.1,
    "Option B should be selected ~30% of the time",
  );
  assertions.assertApproxEqual(
    counts.C / iterations,
    0.2,
    0.1,
    "Option C should be selected ~20% of the time",
  );

  // Test edge cases
  const singleOption = [{ name: "Only", weight: 1.0 }];
  const selected = theory.selectWeightedOption(singleOption);
  assertions.assertEqual(
    selected.name,
    "Only",
    "Single option should always be selected",
  );

  const emptyOptions = [];
  const noSelection = theory.selectWeightedOption(emptyOptions);
  assertions.assertEqual(
    noSelection,
    undefined,
    "Empty options should return undefined",
  );
}

// Test Chord Sequence Parsing
function testChordSequenceParsing() {
  post("Testing Chord Sequence Parsing...\n");

  const root = 60; // C4

  // Test basic chord symbols
  const sequence1 = ["I", "IV", "V"];
  const chords1 = theory.parseChordSequence(sequence1, root);
  assertions.assertEqual(chords1.length, 3, "Should parse 3 chords");
  assertions.assertArrayEqual(chords1[0], [60, 64, 67], "I should be C major");
  assertions.assertArrayEqual(chords1[1], [65, 69, 72], "IV should be F major");
  assertions.assertArrayEqual(chords1[2], [67, 71, 74], "V should be G major");

  // Test seventh chords
  const sequence2 = ["ii7", "V7", "I"];
  const chords2 = theory.parseChordSequence(sequence2, root);
  assertions.assertEqual(chords2.length, 3, "Should parse 3 seventh chords");
  assertions.assertArrayEqual(
    chords2[0],
    [62, 65, 69, 72],
    "ii7 should be D minor 7",
  );
  assertions.assertArrayEqual(
    chords2[1],
    [67, 71, 74, 77],
    "V7 should be G dominant 7",
  );

  // Test chromatic chords
  const sequence3 = ["bVII7", "I"];
  const chords3 = theory.parseChordSequence(sequence3, root);
  assertions.assertEqual(chords3.length, 2, "Should parse chromatic chords");
  assertions.assertArrayEqual(
    chords3[0],
    [58, 62, 65, 68],
    "bVII7 should be Bb dominant 7",
  );

  // Test invalid symbols
  const sequence4 = ["invalid", "I"];
  const chords4 = theory.parseChordSequence(sequence4, root);
  assertions.assertEqual(
    chords4.length,
    1,
    "Should skip invalid chord symbols",
  );
}

// Test Probabilistic Transition Building
function testProbabilisticTransitionBuilding() {
  post("Testing Probabilistic Transition Building...\n");

  const root = 60; // C4
  const preset = theory.TRANSITION_PRESETS.jazz_cadence;

  // Mock Math.random to return 0 (should select first option: ii-V-I)
  const originalRandom = Math.random;
  Math.random = () => 0;

  const notes = theory.buildProbabilisticTransition(root, preset, 4);
  assertions.assert(
    notes.length > 0,
    "Should generate notes for probabilistic transition",
  );

  // Check that notes are properly timed
  let totalDuration = 0;
  notes.forEach((note) => {
    assertions.assert(note.hasOwnProperty("pitch"), "Note should have pitch");
    assertions.assert(
      note.hasOwnProperty("start_time"),
      "Note should have start_time",
    );
    assertions.assert(
      note.hasOwnProperty("duration"),
      "Note should have duration",
    );
    totalDuration += note.duration;
  });
  assertions.assertApproxEqual(
    totalDuration,
    4,
    0.1,
    "Total duration should be approximately 4 beats",
  );

  // Restore Math.random
  Math.random = originalRandom;
}

// Test Custom Transition Creation
function testCustomTransitionCreation() {
  post("Testing Custom Transition Creation...\n");

  // Test basic custom transition
  const custom1 = theory.createCustomTransition(
    "My Transition",
    "Dm7 G7 Cmaj7",
  );
  assertions.assert(custom1 !== null, "Should create custom transition");
  assertions.assertEqual(
    custom1.name,
    "My Transition",
    "Should set correct name",
  );
  assertions.assertEqual(custom1.type, "custom", "Should set correct type");
  assertions.assert(custom1.options.length > 0, "Should have options");

  // Test building custom transition
  const root = 60;
  const notes = custom1.build(root, 4);
  assertions.assert(
    notes.length > 0,
    "Should generate notes for custom transition",
  );

  // Test invalid sequence
  const custom2 = theory.createCustomTransition("Invalid", "");
  assertions.assertEqual(
    custom2,
    null,
    "Should return null for empty sequence",
  );

  // Test with custom weights
  const custom3 = theory.createCustomTransition(
    "Weighted",
    "C D E",
    [0.5, 0.3, 0.2],
  );
  assertions.assert(
    custom3 !== null,
    "Should create weighted custom transition",
  );
  const notes3 = custom3.build(root, 6);
  let totalDuration = 0;
  notes3.forEach((note) => (totalDuration += note.duration));
  assertions.assertApproxEqual(
    totalDuration,
    6,
    0.1,
    "Weighted transition should respect total duration",
  );
}

// Test Transition Persistence
function testTransitionPersistence() {
  post("Testing Transition Persistence...\n");

  // Mock dict for testing
  global.customTransitionsDict = {
    storage: {},
    set: function (key, value) {
      this.storage[key] = value;
    },
    get: function (key) {
      return this.storage[key];
    },
  };

  // Test saving and loading
  const customTransition = theory.createCustomTransition(
    "Test Save",
    "Am F C G",
  );
  theory.saveCustomTransition("test_save", customTransition);

  const loaded = theory.loadCustomTransition("test_save");
  assertions.assert(loaded !== null, "Should load saved transition");
  assertions.assertEqual(loaded.name, "Test Save", "Should preserve name");
  assertions.assertEqual(loaded.type, "custom", "Should preserve type");

  // Test loading non-existent transition
  const notFound = theory.loadCustomTransition("nonexistent");
  assertions.assertEqual(
    notFound,
    null,
    "Should return null for non-existent transition",
  );

  // Clean up
  delete global.customTransitionsDict;
}

// Test Backward Compatibility
function testBackwardCompatibility() {
  post("Testing Backward Compatibility...\n");

  const root = 60;

  // Test that existing transitions still work
  const backdoor = theory.buildTransition(root, "backdoor_dominant", 2);
  assertions.assert(
    backdoor.notes.length > 0,
    "Backdoor dominant should still work",
  );
  assertions.assertEqual(backdoor.length, 2, "Should preserve length");

  const plagal = theory.buildTransition(root, "plagal", 2);
  assertions.assert(
    plagal.notes.length > 0,
    "Plagal cadence should still work",
  );

  const modal = theory.buildTransition(root, "modal_borrow", 2);
  assertions.assert(modal.notes.length > 0, "Modal borrow should still work");

  // Test that "none" still works
  const none = theory.buildTransition(root, "none", 2);
  assertions.assertEqual(
    none.notes.length,
    0,
    "None transition should return empty notes",
  );
  assertions.assertEqual(
    none.length,
    0,
    "None transition should have zero length",
  );
}

// Test Error Handling
function testErrorHandling() {
  post("Testing Error Handling...\n");

  // Test invalid preset
  const invalid = theory.buildProbabilisticTransition(60, null, 4);
  assertions.assertEqual(
    invalid.length,
    0,
    "Should handle null preset gracefully",
  );

  const emptyPreset = theory.buildProbabilisticTransition(
    60,
    { options: [] },
    4,
  );
  assertions.assertEqual(
    emptyPreset.length,
    0,
    "Should handle empty options gracefully",
  );

  // Test invalid chord symbols in custom transitions
  const custom = theory.createCustomTransition(
    "Test",
    "invalid I also_invalid",
  );
  assertions.assert(
    custom !== null,
    "Should create transition even with invalid symbols",
  );
  const notes = custom.build(60, 4);
  assertions.assert(
    notes.length > 0,
    "Should generate notes for valid symbols only",
  );
}

// Export test functions
exports.runAdvancedTransitionsTests = runAdvancedTransitionsTests;
exports.testProbabilisticSelection = testProbabilisticSelection;
exports.testChordSequenceParsing = testChordSequenceParsing;
exports.testProbabilisticTransitionBuilding =
  testProbabilisticTransitionBuilding;
exports.testCustomTransitionCreation = testCustomTransitionCreation;
exports.testTransitionPersistence = testTransitionPersistence;
exports.testBackwardCompatibility = testBackwardCompatibility;
exports.testErrorHandling = testErrorHandling;

// Main test runner function
function runAdvancedTransitionsTests() {
  post("Starting Advanced Transitions Tests...\n");
  assertions = new TestAssertions(); // Reset assertions

  testProbabilisticSelection();
  testChordSequenceParsing();
  testProbabilisticTransitionBuilding();
  testCustomTransitionCreation();
  testTransitionPersistence();
  testBackwardCompatibility();
  testErrorHandling();

  assertions.report();
  post("Advanced Transitions Tests Complete\n");
}

// Auto-run tests when loaded (for Max environment)
if (typeof max !== "undefined") {
  // In Max, run tests automatically
  runAdvancedTransitionsTests();
}
