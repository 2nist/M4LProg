export type ModeId = "harmony" | "drum" | "other";

export type ArrangementIntent =
  | "main"
  | "fill"
  | "break"
  | "transition"
  | "custom";

export interface ExpressionRef {
  profileId?: string;
  transitionId?: string;
  humanizeId?: string;
  energyId?: string;
}

export interface ArrangementBlock {
  id: string;
  sourceId: string;
  mode: ModeId;
  startBeat: number;
  lengthBeats: number;
  label: string;
  color?: string;
  repeats?: number;
  sourceVersion?: number;
  phraseRef?: string;
  intent?: ArrangementIntent;
  expressionRef?: ExpressionRef;
}

export interface SourceTrayItem {
  id: string;
  mode: ModeId;
  label: string;
  beats: number;
  sourceVersion?: number;
}

