import { useEffect, useMemo, useState } from "react";
import { useProgressionStore } from "@stores/progressionStore";
import { useLiveStore } from "@stores/liveStore";

const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const SONG_TITLE_STORAGE_KEY = "song-meta-title";

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const secs = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function SongMetaCard() {
  const keyRoot = useProgressionStore((s) => s.keyRoot);
  const mode = useProgressionStore((s) => s.mode);
  const sections = useProgressionStore((s) => s.sections);
  const arrangementBlocks = useProgressionStore((s) => s.arrangementBlocks);
  const tempo = useLiveStore((s) => s.transport.tempo) || 120;
  const [title, setTitle] = useState<string>("Untitled Song");

  useEffect(() => {
    const persisted = localStorage.getItem(SONG_TITLE_STORAGE_KEY);
    if (persisted && persisted.trim().length > 0) {
      setTitle(persisted);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SONG_TITLE_STORAGE_KEY, title.trim() || "Untitled Song");
  }, [title]);

  const sectionMap = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  const timelineBlocks = useMemo(() => {
    if (arrangementBlocks.length > 0) return arrangementBlocks;
    let startBeat = 0;
    return sections.map((section) => {
      const repeats = Math.max(1, section.repeats || 1);
      const baseBeats = Math.max(
        1,
        section.progression.reduce((sum, chord) => sum + (chord.duration || 0), 0),
      );
      const lengthBeats = baseBeats * repeats;
      const block = {
        id: `fallback-${section.id}`,
        sourceId: section.id,
        startBeat,
        lengthBeats,
      };
      startBeat += lengthBeats;
      return block;
    });
  }, [arrangementBlocks, sections]);

  const { totalBeats, totalBars, timeSignatureLabel, detectedKeyLabel } = useMemo(() => {
    const timeSigs = new Set<number>();
    const pitchClassWeights = new Array(12).fill(0) as number[];
    let beats = 0;
    let bars = 0;

    timelineBlocks.forEach((block) => {
      const section = sectionMap.get(block.sourceId);
      const beatsPerBar = Math.max(1, section?.beatsPerBar || 4);
      beats += block.lengthBeats;
      bars += block.lengthBeats / beatsPerBar;
      timeSigs.add(beatsPerBar);

      if (!section) return;
      const blockRepeats = Math.max(1, block.lengthBeats / Math.max(1, section.progression.reduce((sum, chord) => sum + (chord.duration || 0), 0)));
      section.progression.forEach((chord) => {
        const root = chord.metadata?.root ?? chord.notes?.[0];
        if (typeof root !== "number" || Number.isNaN(root)) return;
        const pitchClass = ((Math.round(root) % 12) + 12) % 12;
        pitchClassWeights[pitchClass] += Math.max(1, chord.duration || 1) * blockRepeats;
      });
    });

    const ranked = pitchClassWeights
      .map((weight, pitchClass) => ({ pitchClass, weight }))
      .sort((a, b) => b.weight - a.weight);

    const fallbackPitchClass = ((keyRoot % 12) + 12) % 12;
    const strongest = ranked[0]?.weight > 0 ? ranked[0].pitchClass : fallbackPitchClass;
    const detectedKey = NOTE_NAMES[strongest];
    const isMixed = timeSigs.size > 1;
    const firstSig = [...timeSigs][0] || 4;

    return {
      totalBeats: beats,
      totalBars: bars,
      timeSignatureLabel: isMixed ? "Mixed" : `${firstSig}/4`,
      detectedKeyLabel: `${detectedKey} ${mode}`,
    };
  }, [timelineBlocks, sectionMap, keyRoot, mode]);

  const durationLabel = useMemo(() => formatDuration((totalBeats * 60) / Math.max(1, tempo)), [totalBeats, tempo]);

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs muted-text mb-1">Song</div>
      <input
        className="w-full text-sm rounded px-2 py-1 compact input mb-2"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Song title"
      />

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] leading-tight">
        <div className="muted-text">Key/Mode</div>
        <div className="text-right truncate">{detectedKeyLabel}</div>

        <div className="muted-text">Tempo</div>
        <div className="text-right">{Math.round(tempo)} BPM</div>

        <div className="muted-text">Time Sig</div>
        <div className="text-right">{timeSignatureLabel}</div>

        <div className="muted-text">Total Bars</div>
        <div className="text-right">{totalBars.toFixed(1)}</div>

        <div className="muted-text">Length</div>
        <div className="text-right">{durationLabel}</div>
      </div>
    </div>
  );
}
