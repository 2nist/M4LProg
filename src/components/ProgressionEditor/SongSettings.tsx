import React, { useState } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import { useHardwareStore } from "@stores/hardwareStore";

export default function SongSettings() {
  const { saveProgression, setKeyRoot, keyRoot } = useProgressionStore();
  const { isConnected, initializeMIDI } = useHardwareStore();

  const [title, setTitle] = useState<string>("Untitled Song");
  const [tempo, setTempo] = useState<number>(120);
  const [timeSig, setTimeSig] = useState<string>("4/4");

  const handleSave = () => {
    if (!title) {
      alert("Enter a title before saving");
      return;
    }

    saveProgression(title, { tempo, timeSignature: timeSig, key: keyRoot });
    alert("Saved progression: " + title);
  };

  const handleExport = () => {
    const store = useProgressionStore.getState();
    const snapshot = {
      sections: store.sections,
      meta: { title, tempo, timeSig, keyRoot: store.keyRoot },
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_") || "progression"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-1 text-xs muted-text">Song Settings</div>

      <div className="flex flex-col gap-2">
        <div>
          <label className="text-[10px] muted-text block mb-1">Song Title</label>
          <input
            className="w-full text-sm rounded px-2 py-1 compact input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Song"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] muted-text block mb-1">Tempo (BPM)</label>
            <input
              className="w-full text-sm rounded px-2 py-1 compact input"
              type="number"
              min={20}
              max={400}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="text-[10px] muted-text block mb-1">Time Signature</label>
            <select
              className="w-full h-8 text-xs compact"
              value={timeSig}
              onChange={(e) => setTimeSig(e.target.value)}
            >
              <option>4/4</option>
              <option>3/4</option>
              <option>6/8</option>
              <option>5/4</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] muted-text block mb-1">Global Key</label>
          <select
            className="w-full h-8 text-xs compact"
            value={keyRoot}
            onChange={(e) => setKeyRoot(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={60 + i}>
                {i === 0 ? "C" : "" /* simple placeholder - display handled by parent */}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex-1 btn-primary px-3 py-1" onClick={handleSave}>
            Save Progression
          </button>

          <button className="flex-1 btn-muted px-3 py-1" onClick={handleExport}>
            Export
          </button>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="text-xs muted-text">Ableton Connection</div>
          <div>
            {isConnected ? (
              <span className="text-xs text-green-600">Connected</span>
            ) : (
              <button className="text-xs btn-muted px-2 py-1" onClick={() => initializeMIDI()}>
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
