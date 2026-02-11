/**
 * VelocityCurveDrawer - Simple velocity curve drawing interface
 * 
 * Allows users to draw velocity curves for chord beats with mouse/touch.
 * Not precision-focused - just establish loud/medium/quiet dynamics.
 */

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface VelocityCurveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  duration: number; // Number of beats in the chord
  velocities: number[]; // Current velocity values (0-127)
  onSave: (velocities: number[]) => void;
  chordName?: string;
}

export default function VelocityCurveDrawer({
  isOpen,
  onClose,
  duration,
  velocities,
  onSave,
  chordName = 'Chord',
}: VelocityCurveDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [curvePoints, setCurvePoints] = useState<number[]>(velocities.length === duration ? velocities : Array(duration).fill(100));

  // Initialize curve points when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurvePoints(velocities.length === duration ? [...velocities] : Array(duration).fill(100));
    }
  }, [isOpen, velocities, duration]);

  // Draw the curve on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal lines (velocity levels)
    const levels = [127, 100, 64, 32, 0]; // Loud, Med-High, Medium, Quiet, Silent
    levels.forEach(level => {
      const y = height - (level / 127) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    // Vertical lines (beat divisions)
    const beatWidth = width / duration;
    for (let i = 0; i <= duration; i++) {
      const x = i * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw velocity curve
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    curvePoints.forEach((velocity, idx) => {
      const x = (idx + 0.5) * beatWidth;
      const y = height - (velocity / 127) * height;
      
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw velocity points
    ctx.fillStyle = '#06b6d4';
    curvePoints.forEach((velocity, idx) => {
      const x = (idx + 0.5) * beatWidth;
      const y = height - (velocity / 127) * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    // Velocity level labels
    const labels = ['Loud', 'Med+', 'Med', 'Quiet', 'Off'];
    levels.forEach((level, idx) => {
      const y = height - (level / 127) * height;
      ctx.fillText(labels[idx], 35, y + 3);
    });

  }, [curvePoints, duration]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const beatWidth = width / duration;

    // Determine which beat was clicked
    const beatIdx = Math.floor(x / beatWidth);
    if (beatIdx < 0 || beatIdx >= duration) return;

    // Calculate velocity from Y position (inverted: top = high velocity)
    const velocity = Math.max(0, Math.min(127, Math.round((1 - y / height) * 127)));

    // Update curve points
    const newCurve = [...curvePoints];
    newCurve[beatIdx] = velocity;
    setCurvePoints(newCurve);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    handleCanvasInteraction(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    handleCanvasInteraction(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    onSave(curvePoints);
    onClose();
  };

  const handleReset = () => {
    setCurvePoints(Array(duration).fill(100));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-lg shadow-2xl p-6 w-[600px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Velocity Curve - {chordName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Canvas area */}
        <div className="mb-4 bg-black/50 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            className="w-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Instructions */}
        <div className="mb-4 text-sm text-gray-400">
          <p>Click or drag on the canvas to draw velocity curve for each beat.</p>
          <p className="text-xs mt-1 opacity-70">Top = Loud (127), Middle = Medium (64), Bottom = Quiet (0)</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm font-semibold"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded transition-colors text-sm font-semibold"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
