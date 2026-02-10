/**
 * Progression Demo Component
 * Demonstrates the ported Progression Manager functionality
 */

import { useState } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import * as ProgressionManager from "@services/progression/ProgressionManager";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";

export function ProgressionDemo() {
  const {
    getCurrentSection,
    addChord,
    removeChord,
    getAllPatterns,
    applyPatternToSection,
    saveProgression,
    getSavedProgressionNames,
    loadProgression,
  } = useProgressionStore();

  const [selectedPattern, setSelectedPattern] = useState("pop_1-5-6-4");
  const [rootNote, setRootNote] = useState(60); // Middle C

  const currentSection = getCurrentSection();
  const allPatterns = getAllPatterns();
  const savedNames = getSavedProgressionNames();

  // Detect patterns in current progression
  const detectedPatterns = ProgressionManager.detectPatterns(
    currentSection.progression,
    rootNote,
  );

  const handleApplyPattern = () => {
    applyPatternToSection(selectedPattern, rootNote);
  };

  const handleAddChord = () => {
    const chord = {
      notes: MusicTheory.getChordNotes(rootNote, "Maj"),
      duration: 4,
      metadata: {
        root: rootNote,
        quality: "Maj" as const,
      },
    };
    addChord(chord);
  };

  const handleSaveProgression = () => {
    const name = prompt("Enter name for progression:");
    if (name) {
      saveProgression(name, {
        tempo: 120,
        key: MusicTheory.getChordName(rootNote, "Maj"),
      });
    }
  };

  const handleLoadProgression = (name: string) => {
    loadProgression(name);
  };

  return (
    <div className="p-6 rounded-lg panel">
      <h2 className="mb-4 text-2xl font-semibold">Progression Manager Demo</h2>

      {/* Pattern Library */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-medium">Pattern Library</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {allPatterns.map((pattern) => (
            <button
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern.id)}
              className={`p-3 rounded text-left transition ${
                selectedPattern === pattern.id ? "btn-primary" : "card"
              }`}
            >
              <div className="font-medium">{pattern.name}</div>
              <div className="mt-1 text-xs muted-text">
                {pattern.description}
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1 text-sm">Root Note</label>
            <input
              type="range"
              min="48"
              max="72"
              value={rootNote}
              onChange={(e) => setRootNote(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 text-sm muted-text">
              {MusicTheory.getChordName(rootNote, "Maj").slice(0, -3)} (MIDI:{" "}
              {rootNote})
            </div>
          </div>
          <button
            onClick={handleApplyPattern}
            className="self-end px-6 py-2 rounded btn-primary"
          >
            Apply Pattern
          </button>
        </div>
      </div>

      {/* Current Progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">{currentSection.name}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleAddChord}
              className="px-3 py-1 text-sm rounded btn-primary"
            >
              Add Chord
            </button>
            <button
              onClick={handleSaveProgression}
              className="px-3 py-1 text-sm rounded btn-primary"
            >
              Save Progression
            </button>
          </div>
        </div>

        {currentSection.progression.length === 0 ? (
          <div className="p-8 text-center rounded card muted-text">
            No chords yet. Apply a pattern or add chords manually.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {currentSection.progression.map((chord, index) => (
              <div key={index} className="relative p-3 rounded card group">
                <button
                  onClick={() => removeChord(index)}
                  className="absolute w-6 h-6 text-xs transition rounded opacity-0 top-1 right-1 btn-danger group-hover:opacity-100"
                >
                  ×
                </button>
                <div className="font-medium status-on-text">
                  {ProgressionManager.analyzeChord(chord)}
                </div>
                <div className="mt-1 text-xs muted-text">
                  Notes: {chord.notes.join(", ")}
                </div>
                <div className="mt-1 text-xs muted-text">
                  {chord.duration} beats
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progression Stats */}
        <div className="mt-3 text-sm muted-text">
          Total Duration:{" "}
          {ProgressionManager.getProgressionDuration(
            currentSection.progression,
          )}{" "}
          beats
        </div>
      </div>

      {/* Pattern Detection */}
      {detectedPatterns.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-medium">Detected Patterns</h3>
          <div className="space-y-2">
            {detectedPatterns.map((pattern, index) => (
              <div key={index} className="p-3 rounded card">
                <div className="font-medium status-on-text">{pattern.name}</div>
                <div className="mt-1 text-sm muted-text">
                  Position: Chords {pattern.startIndex + 1}-
                  {pattern.startIndex + pattern.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Progressions */}
      {savedNames.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-medium">Saved Progressions</h3>
          <div className="grid grid-cols-3 gap-2">
            {savedNames.map((name) => (
              <button
                key={name}
                onClick={() => handleLoadProgression(name)}
                className="px-3 py-2 text-sm text-left btn-small card"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
