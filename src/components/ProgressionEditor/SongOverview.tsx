import React, { useCallback } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import { Repeat } from "lucide-react";

export default function SongOverview() {
  const {
    sections,
    currentSectionIndex,
    loadSection,
    reorderSection,
    duplicateSection,
    deleteSection,
  } = useProgressionStore();

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

  return (
    <div>
      <div className="mb-1 text-xs muted-text">Song Overview</div>
      <div className="flex flex-col gap-1">
        {sections.map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={preventDefault}
            onDrop={(e) => handleDrop(e, i)}
            className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all ${
              i === currentSectionIndex ? "bg-orange/10 ring-1 ring-orange" : "hover:bg-black/5"
            }`}
            onClick={() => onClickSection(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              // Simple inline actions via prompt for now
              const action = window.prompt("Action: rename / dup / del", "");
              if (!action) return;
              const a = action.toLowerCase().trim();
              if (a === "dup" || a === "duplicate") duplicateSection(i);
              if (a === "del" || a === "delete") deleteSection(i);
              if (a === "rename") {
                const name = window.prompt("New name", s.name);
                if (name) useProgressionStore.getState().renameSection(name);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-sm text-black" aria-hidden>
                {i + 1}
              </div>
              <div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs muted-text">{s.progression.length} chords • {s.progression.reduce((sum, c) => sum + c.duration, 0)} beats</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-0.5 rounded bg-black/5 text-black flex items-center gap-1">
                <Repeat size={12} /> <span className="text-[11px]">{s.repeats || 1}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
