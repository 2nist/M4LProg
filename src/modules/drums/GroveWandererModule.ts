import { GrooveWandererEngine, type GroovePatternLibrary, type GrooveWandererConfig } from "./GroveWandererEngine";
import { toMidiFileBytes } from "@services/output/ArrangementOutput";
import { sendArrangedEventsToWebMidi, stopActiveWebMidiPlayback } from "@services/output/WebMidiOutService";
import type { ModeId } from "@/types/arrangement";

export interface GroveWandererPlaybackOptions {
  outputId?: string | null;
  midiChannel?: number;
  modeChannels?: Partial<Record<ModeId, number>>;
}

export class GroveWandererModule {
  readonly type = "rhythm-generator";
  readonly name = "Grove Wanderer";
  readonly category = "drums";
  readonly version = "1.0.0";

  private readonly engine = new GrooveWandererEngine();
  private initialized = false;
  private lastRendered = this.engine.generatePattern(1);

  async initialize(library?: GroovePatternLibrary): Promise<void> {
    if (library) {
      this.engine.loadLibrary(library);
      this.lastRendered = this.engine.generatePattern();
    }
    this.initialized = true;
  }

  async destroy(): Promise<void> {
    stopActiveWebMidiPlayback();
    this.initialized = false;
  }

  setConfig(config: Partial<GrooveWandererConfig>): void {
    this.engine.setConfig(config);
  }

  getConfig(): GrooveWandererConfig {
    return this.engine.getConfig();
  }

  loadLibrary(library: GroovePatternLibrary): void {
    this.engine.loadLibrary(library);
    this.lastRendered = this.engine.generatePattern();
  }

  generatePattern(config?: Partial<GrooveWandererConfig>) {
    if (config) this.engine.setConfig(config);
    this.lastRendered = this.engine.generatePattern();
    return this.lastRendered;
  }

  async startPlayback(options: GroveWandererPlaybackOptions = {}): Promise<boolean> {
    if (!this.initialized) return false;
    if (!this.lastRendered.events.length) {
      this.lastRendered = this.engine.generatePattern();
    }
    const arranged = this.engine.toArrangedEvents(this.lastRendered, {
      mode: "drum",
      midiChannel: options.midiChannel,
    });
    return sendArrangedEventsToWebMidi(arranged, {
      outputId: options.outputId,
      channel: options.midiChannel,
      tempo: this.engine.getConfig().tempo,
      modeChannels: options.modeChannels,
    });
  }

  stopPlayback(): void {
    stopActiveWebMidiPlayback();
  }

  handleTempoChange(newTempo: number): void {
    this.engine.setConfig({ tempo: Math.max(20, Math.min(300, newTempo)) });
  }

  exportMidi(): Uint8Array {
    const arranged = this.engine.toArrangedEvents(this.lastRendered, {
      mode: "drum",
    });
    return toMidiFileBytes(arranged, {
      tempo: this.engine.getConfig().tempo,
      timeSignature: `${this.engine.getConfig().timeSignature[0]}/${this.engine.getConfig().timeSignature[1]}`,
    });
  }
}
