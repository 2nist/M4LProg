import { useEffect } from "react";
import { useLiveStore } from "../stores/liveStore";
import { useProgressionStore } from "../stores/progressionStore";

/**
 * Live Transport Panel
 * Shows connection status, tempo, and basic controls
 */
export function LiveTransportPanel() {
  const {
    isConnected,
    transport,
    tracks,
    selectedTrackIndex,
    initializeOSC,
    createProgression,
    selectTrack,
  } = useLiveStore();

  const { getCurrentSection } = useProgressionStore();

  useEffect(() => {
    // Auto-connect on mount
    initializeOSC();
  }, [initializeOSC]);

  const handleSendToLive = () => {
    const currentSection = getCurrentSection();
    createProgression(currentSection.progression);
  };

  return (
    <div className="p-4 card rounded-lg">
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ableton Live</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "status-on" : "status-off"}`} />
            <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>

        {/* Transport Info */}
        {isConnected && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="muted-text">Tempo:</span>
              <span className="font-mono">
                {transport.tempo.toFixed(1)} BPM
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="muted-text">Position:</span>
              <span className="font-mono">
                {transport.currentBeat.toFixed(2)} beats
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="muted-text">Status:</span>
              <span className={transport.isPlaying ? "status-on-text" : "muted-text"}>
                {transport.isPlaying ? "▶ Playing" : "⏸ Stopped"}
              </span>
            </div>
          </div>
        )}

        {/* Track Selection */}
        {isConnected && tracks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm muted-text">Target Track:</label>
            <select
              title="Target Track"
              value={selectedTrackIndex}
              onChange={(e) => selectTrack(Number(e.target.value))}
              className="w-full px-3 py-2 input rounded-lg"
            >
              {tracks.map((track) => (
                <option key={track.index} value={track.index}>
                  {track.index + 1}. {track.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Send to Live Button */}
        <button
          onClick={handleSendToLive}
          disabled={!isConnected}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isConnected ? "btn-primary" : "btn-disabled"
          }`}
        >
          Send to Live
        </button>

        {/* Help Text */}
        {!isConnected && (
          <p className="text-xs muted-text text-center">
            Make sure ChordGen Live Helper device is loaded in Ableton
          </p>
        )}
      </div>
    </div>
  );
}
