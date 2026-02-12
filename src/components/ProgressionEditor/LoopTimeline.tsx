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

const getBaseSectionBeats = (section: SectionData): number =>
  section.progression.reduce((sum: number, chord: ChordData) => sum + chord.duration, 0);

const getSectionRepeats = (section: SectionData): number => Math.max(1, section.repeats || 1);

const getTotalSectionBeats = (section: SectionData): number =>
  getBaseSectionBeats(section) * getSectionRepeats(section);

const formatSecondsToClock = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

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
const TIMELINE_MIN_ZOOM = 0.02;
const TIMELINE_MAX_ZOOM = 1;
const TRANSPORT_CORRECTION_ALPHA = 0.12;
const TRANSPORT_HARD_SNAP_BEATS = 2.0;

function SortableSection({
  section,
  index,
  pixelsPerBeat,
  getActiveBeatInSection,
  markUserInteraction,
}: SortableSectionProps) {
  const baseSectionBeats = getBaseSectionBeats(section);
  const sectionRepeats = getSectionRepeats(section);
  const sectionBeats = baseSectionBeats * sectionRepeats;
  const sectionWidth = sectionBeats * pixelsPerBeat;
  const activeBeat = getActiveBeatInSection(index);
  const renderedChords = Array.from({ length: sectionRepeats }).flatMap(
    (_, repeatIndex) =>
      section.progression.map((chord, chordIndex) => ({
        chord,
        key: `${repeatIndex}-${chordIndex}`,
      })),
  );

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
          {renderedChords.map(({ chord, key }) => {
            const chordWidth = chord.duration * pixelsPerBeat;
            const rootNote =
              chord.metadata?.root !== undefined
                ? midiToNoteName(chord.metadata.root)
                : "";
            const quality = chord.metadata?.quality || "?";
            const fullChordName = rootNote ? `${rootNote}${quality}` : quality;
            
            return (
              <div
                key={key}
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
              <span className="repeat-badge">×{sectionRepeats}</span>
            </div>
            <div className="section-meta-item">
              <span>
                {Math.ceil(
                  sectionBeats / (section?.beatsPerBar || 4),
                )}{" "}
                bars
              </span>
            </div>
            <div className="section-meta-item">
              <span>{section.progression.length * sectionRepeats} chords</span>
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

  const renderStaticSection = (section: SectionData, index: number, keyOverride?: string) => {
    const sectionBeats = getTotalSectionBeats(section);
    const sectionRepeats = getSectionRepeats(section);
    const sectionWidth = sectionBeats * pixelsPerBeat;
    const activeBeat = getActiveBeatInSection(index);
    const renderedChords = Array.from({ length: sectionRepeats }).flatMap(
      (_, repeatIndex) =>
        section.progression.map((chord, chordIndex) => ({
          chord,
          key: `${repeatIndex}-${chordIndex}`,
        })),
    );

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
            {renderedChords.map(({ chord, key }) => {
              const chordWidth = chord.duration * pixelsPerBeat;
              const rootNote =
                chord.metadata?.root !== undefined
                  ? midiToNoteName(chord.metadata.root)
                  : "";
              const quality = chord.metadata?.quality || "?";
              const fullChordName = rootNote ? `${rootNote}${quality}` : quality;
              
              return (
                <div key={key} className="chord-card" style={{ width: `${chordWidth}px` }}>
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
                <span className="repeat-badge">×{sectionRepeats}</span>
              </div>
              <div className="section-meta-item">
                <span>
                  {Math.ceil(
                    sectionBeats / (section?.beatsPerBar || 4),
                  )}{" "}
                  bars
                </span>
              </div>
              <div className="section-meta-item">
                <span>{(section?.progression?.length || 0) * sectionRepeats} chords</span>
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
        <div className="timeline-song-start-marker timeline-song-start-marker--prev" aria-hidden="true" />
        {sections.map((section: SectionData, index: number) =>
          renderStaticSection(section, index, `section-static-prev-${index}`),
        )}
        <div className="timeline-song-start-marker timeline-song-start-marker--middle" aria-hidden="true" />
        {sections.map((section: SectionData, index: number) =>
          renderStaticSection(section, index, `section-static-${index}`),
        )}
        <div className="timeline-song-start-marker timeline-song-start-marker--next" aria-hidden="true" />
        {sections.map((section: SectionData, index: number) =>
          renderStaticSection(section, index, `section-static-next-${index}`),
        )}
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
          <div className="timeline-song-start-marker timeline-song-start-marker--prev" aria-hidden="true" />
          {sections.map((section: SectionData, index: number) =>
            renderStaticSection(section, index, `section-prev-${index}`),
          )}
          <div className="timeline-song-start-marker timeline-song-start-marker--middle" aria-hidden="true" />

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

          <div className="timeline-song-start-marker timeline-song-start-marker--next" aria-hidden="true" />
          {sections.map((section: SectionData, index: number) =>
            renderStaticSection(section, index, `section-next-${index}`),
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
});

export function LoopTimeline() {
  const { sections, reorderSection } = useProgressionStore();
  const { play, pause, jumpByBars, jumpToBeat, isConnected, transport } = useLiveStore();

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
  const autoScrollEnabledRef = useRef(false);
  const targetScrollLeftRef = useRef(0);
  const cycleOffsetRef = useRef(0);
  const hasCenteredInitialScrollRef = useRef(false);
  const cycleMetricsRef = useRef<{
    ready: boolean;
    prevStart: number;
    middleStart: number;
    nextStart: number;
    cycleSpan: number;
  }>({
    ready: false,
    prevStart: 0,
    middleStart: 0,
    nextStart: 0,
    cycleSpan: 1,
  });
  const unwrappedBeatRef = useRef(0);
  const currentBeatRef = useRef(0);
  const lastRawBeatRef = useRef<number | null>(null);
  const beatAnchorRef = useRef(0);
  const beatAnchorTimeRef = useRef(0);

  // Helper to convert MIDI note to name
  // NOTE: midiToNoteName is defined at module scope above; avoid redeclaring here.

  // (bar/beat calculation happens after playhead is available)

  // Calculate cumulative beat positions for each section
  const sectionBeatPositions = useMemo(() => {
    let cumulativeBeat = 0;
    return sections.map((section) => {
      const sectionStartBeat = cumulativeBeat;
      const sectionBeats = getTotalSectionBeats(section);
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

  // Calculate current bar:beat position based on active section time signature
  const { currentBar, currentBeatInBar } = useMemo(() => {
    if (totalBeats <= 0 || sectionBeatPositions.length === 0) {
      return { currentBar: 1, currentBeatInBar: 1 };
    }

    const loopedBeat = ((currentBeat % totalBeats) + totalBeats) % totalBeats;
    const activeSectionIndex = sectionBeatPositions.findIndex(
      (position) => loopedBeat >= position.startBeat && loopedBeat < position.endBeat,
    );

    if (activeSectionIndex < 0) {
      return { currentBar: 1, currentBeatInBar: 1 };
    }

    const activeSection = sections[activeSectionIndex];
    const beatsPerBar = activeSection?.beatsPerBar || 4;
    const beatIntoSection = loopedBeat - sectionBeatPositions[activeSectionIndex].startBeat;
    const barInSection = Math.floor(beatIntoSection / beatsPerBar) + 1;
    const beatInBar = Math.floor(beatIntoSection % beatsPerBar) + 1;

    const barsBefore = sections.slice(0, activeSectionIndex).reduce((sum, section) => {
      const sectionBeats = getTotalSectionBeats(section);
      return sum + Math.ceil(sectionBeats / (section.beatsPerBar || 4));
    }, 0);

    return {
      currentBar: barsBefore + barInSection,
      currentBeatInBar: beatInBar,
    };
  }, [currentBeat, sectionBeatPositions, sections, totalBeats]);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

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

  const computeTargetScrollLeft = useCallback((unwrappedBeat: number) => {
    const container = scrollContainerRef.current;
    if (!container || totalBeats <= 0) return null;

    const viewportWidth = container.clientWidth;
    const songStartOffset = cycleMetricsRef.current.ready
      ? cycleMetricsRef.current.middleStart
      : viewportWidth / 2;
    const songCycleSpanPx = cycleMetricsRef.current.ready
      ? Math.max(1, cycleMetricsRef.current.cycleSpan)
      : Math.max(1, totalBeats * pixelsPerBeat);

    const songWidthPx = totalBeats * pixelsPerBeat;
    const bufferWidthPx = Math.max(0, songCycleSpanPx - songWidthPx);
    const bufferBeats = bufferWidthPx / pixelsPerBeat;

    const normalizedBeat = Math.max(0, unwrappedBeat);
    const completedSongLoops =
      totalBeats > 0 ? Math.floor(normalizedBeat / totalBeats) : 0;
    const beatInSong = normalizedBeat - completedSongLoops * totalBeats;
    // Spread buffer travel across the loop phase so wrap is continuous.
    const bufferProgress =
      totalBeats > 0 ? (beatInSong / totalBeats) * bufferBeats : 0;
    const virtualBeat =
      completedSongLoops * (totalBeats + bufferBeats) +
      beatInSong +
      bufferProgress;
    const rawTarget =
      songStartOffset + virtualBeat * pixelsPerBeat - viewportWidth / 2;
    return { rawTarget, viewportWidth, songCycleSpanPx };
  }, [pixelsPerBeat, totalBeats]);

  const refreshCycleMetrics = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const prevStartMarker = container.querySelector(
      ".timeline-song-start-marker--prev",
    ) as HTMLElement | null;
    const middleStartMarker = container.querySelector(
      ".timeline-song-start-marker--middle",
    ) as HTMLElement | null;
    const nextStartMarker = container.querySelector(
      ".timeline-song-start-marker--next",
    ) as HTMLElement | null;

    if (!prevStartMarker || !middleStartMarker || !nextStartMarker) {
      cycleMetricsRef.current.ready = false;
      return;
    }

    const middleStart = middleStartMarker.offsetLeft;
    const nextStart = nextStartMarker.offsetLeft;
    const prevStart = prevStartMarker.offsetLeft;
    cycleMetricsRef.current = {
      ready: true,
      prevStart,
      middleStart,
      nextStart,
      cycleSpan: Math.max(1, nextStart - middleStart),
    };
  }, []);

  useEffect(() => {
    refreshCycleMetrics();
    const onResize = () => refreshCycleMetrics();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [refreshCycleMetrics, sections, pixelsPerBeat, mode]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || hasCenteredInitialScrollRef.current) return;
    refreshCycleMetrics();
    if (!cycleMetricsRef.current.ready) return;

    const viewportWidth = container.clientWidth;
    const start = Math.max(
      0,
      cycleMetricsRef.current.middleStart - viewportWidth / 2,
    );
    container.scrollLeft = start;
    targetScrollLeftRef.current = start;
    cycleOffsetRef.current = 0;
    hasCenteredInitialScrollRef.current = true;
  }, [sections, pixelsPerBeat, refreshCycleMetrics]);

  useEffect(() => {
    const now = performance.now();
    const tempo = transport?.tempo || 120;
    const beatsPerMs = tempo / 60000;
    if (lastRawBeatRef.current === null) {
      unwrappedBeatRef.current = currentBeat;
      lastRawBeatRef.current = currentBeat;
      beatAnchorRef.current = unwrappedBeatRef.current;
      beatAnchorTimeRef.current = now;
      return;
    }

    let delta = currentBeat - lastRawBeatRef.current;
    if (totalBeats > 0) {
      const wrapThreshold = Math.max(1, totalBeats * 0.5);
      if (delta < -wrapThreshold) delta += totalBeats;
      if (delta > wrapThreshold) delta -= totalBeats;
    }

    unwrappedBeatRef.current += delta;
    lastRawBeatRef.current = currentBeat;
    const predictedNow =
      beatAnchorRef.current + (now - beatAnchorTimeRef.current) * beatsPerMs;
    const phaseError = unwrappedBeatRef.current - predictedNow;

    if (Math.abs(phaseError) >= TRANSPORT_HARD_SNAP_BEATS) {
      beatAnchorRef.current = unwrappedBeatRef.current;
    } else {
      beatAnchorRef.current =
        predictedNow + phaseError * TRANSPORT_CORRECTION_ALPHA;
    }
    beatAnchorTimeRef.current = now;
  }, [currentBeat, totalBeats, transport]);

  const getPredictedBeat = useCallback(() => {
    if (!isPlaying) return beatAnchorRef.current;
    const tempo = transport?.tempo || 120;
    const elapsedMs = Math.max(0, performance.now() - beatAnchorTimeRef.current);
    return beatAnchorRef.current + elapsedMs * (tempo / 60000);
  }, [isPlaying, transport]);

  const currentTimeDisplay = useMemo(() => {
    const tempo = transport?.tempo || 120;
    const beatForClock = isPlaying ? getPredictedBeat() : currentBeat;
    const seconds = (Math.max(0, beatForClock) * 60) / tempo;
    return formatSecondsToClock(seconds);
  }, [currentBeat, getPredictedBeat, isPlaying, transport]);

  useEffect(() => {
    const next = computeTargetScrollLeft(unwrappedBeatRef.current);
    if (next !== null) {
      targetScrollLeftRef.current = next.rawTarget - cycleOffsetRef.current;
    }
  }, [computeTargetScrollLeft, currentBeat]);

  // Auto-scroll: keep a single RAF loop while active and chase the latest target.
  useEffect(() => {
    const enabled =
      !!scrollContainerRef.current &&
      totalBeats > 0 &&
      isPlaying &&
      !isUserInteracting;
    autoScrollEnabledRef.current = enabled;

    if (!enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      if (!autoScrollEnabledRef.current || !scrollContainerRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const container = scrollContainerRef.current;
      const predictedBeat = getPredictedBeat();
      const computed = computeTargetScrollLeft(predictedBeat);
      if (computed !== null) {
        let target = computed.rawTarget - cycleOffsetRef.current;

        if (cycleMetricsRef.current.ready) {
          const { middleStart, nextStart, cycleSpan } = cycleMetricsRef.current;
          const lowThreshold = middleStart - cycleSpan;
          const highThreshold = nextStart;

          while (target > highThreshold) {
            cycleOffsetRef.current += cycleSpan;
            target -= cycleSpan;
          }
          while (target < lowThreshold) {
            cycleOffsetRef.current -= cycleSpan;
            target += cycleSpan;
          }
        }

        const maxScroll = Math.max(0, container.scrollWidth - computed.viewportWidth);
        targetScrollLeftRef.current = Math.max(0, Math.min(target, maxScroll));
      }
      const target = targetScrollLeftRef.current;
      container.scrollLeft = target;

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isUserInteracting, totalBeats]);

  // Keyboard shortcuts for timeline: T toggle, Shift+T fullscreen, Esc exit fullscreen, +/- zoom
  useEffect(() => {
    if (!isPlaying) {
      beatAnchorRef.current = unwrappedBeatRef.current;
      beatAnchorTimeRef.current = performance.now();
    }
  }, [isPlaying]);

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
        setZoomLevel((z) =>
          Math.min(TIMELINE_MAX_ZOOM, +(z + 0.05).toFixed(2)),
        );
      } else if (e.key === "-") {
        setZoomLevel((z) =>
          Math.max(TIMELINE_MIN_ZOOM, +(z - 0.05).toFixed(2)),
        );
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, changeMode]);

  // Calculate which beat within each section is active (handles looping)
  const getActiveBeatInSection = useCallback(
    (sectionIndex: number) => {
      if (totalBeats === 0) return -1;

      const loopedBeat = currentBeatRef.current % totalBeats;
      const position = sectionBeatPositions[sectionIndex];

      if (loopedBeat >= position.startBeat && loopedBeat < position.endBeat) {
        return Math.floor(loopedBeat - position.startBeat);
      }
      return -1;
    },
    [totalBeats, sectionBeatPositions],
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
                min={TIMELINE_MIN_ZOOM}
                max={TIMELINE_MAX_ZOOM}
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
              <span>{currentTimeDisplay}</span>
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
