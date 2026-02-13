import { useState, useEffect } from 'react';

interface BeatPadContextMenuProps {
  /** Position to render menu */
  x: number;
  y: number;
  /** Current velocity value (0-127) */
  velocity: number;
  /** Current gate value as percent (0-200) */
  gate: number;
  /** Beat number being edited */
  beatNumber: number;
  /** Callback when beat params change */
  onUpdate: (params: { velocity: number; gate: number }) => void;
  /** Callback to close menu */
  onClose: () => void;
}

export function BeatPadContextMenu({
  x,
  y,
  velocity: initialVelocity,
  gate: initialGate,
  beatNumber,
  onUpdate,
  onClose,
}: BeatPadContextMenuProps) {
  const [velocity, setVelocity] = useState(initialVelocity);
  const [gate, setGate] = useState(initialGate);

  useEffect(() => {
    setVelocity(initialVelocity);
    setGate(initialGate);
  }, [initialVelocity, initialGate]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.beat-pad-context-menu')) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleApply = () => {
    onUpdate({ velocity, gate });
    onClose();
  };

  return (
    <div
      className="beat-pad-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
      }}
    >
      <div className="px-4 py-3 rounded-lg panel bg-popover border-2 border-border shadow-xl min-w-[240px]">
        <div className="mb-3 text-xs font-semibold text-turquoise">
          Beat {beatNumber} MIDI
        </div>

        {/* Velocity Slider */}
        <div className="mb-3">
          <label className="flex items-center justify-between mb-1 text-[10px] muted-text">
            <span>Velocity</span>
            <span className="font-mono text-yellow">{velocity}</span>
          </label>
          <input
            type="range"
            min="0"
            max="127"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-full h-2"
          />
          <div className="flex justify-between mt-0.5 text-[9px] opacity-40">
            <span>0</span>
            <span>64</span>
            <span>127</span>
          </div>
        </div>

        {/* Gate Slider */}        
        <div className="mb-3">
          <label className="flex items-center justify-between mb-1 text-[10px] muted-text">
            <span>Gate %</span>
            <span className="font-mono text-yellow">{gate}</span>
          </label>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={gate}
            onChange={(e) => setGate(Number(e.target.value))}
            className="w-full h-2"
          />
          <div className="flex justify-between mt-0.5 text-[9px] opacity-40">
            <span>0</span>
            <span>100</span>
            <span>200</span>
          </div>
          <div className="mt-1 text-[9px] opacity-60 text-center">
            {gate > 100 ? "Legato feel" : "Staccato/Break feel"}
          </div>
          <div className="mt-2 flex gap-1">
            <button
              onClick={() => setGate(100)}
              className="flex-1 px-1.5 py-1 text-[9px] rounded border border-border hover:bg-muted transition-colors"
            >
              Break 100
            </button>
            <button
              onClick={() => setGate(150)}
              className="flex-1 px-1.5 py-1 text-[9px] rounded border border-border hover:bg-muted transition-colors"
            >
              Legato 150
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              setVelocity(100);
              setGate(150);
            }}
            className="flex-1 px-2 py-1.5 text-[10px] rounded border border-border hover:bg-muted transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-2 py-1.5 text-[10px] font-bold rounded btn-yellow transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
