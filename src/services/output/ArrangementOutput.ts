import type { Chord } from "@/types/chord";
import type { ArrangementBlock } from "@/types/arrangement";
import type { Section } from "@/types/progression";
import type { ModeId } from "@/types/arrangement";

export interface ArrangedChordEvent {
  blockId: string;
  sectionId: string;
  sectionName: string;
  mode: string;
  midiChannel?: number;
  startBeat: number;
  durationBeats: number;
  notes: number[];
  velocity: number;
  gatePercent: number;
  strumMs: number;
  chordIndex: number;
}

export interface ArrangementSnapshot {
  exportedAt: number;
  tempo: number;
  timeSignature: string;
  totalBeats: number;
  blockCount: number;
  sections: Section[];
  blocks: ArrangementBlock[];
  events: ArrangedChordEvent[];
}

export interface OscProgressionChord {
  notes: number[];
  duration: number;
}

const DEFAULT_TEMPO = 120;

const clampMidi = (value: number): number =>
  Math.max(0, Math.min(127, Math.round(value)));

const safeDuration = (duration: number): number =>
  Math.max(0.25, duration || 0.25);

const getSectionProgressionForMode = (
  section: Section,
  mode: string,
): Chord[] => {
  const modeId = mode as ModeId;
  const modeProgression = section.modeProgressions?.[modeId];
  if (Array.isArray(modeProgression)) return modeProgression;
  // Fall back to main progression for any mode when modeProgressions is not defined
  return section.progression || [];
};

export function buildArrangedChordEvents(
  sections: Section[],
  blocks: ArrangementBlock[],
): ArrangedChordEvent[] {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const sortedBlocks = [...blocks].sort((a, b) => a.startBeat - b.startBeat);
  const events: ArrangedChordEvent[] = [];

  for (const block of sortedBlocks) {
    const section = sectionMap.get(block.sourceId);
    if (!section) continue;
    const sectionProgression = getSectionProgressionForMode(
      section,
      block.mode,
    );
    if (!Array.isArray(sectionProgression)) continue;

    const blockRepeats = Math.max(1, block.repeats || section.repeats || 1);
    const sectionLength = sectionProgression.reduce(
      (sum, chord) => sum + safeDuration(chord.duration),
      0,
    );

    for (let repeatIndex = 0; repeatIndex < blockRepeats; repeatIndex += 1) {
      const repeatOffset = repeatIndex * sectionLength;
      let chordCursor = 0;

      sectionProgression.forEach((chord: Chord, chordIndex: number) => {
        const durationBeats = safeDuration(chord.duration);
        const beatIndex = Math.max(0, Math.floor(chordCursor));
        events.push({
          blockId: block.id,
          sectionId: section.id,
          sectionName: section.name || "Section",
          mode: block.mode,
          midiChannel: block.midiChannel,
          startBeat: block.startBeat + repeatOffset + chordCursor,
          durationBeats,
          notes: Array.isArray(chord.notes)
            ? chord.notes.map((n) => clampMidi(n))
            : [],
          velocity: clampMidi(chord.metadata?.velocities?.[beatIndex] ?? 100),
          gatePercent: Math.max(
            1,
            Math.min(200, chord.metadata?.gate?.[beatIndex] ?? 100),
          ),
          strumMs: Math.max(0, chord.metadata?.strum?.[beatIndex] ?? 0),
          chordIndex,
        });
        chordCursor += durationBeats;
      });
    }
  }

  return events.sort((a, b) => a.startBeat - b.startBeat);
}

export function createArrangementSnapshot(params: {
  sections: Section[];
  blocks: ArrangementBlock[];
  tempo?: number;
  timeSignature?: string;
}): ArrangementSnapshot {
  const tempo = params.tempo || DEFAULT_TEMPO;
  const timeSignature = params.timeSignature || "4/4";
  const events = buildArrangedChordEvents(params.sections, params.blocks);
  const totalBeats = events.reduce(
    (maxBeat, event) =>
      Math.max(maxBeat, event.startBeat + event.durationBeats),
    0,
  );

  return {
    exportedAt: Date.now(),
    tempo,
    timeSignature,
    totalBeats,
    blockCount: params.blocks.length,
    sections: params.sections,
    blocks: params.blocks,
    events,
  };
}

export function toOscProgression(
  events: ArrangedChordEvent[],
): OscProgressionChord[] {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const progression: OscProgressionChord[] = [];
  let cursor = 0;

  for (const event of sorted) {
    if (event.startBeat > cursor) {
      progression.push({
        notes: [],
        duration: event.startBeat - cursor,
      });
      cursor = event.startBeat;
    }

    progression.push({
      notes: event.notes,
      duration: event.durationBeats,
    });
    cursor += event.durationBeats;
  }

  return progression;
}

function encodeVarLen(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function pushU32(target: number[], value: number): void {
  target.push((value >>> 24) & 0xff);
  target.push((value >>> 16) & 0xff);
  target.push((value >>> 8) & 0xff);
  target.push(value & 0xff);
}

function parseTimeSignature(sig: string): {
  numerator: number;
  denominatorPow: number;
} {
  const [numRaw, denRaw] = sig.split("/");
  const numerator = Math.max(1, Number(numRaw) || 4);
  const denominator = Math.max(1, Number(denRaw) || 4);
  const denominatorPow = Math.round(Math.log2(denominator));
  return { numerator, denominatorPow: Math.max(0, denominatorPow) };
}

/**
 * Convert events to MIDI timeline sorted by tick
 */
function eventsToTimeline(
  events: ArrangedChordEvent[],
  ppq: number,
): Array<{
  tick: number;
  status: number;
  data1: number;
  data2: number;
}> {
  const timeline: Array<{
    tick: number;
    status: number;
    data1: number;
    data2: number;
  }> = [];

  for (const event of events) {
    const startTick = Math.max(0, Math.round(event.startBeat * ppq));
    const gateScale = Math.max(0.01, event.gatePercent / 100);
    const durationTicks = Math.max(
      1,
      Math.round(event.durationBeats * ppq * gateScale),
    );
    const endTick = startTick + durationTicks;

    event.notes.forEach((note) => {
      timeline.push({
        tick: startTick,
        status: 0x90,
        data1: clampMidi(note),
        data2: clampMidi(event.velocity),
      });
      timeline.push({
        tick: endTick,
        status: 0x80,
        data1: clampMidi(note),
        data2: 0,
      });
    });
  }

  return timeline.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    return a.status - b.status;
  });
}

/**
 * Create track data with tempo and time signature meta events
 */
function createTrackData(
  timeline: Array<{
    tick: number;
    status: number;
    data1: number;
    data2: number;
  }>,
  tempo: number,
  timeSignature: string,
): number[] {
  const ppq = 480;
  const beatsPerSecond = tempo / 60;
  const usPerQuarter = Math.max(1, Math.round(1_000_000 / beatsPerSecond));
  const { numerator, denominatorPow } = parseTimeSignature(timeSignature);

  const trackData: number[] = [];
  const pushMeta = (delta: number, metaType: number, data: number[]) => {
    trackData.push(
      ...encodeVarLen(delta),
      0xff,
      metaType,
      ...encodeVarLen(data.length),
      ...data,
    );
  };

  pushMeta(0, 0x51, [
    (usPerQuarter >> 16) & 0xff,
    (usPerQuarter >> 8) & 0xff,
    usPerQuarter & 0xff,
  ]);
  pushMeta(0, 0x58, [numerator & 0xff, denominatorPow & 0xff, 24, 8]);

  let lastTick = 0;
  for (const midiEvent of timeline) {
    const delta = Math.max(0, midiEvent.tick - lastTick);
    trackData.push(
      ...encodeVarLen(delta),
      midiEvent.status,
      midiEvent.data1,
      midiEvent.data2,
    );
    lastTick = midiEvent.tick;
  }

  trackData.push(0x00, 0xff, 0x2f, 0x00);
  return trackData;
}

/**
 * Create a track with only text meta events (for track names)
 */
function createMetaTrackData(trackName: string): number[] {
  const trackData: number[] = [];
  const nameBytes = new TextEncoder().encode(trackName);

  // Track name meta event
  trackData.push(0x00, 0xff, 0x03);
  trackData.push(...encodeVarLen(nameBytes.length));
  trackData.push(...nameBytes);

  // End of track
  trackData.push(0x00, 0xff, 0x2f, 0x00);

  return trackData;
}

export function toMidiFileBytes(
  events: ArrangedChordEvent[],
  options?: { tempo?: number; timeSignature?: string; ppq?: number },
): Uint8Array {
  const tempo = options?.tempo || DEFAULT_TEMPO;
  const ppq = options?.ppq || 480;
  const timeSignature = options?.timeSignature || "4/4";

  const timeline = eventsToTimeline(events, ppq);
  const trackData = createTrackData(timeline, tempo, timeSignature);

  const bytes: number[] = [];
  bytes.push(0x4d, 0x54, 0x68, 0x64); // MThd
  pushU32(bytes, 6);
  bytes.push(0x00, 0x00); // format 0
  bytes.push(0x00, 0x01); // one track
  bytes.push((ppq >> 8) & 0xff, ppq & 0xff);

  bytes.push(0x4d, 0x54, 0x72, 0x6b); // MTrk
  pushU32(bytes, trackData.length);
  bytes.push(...trackData);

  return new Uint8Array(bytes);
}

/**
 * Multi-track MIDI export options
 */
export interface MultiTrackMidiOptions {
  tempo?: number;
  timeSignature?: string;
  ppq?: number;
  /** Channel mapping for each mode. Defaults to 1 for harmony, 10 for drum, 11 for other */
  modeChannels?: Partial<Record<ModeId, number>>;
  /** Include track for each mode. Defaults to all true */
  includeModes?: Partial<Record<ModeId, boolean>>;
}

/**
 * Export arrangement to Type 1 MIDI file with separate tracks per mode
 * This creates a multi-track MIDI file ideal for DAW import
 *
 * @param sections - Sections with progressions
 * @param blocks - Arrangement blocks
 * @param options - Export options
 * @returns Type 1 MIDI file bytes with separate tracks per mode
 */
export function toMultiTrackMidiFileBytes(
  sections: Section[],
  blocks: ArrangementBlock[],
  options: MultiTrackMidiOptions = {},
): Uint8Array {
  const tempo = options.tempo || DEFAULT_TEMPO;
  const ppq = options.ppq || 480;
  const timeSignature = options.timeSignature || "4/4";

  // Default channel assignments
  const defaultChannels: Record<ModeId, number> = {
    harmony: 1,
    drum: 10,
    other: 11,
  };
  const modeChannels = {
    ...defaultChannels,
    ...options.modeChannels,
  };

  // Which modes to include
  const defaultInclude: Record<ModeId, boolean> = {
    harmony: true,
    drum: true,
    other: true,
  };
  const includeModes = {
    ...defaultInclude,
    ...options.includeModes,
  };

  // Build events for all modes
  const allEvents = buildArrangedChordEvents(sections, blocks);

  // Group events by mode
  const eventsByMode: Record<ModeId, ArrangedChordEvent[]> = {
    harmony: [],
    drum: [],
    other: [],
  };

  for (const event of allEvents) {
    const mode = event.mode as ModeId;
    if (eventsByMode[mode]) {
      eventsByMode[mode].push(event);
    }
  }

  // Build track data for each included mode
  const trackDataList: number[][] = [];

  // Add meta track first (optional - for track names)
  const trackNames: ModeId[] = ["harmony", "drum", "other"].filter(
    (m) => includeModes[m as ModeId],
  ) as ModeId[];

  // Determine total tracks: 1 for header + 1 per mode
  const trackCount = 1 + trackNames.length;

  const bytes: number[] = [];
  bytes.push(0x4d, 0x54, 0x68, 0x64); // MThd
  pushU32(bytes, 6);
  bytes.push(0x00, 0x00); // format 1 (multi-track)
  bytes.push((trackCount >> 8) & 0xff, trackCount & 0xff);
  bytes.push((ppq >> 8) & 0xff, ppq & 0xff);

  // Create tracks for each mode
  for (const mode of trackNames) {
    const events = eventsByMode[mode];
    const channel = modeChannels[mode];
    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

    // Apply channel to events
    const channeledEvents = events.map((e) => ({
      ...e,
      midiChannel: channel,
    }));

    const timeline = eventsToTimeline(channeledEvents, ppq);
    const trackData = createTrackData(timeline, tempo, timeSignature);

    bytes.push(0x4d, 0x54, 0x72, 0x6b); // MTrk
    pushU32(bytes, trackData.length);
    bytes.push(...trackData);
  }

  return new Uint8Array(bytes);
}

/**
 * Detect song form from section names
 * Returns letters (A, B, C...) based on unique sections
 */
export function detectSongForm(sections: Section[]): string {
  if (!sections || sections.length === 0) return "";

  // Map section names to form letters
  const uniqueSections: Map<string, string> = new Map();
  let letterCode = 65; // ASCII 'A'

  const formLetters: string[] = [];

  for (const section of sections) {
    const name = section.name || "Section";

    if (!uniqueSections.has(name)) {
      uniqueSections.set(name, String.fromCharCode(letterCode));
      letterCode += 1;
    }

    formLetters.push(uniqueSections.get(name)!);
  }

  return formLetters.join("-");
}

/**
 * Get form analysis with detailed breakdown
 */
export interface SongFormAnalysis {
  form: string;
  sections: Array<{
    name: string;
    letter: string;
    type: string;
    repeats: number;
    durationBeats: number;
  }>;
  totalDuration: number;
}

export function analyzeSongForm(
  sections: Section[],
  blocks: ArrangementBlock[],
): SongFormAnalysis {
  const uniqueSections: Map<string, string> = new Map();
  let letterCode = 65;

  const sectionMap = new Map(sections.map((s) => [s.id, s]));

  const analyzed: SongFormAnalysis["sections"] = [];

  for (const block of blocks) {
    const section = sectionMap.get(block.sourceId);
    if (!section) continue;

    const name = section.name || "Section";

    if (!uniqueSections.has(name)) {
      uniqueSections.set(name, String.fromCharCode(letterCode));
      letterCode += 1;
    }

    const letter = uniqueSections.get(name)!;
    const repeats = block.repeats || section.repeats || 1;

    // Calculate duration
    const progression = section.progression || [];
    const sectionDuration = progression.reduce(
      (sum, chord) => sum + safeDuration(chord.duration),
      0,
    );
    const blockDuration = sectionDuration * repeats;

    analyzed.push({
      name,
      letter,
      type: section.sectionType || "custom",
      repeats,
      durationBeats: blockDuration,
    });
  }

  const totalDuration = analyzed.reduce((sum, s) => sum + s.durationBeats, 0);

  return {
    form: analyzed.map((s) => s.letter).join("-"),
    sections: analyzed,
    totalDuration,
  };
}

export function triggerBrowserDownload(
  filename: string,
  content: BlobPart | Uint8Array,
  mimeType: string,
): void {
  const blobContent: BlobPart = (() => {
    if (!(content instanceof Uint8Array)) return content;
    const stable = new Uint8Array(content.length);
    stable.set(content);
    return stable;
  })();
  const blob = new Blob([blobContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
