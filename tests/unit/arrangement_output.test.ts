import { describe, expect, it } from "vitest";
import {
  buildArrangedChordEvents,
  toMidiFileBytes,
  toOscProgression,
} from "@/services/output/ArrangementOutput";
import type { Section } from "@/types/progression";
import type { ArrangementBlock } from "@/types/arrangement";

describe("ArrangementOutput", () => {
  const sectionA: Section = {
    id: "sec-a",
    name: "Verse",
    progression: [
      {
        notes: [60, 64, 67],
        duration: 1,
        metadata: {
          velocities: [96],
          gate: [120],
          strum: [0],
        },
      },
      {
        notes: [62, 65, 69],
        duration: 1,
        metadata: {
          velocities: [102],
          gate: [90],
          strum: [5],
        },
      },
    ],
    repeats: 1,
    beatsPerBar: 4,
    rootHeld: null,
    currentNotes: [],
    transitions: { type: "none", length: 1 },
  };

  const sectionB: Section = {
    ...sectionA,
    id: "sec-b",
    name: "Drums",
    progression: [
      {
        notes: [36],
        duration: 2,
        metadata: {
          velocities: [110, 110],
          gate: [100, 100],
          strum: [0, 0],
        },
      },
    ],
  };

  it("builds arranged events with per-block midi channels", () => {
    const blocks: ArrangementBlock[] = [
      {
        id: "blk-a",
        sourceId: "sec-a",
        mode: "harmony",
        midiChannel: 3,
        startBeat: 0,
        lengthBeats: 2,
        label: "Verse",
        repeats: 1,
      },
      {
        id: "blk-b",
        sourceId: "sec-b",
        mode: "drum",
        midiChannel: 10,
        startBeat: 2,
        lengthBeats: 2,
        label: "Drums",
        repeats: 1,
      },
    ];

    const events = buildArrangedChordEvents([sectionA, sectionB], blocks);
    expect(events).toHaveLength(3);
    expect(events[0].midiChannel).toBe(3);
    expect(events[2].midiChannel).toBe(10);
    expect(events[2].startBeat).toBe(2);
  });

  it("converts arranged events to osc progression and preserves gaps", () => {
    const events = [
      {
        blockId: "b1",
        sectionId: "s1",
        sectionName: "A",
        mode: "harmony",
        midiChannel: 1,
        startBeat: 0,
        durationBeats: 1,
        notes: [60, 64, 67],
        velocity: 100,
        gatePercent: 100,
        strumMs: 0,
        chordIndex: 0,
      },
      {
        blockId: "b2",
        sectionId: "s2",
        sectionName: "B",
        mode: "harmony",
        midiChannel: 1,
        startBeat: 3,
        durationBeats: 1,
        notes: [65, 69, 72],
        velocity: 100,
        gatePercent: 100,
        strumMs: 0,
        chordIndex: 0,
      },
    ];

    const progression = toOscProgression(events);
    expect(progression).toHaveLength(3);
    expect(progression[1].notes).toEqual([]);
    expect(progression[1].duration).toBe(2);
  });

  it("renders a valid midi file header", () => {
    const events = buildArrangedChordEvents(
      [sectionA],
      [
        {
          id: "blk-a",
          sourceId: "sec-a",
          mode: "harmony",
          midiChannel: 1,
          startBeat: 0,
          lengthBeats: 2,
          label: "Verse",
          repeats: 1,
        },
      ],
    );

    const bytes = toMidiFileBytes(events, { tempo: 120, timeSignature: "4/4" });
    expect(bytes.length).toBeGreaterThan(20);
    // MThd
    expect(bytes[0]).toBe(0x4d);
    expect(bytes[1]).toBe(0x54);
    expect(bytes[2]).toBe(0x68);
    expect(bytes[3]).toBe(0x64);
  });
});

