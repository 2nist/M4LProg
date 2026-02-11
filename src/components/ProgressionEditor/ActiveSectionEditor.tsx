import React, { useState, useEffect } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import { Plus, Copy, Trash2 } from "lucide-react";

export default function ActiveSectionEditor() {
  const {
    getCurrentSection,
    updateCurrentSection,
    createSection,
    duplicateSection,
    deleteSection,
    renameSection,
    currentSectionIndex,
  } = useProgressionStore();

  const section = getCurrentSection();

  const [name, setName] = useState(section.name || "");
  const [repeats, setRepeats] = useState(section.repeats || 1);
  const [beatsPerBar, setBeatsPerBar] = useState(section.beatsPerBar || 4);
  const [transition, setTransition] = useState(section.transition || "none");

  useEffect(() => {
    setName(section.name || "");
    setRepeats(section.repeats || 1);
    setBeatsPerBar(section.beatsPerBar || 4);
    setTransition(section.transition || "none");
  }, [section, currentSectionIndex]);

  const save = () => {
    const updated = {
      ...section,
      name,
      repeats: Number(repeats),
      beatsPerBar: Number(beatsPerBar),
      transition,
    };
    updateCurrentSection(updated);
    renameSection(name);
  };

  return (
    <div>
      <div className="mb-1 text-xs muted-text">Active Section</div>

      <div className="flex flex-col gap-2">
        <div>
          <label className="text-[10px] muted-text block mb-1">Section Name</label>
          <input
            className="w-full text-sm rounded px-2 py-1 compact input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] muted-text block mb-1">Repeats</label>
            <select
              className="w-full h-8 text-xs compact"
              value={repeats}
              onChange={(e) => setRepeats(Number(e.target.value))}
              onBlur={save}
            >
              {[1,2,3,4,6,8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] muted-text block mb-1">Beats / Bar</label>
            <select
              className="w-full h-8 text-xs compact"
              value={beatsPerBar}
              onChange={(e) => setBeatsPerBar(Number(e.target.value))}
              onBlur={save}
            >
              {[3,4,5,6,7,8].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] muted-text block mb-1">Transition</label>
          <select
            className="w-full h-8 text-xs compact"
            value={transition}
            onChange={(e) => setTransition(e.target.value)}
            onBlur={save}
          >
            <option value="none">None</option>
            <option value="smooth">Smooth</option>
            <option value="jump">Jump</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1 px-2 py-1 text-[10px] btn-muted rounded"
            onClick={() => createSection()}
            title="Add new section"
          >
            <Plus size={12} /> New
          </button>

          <button
            className="flex items-center gap-1 px-2 py-1 text-[10px] btn-muted rounded"
            onClick={() => duplicateSection(useProgressionStore.getState().currentSectionIndex)}
            title="Duplicate section"
          >
            <Copy size={12} /> Dup
          </button>

          <button
            className="flex items-center gap-1 px-2 py-1 text-[10px] btn-danger rounded"
            onClick={() => deleteSection(useProgressionStore.getState().currentSectionIndex)}
            title="Delete section"
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
