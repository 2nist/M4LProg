/**
 * LoopTimeline Component
 *
 * Expandable timeline with analog warmth styling
 * Features: drag-to-resize, multiple view modes, drag-drop sections
 */

import { useCallback, useMemo, useRef, useEffect, useState, memo } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
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

// Stable memoized TimelineSections component (defined at module scope to keep identity stable)
// Track and warn once if sections lack ids to avoid console spam
let warnedMissingDraggableId = false;

const TimelineSectionsStatic = memo(function TimelineSectionsStatic({
  sections,
  pixelsPerBeat,
  getActiveBeatInSection,
  handleDragEnd,
  onDragStart,
  onDragEnd,
  markUserInteraction,
}: any) {
  return (
    <DragDropContext
      onBeforeDragStart={() => onDragStart?.()}
      onDragEnd={(result: DropResult) => {
        handleDragEnd(result);
        onDragEnd?.();
      }}
    >
      <div
        className="timeline-scroll-container"
        onMouseDown={markUserInteraction}
        onTouchStart={markUserInteraction}
        onWheel={markUserInteraction}
        onScroll={markUserInteraction}
      >
        {/* Pre-buffer cards */}
        <div className="buffer-card">
          <span className="buffer-title">Song Overview</span>
          <div className="buffer-content">
            {sections.length} sections, 48 total beats
          </div>
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
          <div className="buffer-content">
            This progression creates tension and release
          </div>
        </div>

        <Droppable
          droppableId="timeline-sections"
          direction="horizontal"
          isDropDisabled={false}
          isCombineEnabled={false}
          ignoreContainerClipping={false}
        >
          {(provided: any) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: "contents" }}
            >
              {sections.map((section: any, index: number) => {
                const sectionBeats = section.progression.reduce(
                  (s: number, c: any) => s + c.duration,
                  0,
                );
                const sectionWidth = sectionBeats * pixelsPerBeat;
                const activeBeat = getActiveBeatInSection(index);

                // Defensive: if a section is missing an id, render a non-draggable fallback
                if (!section || !section.id) {
                  if (!warnedMissingDraggableId) {
                    // eslint-disable-next-line no-console
                    console.warn(
                      "[Timeline] section missing id — rendering non-draggable fallback. Fix section ids to re-enable drag/drop.",
                      { index, section },
                    );
                    warnedMissingDraggableId = true;
                  }

                  return (
                    <div
                      key={`section-fallback-${index}`}
                      className="section-card static-section"
                      style={{
                        width: `${sectionWidth}px`,
                        minWidth: `${sectionWidth}px`,
                      }}
                    >
                      <div className="duration-indicator">
                        {Array.from({ length: Math.ceil(sectionBeats) }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className={`duration-beat ${i === activeBeat ? "active" : ""}`}
                              style={{ width: `${pixelsPerBeat}px` }}
                            />
                          ),
                        )}
                      </div>

                      <div className="section-card-content">
                        <div className="section-header">
                          <span className="section-name">
                            {section?.name || "Unnamed"}
                          </span>
                        </div>

                        <div className="progression-chords">
                          {section?.progression?.map(
                            (chord: any, chordIdx: number) => {
                              const chordWidth = chord.duration * pixelsPerBeat;
                              const rootNote =
                                chord.metadata?.root !== undefined
                                  ? midiToNoteName(chord.metadata.root)
                                  : "";
                              const quality = chord.metadata?.quality || "?";
                              const fullChordName = rootNote
                                ? `${rootNote}${quality}`
                                : quality;

                              return (
                                <div
                                  key={chordIdx}
                                  className="chord-card"
                                  style={{ width: `${chordWidth}px` }}
                                >
                                  <span className="chord-name">
                                    {fullChordName}
                                  </span>
                                  <span className="chord-duration">
                                    {chord.duration}b
                                  </span>
                                </div>
                              );
                            },
                          )}
                        </div>

                        <div className="section-detail-expanded">
                          <div className="section-meta">
                            <div className="section-meta-item">
                              <span className="repeat-badge">
                                ×{section?.repeats || 1}
                              </span>
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
                              <span>
                                {section?.progression?.length || 0} chords
                              </span>
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

                return (
                  <Draggable
                    key={String(section.id)}
                    draggableId={String(section.id)}
                    index={index}
                  >
                    {(provided: any, snapshot: any) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`section-card ${snapshot.isDragging ? "dragging" : ""}`}
                        style={{
                          ...provided.draggableProps.style,
                          width: `${sectionWidth}px`,
                          minWidth: `${sectionWidth}px`,
                        }}
                      >
                        <div className="duration-indicator">
                          {Array.from({ length: Math.ceil(sectionBeats) }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className={`duration-beat ${i === activeBeat ? "active" : ""}`}
                                style={{ width: `${pixelsPerBeat}px` }}
                              />
                            ),
                          )}
                        </div>

                        <div className="section-card-content">
                          <div
                            className="drag-handle"
                            {...provided.dragHandleProps}
                          />

                          <div className="section-header">
                            <span className="section-name">{section.name}</span>
                          </div>

                          <div className="progression-chords">
                            {section.progression.map(
                              (chord: any, chordIdx: number) => {
                                const chordWidth =
                                  chord.duration * pixelsPerBeat;
                                const rootNote =
                                  chord.metadata?.root !== undefined
                                    ? midiToNoteName(chord.metadata.root)
                                    : "";
                                const quality = chord.metadata?.quality || "?";
                                const fullChordName = rootNote
                                  ? `${rootNote}${quality}`
                                  : quality;

                                return (
                                  <div
                                    key={chordIdx}
                                    className="chord-card"
                                    style={{ width: `${chordWidth}px` }}
                                  >
                                    <span className="chord-name">
                                      {fullChordName}
                                    </span>
                                    <span className="chord-duration">
                                      {chord.duration}b
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>

                          <div className="section-detail-expanded">
                            <div className="section-meta">
                              <div className="section-meta-item">
                                <span className="repeat-badge">
                                  ×{section.repeats || 1}
                                </span>
                              </div>
                              <div className="section-meta-item">
                                <span>
                                  {Math.ceil(
                                    (sectionBeats * (section.repeats || 1)) /
                                      (section.beatsPerBar || 4),
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
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* Post-buffer cards */}
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
      </div>
    </DragDropContext>
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

  // Fixed heights for each mode (kept in CSS; removed unused JS map)

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

  // Auto-scroll: center the active beat under the fixed playhead.
  // Uses requestAnimationFrame to ensure layout is settled before scrolling.
  useEffect(() => {
    if (
      !scrollContainerRef.current ||
      totalBeats === 0 ||
      !isPlaying ||
      isUserInteracting
    )
      return;

    const container = scrollContainerRef.current;
    const loopedBeat = currentBeat % totalBeats;
    const targetScrollLeft = loopedBeat * pixelsPerBeat;

    // Use rAF to ensure the DOM has finished layout before assigning scrollLeft.
    // Without this, the browser may discard the assignment if it happens mid-layout.
    const frameId = requestAnimationFrame(() => {
      container.scrollLeft = targetScrollLeft;
    });

    return () => cancelAnimationFrame(frameId);
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

  // Handle drag-and-drop reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const fromIndex = result.source.index;
      const toIndex = result.destination.index;

      if (fromIndex !== toIndex) {
        reorderSection(fromIndex, toIndex);
      }
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
          title="Drag to resize timeline"
          role="button"
          aria-label="Resize timeline"
        />
        {isDragging && (
          <div className="resize-tooltip">{Math.round(height)} px</div>
        )}
        {/* Expand/collapse button */}
        <button
          className="timeline-expand-btn"
          onClick={toggle}
          title={
            mode === "normal" ? "Expand timeline (T)" : "Collapse timeline (T)"
          }
        >
          {mode === "normal" || mode === "collapsed" ? (
            <>
              <ChevronUp size={14} />
              Expand
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Collapse
            </>
          )}
        </button>

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
          {/* Navigation strip */}
          <div className="timeline-nav-strip">
            <div className="timeline-transport-controls">
              <button
                className="transport-btn"
                onClick={() => jumpToBeat(0)}
                title="Skip to start"
              >
                ⏮
              </button>
              <button
                className="transport-btn"
                onClick={() => jumpByBars(-1)}
                title="Previous bar"
              >
                ⏪
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
                {isPlaying ? "⏸" : "▶"}
              </button>
              {!isConnected && (
                <button
                  className={`transport-btn dev ${mockActive ? "playing" : ""}`}
                  onClick={() => (mockActive ? stopMock() : startMock())}
                  title={mockActive ? "Stop mock play" : "Dev mock play"}
                >
                  {mockActive ? "Dev⏸" : "Dev▶"}
                </button>
              )}
              <button
                className="transport-btn"
                onClick={() => jumpByBars(1)}
                title="Next bar"
              >
                ⏩
              </button>
              <button
                className="transport-btn"
                onClick={() => jumpToBeat(totalBeats - 1)}
                title="Skip to end"
              >
                ⏭
              </button>
            </div>

            <div className="position-display">
              <span>Bar: {currentBar}</span>
              <span className="position-separator">|</span>
              <span>Beat: {currentBeatInBar}</span>
              <span className="position-separator">|</span>
              <span>00:00 / 02:30</span>
            </div>

            {/* Size presets moved here */}
            <div className="timeline-size-presets">
              <button
                className={`size-preset-btn ${mode === "collapsed" ? "active" : ""}`}
                onClick={() => changeMode("collapsed")}
                title="Min"
              >
                MIN
              </button>
              <button
                className={`size-preset-btn ${mode === "normal" ? "active" : ""}`}
                onClick={() => changeMode("normal")}
                title="Norm"
              >
                NORM
              </button>
              <button
                className={`size-preset-btn ${mode === "expanded" ? "active" : ""}`}
                onClick={() => changeMode("expanded")}
                title="Max"
              >
                MAX
              </button>
              <button
                className={`size-preset-btn ${mode === "fullscreen" ? "active" : ""}`}
                onClick={() => changeMode("fullscreen")}
                title="Full"
              >
                FULL
              </button>
            </div>

            <div className="loop-toggle active" title="Loop enabled">
              🔁 Loop
            </div>
          </div>

          {/* Main timeline track */}
          <div className="timeline-track-wrapper">
            <div className="timeline-track" ref={scrollContainerRef}>
              {/* Playhead dial - stays centered */}
              <div className="playhead-dial" />

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

              {/* Fixed playhead */}
              <div
                className="playhead-dial"
                data-position={`${currentBar}:${currentBeatInBar}`}
              >
                <div className="playhead-position">
                  {currentBar}:{currentBeatInBar}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline controls panel */}
          <div className="timeline-controls-panel">
            <div className="control-group">
              <span className="control-label">Zoom</span>
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
              <span style={{ fontSize: "11px", color: "hsl(45, 30%, 65%)" }}>
                {pixelsPerBeat} px/beat
              </span>
            </div>

            <div className="control-group">
              <button className="preset-btn">Fit</button>
              <button className="preset-btn">2x</button>
              <button className="preset-btn active">Auto</button>
              <button
                className="preset-btn dev"
                title="Center playhead (dev)"
                onClick={() => {
                  if (scrollContainerRef.current && totalBeats > 0) {
                    const loopedBeat = currentBeat % totalBeats;
                    const target = loopedBeat * pixelsPerBeat;
                    requestAnimationFrame(() => {
                      if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollLeft = target;
                      }
                    });
                  }
                }}
              >
                Center
              </button>
            </div>

            <div className="control-group">
              <label className="checkbox-toggle">
                <input type="checkbox" defaultChecked />
                <span className="checkbox-label">Show Buffer</span>
              </label>
            </div>

            <div className="control-group">
              <span className="control-label">Pre:</span>
              <input
                type="number"
                min="2"
                max="8"
                defaultValue="4"
                className="buffer-input"
                title="Pre-buffer bars"
              />
            </div>

            <div className="control-group">
              <span className="control-label">Post:</span>
              <input
                type="number"
                min="2"
                max="8"
                defaultValue="4"
                className="buffer-input"
                title="Post-buffer bars"
              />
            </div>

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

            <div className="control-group">
              <label className="checkbox-toggle">
                <input type="checkbox" />
                <span className="checkbox-label">Stop at end</span>
              </label>
            </div>
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="timeline-shortcut-hint">
          Press T to toggle • Shift+T for fullscreen • Drag edge to resize
        </div>
      </div>
    </>
  );
}
