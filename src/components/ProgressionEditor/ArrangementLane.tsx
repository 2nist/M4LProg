import { useEffect, useMemo, useState } from "react";
import { Plus, Copy, Trash2, ChevronsUpDown, Pencil } from "lucide-react";
import type { Section } from "@/types/progression";
import type { ArrangementBlock, ModeId } from "@/types/arrangement";
import { computePxPerBeat } from "@/utils/pxPerBeat";

type Props = {
  mode: ModeId;
  sections: Section[];
  currentSectionIndex: number;
  onSelectSection: (index: number) => void;
  onSetCurrentSectionRepeats: (repeats: number) => void;
  onCreateSection: () => void;
  onDuplicateSection: (index: number) => void;
  onDeleteSection: (index: number) => void;
  onLoadExample: (exampleId: "stand_by_me" | "blues_12bar") => void;
};

const getSectionBeats = (section: Section): number =>
  section.progression.reduce((sum, chord) => sum + (chord.duration || 0), 0);

const createLaneBlock = (
  section: Section,
  startBeat: number,
  mode: ModeId = "harmony",
): ArrangementBlock => {
  const repeats = Math.max(1, section.repeats || 1);
  const baseBeats = Math.max(1, getSectionBeats(section));
  const lengthBeats = baseBeats * repeats;
  return {
    id: `arr-${section.id}-${Math.random().toString(36).slice(2, 8)}`,
    sourceId: section.id,
    mode,
    startBeat,
    lengthBeats,
    label: section.name || "Section",
    repeats: 1,
    intent: "main",
  };
};

const reflowBlocks = (blocks: ArrangementBlock[], sectionMap: Map<string, Section>) => {
  let cursor = 0;
  return blocks.map((block) => {
    const section = sectionMap.get(block.sourceId);
    const repeats = Math.max(1, section?.repeats || 1);
    const baseBeats = Math.max(1, section ? getSectionBeats(section) : 4);
    const lengthBeats = baseBeats * repeats;
    const next: ArrangementBlock = {
      ...block,
      startBeat: cursor,
      lengthBeats,
      label: section?.name || block.label,
    };
    cursor += lengthBeats;
    return next;
  });
};

export default function ArrangementLane({
  mode,
  sections,
  currentSectionIndex,
  onSelectSection,
  onSetCurrentSectionRepeats,
  onCreateSection,
  onDuplicateSection,
  onDeleteSection,
  onLoadExample,
}: Props) {
  const [snap, setSnap] = useState<"bar" | "beat">("bar");
  const [zoom, setZoom] = useState(0.45);
  const [showSourceTray, setShowSourceTray] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [laneBlocks, setLaneBlocks] = useState<ArrangementBlock[]>([]);

  const sectionMap = useMemo(
    () => new Map(sections.map((section) => [section.id, section])),
    [sections],
  );

  useEffect(() => {
    setLaneBlocks((prev) => {
      if (prev.length === 0) {
        const seeded: ArrangementBlock[] = [];
        let startBeat = 0;
        for (const section of sections) {
          const block = createLaneBlock(section, startBeat, mode);
          seeded.push(block);
          startBeat += block.lengthBeats;
        }
        return seeded;
      }

      const valid = prev.filter((block) => sectionMap.has(block.sourceId));
      const coveredSourceIds = new Set(valid.map((block) => block.sourceId));
      const missingSections = sections.filter(
        (section) => !coveredSourceIds.has(section.id),
      );

      if (missingSections.length === 0) {
        return reflowBlocks(valid, sectionMap);
      }

      const appended = [...valid];
      let tailStart = valid.reduce((sum, block) => sum + block.lengthBeats, 0);
      for (const section of missingSections) {
        const next = createLaneBlock(section, tailStart, mode);
        appended.push(next);
        tailStart += next.lengthBeats;
      }

      return reflowBlocks(appended, sectionMap);
    });
  }, [sections, sectionMap, mode]);

  const totalBeats = useMemo(
    () => laneBlocks.reduce((sum, block) => sum + block.lengthBeats, 0),
    [laneBlocks],
  );

  const pixelsPerBeat = computePxPerBeat({
    zoom,
    minPx: 10,
    maxPx: 60,
    fitToView: false,
    totalBeats,
    viewportWidth: 1200,
  });

  const selectedBlock = laneBlocks.find((block) => block.id === selectedBlockId) || null;
  const selectedSectionIndex =
    selectedBlock
      ? sections.findIndex((section) => section.id === selectedBlock.sourceId)
      : currentSectionIndex;
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null;

  const handleAddSectionToLane = (sectionId: string) => {
    const section = sectionMap.get(sectionId);
    if (!section) return;
    setLaneBlocks((prev) => {
      const next = [...prev, createLaneBlock(section, 0, "harmony")];
      return reflowBlocks(next, sectionMap);
    });
  };

  const handleDuplicateSelected = () => {
    if (!selectedBlock) return;
    setLaneBlocks((prev) => {
      const idx = prev.findIndex((block) => block.id === selectedBlock.id);
      if (idx < 0) return prev;
      const clone: ArrangementBlock = {
        ...selectedBlock,
        id: `arr-${selectedBlock.sourceId}-${Math.random().toString(36).slice(2, 8)}`,
      };
      const next = [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
      return reflowBlocks(next, sectionMap);
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedBlock) return;
    setLaneBlocks((prev) =>
      reflowBlocks(prev.filter((block) => block.id !== selectedBlock.id), sectionMap),
    );
    setSelectedBlockId(null);
  };

  return (
    <div className="w-full mt-3 overflow-hidden rounded-lg border border-border bg-surface/20">
      <div className="flex items-center gap-6 px-4 py-3 border-b border-border bg-surface/30">
        <div className="text-[10px] uppercase tracking-wide muted-text font-semibold">
          Arrangement Lane
        </div>

        <span className="px-2 py-1 text-[9px] uppercase tracking-wide rounded border border-border muted-text">
          {mode} mode
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide muted-text">Snap</span>
          <select
            className="h-7 text-xs compact"
            value={snap}
            onChange={(e) => setSnap(e.target.value as "bar" | "beat")}
          >
            <option value="bar">Bar</option>
            <option value="beat">Beat</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide muted-text">Zoom</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="progression-zoom-slider"
          />
          <span className="text-xs muted-text font-mono">{pixelsPerBeat}px/b</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide muted-text">Section Repeats</span>
          <input
            type="range"
            min={1}
            max={16}
            step={1}
            value={selectedSection?.repeats || 1}
            onChange={(e) => onSetCurrentSectionRepeats(Number(e.target.value) || 1)}
            className="progression-param-slider"
          />
          <span className="text-xs muted-text font-mono w-6 text-center">
            {selectedSection?.repeats || 1}
          </span>
        </div>

        <button
          className="btn-muted px-2 py-1 text-[10px]"
          onClick={handleDuplicateSelected}
          disabled={!selectedBlock}
          title="Duplicate selected arrangement block"
        >
          <Copy size={12} />
        </button>
        <button
          className="btn-muted px-2 py-1 text-[10px]"
          onClick={handleDeleteSelected}
          disabled={!selectedBlock}
          title="Delete selected arrangement block"
        >
          <Trash2 size={12} />
        </button>
        <button
          className="btn-muted px-2 py-1 text-[10px]"
          onClick={() => onLoadExample("stand_by_me")}
          title="Load example arrangement: Stand By Me form"
        >
          Example A
        </button>
        <button
          className="btn-muted px-2 py-1 text-[10px]"
          onClick={() => onLoadExample("blues_12bar")}
          title="Load example arrangement: 12-bar blues form"
        >
          Example B
        </button>
      </div>

      <div className="px-3 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {laneBlocks.length === 0 ? (
            <div className="text-xs muted-text px-2 py-6">
              Arrangement is empty. Add blocks from the Source Tray below.
            </div>
          ) : (
            laneBlocks.map((block) => {
              const sourceIndex = sections.findIndex((section) => section.id === block.sourceId);
              const isSelected = selectedBlockId === block.id;
              const isActiveSource = sourceIndex === currentSectionIndex;
              const sourceRepeats = Math.max(1, sections[sourceIndex]?.repeats || 1);
              const beatsPerBar = Math.max(1, sections[sourceIndex]?.beatsPerBar || 4);
              const markerBeats = Math.max(1, Math.ceil(block.lengthBeats));
              const markerCount = markerBeats + 1; // include right edge boundary
              const barCount = Math.max(1, Math.ceil(block.lengthBeats / beatsPerBar));
              return (
                <button
                  key={block.id}
                  className={`h-20 rounded-md border px-3 py-2 text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? "ring-2 ring-white border-white/40"
                      : isActiveSource
                        ? "ring-1 ring-orange/70 border-orange/45"
                        : "border-border hover:brightness-110"
                  } relative overflow-hidden`}
                  style={{ width: `${Math.max(140, block.lengthBeats * pixelsPerBeat)}px` }}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    if (sourceIndex >= 0) onSelectSection(sourceIndex);
                  }}
                  title={`${block.label} (${Math.round(block.lengthBeats)} beats)`}
                >
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) ${Math.max(
                        1,
                        beatsPerBar * pixelsPerBeat - 2,
                      )}px, rgba(0,0,0,0.24) ${Math.max(
                        1,
                        beatsPerBar * pixelsPerBeat - 2,
                      )}px, rgba(0,0,0,0.24) ${Math.max(
                        2,
                        beatsPerBar * pixelsPerBeat,
                      )}px)`,
                    }}
                  />

                  <div className="absolute inset-0 pointer-events-none opacity-45">
                    {Array.from({ length: markerCount }, (_, idx) => {
                      const beat = idx + 1;
                      const isBar = idx % beatsPerBar === 0 || idx === markerBeats;
                      const leftPct = (idx / block.lengthBeats) * 100;
                      return (
                        <div
                          key={`${block.id}-m-${beat}`}
                          className="absolute top-0 bottom-0"
                          style={{ left: `${Math.min(99.5, Math.max(0, leftPct))}%` }}
                        >
                          <div className={`h-full ${isBar ? "w-[2px] bg-orange/60" : "w-px bg-black/20"}`} />
                          {isBar && idx < markerBeats && (
                            <div className="absolute top-0 left-1 text-[8px] leading-none text-orange/80 font-semibold">
                              {Math.floor(idx / beatsPerBar) + 1}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{block.label}</span>
                    <span className="text-[9px] uppercase tracking-wide muted-text">
                      {block.mode}
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: barCount }, (_, barIdx) => {
                      const barStartBeat = barIdx * beatsPerBar;
                      const remainingBeats = Math.max(0, block.lengthBeats - barStartBeat);
                      const beatsInThisBar = Math.min(beatsPerBar, remainingBeats);
                      const widthPx = Math.max(12, beatsInThisBar * pixelsPerBeat);
                      return (
                        <div
                          key={`${block.id}-bar-${barIdx + 1}`}
                          className="h-3 rounded-sm border border-orange/45 bg-orange/10 text-[8px] text-orange/85 leading-none flex items-center justify-center"
                          style={{ width: `${widthPx}px` }}
                          title={`Bar ${barIdx + 1}`}
                        >
                          {barIdx + 1}
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative z-10 text-[10px] muted-text flex items-center justify-between">
                    <span>
                      @{Math.round(block.startBeat)}b • {Math.round(block.lengthBeats)}b • {barCount} bar{barCount === 1 ? "" : "s"}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] rounded px-1.5 py-0.5 border border-border/70">
                        {Math.max(0, sections[sourceIndex]?.progression.length || 0)} ch
                      </span>
                      <span className="text-[9px] muted-text/80 rounded px-1.5 py-0.5 border border-border/60">
                        x{sourceRepeats}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="border-t border-border bg-surface/25">
        <button
          className="w-full flex items-center justify-between px-4 py-2 text-xs muted-text"
          onClick={() => setShowSourceTray((prev) => !prev)}
        >
          <span>Source Tray</span>
          <ChevronsUpDown size={14} />
        </button>
        {showSourceTray && (
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[10px] uppercase tracking-wide muted-text">
                {mode === "harmony" ? "Harmony Sections" : mode === "drum" ? "Drum Patterns" : "Mode Sources"}
              </div>
              <button
                className="btn-muted px-2 py-1 text-[10px]"
                onClick={onCreateSection}
                title="Create new section"
              >
                <Plus size={12} />
                <span className="ml-1">New</span>
              </button>
            </div>

            {mode === "harmony" ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((section, index) => {
                  const beats = Math.max(1, getSectionBeats(section));
                  const hasData = section.progression.length > 0;
                  const isActive = index === currentSectionIndex;
                  return (
                    <div
                      key={section.id}
                      className={`rounded border px-2 py-2 flex items-center justify-between gap-2 transition-all ${
                        isActive
                          ? "ring-1 ring-orange border-orange/65 bg-orange/10"
                          : hasData
                            ? "border-orange/45 bg-orange/5"
                            : "border-border"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${hasData ? "bg-orange" : "bg-black/25"}`} />
                          <div className="text-xs font-semibold truncate">{section.name}</div>
                        </div>
                        <div className="text-[10px] muted-text">
                          {section.progression.length} chords • {beats} beats
                        </div>
                        <div className="text-[9px] muted-text">
                          {hasData ? "Ready to arrange and edit" : "Empty section - open in Matrix to add progression"}
                        </div>
                        {isActive && (
                          <div className="text-[9px] text-orange font-semibold mt-0.5">
                            Active in Matrix
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn-muted px-2 py-1 text-[10px]"
                          onClick={() => onSelectSection(index)}
                          title="Open section in Mode Matrix"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-muted px-2 py-1 text-[10px]"
                          onClick={() => onDuplicateSection(index)}
                          title="Duplicate section"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          className="btn-muted px-2 py-1 text-[10px]"
                          onClick={() => onDeleteSection(index)}
                          disabled={sections.length <= 1}
                          title="Delete section"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          className="btn-muted px-2 py-1 text-[10px]"
                          onClick={() => handleAddSectionToLane(section.id)}
                          title="Add section instance to arrangement lane"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs muted-text px-1 py-3">
                Drum source tray is reserved for Drum Matrix patterns.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
