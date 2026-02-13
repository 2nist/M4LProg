import React, { useCallback, useState } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import { Repeat, Edit3, Trash2, Copy } from "lucide-react";
import type { ModeId } from "@/types/arrangement";

export default function SongOverview() {
  const {
    sections,
    currentSectionIndex,
    loadSection,
    reorderSection,
    duplicateSection,
    deleteSection,
    renameSectionAt,
    uiMode,
    setUiMode,
  } = useProgressionStore();

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const onClickSection = useCallback(
    (i: number) => {
      loadSection(i);
    },
    [loadSection],
  );

  // Basic drag handlers for reordering (HTML5 drag/drop)
  const handleDragStart = (e: React.DragEvent, fromIndex: number) => {
    e.dataTransfer.setData("text/plain", String(fromIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!isNaN(from)) reorderSection(from, toIndex);
  };

  const preventDefault = (e: React.DragEvent) => e.preventDefault();

  const startEdit = (i: number, name: string) => {
    setEditingIndex(i);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const saveEdit = (i: number) => {
    const name = editValue.trim();
    if (!name) return;
    renameSectionAt(i, name);
    cancelEdit();
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs muted-text">Song Overview</div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] uppercase tracking-wide muted-text">Mode</span>
          <select
            className="h-6 text-[10px] compact"
            value={uiMode}
            onChange={(e) => setUiMode(e.target.value as ModeId)}
            title="Global mode for Controls, Matrix, and Arrangement"
          >
            <option value="harmony">Harmony</option>
            <option value="drum">Drum</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {sections.map((s, i) => (
          <div
            key={s.id || `section-${i}`}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={preventDefault}
            onDrop={(e) => handleDrop(e, i)}
            className={`flex items-center justify-between rounded cursor-pointer transition-all ${
              i === currentSectionIndex ? "bg-orange/10 ring-1 ring-orange p-1" : "hover:bg-black/5 p-1"
            }`}
            onClick={() => onClickSection(i)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm text-black" aria-hidden>
                {i + 1}
              </div>

              <div className="min-w-0">
                {editingIndex === i ? (
                  <div className="flex items-center gap-1">
                    <input
                      className="input text-sm" 
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); saveEdit(i); }}>Save</button>
                    <button className="btn-small" onClick={(e) => { e.stopPropagation(); cancelEdit(); }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    <div className="text-xs muted-text truncate">{s.progression.length} chords • {s.progression.reduce((sum, c) => sum + c.duration, 0)} beats</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-0.5 rounded bg-black/5 text-black flex items-center gap-1">
                <Repeat size={12} /> <span className="text-[11px]">{s.repeats || 1}</span>
              </div>

              <button
                title="Rename"
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); startEdit(i, s.name); }}
              >
                <Edit3 size={14} />
              </button>

              <button
                title="Duplicate"
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); duplicateSection(i); }}
              >
                <Copy size={14} />
              </button>

              <button
                title="Delete"
                className="btn-icon"
                onClick={(e) => { e.stopPropagation(); deleteSection(i); }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
