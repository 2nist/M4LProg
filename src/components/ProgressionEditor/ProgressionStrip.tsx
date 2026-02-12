import { useMemo, useState, useRef, useEffect } from "react";
import { computePxPerBeat } from "../../utils/pxPerBeat";
import { motion } from "framer-motion";
import { Section } from "../../types/progression";
import type { Chord } from "../../types/chord";
import { ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  // either provide a full section or a raw progression
  section?: Section;
  progression?: Chord[];
  // selection handlers (either name accepted for compatibility)
  selectedSlot?: number | null;
  selectedSlotIndex?: number | null;
  onSelect?: (index: number) => void;
  onSelectSlot?: (index: number) => void;
  compact?: boolean;
  // optional update callbacks when using section
  onUpdateSlot?: (index: number, patch: Partial<Chord>) => void;
  onSetSectionRepeats?: (repeats: number) => void;
  onSetSectionBeatsPerBar?: (beats: number) => void;
  // Velocity drawer callback
  onVelocityDrawerOpen?: (chordIndex: number) => void;
};

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function getPadColor(quality?: string) {
  if (!quality) return "pad-default muted-text";
  
  // Core theme colors (most common chords)
  if (quality.includes("Maj")) return "quality-maj"; // Orange
  if (quality.includes("min")) return "quality-min"; // Turquoise
  if (quality.includes("dom")) return "quality-dom"; // Yellow
  
  // Outlier colors (special/rare chords)
  if (quality.includes("dim")) return "quality-dim"; // Purple
  if (quality.includes("aug")) return "quality-aug"; // Pink
  if (quality.includes("sus")) return "quality-sus"; // Red
  if (quality.includes("add") || quality.includes("9") || quality.includes("11") || quality.includes("13")) return "quality-ext"; // Green
  if (quality.includes("b5") || quality.includes("#5") || quality.includes("#9") || quality.includes("b9")) return "quality-alt"; // Blue
  
  return "pad-default muted-text";
}

export default function ProgressionStrip(props: Props) {
  const {
    section,
    progression: progressionProp,
    selectedSlot,
    selectedSlotIndex,
    onSelect,
    onSelectSlot,
    compact: _compact = true,
    // onUpdateSlot (kept in Props for external use) is not used here
    onUpdateSlot,
    onSetSectionRepeats,
    onSetSectionBeatsPerBar,
    onVelocityDrawerOpen,
  } = props;

  const progression = progressionProp || section?.progression || [];
  const selected = selectedSlot ?? selectedSlotIndex ?? null;

  const [zoom, setZoom] = useState(0.45);
  const [fitToView, _setFitToView] = useState(true); // Default to fit-to-view to avoid scrolling
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(800);

  // generate a unique id for this strip instance for dynamic CSS
  const instanceIdRef = useRef<string | null>(null);
  if (!instanceIdRef.current)
    instanceIdRef.current = `ps-${Math.random().toString(36).slice(2, 9)}`;
  const instanceId = instanceIdRef.current;

  // visual sizing bounds
  const MIN_PX = 10;
  const MAX_PX = 48;

  const totalBeats = useMemo(
    () => progression.reduce((s, c) => s + (c.duration || 1), 0),
    [progression],
  );

  

  // measure container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportWidth(el.clientWidth || 800);
    });
    ro.observe(el);
    // initial
    setViewportWidth(el.clientWidth || 800);
    return () => ro.disconnect();
  }, []);

  // responsive cap to avoid absurdly large px/beat on small viewports
  // compute pxPerBeat using shared util
  const pxPerBeat = useMemo(() => {
    return computePxPerBeat({
      zoom,
      minPx: MIN_PX,
      maxPx: MAX_PX,
      fitToView,
      totalBeats,
      viewportWidth,
    });
  }, [zoom, fitToView, totalBeats, viewportWidth]);

  // inject dynamic CSS for container and slot widths to avoid inline styles in JSX
  useEffect(() => {
    const styleId = `ps-dynamic-${instanceId}`;
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const sectionRepeats = section?.repeats || 1;
    const effectiveBeats = Math.max(1, totalBeats * sectionRepeats);
    // Allow natural width for chords - don't constrain to viewport, let it scroll
    const containerWidth = Math.max(200, effectiveBeats * pxPerBeat);
    let css = ` .ps-container-${instanceId} { width: ${containerWidth}px; }\n`;

    progression.forEach((chord, idx) => {
      const beatWidth = (chord.duration || 1) * pxPerBeat;
      css += `.ps-slot-${instanceId}-${idx} { width: ${beatWidth}px; }\n`;
    });

    styleEl.textContent = css;

    return () => {
      // remove style element when component unmounts
      if (styleEl && styleEl.parentNode)
        styleEl.parentNode.removeChild(styleEl);
    };
  }, [instanceId, progression, totalBeats, pxPerBeat]);

  // mouse/touch drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // scroll speed multiplier
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSelect = (i: number) => {
    onSelect?.(i);
    onSelectSlot?.(i);
  };

  return (
    <div className="w-full mt-3 overflow-y-hidden" ref={containerRef}>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto overflow-y-visible pb-6 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`flex items-end gap-2 mt-2.5 ps-container-${instanceId}`}
        >
          {progression.map((chord, idx) => {
            const isSel = selected === idx;
            const quality = chord.metadata?.quality as any;
            const root =
              typeof chord?.metadata?.root === "number"
                ? chord.metadata!.root!
                : 60;
            const isEmpty = !(chord && (chord.notes || []).length);
            return (
              <div
                key={idx}
                className={`relative ps-slot-${instanceId}-${idx}`}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(idx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onVelocityDrawerOpen?.(idx);
                  }}
                  className={`h-20 w-full px-2 pt-0 pb-2 rounded-lg text-left transition-all flex flex-col ${getPadColor(
                    quality,
                  )} ${isSel ? "ring-2 ring-white shadow-lg scale-105" : "hover:brightness-110"}`}
                  title={`Slot ${idx + 1} - ${NOTE_NAMES[root % 12]} ${quality || ""}`}
                  aria-pressed={isSel}
                >
                  <div className="w-full flex justify-between h-5 gap-0.5 p-0.5">
                    {Array.from({ length: chord.duration || 1 }, (_, beatIdx) => {
                      const gate = chord.metadata?.gate || [];
                      const isLegato = (gate[beatIdx] ?? 150) > 100;
                      const velocity = chord.metadata?.velocities?.[beatIdx] ?? 100;
                      const heightPercent = (velocity / 127) * 100;
                      
                      return (
                        <div
                          key={beatIdx}
                          className={`flex-1 h-full rounded-sm transition-all cursor-pointer ${
                            isLegato 
                              ? 'bg-green-500 opacity-80 hover:opacity-100' 
                              : 'bg-red-500 opacity-60 hover:opacity-80'
                          }`}
                          style={{
                            minHeight: `${Math.max(20, heightPercent * 0.3)}%`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle break for this beat (default is legato)
                            const newGate = [...(chord.metadata?.gate || Array(chord.duration).fill(150))];
                            newGate[beatIdx] = (newGate[beatIdx] ?? 150) > 100 ? 100 : 150;
                            onUpdateSlot?.(idx, {
                              metadata: {
                                ...chord.metadata,
                                gate: newGate
                              }
                            });
                          }}
                          title={`Beat ${beatIdx + 1}: ${isLegato ? 'Legato (click to break)' : 'Break (click for legato)'} • Vel: ${velocity}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div
                      className={`font-semibold text-sm ${isEmpty ? "opacity-40 italic" : ""}`}
                    >
                      {isEmpty
                        ? "Empty"
                        : `${NOTE_NAMES[root % 12]}${quality || ""}`}
                    </div>
                    {!isEmpty && (
                      <div className="text-xs opacity-75 mt-1">
                        {(chord.notes || [])
                          .map((n) => NOTE_NAMES[n % 12])
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </motion.button>

                {/* per-slot repeat removed — repeats are section-level */}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom controls bar - Zoom and Parameters */}
      <div className="flex items-center gap-8 py-3 px-4 mt-2 border-t border-border bg-surface/30 rounded-lg">
        {/* Zoom control */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wide muted-text font-medium">Zoom</span>
          <ZoomOut size={14} className="muted-text" />
          <input
            aria-label="Progression zoom"
            title="Progression zoom"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="progression-zoom-slider"
          />
          <ZoomIn size={14} className="muted-text" />
          <span className="text-xs muted-text font-mono">{pxPerBeat}px/b</span>
        </div>

        {/* Spacer for chord view area */}
        <div className="flex-1"></div>

        {/* Section repeats slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wide muted-text font-medium">Repeats</span>
          <input
            aria-label="Section repeats"
            title="Section repeats (1-16)"
            type="range"
            min={1}
            max={16}
            step={1}
            value={section?.repeats || 1}
            onChange={(e) => {
              const v = Number(e.target.value) || 1;
              onSetSectionRepeats?.(v);
            }}
            className="progression-param-slider"
          />
          <span className="text-xs muted-text font-mono w-6 text-center">{section?.repeats || 1}</span>
        </div>

        {/* Beats per bar slider */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wide muted-text font-medium">Beats/Bar</span>
          <input
            aria-label="Beats per bar"
            title="Beats per bar (time signature)"
            type="range"
            min={1}
            max={12}
            step={1}
            value={section?.beatsPerBar || 4}
            onChange={(e) => {
              const v = Number(e.target.value) || 4;
              onSetSectionBeatsPerBar?.(v);
            }}
            className="progression-param-slider"
          />
          <span className="text-xs muted-text font-mono w-6 text-center">{section?.beatsPerBar || 4}</span>
        </div>
      </div>
    </div>
  );
}
