import type { ArrangedChordEvent } from "@services/output/ArrangementOutput";
import type { ModeId } from "@/types/arrangement";

export type GrooveLayer = "kick" | "snare" | "hats_ride" | "percussion";

export interface GrooveNote {
  beat: number;
  velocity: number;
  note: number;
}

export interface GroovePattern {
  id: string;
  complexity_score: number;
  density_score?: number;
  pattern: {
    beats: number;
    notes: GrooveNote[];
  };
  metadata?: {
    original_tempo?: number;
    time_signature?: string;
    bar_count?: number;
  };
  _analysis?: {
    genre_hint?: string;
    function?: string;
    feel?: string;
  };
}

export interface GroovePatternLibrary {
  metadata?: Record<string, unknown>;
  layers: Record<GrooveLayer, GroovePattern[]>;
}

export interface GrooveWandererConfig {
  tempo: number;
  timeSignature: [number, number];
  patternLengthBars: number;
  swing: number; // 0..100
  humanization: number; // 0..100
  complexity: Record<GrooveLayer, number>; // 0..100
  changeRate: Record<GrooveLayer, number>; // 0..100
  velocityScale: Record<GrooveLayer, number>; // 0..1.5
}

export interface DrumNoteEvent {
  layer: GrooveLayer;
  beat: number;
  note: number;
  velocity: number;
  durationBeats: number;
}

export interface GroovePatternResult {
  events: DrumNoteEvent[];
  selectedPatterns: Partial<Record<GrooveLayer, GroovePattern>>;
  totalBeats: number;
  bars: number;
}

const DEFAULT_CONFIG: GrooveWandererConfig = {
  tempo: 120,
  timeSignature: [4, 4],
  patternLengthBars: 4,
  swing: 0,
  humanization: 8,
  complexity: {
    kick: 45,
    snare: 45,
    hats_ride: 55,
    percussion: 35,
  },
  changeRate: {
    kick: 25,
    snare: 25,
    hats_ride: 40,
    percussion: 50,
  },
  velocityScale: {
    kick: 1,
    snare: 1,
    hats_ride: 0.9,
    percussion: 0.8,
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const clampMidi = (value: number): number => clamp(Math.round(value), 0, 127);

const asNorm = (value: number): number => clamp(value / 100, 0, 1);

const beatDurationForLayer = (layer: GrooveLayer): number => {
  if (layer === "hats_ride") return 0.2;
  if (layer === "percussion") return 0.18;
  return 0.22;
};

const orderedLayers: GrooveLayer[] = ["kick", "snare", "hats_ride", "percussion"];

export class GrooveWandererEngine {
  private library: GroovePatternLibrary | null = null;
  private config: GrooveWandererConfig = { ...DEFAULT_CONFIG };
  private selectedPatterns: Partial<Record<GrooveLayer, GroovePattern>> = {};

  setConfig(next: Partial<GrooveWandererConfig>): void {
    this.config = {
      ...this.config,
      ...next,
      complexity: { ...this.config.complexity, ...(next.complexity || {}) },
      changeRate: { ...this.config.changeRate, ...(next.changeRate || {}) },
      velocityScale: { ...this.config.velocityScale, ...(next.velocityScale || {}) },
    };
  }

  getConfig(): GrooveWandererConfig {
    return this.config;
  }

  loadLibrary(library: GroovePatternLibrary): void {
    this.library = library;
    this.selectedPatterns = {};
  }

  loadLibraryFromUnknown(raw: unknown): void {
    const source = raw as GroovePatternLibrary;
    const layers = source?.layers;
    if (!layers) {
      throw new Error("Invalid GrooveWanderer library: missing layers");
    }
    for (const layer of orderedLayers) {
      if (!Array.isArray(layers[layer])) {
        throw new Error(`Invalid GrooveWanderer library: layer ${layer} missing`);
      }
    }
    this.loadLibrary(source);
  }

  hasLibrary(): boolean {
    return this.library !== null;
  }

  generatePattern(bars?: number, randomFn: () => number = Math.random): GroovePatternResult {
    if (!this.library) {
      return { events: [], selectedPatterns: {}, totalBeats: 0, bars: 0 };
    }

    const beatsPerBar = Math.max(1, this.config.timeSignature[0] || 4);
    const targetBars = Math.max(1, Math.floor(bars || this.config.patternLengthBars));
    const totalBeats = targetBars * beatsPerBar;
    const events: DrumNoteEvent[] = [];

    for (let bar = 0; bar < targetBars; bar += 1) {
      const barStartBeat = bar * beatsPerBar;
      for (const layer of orderedLayers) {
        const pattern = this.selectPatternForLayer(layer, randomFn);
        if (!pattern) continue;
        this.selectedPatterns[layer] = pattern;

        const layerEvents = this.renderLayerForBar(layer, pattern, barStartBeat, beatsPerBar, randomFn);
        events.push(...layerEvents);
      }
    }

    events.sort((a, b) => a.beat - b.beat || a.note - b.note);
    return {
      events,
      selectedPatterns: { ...this.selectedPatterns },
      totalBeats,
      bars: targetBars,
    };
  }

  toArrangedEvents(
    pattern: GroovePatternResult,
    options?: {
      blockId?: string;
      sectionId?: string;
      sectionName?: string;
      mode?: ModeId;
      midiChannel?: number;
      defaultVelocity?: number;
    },
  ): ArrangedChordEvent[] {
    const blockId = options?.blockId || "groove-wanderer";
    const sectionId = options?.sectionId || "drum-pattern";
    const sectionName = options?.sectionName || "Drum Pattern";
    const mode = options?.mode || "drum";
    const channel = options?.midiChannel;

    return pattern.events.map((event, index) => ({
      blockId,
      sectionId,
      sectionName,
      mode,
      midiChannel: channel,
      startBeat: event.beat,
      durationBeats: event.durationBeats,
      notes: [event.note],
      velocity: clampMidi(options?.defaultVelocity ?? event.velocity),
      gatePercent: 100,
      strumMs: 0,
      chordIndex: index,
    }));
  }

  private selectPatternForLayer(
    layer: GrooveLayer,
    randomFn: () => number,
  ): GroovePattern | null {
    if (!this.library) return null;
    const layerPatterns = this.library.layers[layer] || [];
    if (layerPatterns.length === 0) return null;

    const current = this.selectedPatterns[layer];
    const changeProbability = asNorm(this.config.changeRate[layer]);
    if (current && randomFn() > changeProbability) {
      return current;
    }

    const targetComplexity = asNorm(this.config.complexity[layer]);
    const weighted = layerPatterns.map((pattern) => {
      const score = clamp(pattern.complexity_score || 0.5, 0, 1);
      const distance = Math.abs(score - targetComplexity);
      return {
        pattern,
        weight: 1 / (distance + 0.08),
      };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = randomFn() * total;
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.pattern;
    }
    return weighted[weighted.length - 1]?.pattern || null;
  }

  private renderLayerForBar(
    layer: GrooveLayer,
    pattern: GroovePattern,
    barStartBeat: number,
    beatsPerBar: number,
    randomFn: () => number,
  ): DrumNoteEvent[] {
    const patternBeats = Math.max(1, pattern.pattern.beats || beatsPerBar);
    const beatScale = beatsPerBar / patternBeats;
    const swingAmount = asNorm(this.config.swing) * 0.09; // up to ~9% beat delay
    const humanizeAmount = asNorm(this.config.humanization);
    const velocityScale = clamp(this.config.velocityScale[layer], 0.2, 1.8);

    return pattern.pattern.notes
      .map((note) => {
        const normalizedBeat = note.beat * beatScale;
        if (normalizedBeat < 0 || normalizedBeat >= beatsPerBar) return null;

        const sixteenthIndex = Math.floor(normalizedBeat / 0.25);
        const isOffBeat16 = sixteenthIndex % 2 === 1;
        const swingOffset = isOffBeat16 ? swingAmount : 0;
        const timingJitter = (randomFn() - 0.5) * 0.04 * humanizeAmount;
        const nextBeat = barStartBeat + normalizedBeat + swingOffset + timingJitter;

        const velocityJitter = (randomFn() - 0.5) * 18 * humanizeAmount;
        const nextVelocity = clampMidi(note.velocity * velocityScale + velocityJitter);

        return {
          layer,
          beat: Math.max(0, nextBeat),
          note: clampMidi(note.note),
          velocity: nextVelocity,
          durationBeats: beatDurationForLayer(layer),
        } as DrumNoteEvent;
      })
      .filter((event): event is DrumNoteEvent => event !== null);
  }
}

export function createDefaultGrooveWandererConfig(): GrooveWandererConfig {
  return { ...DEFAULT_CONFIG };
}
