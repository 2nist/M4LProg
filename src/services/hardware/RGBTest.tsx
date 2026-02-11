import React, { useState } from "react";
import { useHardwareStore } from "../../stores/hardwareStore";
import { PAD_COLORS } from "../../services/hardware/HardwareService";

export const RGBTest: React.FC = () => {
  const setPadState = useHardwareStore((state) => state.setPadState);
  const [selectedColor, setSelectedColor] = useState<number>(
    PAD_COLORS.PLAYING,
  );

  // ATOM SQ Pads typically map to notes 36-51 (Bank 1)
  // We render them in a 2x8 grid to match the physical layout
  const pads = Array.from({ length: 16 }, (_, i) => 36 + i);

  const handlePadClick = (note: number) => {
    setPadState(note, selectedColor);
  };

  const handleClear = () => {
    pads.forEach((note) => setPadState(note, PAD_COLORS.OFF));
  };

  return (
    <div className="max-w-3xl p-6 mx-auto mt-8 bg-gray-900 border border-gray-800 shadow-lg rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">RGB Feedback Test</h2>
        <button
          onClick={handleClear}
          className="px-3 py-1 text-xs font-medium text-red-400 transition-colors border rounded hover:text-red-300 border-red-900/50 hover:border-red-800 bg-red-900/20"
        >
          Clear All Pads
        </button>
      </div>

      {/* Color Selection */}
      <div className="mb-8">
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Select Color
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PAD_COLORS).map(([name, value]) => (
            <button
              key={name}
              onClick={() => setSelectedColor(value)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                selectedColor === value
                  ? "border-white bg-gray-700 text-white shadow-md scale-105"
                  : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      name === "OFF"
                        ? "transparent"
                        : name === "WHITE" || name === "SELECTED"
                          ? "#fff"
                          : name === "RED" || name === "IN_KEY"
                            ? "#ef4444"
                            : name === "GREEN" || name === "PLAYING"
                              ? "#22c55e"
                              : name === "BLUE" || name === "ROOT"
                                ? "#3b82f6"
                                : name === "YELLOW"
                                  ? "#eab308"
                                  : name === "MAGENTA"
                                    ? "#d946ef"
                                    : "#9ca3af", // Default gray for others
                    border: name === "OFF" ? "1px solid #666" : "none",
                  }}
                />
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pad Grid (2x8 layout for ATOM SQ) */}
      <div>
        <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
          Pad Grid (Notes 36-51)
        </h3>
        <div className="grid grid-cols-8 gap-3">
          {pads.map((note) => (
            <button
              key={note}
              onClick={() => handlePadClick(note)}
              className="flex items-center justify-center font-mono text-xs text-gray-600 transition-all bg-gray-800 border border-gray-700 rounded-lg aspect-square hover:border-gray-500 hover:bg-gray-750 active:scale-95 active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {note}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
