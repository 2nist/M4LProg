import type { GroovePatternLibrary } from "./GroveWandererEngine";

export const seedGrooveLibrary: GroovePatternLibrary = {
  metadata: {
    source: "2nist-seed",
    version: "1.0.0",
  },
  layers: {
    kick: [
      {
        id: "kick-basic",
        complexity_score: 0.25,
        pattern: {
          beats: 4,
          notes: [
            { beat: 0, note: 36, velocity: 108 },
            { beat: 2, note: 36, velocity: 102 },
          ],
        },
      },
      {
        id: "kick-drive",
        complexity_score: 0.62,
        pattern: {
          beats: 4,
          notes: [
            { beat: 0, note: 36, velocity: 110 },
            { beat: 1.5, note: 36, velocity: 94 },
            { beat: 2, note: 36, velocity: 106 },
            { beat: 3.5, note: 36, velocity: 88 },
          ],
        },
      },
    ],
    snare: [
      {
        id: "snare-backbeat",
        complexity_score: 0.3,
        pattern: {
          beats: 4,
          notes: [
            { beat: 1, note: 38, velocity: 102 },
            { beat: 3, note: 38, velocity: 110 },
          ],
        },
      },
      {
        id: "snare-ghosted",
        complexity_score: 0.68,
        pattern: {
          beats: 4,
          notes: [
            { beat: 0.75, note: 38, velocity: 62 },
            { beat: 1, note: 38, velocity: 100 },
            { beat: 2.75, note: 38, velocity: 64 },
            { beat: 3, note: 38, velocity: 108 },
          ],
        },
      },
    ],
    hats_ride: [
      {
        id: "hats-eighths",
        complexity_score: 0.38,
        pattern: {
          beats: 4,
          notes: [
            { beat: 0, note: 42, velocity: 76 },
            { beat: 0.5, note: 42, velocity: 72 },
            { beat: 1, note: 42, velocity: 78 },
            { beat: 1.5, note: 42, velocity: 72 },
            { beat: 2, note: 42, velocity: 80 },
            { beat: 2.5, note: 42, velocity: 74 },
            { beat: 3, note: 42, velocity: 82 },
            { beat: 3.5, note: 42, velocity: 74 },
          ],
        },
      },
      {
        id: "hats-sixteenths",
        complexity_score: 0.78,
        pattern: {
          beats: 4,
          notes: Array.from({ length: 16 }, (_, i) => ({
            beat: i * 0.25,
            note: 42,
            velocity: i % 2 === 0 ? 72 : 58,
          })),
        },
      },
    ],
    percussion: [
      {
        id: "perc-light",
        complexity_score: 0.25,
        pattern: {
          beats: 4,
          notes: [
            { beat: 3.75, note: 49, velocity: 84 },
          ],
        },
      },
      {
        id: "perc-active",
        complexity_score: 0.7,
        pattern: {
          beats: 4,
          notes: [
            { beat: 0.75, note: 46, velocity: 68 },
            { beat: 1.75, note: 46, velocity: 70 },
            { beat: 2.75, note: 49, velocity: 88 },
            { beat: 3.75, note: 49, velocity: 96 },
          ],
        },
      },
    ],
  },
};
