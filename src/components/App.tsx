import { ProgressionEditor } from "./ProgressionEditor/ProgressionEditor";
import { initializeRangeProgress } from "../utils/rangeProgress";
import { useEffect } from "react";

function App() {
  // Check if running in Electron
  const isElectron = typeof window !== "undefined" && window.electronAPI;

  useEffect(() => {
    // Initialize range slider progress indication
    initializeRangeProgress();
  }, []);

  return (
    <div className="h-screen bg-app flex flex-col">
      {/* Header */}
      <header className="panel border-b px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold panel-title">ChordGen Pro</h1>
            <p className="text-xs muted-text">Chord Progression Generator</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 pattern-badge text-xs">Ready</span>
            {isElectron && (
              <span className="px-2 py-1 quality-min text-xs">Electron</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="flex-1 overflow-hidden">
        <ProgressionEditor />
      </main>
    </div>
  );
}

export default App;
