import { ProgressionEditor } from "./ProgressionEditor/ProgressionEditor";
import { initializeRangeProgress } from "../utils/rangeProgress";
import { useEffect, useMemo, useState, useRef } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import usePlayheadSync from "@hooks/usePlayheadSync";
import { computePxPerBeat } from "../utils/pxPerBeat";
import { useLiveStore } from "@stores/liveStore";

const HEADER_GAP_PX = 8;
const HEADER_TRANSPORT_CORRECTION_ALPHA = 0.12;
const HEADER_TRANSPORT_HARD_SNAP_BEATS = 2.0;
const README_LINES = [
  "# ChordGen Live Helper - Max for Live Device",
  "This directory contains the complete Max for Live device.",
  "It enables communication between ChordGen Pro and Ableton Live.",
];

interface HeaderCardData {
  id: string;
  title: string;
  lines: string[];
  beats: number;
}

function HeaderTimelinePreview() {
  const sections = useProgressionStore((s) => s.sections);
  const transport = useLiveStore((s) => s.transport);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const totalBeats = useMemo(
    () =>
      sections.reduce((songTotal, section) => {
        const sectionBeats = section.progression.reduce(
          (sum, chord) => sum + chord.duration,
          0,
        );
        return songTotal + sectionBeats * (section.repeats || 1);
      }, 0),
    [sections],
  );

  const pixelsPerBeat = computePxPerBeat({
    zoom: 0.45,
    minPx: 10,
    maxPx: 60,
    fitToView: false,
    totalBeats,
    viewportWidth,
  });

  const { currentBeat, isPlaying } = usePlayheadSync({ pixelsPerBeat, totalBeats });
  const [smoothedBeat, setSmoothedBeat] = useState(0);
  const anchorBeatRef = useRef(0);
  const anchorTimeRef = useRef(0);
  const lastRawBeatRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const now = performance.now();
    const tempo = transport?.tempo || 120;
    const beatsPerMs = tempo / 60000;

    if (lastRawBeatRef.current === null) {
      lastRawBeatRef.current = currentBeat;
      anchorBeatRef.current = currentBeat;
      anchorTimeRef.current = now;
      setSmoothedBeat(currentBeat);
      return;
    }

    let delta = currentBeat - lastRawBeatRef.current;
    if (totalBeats > 0) {
      const wrapThreshold = Math.max(1, totalBeats * 0.5);
      if (delta < -wrapThreshold) delta += totalBeats;
      if (delta > wrapThreshold) delta -= totalBeats;
    }

    const unwrappedMeasured = anchorBeatRef.current + delta;
    const predictedNow =
      anchorBeatRef.current + (now - anchorTimeRef.current) * beatsPerMs;
    const phaseError = unwrappedMeasured - predictedNow;

    if (Math.abs(phaseError) >= HEADER_TRANSPORT_HARD_SNAP_BEATS) {
      anchorBeatRef.current = unwrappedMeasured;
    } else {
      anchorBeatRef.current =
        predictedNow + phaseError * HEADER_TRANSPORT_CORRECTION_ALPHA;
    }
    anchorTimeRef.current = now;
    lastRawBeatRef.current = currentBeat;
  }, [currentBeat, totalBeats, transport]);

  useEffect(() => {
    const tick = () => {
      const tempo = transport?.tempo || 120;
      const beatsPerMs = tempo / 60000;
      const now = performance.now();
      const predicted = isPlaying
        ? anchorBeatRef.current + (now - anchorTimeRef.current) * beatsPerMs
        : anchorBeatRef.current;
      setSmoothedBeat(predicted);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, transport]);

  const loopedBeat = totalBeats > 0 ? smoothedBeat % totalBeats : smoothedBeat;

  const cards = useMemo<HeaderCardData[]>(() => {
    const sectionCards: HeaderCardData[] = sections.slice(0, 2).map((section, i) => {
      const sectionBeats =
        section.progression.reduce((sum, chord) => sum + chord.duration, 0) || 4;
      return {
        id: `section-preview-${section.id}`,
        title: section.name || `Section ${i + 1}`,
        lines: [`${section.progression.length} chords`, `${sectionBeats} beats`],
        beats: Math.max(6, Math.min(16, sectionBeats)),
      };
    });

    return [
      {
        id: "header-test-card",
        title: "Header Test Card",
        lines: ["Timeline visible through glass", "Footer-synced movement"],
        beats: 8,
      },
      {
        id: "header-readme-card",
        title: "README.md",
        lines: README_LINES,
        beats: 14,
      },
      ...sectionCards,
    ];
  }, [sections]);

  const cycleWidth = useMemo(() => {
    if (!cards.length) return 1;
    const cardsWidth = cards.reduce((sum, card) => sum + card.beats * pixelsPerBeat, 0);
    return cardsWidth + HEADER_GAP_PX * (cards.length - 1);
  }, [cards, pixelsPerBeat]);

  const wrappedOffset = cycleWidth > 0 ? (loopedBeat * pixelsPerBeat) % cycleWidth : 0;
  const renderedCards = [...cards, ...cards];

  return (
    <div className="app-top-header-timeline" aria-hidden="true">
      <div
        className="app-top-header-scroll-strip"
        style={{ transform: `translate3d(${-wrappedOffset}px, 0, 0)` }}
      >
        {renderedCards.map((card, index) => (
          <article
            key={`${card.id}-${index}`}
            className="header-preview-card"
            style={{ width: `${card.beats * pixelsPerBeat}px` }}
          >
            <h3 className="header-preview-title">{card.title}</h3>
            {card.lines.map((line, lineIndex) => (
              <p key={`${card.id}-${index}-${lineIndex}`} className="header-preview-line">
                {line}
              </p>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    // Initialize range slider progress indication
    initializeRangeProgress();
  }, []);

  return (
    <div className="h-screen bg-app flex flex-col">
      {/* Header */}
      <header className="app-top-header">
        <HeaderTimelinePreview />
        <div className="app-top-header-menu-layer" />
      </header>

      {/* Main Editor */}
      <main className="flex-1 overflow-hidden">
        <ProgressionEditor />
      </main>
    </div>
  );
}

export default App;
