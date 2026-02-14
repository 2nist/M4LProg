/**
 * ChordSlot Component
 * Individual chord display with drag & drop, editing, and visual feedback
 */

import { useState } from "react";
import type { Chord } from "../../types/chord";
import * as ProgressionManager from "@services/progression/ProgressionManager";
import { motion } from "framer-motion";

interface ChordSlotProps {
  chord: Chord;
  index: number;
  isSelected?: boolean;
  isInPattern?: boolean;
  patternName?: string;
  onSelect?: (index: number) => void;
  onDelete?: (index: number) => void;
  onEdit?: (index: number, chord: Chord) => void;
  onDuplicate?: (index: number) => void;
}

export function ChordSlot({
  chord,
  index,
  isSelected = false,
  isInPattern = false,
  patternName,
  onSelect,
  onDelete,
  onEdit: _onEdit,
  onDuplicate,
}: ChordSlotProps) {
  const [isHovered, setIsHovered] = useState(false);

  const analysis = ProgressionManager.analyzeChord(chord);

  // Get chord name
  const chordName =
    chord.metadata?.root && chord.metadata?.quality
      ? `${["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][chord.metadata.root % 12]}${chord.metadata.quality}`
      : analysis.split(" - ")[0];

  // Get voicing description
  const voicingDesc = analysis.split(" - ")[1] || "";

  // Get chord color semantic classes based on quality
  const getChordColor = () => {
    const quality = chord.metadata?.quality;
    if (!quality)
      return {
        bgClass: "chord-bg-default",
        textClass: "chord-text-default",
        ringClass: "chord-ring-default",
      };

    if (quality.includes("Maj"))
      return {
        bgClass: "chord-bg-maj",
        textClass: "chord-text-maj",
        ringClass: "chord-ring-maj",
      };
    if (quality.includes("min"))
      return {
        bgClass: "chord-bg-min",
        textClass: "chord-text-min",
        ringClass: "chord-ring-min",
      };
    if (quality.includes("dim"))
      return {
        bgClass: "chord-bg-dim",
        textClass: "chord-text-dim",
        ringClass: "chord-ring-dim",
      };
    if (quality.includes("aug"))
      return {
        bgClass: "chord-bg-aug",
        textClass: "chord-text-aug",
        ringClass: "chord-ring-aug",
      };
    if (quality.includes("dom"))
      return {
        bgClass: "chord-bg-dom",
        textClass: "chord-text-dom",
        ringClass: "chord-ring-dom",
      };
    return {
      bgClass: "chord-bg-default",
      textClass: "chord-text-default",
      ringClass: "chord-ring-default",
    };
  };

  const colors = getChordColor();

  // Duration editing removed from this slot component per design

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect?.(index)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group cursor-pointer
        rounded-xl p-4 border-2
        transition-all duration-200
        ${colors.bgClass}
        ${isSelected ? `slot-selected ${colors.ringClass} border-transparent` : "slot-border"}
        ${isInPattern ? "slot-in-pattern" : ""}
      `}
    >
      {/* Pattern badge */}
      {isInPattern && patternName && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-medium pattern-badge shadow-lg">
          {patternName}
        </div>
      )}

      {/* Action buttons */}
      <div
        className={`
        absolute top-2 right-2 flex gap-1
        transition-opacity duration-200
        ${isHovered || isSelected ? "opacity-100" : "opacity-0"}
      `}
      >
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(index);
            }}
            className="w-6 h-6 btn-small flex items-center justify-center text-xs"
            title="Duplicate"
          >
            ⎘
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="w-6 h-6 btn-danger flex items-center justify-center"
            title="Delete"
          >
            ×
          </button>
        )}
      </div>

      {/* Index badge removed per design (slot numbers hidden) */}

      {/* Chord info */}
      <div className="ml-2">
        <div
          className={`text-2xl font-bold ${colors.textClass} mb-1 chord-label`}
        >
          {chordName}
        </div>

        {voicingDesc && (
          <div className="text-xs muted-text mb-2">{voicingDesc}</div>
        )}

        {/* MIDI notes */}
        <div className="text-xs muted-text font-mono mb-3">
          {chord.notes.slice(0, 5).join(" • ")}
          {chord.notes.length > 5 && " ..."}
        </div>

        {/* Duration removed from chord slot UI per design */}
      </div>
    </motion.div>
  );
}
