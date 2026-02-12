/**
 * LoopTimeline Component
 *
 * Expandable timeline with analog warmth styling
 * Features: drag-to-resize, multiple view modes, drag-drop sections
 */

import { useCallback, useMemo, useRef, useEffect, useState, memo } from "react";
import { 
  X, 
  SkipBack, 
  Rewind, 
  Play, 
  Pause, 
  FastForward, 
  SkipForward, 
  Repeat,
  ZoomIn,
  ZoomOut,
  Minimize2,
  Square,
  Maximize2,
  Maximize
} from "lucide-react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useExpandableTimeline } from "../../hooks/useExpandableTimeline";
import usePlayheadSync from "../../hooks/usePlayheadSync";
import { computePxPerBeat } from "../../utils/pxPerBeat";
import { useProgressionStore } from "../../stores/progressionStore";
import { useLiveStore } from "../../stores/liveStore";
import "./timeline-analog.css";

// Helper to convert MIDI note to name (module-scoped so static components can use it)
const midiToNoteName = (midi: number): string => {
  const noteNames = [
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
  return noteNames[midi % 12];
};

// Local interfaces to replace any types
interface ChordData {
  duration: number;
  metadata?: {
    root?: number;
    quality?: string;
  };
}

interface SectionData {
  id: string | number;
  name: string;
  progression: ChordData[];
  repeats?: number;
  beatsPerBar?: number;
}

interface SortableSectionProps {
  section: SectionData;
  index: number;
  pixelsPerBeat: number;
  getActiveBeatInSection: (index: number) => number;
  markUserInteraction: () => void;
  onVelocityDragStart?: (section: SectionData, index: number) => void;
  onGateToggle?: (section: SectionData, index: number) => void;
}

interface TimelineSectionsProps {
  sections: SectionData[];
  pixelsPerBeat: number;
  getActiveBeatInSection: (index: number) => number;
  handleDragEnd: (from: number, to: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  markUserInteraction: () => void;
  disableDrag?: boolean;
  onVelocityDragStart?: (section: SectionData, index: number) => void;
  onGateToggle?: (section: SectionData, index: number) => void;
}

// Stable memoized TimelineSections component (defined at module scope to keep identity stable)
// Track and warn once if sections lack ids to avoid console spam
let warnedMissingDraggableId = false;

function SortableSection({
  section,
  index,
  pixelsPerBeat,
  getActiveBeatInSection,
  markUserInteraction,
}: SortableSectionProps) {
  const sectionBeats = section.progression.reduce(
    (s: number, c: any) => s + c.duration,
    0,
  );
  const sectionWidth = sectionBeats * pixelsPerBeat;
  const activeBeat = getActiveBeatInSection(index);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(section.id) });

  const style: any = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition,
    width: `${sectionWidth}px`,
    minWidth: `${sectionWidth}px`,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`section-card ${isDragging ? "dragging" : ""}`}
      style={style}
      onMouseDown={markUserInteraction}
    >
      <div className="duration-indicator">
        {Array.from({ length: Math.ceil(sectionBeats) }).map((_, i) => (
          <div
            key={i}
            className={`duration-beat ${i === activeBeat ? "active" : ""}`}
            style={{ width: `${pixelsPerBeat}px` }}
          />
        ))}
      </div>

      <div className="section-card-content">
        <div className="drag-handle" {...listeners} />

        <div className="section-header">
          <span className="section-name">{section.name}</span>
        </div>

        <div className="progression-chords">
          {section.progression.map((chord: any, chordIdx: number) => {
            const chordWidth = chord.duration * pixelsPerBeat;
            const rootNote =
              chord.metadata?.root !== undefined
                ? midiToNoteName(chord.metadata.root)
                : "";
            const quality = chord.metadata?.quality || "?";
            const fullChordName = rootNote ? `${rootNote}${quality}` : quality;
            
            return (
              <div
                key={chordIdx}
                className="chord-card"
                style={{ width: `${chordWidth}px` }}
              >
                {/* Chord label */}
                <div className="chord-label">
                  <span className="chord-name">{fullChordName}</span>
                  <span className="chord-duration">{chord.duration}b</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-detail-expanded">
          <div className="section-meta">
            <div className="section-meta-item">
              <span className="repeat-badge">×{section.repeats || 1}</span>
            </div>
            <div className="section-meta-item">
              <span>
                {Math.ceil(
                  (sectionBeats * (section?.repeats || 1)) /
                    (section?.beatsPerBar || 4),
                )}{" "}
                bars
              </span>
            </div>
            <div className="section-meta-item">
              <span>{section.progression.length} chords</span>
            </div>
            <div className="section-meta-item">
              <span>{sectionBeats} beats</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TimelineSectionsStatic = memo(function TimelineSectionsStatic({
  sections,
  pixelsPerBeat,
  getActiveBeatInSection,
  handleDragEnd,
  onDragStart,
  onDragEnd,
  markUserInteraction,
  disableDrag,
  onVelocityDragStart,
  onGateToggle,
}: TimelineSectionsProps) {
  const ids = sections.map((s: any) => String(s.id));

  const introBufferCards = (
    <>
      <div className="buffer-card">
        <span className="buffer-title">Song Overview</span>
        <div className="buffer-content">{sections.length} sections, 48 total beats</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">Key & Tempo</span>
        <div className="buffer-content">C Major, 120 BPM, 4/4</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">Pattern Info</span>
        <div className="buffer-content">I-V-vi-IV detected in Section 1</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">💡 Theory Tip</span>
        <div className="buffer-content">This progression creates tension and release</div>
      </div>
    </>
  );

  const outroBufferCards = (
    <>
      <div className="buffer-card">
        <span className="buffer-title">🔄 Looping back...</span>
        <div className="buffer-content">Repeating from Section 1</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">📝 Metadata</span>
        <div className="buffer-content">Saved: 2026-02-10, Tags: Pop</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">🎼 Harmonic Summary</span>
        <div className="buffer-content">Diatonic: 85%, Borrowed: 15%</div>
      </div>
      <div className="buffer-card">
        <span className="buffer-title">💡 Suggestion</span>
        <div className="buffer-content">Try adding a pre-chorus section</div>
      </div>
    </>
  );

  const renderStaticSection = (section: SectionData, index: number, keyOverride?: string) => {
    const sectionBeats =
      section?.progression?.reduce((s: number, c: any) => s + c.duration, 0) || 0;
    const sectionWidth = sectionBeats * pixelsPerBeat;
    const activeBeat = getActiveBeatInSection(index);

    return (
      <div
        key={keyOverride || section?.id || `section-static-${index}`}
        className="section-card static-section"
        style={{ width: `${sectionWidth}px`, minWidth: `${sectionWidth}px` }}
      >
        <div className="duration-indicator">
          {Array.from({ length: Math.ceil(sectionBeats || 0) }).map((_, i) => (
            <div
              key={i}
              className={`duration-beat ${i === activeBeat ? "active" : ""}`}
              style={{ width: `${pixelsPerBeat}px` }}
            />
          ))}
        </div>

        <div className="section-card-content">
          <div className="section-header">
            <span className="section-name">{section?.name || "Unnamed"}</span>
          </div>

          <div className="progression-chords">
            {section?.progression?.map((chord: any, chordIdx: number) => {
              const chordWidth = chord.duration * pixelsPerBeat;
              const rootNote =
                chord.metadata?.root !== undefined
                  ? midiToNoteName(chord.metadata.root)
                  : "";
              const quality = chord.metadata?.quality || "?";
              const fullChordName = rootNote ? `${rootNote}${quality}` : quality;
              
              return (
                <div key={chordIdx} className="chord-card" style={{ width: `${chordWidth}px` }}>
                  <span className="chord-name">{fullChordName}</span>
                  <span className="chord-duration">{chord.duration}b</span>
                </div>
              );
            })}
          </div>

          <div className="section-detail-expanded">
            <div className="section-meta">
              <div className="section-meta-item">
                <span className="repeat-badge">×{section?.repeats || 1}</span>
              </div>
              <div className="section-meta-item">
                <span>
                  {Math.ceil(
                    ((sectionBeats || 0) * (section?.repeats || 1)) /
                      (section?.beatsPerBar || 4),
                  )}{" "}
                  bars
                </span>
              </div>
              <div className="section-meta-item">
                <span>{section?.progression?.length || 0} chords</span>
              </div>
              <div className="section-meta-item">
                <span>{sectionBeats} beats</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (disableDrag) {
    return (
      <div
        className="timeline-scroll-container"
        onMouseDown={markUserInteraction}
        onTouchStart={markUserInteraction}
        onWheel={markUserInteraction}
        onScroll={markUserInteraction}
      >
        {introBufferCards}
        {sections.map((section: SectionData, index: number) =>
          renderStaticSection(section, index, `section-static-${index}`),
        )}
        {outroBufferCards}
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={() => onDragStart?.()}
      onDragEnd={(event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
          onDragEnd?.();
          return;
        }
        const fromIndex = sections.findIndex(
          (s: SectionData) => String(s.id) === String(active.id),
        );
        const toIndex = sections.findIndex(
          (s: SectionData) => String(s.id) === String(over.id),
        );
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          handleDragEnd(fromIndex, toIndex);
        }
        onDragEnd?.();
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          className="timeline-scroll-container"
          onMouseDown={markUserInteraction}
          onTouchStart={markUserInteraction}
          onWheel={markUserInteraction}
          onScroll={markUserInteraction}
        >
          {introBufferCards}

          {sections.map((section: SectionData, index: number) => {
            if (!section || !section.id) {
              if (!warnedMissingDraggableId) {
                // eslint-disable-next-line no-console
                console.warn(
                  "[Timeline] section missing id — rendering non-draggable fallback. Fix section ids to re-enable drag/drop.",
                  { index, section },
                );
                warnedMissingDraggableId = true;
              }

              return renderStaticSection(section, index, `section-fallback-${index}`);
            }

            return (
              <SortableSection
                key={String(section.id)}
                section={section}
                index={index}
                pixelsPerBeat={pixelsPerBeat}
                getActiveBeatInSection={getActiveBeatInSection}
                markUserInteraction={markUserInteraction}
                onVelocityDragStart={onVelocityDragStart}
                onGateToggle={onGateToggle}
              />
            );
          })}

          {outroBufferCards}
        </div>
      </SortableContext>
    </DndContext>
  );
});

export function LoopTimeline() {
  const { sections, reorderSection } = useProgressionStore();
  const { play, pause, jumpByBars, jumpToBeat, isConnected } = useLiveStore();

  const { mode, height, isDragging, changeMode, toggle, handlers } =
    useExpandableTimeline({
      initialMode: "normal",
      onModeChange: (newMode) => {
        console.log("Timeline mode changed:", newMode);
      },
    });

  // Ref for scroll container to enable auto-scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Ref for animation frame to manage eased scrolling
  const animationFrameRef = useRef<number | null>(null);

  // Helper to convert MIDI note to name
  // NOTE: midiToNoteName is defined at module scope above; avoid redeclaring here.

  // (bar/beat calculation happens after playhead is available)

  // Calculate cumulative beat positions for each section
  const sectionBeatPositions = useMemo(() => {
    let cumulativeBeat = 0;
    return sections.map((section) => {
      const sectionStartBeat = cumulativeBeat;
      const sectionBeats =
        section.progression.reduce((sum, chord) => sum + chord.duration, 0) *
        (section.repeats || 1);
      cumulativeBeat += sectionBeats;
      return {
        startBeat: sectionStartBeat,
        endBeat: cumulativeBeat,
        totalBeats: sectionBeats,
      };
    });
  }, [sections]);

  // Calculate total beats in progression for looping
  const totalBeats = useMemo(
    () =>
      sectionBeatPositions.length > 0
        ? sectionBeatPositions[sectionBeatPositions.length - 1].endBeat
        : 0,
    [sectionBeatPositions],
  );

  // Zoom state (range 0..1) and pixels-per-beat (computed after totalBeats available)
  const [zoomLevel, setZoomLevel] = useState(0.45);

  const viewportWidth =
    scrollContainerRef.current?.parentElement?.clientWidth ??
    scrollContainerRef.current?.clientWidth ??
    800;

  const pixelsPerBeat = computePxPerBeat({
    zoom: zoomLevel,
    minPx: mode === "collapsed" ? 8 : 10,
    maxPx: 60,
    fitToView: false,
    totalBeats,
    viewportWidth,
  });

  // Playhead sync (uses OSC-backed transport when available, mock otherwise)
  const { currentBeat, isPlaying, startMock, stopMock, mockActive } =
    usePlayheadSync({ pixelsPerBeat, totalBeats });

  // Calculate current bar:beat position (based on current playhead)
  const beatsPerBar = 4;
  const currentBar = Math.floor(currentBeat / beatsPerBar) + 1;
  const currentBeatInBar = Math.floor((currentBeat % beatsPerBar) + 1);

  // Track whether the user is interacting with the timeline (scroll/drag/resize)
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const interactionTimeoutRef = useRef<number | null>(null);
  const markUserInteraction = useCallback(() => {
    setIsUserInteracting(true);
    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }
    interactionTimeoutRef.current = window.setTimeout(() => {
      setIsUserInteracting(false);
      interactionTimeoutRef.current = null;
    }, 1000);
  }, []);

  // Velocity and legato controls moved to Zone 3 (ProgressionStrip)

  // Auto-scroll: center the active beat under the fixed playhead with eased animation.
  // Uses requestAnimationFrame for smooth easing and respects user interaction.
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      totalBeats === 0 ||
      !isPlaying ||
      isUserInteracting
    ) {
      // Stop any ongoing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const container = scrollContainerRef.current;
    const loopedBeat = currentBeat % totalBeats;
    const beatPosition = loopedBeat * pixelsPerBeat;

    // With 50% padding, we need to account for viewport width to center the beat under the playhead
    const viewportWidth = container.clientWidth;
    const targetScrollLeft = beatPosition - viewportWidth / 2;

    // Start eased animation if not already running
    if (!animationFrameRef.current) {
      const animate = () => {
        const currentScroll = container.scrollLeft;
        const delta = targetScrollLeft - currentScroll;
        const easeAmount = 0.1; // Adjust for easing speed (lower = smoother/slower)
        const newScroll = currentScroll + delta * easeAmount;

        container.scrollLeft = newScroll;

        // Continue if not close enough to target
        if (Math.abs(delta) > 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [currentBeat, totalBeats, pixelsPerBeat, isPlaying, isUserInteracting]);

  // Keyboard shortcuts for timeline: T toggle, Shift+T fullscreen, Esc exit fullscreen, +/- zoom
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
      )
        return;

      if (e.key === "t" || e.key === "T") {
        if (e.shiftKey) {
          changeMode("fullscreen");
        } else {
          toggle();
        }
      } else if (e.key === "Escape") {
        changeMode("normal");
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((z) => Math.min(1, +(z + 0.05).toFixed(2)));
      } else if (e.key === "-") {
        setZoomLevel((z) => Math.max(0, +(z - 0.05).toFixed(2)));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, changeMode]);

  // Calculate which beat within each section is active (handles looping)
  const getActiveBeatInSection = useCallback(
    (sectionIndex: number) => {
      if (totalBeats === 0) return -1;

      const loopedBeat = currentBeat % totalBeats;
      const position = sectionBeatPositions[sectionIndex];

      if (loopedBeat >= position.startBeat && loopedBeat < position.endBeat) {
        return Math.floor(loopedBeat - position.startBeat);
      }
      return -1;
    },
    [currentBeat, totalBeats, sectionBeatPositions],
  );

  // Handle drag-and-drop reordering (dnd-kit)
  const handleDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      reorderSection(fromIndex, toIndex);
    },
    [reorderSection],
  );

  // Use the stable module-scoped TimelineSectionsStatic component to avoid remounting
  const TimelineSections = TimelineSectionsStatic;

  return (
    <>
      {/* Overlay backdrop for fullscreen */}
      {mode === "fullscreen" && (
        <div
          className="timeline-overlay-backdrop"
          onClick={() => changeMode("normal")}
        />
      )}

      <div
        className={`timeline-container ${mode}`}
        style={{
          height: mode === "fullscreen" ? "100vh" : `${height}px`,
        }}
      >
        {/* Resize handle (drag top edge to resize) */}
        <div
          className="timeline-resize-handle"
          onMouseDown={handlers.onDragStart}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlers.onDragStart(e as any);
            }
          }}
          title="Drag to resize timeline"
          role="button"
          aria-label="Resize timeline"
          tabIndex={0}
        />
        {isDragging && (
          <div className="resize-tooltip">{Math.round(height)} px</div>
        )}

        {/* Fullscreen close button */}
        <button
          className="timeline-fullscreen-close"
          onClick={() => changeMode("normal")}
          title="Exit fullscreen (Esc)"
        >
          <X size={20} />
        </button>

        {/* Timeline content */}
        <div className="timeline-content">
          {/* Top navigation strip - Zoom & View controls only */}
          <div className="timeline-nav-strip">
            <div className="control-group">
              <span className="control-label">Zoom</span>
              <ZoomOut size={14} style={{ color: "rgba(0, 0, 0, 0.5)" }} />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="zoom-slider"
                title="Zoom level"
              />
              <ZoomIn size={14} style={{ color: "rgba(0, 0, 0, 0.5)" }} />
              <span className="zoom-display">
                {pixelsPerBeat}px/b
              </span>
            </div>

            {/* Size presets */}
            <div className="timeline-size-presets">
              <button
                className={`size-preset-btn ${mode === "collapsed" ? "active" : ""}`}
                onClick={() => changeMode("collapsed")}
                title="Collapsed view"
              >
                <Minimize2 size={14} />
              </button>
              <button
                className={`size-preset-btn ${mode === "normal" ? "active" : ""}`}
                onClick={() => changeMode("normal")}
                title="Normal view"
              >
                <Square size={14} />
              </button>
              <button
                className={`size-preset-btn ${mode === "expanded" ? "active" : ""}`}
                onClick={() => changeMode("expanded")}
                title="Expanded view"
              >
                <Maximize2 size={14} />
              </button>
              <button
                className={`size-preset-btn ${mode === "fullscreen" ? "active" : ""}`}
                onClick={() => changeMode("fullscreen")}
                title="Fullscreen view"
              >
                <Maximize size={14} />
              </button>
            </div>
          </div>

          {/* Main timeline track */}
          <div className="timeline-track-wrapper">
            <div className="timeline-track" ref={scrollContainerRef}>
              {/* use the memoized TimelineSections component to reduce re-renders */}
              <TimelineSections
                sections={sections}
                pixelsPerBeat={pixelsPerBeat}
                getActiveBeatInSection={getActiveBeatInSection}
                handleDragEnd={handleDragEnd}
                onDragStart={() => setIsUserInteracting(true)}
                onDragEnd={() => markUserInteraction()}
                markUserInteraction={markUserInteraction}
              />
            </div>

            {/* Fixed playhead - positioned outside scrollable track */}
            <div
              className="playhead-dial"
              data-position={`${currentBar}:${currentBeatInBar}`}
              aria-live="polite"
              aria-label={`Playhead at bar ${currentBar}, beat ${currentBeatInBar}`}
            >
            </div>
          </div>

          {/* Bottom controls panel - Transport controls */}
          <div className="timeline-controls-panel">
            {/* Transport buttons */}
            <div className="control-group">
              <button
                className="transport-btn"
                onClick={() => jumpToBeat(0)}
                title="Skip to start"
              >
                <SkipBack size={16} />
              </button>
              <button
                className="transport-btn"
                onClick={() => jumpByBars(-1)}
                title="Previous bar"
              >
                <Rewind size={16} />
              </button>
              <button
                className={`transport-btn ${isPlaying ? "playing" : ""}`}
                onClick={() =>
                  isConnected
                    ? isPlaying
                      ? pause()
                      : play()
                    : isPlaying
                      ? stopMock()
                      : startMock()
                }
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              {!isConnected && (
                <button
                  className={`transport-btn dev ${mockActive ? "playing" : ""}`}
                  onClick={() => (mockActive ? stopMock() : startMock())}
                  title={mockActive ? "Stop mock play" : "Dev mock play"}
                >
                  {mockActive ? <Pause size={12} /> : <Play size={12} />}
                </button>
              )}
              <button
                className="transport-btn"
                onClick={() => jumpByBars(1)}
                title="Next bar"
              >
                <FastForward size={16} />
              </button>
              <button
                className="transport-btn"
                onClick={() => jumpToBeat(totalBeats - 1)}
                title="Skip to end"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Position display */}
            <div className="position-display">
              <span>Bar {currentBar}</span>
              <span className="position-separator">|</span>
              <span>Beat {currentBeatInBar}</span>
              <span className="position-separator">|</span>
              <span>00:00</span>
            </div>

            {/* Loop toggle */}
            <div className="control-group">
              <button className="transport-btn loop-toggle active" title="Loop enabled">
                <Repeat size={16} />
              </button>
            </div>

            {/* Snap controls */}
            <div className="control-group">
              <span className="control-label">Snap</span>
              <label className="checkbox-toggle">
                <input type="radio" name="snap" defaultChecked />
                <span className="checkbox-label">Bar</span>
              </label>
              <label className="checkbox-toggle">
                <input type="radio" name="snap" />
                <span className="checkbox-label">Beat</span>
              </label>
            </div>

            {/* Buffer controls */}
            <div className="control-group">
              <label className="checkbox-toggle">
                <input type="checkbox" defaultChecked />
                <span className="checkbox-label">Buffer</span>
              </label>
              <input
                type="number"
                min="2"
                max="8"
                defaultValue="4"
                className="buffer-input"
                title="Pre-buffer bars"
              />
              <input
                type="number"
                min="2"
                max="8"
                defaultValue="4"
                className="buffer-input"
                title="Post-buffer bars"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
