// Hardware-specific types for ATOM SQ integration

export interface EncoderEvent {
  encoderIndex: number;
  delta: number;
}

export interface DisplayUpdate {
  line: number;
  content: string | number[];
  rgb?: [number, number, number];
}

export interface PadState {
  note: number;
  mode: number; // 0: Off, 1: Blink, 2: Pulse, 127: Solid
}
