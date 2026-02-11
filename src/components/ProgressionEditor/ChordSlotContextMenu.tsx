import { useState, useEffect } from 'react';

interface ChordSlotContextMenuProps {
  /** Position to render menu */
  x: number;
  y: number;
  /** Current splits value (1-16) */
  splits: number;
  /** Chord slot number being edited */
  slotNumber: number;
  /** Callback when splits changes */
  onUpdate: (splits: number) => void;
  /** Callback to close menu */
  onClose: () => void;
}

// Musical split divisions that snap nicely
const SPLIT_SNAP_POINTS = [1, 2, 3, 4, 6, 8, 12, 16];

export function ChordSlotContextMenu({
  x,
  y,
  splits: initialSplits,
  slotNumber,
  onUpdate,
  onClose,
}: ChordSlotContextMenuProps) {
  const [splits, setSplits] = useState(initialSplits);

  // Snap splits to nearest musical division
  const snapSplits = (value: number): number => {
    const closest = SPLIT_SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    return closest;
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chord-slot-context-menu')) {
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
    onUpdate(splits);
    onClose();
  };

  const handleSplitsChange = (value: number) => {
    const snapped = snapSplits(value);
    setSplits(snapped);
  };

  return (
    <div
      className="chord-slot-context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 1000,
      }}
    >
      <div className="px-4 py-3 rounded-lg panel bg-popover border-2 border-border shadow-xl min-w-60">
        <div className="mb-3 text-xs font-semibold text-orange">
          Chord Slot {slotNumber} - Splits
        </div>

        {/* Splits Slider with Snap Points */}
        <div className="mb-3">
          <label className="flex items-center justify-between mb-1 text-[10px] muted-text">
            <span>Re-triggers for Chord Duration</span>
            <span className="font-mono text-yellow">{splits}</span>
          </label>
          <input
            type="range"
            min="1"
            max="16"
            step="1"
            value={splits}
            onChange={(e) => handleSplitsChange(Number(e.target.value))}
            className="w-full h-2"
            title="Splits"
            aria-label="Chord splits"
          />
          <div className="flex justify-between mt-0.5 text-[9px] opacity-40">
            <span>1</span>
            <span>2</span>
            <span>4</span>
            <span>8</span>
            <span>16</span>
          </div>
          <div className="mt-1 text-[9px] opacity-60 text-center">
            {splits === 1 ? 'Legato (no splits)' : `Split into ${splits} parts`}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 4, 8].map((preset) => (
            <button
              key={preset}
              onClick={() => setSplits(preset)}
              className={`flex-1 px-1.5 py-1 text-[9px] rounded border transition-colors ${
                splits === preset
                  ? 'border-orange bg-orange text-black'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {preset === 1 ? 'Legato' : `${preset}x`}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              setSplits(1);
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
