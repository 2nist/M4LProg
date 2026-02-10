import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Section } from "../../types/progression";
import type { Chord } from "../../types/chord";

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
  switch (quality) {
    case "Maj":
    case "Maj7":
      return "quality-maj";
    case "min":
    case "min7":
      return "quality-min";
    case "dom7":
    case "dom9":
      return "quality-dom";
    case "dim":
    case "dim7":
      return "quality-dim";
    case "aug":
      return "quality-aug";
    default:
      return "pad-default muted-text";
  }
}

export default function ProgressionStrip(props: Props) {
  const {
    section,
    progression: progressionProp,
    selectedSlot,
    selectedSlotIndex,
    onSelect,
    onSelectSlot,
    compact = true,
    // onUpdateSlot (kept in Props for external use) is not used here
    onSetSectionRepeats,
    onSetSectionBeatsPerBar,
  } = props;

  const progression = progressionProp || section?.progression || [];
  const selected = selectedSlot ?? selectedSlotIndex ?? null;

  const compactClass = compact ? "text-xs" : "text-sm";

  const [zoom, setZoom] = useState(0.45);
  const [fitToView, setFitToView] = useState(true); // Default to fit-to-view to avoid scrolling
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

  const beatsPerBar = section?.beatsPerBar || 4;

  // compute base pxPerBeat from zoom (use gentle curve for sensitivity)
  const basePxPerBeat = useMemo(() => {
    const t = Math.pow(zoom, 0.8); // non-linear feel
    return Math.round(MIN_PX + (MAX_PX - MIN_PX) * t);
  }, [zoom]);

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
  const pxPerBeat = useMemo(() => {
    if (!totalBeats) return basePxPerBeat;
    const padding = 48; // left/right padding allowance

    // if fit mode, compute px so entire progression fits available width
    if (fitToView) {
      const fit = Math.floor(
        Math.max(4, (viewportWidth - padding) / totalBeats),
      );
      return Math.max(4, Math.min(basePxPerBeat, fit));
    }

    // otherwise, apply a responsive cap based on viewport and a minimum visible beats
    const minVisibleBeats = 6; // prefer to show at least this many beats in overview
    const responsiveCap = Math.max(
      12,
      Math.floor((viewportWidth - padding) / minVisibleBeats),
    );
    return Math.max(4, Math.min(basePxPerBeat, responsiveCap));
  }, [fitToView, totalBeats, viewportWidth, basePxPerBeat]);

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
    // Make container fit within viewport width when possible, but allow minimum width for readability
    const maxContainerWidth = Math.max(400, viewportWidth - 48); // Account for padding
    const naturalWidth = Math.max(200, effectiveBeats * pxPerBeat);
    const containerWidth = Math.min(naturalWidth, maxContainerWidth);
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
      <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold muted-text">Progression</h3>
        <div className="flex items-center gap-3">
            <div className="text-xs muted-text">Zoom</div>
          <input
            aria-label="Progression zoom"
            title="Progression zoom"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="compact"
          />
            <div className="text-xs muted-text">{pxPerBeat} px/beat</div>

          {/* progression summary and section repeat controls */}
          <div className="ml-3 text-xs muted-text flex items-center gap-3">
            <div>
                <div className="text-xs muted-text">Progression</div>
              <div className="text-sm">
                {Math.ceil(totalBeats / beatsPerBar)} bars • {totalBeats} beats
              </div>
            </div>

            <div>
                <div className="text-xs muted-text">Section repeats</div>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Section repeats"
                  title="Section repeats (1-16)"
                  type="number"
                  min={1}
                  max={16}
                  value={section?.repeats || 1}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 1;
                    const clamped = Math.max(1, Math.min(16, Math.floor(v)));
                    onSetSectionRepeats?.(clamped);
                  }}
                  className="w-16 px-2 py-1 compact text-center"
                />
              </div>
            </div>

            <div>
                <div className="text-xs muted-text">Beats / bar</div>
              <div className="flex items-center gap-2">
                <input
                  aria-label="Beats per bar"
                  title="Beats per bar (time signature)"
                  type="number"
                  min={1}
                  max={12}
                  value={section?.beatsPerBar || 4}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 4;
                    const clamped = Math.max(1, Math.min(12, Math.floor(v)));
                    onSetSectionBeatsPerBar?.(clamped);
                  }}
                  className="w-16 px-2 py-1 compact text-center"
                />
              </div>
            </div>

            <div>
                <div className="text-xs muted-text">Section length</div>
              <div className="text-sm">
                {Math.ceil(
                  (totalBeats * (section?.repeats || 1)) /
                    (section?.beatsPerBar || 4),
                )}{" "}
                bars • {totalBeats * (section?.repeats || 1)} beats
              </div>
            </div>
          </div>

          <div className="ml-2 flex items-center gap-2">
            <button
              title="Fit to view"
              onClick={() => setFitToView((v) => !v)}
              className={`px-2 py-1 rounded compact ${fitToView ? "btn-primary" : "card"}`}
            >
              Fit
            </button>
            <button
              title="Preset: Detailed"
              onClick={() => {
                setFitToView(false);
                setZoom(0.95);
              }}
              className="px-2 py-1 card rounded compact"
            >
              2x
            </button>
            <button
              title="Preset: Overview"
              onClick={() => {
                setFitToView(true);
              }}
              className="px-2 py-1 card rounded compact"
            >
              Auto
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-hidden overflow-y-visible pb-6 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`flex items-end gap-2 mt-2.5 ps-container-${instanceId}`}>
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
                  className={`h-20 w-full px-2 pt-0 pb-2 rounded-lg text-left transition-all flex flex-col ${getPadColor(
                    quality,
                  )} ${isSel ? "ring-2 ring-white shadow-lg scale-105" : "hover:brightness-110"}`}
                  title={`Slot ${idx + 1} - ${NOTE_NAMES[root % 12]} ${quality || ""}`}
                  aria-pressed={isSel}
                >
                  <div className="w-full flex justify-between h-5">
                    {Array.from({ length: chord.duration || 1 }, (_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full bg-current opacity-60 rounded-sm mx-0.5"
                      />
                    ))}
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <div
                      className={`font-semibold text-sm ${isEmpty ? "opacity-40 italic" : ""}`}
                    >
                      {isEmpty ? "Empty" : `${NOTE_NAMES[root % 12]}${quality || ""}`}
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
    </div>
  );
}
