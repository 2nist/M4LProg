/**
 * ChordPalette Component
 * Quick chord picker with common qualities
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import type { ChordQuality } from "../../types/chord";
import * as MusicTheory from "@services/musicTheory/MusicTheoryEngine";

interface ChordPaletteProps {
  onAddChord: (
    notes: number[],
    quality: ChordQuality,
    root: number,
    duration: number,
  ) => void;
}

const QUICK_CHORDS: {
  quality: ChordQuality;
  label: string;
  qualityClass: string;
}[] = [
  { quality: "Maj", label: "Maj", qualityClass: "quality-maj" },
  { quality: "min", label: "min", qualityClass: "quality-min" },
  { quality: "dom7", label: "dom7", qualityClass: "quality-dom" },
  { quality: "Maj7", label: "Maj7", qualityClass: "quality-maj" },
  { quality: "min7", label: "min7", qualityClass: "quality-min" },
  { quality: "dim", label: "dim", qualityClass: "quality-dim" },
];

const NOTE_NAMES = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];

export function ChordPalette({ onAddChord }: ChordPaletteProps) {
  const [root, setRoot] = useState(60); // Middle C
  const [quality, setQuality] = useState<ChordQuality>("Maj");
  const [duration, setDuration] = useState(4);

  const handleAdd = () => {
    const notes = MusicTheory.getChordNotes(root, quality);
    onAddChord(notes, quality, root, duration);
  };

  const currentNoteName = NOTE_NAMES[root % 12];
  const chordName = `${currentNoteName}${quality}`;

  return (
    <div className="card rounded-xl p-6 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold mb-1">Add Chord</h3>
        <p className="text-xs muted-text">Quick chord picker</p>
      </div>

      {/* Current chord display */}
      <div className="panel rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold panel-title mb-1">{chordName}</div>
          <div className="text-xs muted-text">
            {duration} {duration === 1 ? "beat" : "beats"}
          </div>
        </div>
      </div>

      {/* Root note selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Root Note</label>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const noteName = NOTE_NAMES[i];
            const isSelected = root % 12 === i;
            const isBlackKey = noteName.includes("♭");

            return (
              <button
                key={i}
                onClick={() => setRoot(60 + i)}
                className={`
                  px-3 py-2 rounded font-medium text-sm transition-all
                  ${isSelected ? "note-selected" : isBlackKey ? "note-black" : "note-default"}
                `}
              >
                {noteName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chord quality selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Quality</label>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_CHORDS.map(({ quality: q, label, qualityClass }) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              className={`
                  px-3 py-2 rounded font-medium text-sm transition-all
                  ${quality === q ? `${qualityClass} quality-selected` : "quality-default"}
                `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Duration (beats)
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 4, 8].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-3 py-2 rounded font-medium text-sm transition-all ${duration === d ? "quality-selected" : "quality-default"}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="w-full py-3 btn-primary font-semibold rounded-lg flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        Add {chordName}
      </button>
    </div>
  );
}
