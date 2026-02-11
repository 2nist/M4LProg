import React, { useEffect } from "react";
import { useHardwareStore } from "@stores/hardwareStore";
import { useOSCStore } from "@stores/oscStore";

export const ConnectionStatus: React.FC = () => {
  // MIDI State
  const isMidiConnected = useHardwareStore((state) => state.isConnected);
  const initializeMidi = useHardwareStore((state) => state.initializeMIDI);

  // OSC State
  const isOscConnected = useOSCStore((state) => state.isConnected);
  const connectOsc = useOSCStore((state) => state.connect);

  // Auto-connect on mount
  useEffect(() => {
    if (!isMidiConnected) initializeMidi();
    if (!isOscConnected) connectOsc();
  }, []);

  const handleReconnect = () => {
    if (!isMidiConnected) initializeMidi();
    if (!isOscConnected) connectOsc();
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-sm">
      {/* MIDI Indicator */}
      <div className="flex items-center gap-2" title="ATOM SQ Connection">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            isMidiConnected
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium text-gray-300">MIDI</span>
      </div>

      <div className="w-px h-4 bg-gray-700" />

      {/* OSC Indicator */}
      <div className="flex items-center gap-2" title="Ableton Live Connection">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            isOscConnected
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              : "bg-red-500"
          }`}
        />
        <span className="text-sm font-medium text-gray-300">Live</span>
      </div>

      {/* Reconnect Action */}
      {(!isMidiConnected || !isOscConnected) && (
        <button
          onClick={handleReconnect}
          className="px-3 py-1 ml-2 text-xs font-medium text-white transition-colors bg-blue-600 rounded hover:bg-blue-500"
        >
          Reconnect
        </button>
      )}
    </div>
  );
};
