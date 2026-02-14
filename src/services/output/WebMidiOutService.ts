import { WebMidi } from "webmidi";
import type { ArrangedChordEvent } from "./ArrangementOutput";
import type { ModeId } from "@/types/arrangement";

export interface MidiOutputDevice {
  id: string;
  name: string;
}

export interface WebMidiOutputDiagnostic {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
  connection: string;
}

export interface WebMidiDebugSnapshot {
  enabled: boolean;
  sysexEnabled: boolean;
  outputCount: number;
  outputs: WebMidiOutputDiagnostic[];
}

export interface WebMidiSendOptions {
  outputId?: string | null;
  channel?: number;
  tempo?: number;
  modeChannels?: Partial<Record<ModeId, number>>;
  onEventSent?: () => void;
  onSignal?: (signal: {
    type: "on" | "off" | "all_off";
    note?: number;
    velocity?: number;
    channel: number;
  }) => void;
}

interface PlaybackSession {
  stop: () => void;
}

let activeSession: PlaybackSession | null = null;

const clampChannel = (channel: number): number =>
  Math.max(1, Math.min(16, Math.floor(channel || 1)));

const clampMidi = (value: number): number =>
  Math.max(0, Math.min(127, Math.round(value)));

async function ensureEnabled(): Promise<boolean> {
  if (WebMidi.enabled) return true;
  try {
    await WebMidi.enable({ sysex: true });
    return true;
  } catch (sysexError) {
    console.warn("WebMIDI sysex enable failed, retrying without sysex:", sysexError);
    try {
      await WebMidi.enable({ sysex: false });
      return true;
    } catch (error) {
      console.warn("WebMIDI enable failed:", error);
      return false;
    }
  }
}

export async function listMidiOutputDevices(): Promise<MidiOutputDevice[]> {
  const enabled = await ensureEnabled();
  if (!enabled) return [];
  return WebMidi.outputs.map((output) => ({
    id: output.id,
    name: output.name || "MIDI Output",
  }));
}

export async function getWebMidiDebugSnapshot(): Promise<WebMidiDebugSnapshot> {
  const enabled = await ensureEnabled();
  if (!enabled) {
    return {
      enabled: false,
      sysexEnabled: false,
      outputCount: 0,
      outputs: [],
    };
  }
  const outputs = WebMidi.outputs.map((output) => ({
    id: output.id,
    name: output.name || "MIDI Output",
    manufacturer: output.manufacturer || "unknown",
    state: output.state || "unknown",
    connection: (output as { connection?: string }).connection || "unknown",
  }));
  return {
    enabled: WebMidi.enabled,
    sysexEnabled: WebMidi.sysexEnabled,
    outputCount: outputs.length,
    outputs,
  };
}

export async function sendWebMidiTestNote(options?: {
  outputId?: string | null;
  channel?: number;
  note?: number;
  velocity?: number;
  durationMs?: number;
}): Promise<boolean> {
  const enabled = await ensureEnabled();
  if (!enabled) return false;
  const output = getOutput(options?.outputId);
  if (!output) {
    console.warn("No MIDI output available for test note");
    return false;
  }

  const channel = clampChannel(options?.channel || 1);
  const note = clampMidi(options?.note ?? 60);
  const velocity = clampMidi(options?.velocity ?? 100);
  const durationMs = Math.max(40, Math.min(4000, Math.floor(options?.durationMs ?? 250)));
  const statusOn = 0x90 + (channel - 1);
  const statusOff = 0x80 + (channel - 1);

  output.send([statusOn, note, velocity]);
  window.setTimeout(() => {
    output.send([statusOff, note, 0]);
  }, durationMs);
  return true;
}

function getOutput(outputId?: string | null) {
  if (outputId) {
    return WebMidi.getOutputById(outputId) || WebMidi.outputs[0] || null;
  }
  return WebMidi.outputs[0] || null;
}

export function stopActiveWebMidiPlayback(): void {
  if (activeSession) {
    activeSession.stop();
    activeSession = null;
  }
}

export async function sendArrangedEventsToWebMidi(
  events: ArrangedChordEvent[],
  options: WebMidiSendOptions = {},
): Promise<boolean> {
  if (!events.length) return false;
  const enabled = await ensureEnabled();
  if (!enabled) return false;

  const output = getOutput(options.outputId);
  if (!output) {
    console.warn("No MIDI output available");
    return false;
  }

  stopActiveWebMidiPlayback();

  const defaultChannel = clampChannel(options.channel || 1);
  const tempo = options.tempo || 120;
  const msPerBeat = 60000 / Math.max(1, tempo);
  const timers: number[] = [];
  const activeNotes: Array<{ note: number; channel: number }> = [];
  const startAt = performance.now();

  const schedule = (delayMs: number, fn: () => void) => {
    const timer = window.setTimeout(fn, Math.max(0, delayMs));
    timers.push(timer);
  };

  const session: PlaybackSession = {
    stop: () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.length = 0;
      activeNotes.forEach(({ note, channel }) => {
        const statusOff = 0x80 + (channel - 1);
        output.send([statusOff, clampMidi(note), 0]);
      });
      for (let channel = 1; channel <= 16; channel += 1) {
        const statusCc = 0xb0 + (channel - 1);
        output.send([statusCc, 123, 0]); // all notes off
      }
      activeNotes.length = 0;
    },
  };
  activeSession = session;

  events.forEach((event) => {
    const startMs = event.startBeat * msPerBeat;
    const durationMs =
      Math.max(1, event.durationBeats * msPerBeat * Math.max(0.01, event.gatePercent / 100));
    const strumMs = Math.max(0, event.strumMs || 0);
    const velocity = clampMidi(event.velocity || 100);
    const modeChannel =
      options.modeChannels?.[event.mode as ModeId] !== undefined
        ? clampChannel(options.modeChannels[event.mode as ModeId] as number)
        : undefined;
    const eventChannel = clampChannel(event.midiChannel || modeChannel || defaultChannel);
    const statusOn = 0x90 + (eventChannel - 1);
    const statusOff = 0x80 + (eventChannel - 1);

    event.notes.forEach((note, noteIndex) => {
      const onDelay = startMs + noteIndex * strumMs;
      const offDelay = onDelay + durationMs;
      const safeNote = clampMidi(note);

      schedule(onDelay, () => {
        output.send([statusOn, safeNote, velocity]);
        activeNotes.push({ note: safeNote, channel: eventChannel });
        options.onEventSent?.();
        options.onSignal?.({
          type: "on",
          note: safeNote,
          velocity,
          channel: eventChannel,
        });
      });
      schedule(offDelay, () => {
        output.send([statusOff, safeNote, 0]);
        const idx = activeNotes.findIndex(
          (entry) => entry.note === safeNote && entry.channel === eventChannel,
        );
        if (idx >= 0) activeNotes.splice(idx, 1);
        options.onEventSent?.();
        options.onSignal?.({
          type: "off",
          note: safeNote,
          velocity: 0,
          channel: eventChannel,
        });
      });
    });
  });

  const totalMs = events.reduce(
    (max, event) =>
      Math.max(
        max,
        event.startBeat * msPerBeat +
          event.durationBeats * msPerBeat * Math.max(0.01, event.gatePercent / 100),
      ),
    0,
  );

  schedule(totalMs + 30, () => {
    for (let channel = 1; channel <= 16; channel += 1) {
      const statusCc = 0xb0 + (channel - 1);
      output.send([statusCc, 123, 0]);
      options.onSignal?.({
        type: "all_off",
        channel,
      });
    }
    activeSession = null;
  });

  console.log("WebMIDI playback started:", {
    output: output.name,
    channel: defaultChannel,
    eventCount: events.length,
    startedAt: startAt,
  });

  return true;
}
