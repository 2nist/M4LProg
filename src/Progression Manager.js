/**
 * Progression Manager
 * Handles section-based progression storage, pattern detection, and snapshots.
 */

const theory = require("./Music Theory Engine");

// Section structure
function createSection(name = "New Section") {
  return {
    name: name,
    progression: [],
    rootHeld: null,
    transitions: { type: "none", length: 2 },
  };
}

// Pattern detection using music theory
function detectPatterns(progression, root) {
  if (!progression || progression.length < 2) return [];

  const patterns = [];
  const notes = progression.flatMap((chord) => chord.notes || []);

  // Common patterns to detect
  const patternDefinitions = {
    "I-IV-V-I": { sequence: [0, 5, 7, 0], name: "Perfect Cadence" },
    "ii-V-I": { sequence: [2, 7, 0], name: "Jazz Cadence" },
    "I-vi-IV-V": { sequence: [0, 9, 5, 7], name: "Pop Progression" },
    "i-VI-III-VII": { sequence: [0, 9, 4, 11], name: "Minor Pop" },
    "I-V-vi-IV": { sequence: [0, 7, 9, 5], name: "Pop-punk" },
    "vi-IV-I-V": { sequence: [9, 5, 0, 7], name: "Sensitive Female" },
  };

  // Convert progression to scale degrees
  const scaleDegrees = notes.map((note) => (note - root) % 12);

  // Check for patterns
  for (const [key, pattern] of Object.entries(patternDefinitions)) {
    if (matchesPattern(scaleDegrees, pattern.sequence)) {
      patterns.push({
        name: pattern.name,
        type: key,
        confidence: calculateConfidence(scaleDegrees, pattern.sequence),
      });
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function matchesPattern(degrees, pattern, tolerance = 1) {
  if (degrees.length < pattern.length) return false;

  for (let i = 0; i <= degrees.length - pattern.length; i++) {
    let matches = true;
    for (let j = 0; j < pattern.length; j++) {
      const diff = Math.abs(degrees[i + j] - pattern[j]);
      if (diff > tolerance && diff < 12 - tolerance) {
        matches = false;
        break;
      }
    }
    if (matches) return true;
  }
  return false;
}

function calculateConfidence(degrees, pattern) {
  // Simple confidence based on how well the pattern fits
  let matches = 0;
  for (let i = 0; i < Math.min(degrees.length, pattern.length); i++) {
    if (Math.abs(degrees[i] - pattern[i]) <= 1) matches++;
  }
  return matches / pattern.length;
}

// Apply pattern to create a new progression
function applyPattern(patternId, context) {
  const { root, duration } = context;

  // Pattern definitions with chord sequences
  const patterns = {
    "I-IV-V-I": [
      { notes: theory.getChordNotes(root, "Maj"), duration: duration },
      { notes: theory.getChordNotes(root + 5, "Maj"), duration: duration },
      { notes: theory.getChordNotes(root + 7, "Maj"), duration: duration },
      { notes: theory.getChordNotes(root, "Maj"), duration: duration },
    ],
    "ii-V-I": [
      { notes: theory.getChordNotes(root + 2, "min"), duration: duration },
      { notes: theory.getChordNotes(root + 7, "Dom7"), duration: duration },
      { notes: theory.getChordNotes(root, "Maj"), duration: duration },
    ],
    "I-vi-IV-V": [
      { notes: theory.getChordNotes(root, "Maj"), duration: duration },
      { notes: theory.getChordNotes(root + 9, "min"), duration: duration },
      { notes: theory.getChordNotes(root + 5, "Maj"), duration: duration },
      { notes: theory.getChordNotes(root + 7, "Maj"), duration: duration },
    ],
  };

  return patterns[patternId] || null;
}

// Section management
let sections = [createSection("Verse 1")];
let currentSectionIndex = 0;

function initialize(songData) {
  if (songData && songData.sections) {
    sections = songData.sections.map((s) => ({
      ...createSection(),
      ...s,
    }));
    currentSectionIndex = songData.currentSectionIndex || 0;
  }
}

function loadCurrentSection() {
  return {
    section: sections[currentSectionIndex],
    index: currentSectionIndex,
    total: sections.length,
  };
}

function saveCurrentSection(section) {
  sections[currentSectionIndex] = { ...section };
  saveToDict();
}

function moveSection(direction) {
  const newIndex = Math.max(
    0,
    Math.min(sections.length - 1, currentSectionIndex + direction),
  );
  if (newIndex !== currentSectionIndex) {
    currentSectionIndex = newIndex;
    saveToDict();
  }
  return loadCurrentSection();
}

function createSection(name) {
  const newSection = createSection(name);
  sections.push(newSection);
  currentSectionIndex = sections.length - 1;
  saveToDict();
  return loadCurrentSection();
}

// Progression snapshots
let progressionSnapshots = {};

function saveProgressionSnapshot(name, progression, metadata = {}) {
  if (!name || !progression) return false;

  progressionSnapshots[name] = {
    progression: JSON.parse(JSON.stringify(progression)), // Deep copy
    timestamp: Date.now(),
    metadata: metadata,
  };

  saveToDict();
  return true;
}

function loadProgressionSnapshot(name) {
  return progressionSnapshots[name] || null;
}

function deleteProgressionSnapshot(name) {
  if (progressionSnapshots[name]) {
    delete progressionSnapshots[name];
    saveToDict();
    return true;
  }
  return false;
}

function listSavedProgressions() {
  return progressionSnapshots;
}

// Dict persistence
function saveToDict() {
  const data = {
    sections: sections,
    currentSectionIndex: currentSectionIndex,
    progressionSnapshots: progressionSnapshots,
  };

  if (typeof max !== "undefined") {
    // Send to dict in Max
    max.outlet("dict_data", JSON.stringify(data));
  }
}

function loadFromDict(dictData) {
  try {
    const data = JSON.parse(dictData);
    if (data.sections) sections = data.sections;
    if (data.currentSectionIndex !== undefined)
      currentSectionIndex = data.currentSectionIndex;
    if (data.progressionSnapshots)
      progressionSnapshots = data.progressionSnapshots;
  } catch (error) {
    max.post("Progression Manager: Error loading from dict:", error.message);
  }
}

// Exports
exports.initialize = initialize;
exports.loadCurrentSection = loadCurrentSection;
exports.saveCurrentSection = saveCurrentSection;
exports.moveSection = moveSection;
exports.createSection = createSection;
exports.detectPatterns = detectPatterns;
exports.applyPattern = applyPattern;
exports.saveProgressionSnapshot = saveProgressionSnapshot;
exports.loadProgressionSnapshot = loadProgressionSnapshot;
exports.deleteProgressionSnapshot = deleteProgressionSnapshot;
exports.listSavedProgressions = listSavedProgressions;
exports.loadFromDict = loadFromDict;
