/**
 * =============================================================================
 * REAPER OSC MESSAGE TYPE DEFINITIONS
 * For communication between Electron app and REAPER DAW
 *
 * REAPER OSC Reference: https://www.reaper.fm/sdk/osc/osc.php
 * =============================================================================
 */

// ======================= OSC Message Structure =======================

export interface REAPEROSCMessage {
  address: string;
  args: REAPEROSCArgument[];
}

export type REAPEROSCArgument = number | string | boolean | Uint8Array;

// ======================= REAPER Note Structure =======================

export interface REAPERNote {
  pitch: number; // MIDI pitch (0-127)
  startTime: number; // Time in seconds
  duration: number; // Duration in seconds
  velocity: number; // Velocity (0-127)
  channel: number; // MIDI channel (0-15)
}

// ======================= REAPER Track Structure =======================

export interface REAPERTrack {
  index: number;
  name: string;
  color: number;
  muted: boolean;
  solo: boolean;
  volume: number;
  pan: number;
}

// ======================= REAPER Transport State =======================

export interface REAPERTransportState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  position: number; // Position in seconds
  tempo: number; // BPM
  timeSignatureNum: number;
  timeSignatureDenom: number;
}

// ======================= REAPER OSC Address Constants =======================

export const REAPER_OSC_ADDRESSES = {
  // Transport controls (Electron → REAPER)
  PLAY: "/play",
  STOP: "/stop",
  PAUSE: "/pause",
  PLAY_PAUSE: "/playpause",
  RESTART: "/restart",

  // Position/Transport state
  POSITION: "/position",
  POSITION_SEEK: "/position.seek",
  POSITION_END: "/position.end",

  // Tempo
  TEMPO: "/tempo",
  TEMPO_NEXT: "/tempo.next",

  // Time signature
  TIME_SIGNATURE: "/timesig",
  TIME_SIG_NUM: "/timesig.num",
  TIME_SIG_DENOM: "/timesig.den",

  // Track operations
  TRACK_COUNT: "/track/count",
  TRACK_LIST: "/track/list",
  TRACK_GET: "/track",
  TRACK_ADD: "/track/add",

  // Track-specific (use {n} for track number, 0-based)
  TRACK_NAME: "/track/{n}/name",
  TRACK_MUTE: "/track/{n}/mute",
  TRACK_SOLO: "/track/{n}/solo",
  TRACK_VOLUME: "/track/{n}/volume",
  TRACK_PAN: "/track/{n}/pan",
  TRACK_COLOR: "/track/{n}/color",
  TRACK_SELECT: "/track/{n}/select",

  // MIDI/Item operations
  TRACK_ADD_ITEM: "/track/{n}/add/item",
  ITEM_ADD_NOTE: "/item/{n}/add/note",
  ITEM_POSITION: "/item/{n}/position",
  ITEM_DURATION: "/item/{n}/duration",
  ITEM_NAME: "/item/{n}/name",
  ITEM_TAKE: "/item/{n}/take",

  // Marker/Region
  MARKER_LIST: "/marker/list",
  MARKER_ADD: "/marker/add",
  REGION_LIST: "/region/list",
  REGION_ADD: "/region/add",

  // Responses from REAPER
  TRANSPORT_STATE: "/transport",
  TRACK_INFO: "/trackinfo",

  // Custom ChordGen addresses (for MIDI note creation)
  CHORDGEN_PLAY_NOTE: "/chordgen/play_note",
  CHORDGEN_CREATE_CHORD: "/chordgen/create_chord",
  CHORDGEN_CREATE_MIDI: "/chordgen/create_midi",

  // Handshake
  HELLO: "/hello",
  HELLO_ACK: "/helloack",
} as const;

// ======================= REAPER Action Map =======================

export const REAPER_ACTIONS = {
  // Transport
  play: REAPER_OSC_ADDRESSES.PLAY,
  stop: REAPER_OSC_ADDRESSES.STOP,
  pause: REAPER_OSC_ADDRESSES.PAUSE,
  playPause: REAPER_OSC_ADDRESSES.PLAY_PAUSE,
  restart: REAPER_OSC_ADDRESSES.RESTART,

  // Position
  getPosition: REAPER_OSC_ADDRESSES.POSITION,
  seek: REAPER_OSC_ADDRESSES.POSITION_SEEK,

  // Tempo
  getTempo: REAPER_OSC_ADDRESSES.TEMPO,
  setTempo: REAPER_OSC_ADDRESSES.TEMPO,

  // Tracks
  getTrackCount: REAPER_OSC_ADDRESSES.TRACK_COUNT,
  getTrackList: REAPER_OSC_ADDRESSES.TRACK_LIST,
  addTrack: REAPER_OSC_ADDRESSES.TRACK_ADD,
} as const;

export type REAPEROSCAddressType =
  (typeof REAPER_OSC_ADDRESSES)[keyof typeof REAPER_OSC_ADDRESSES];

// ======================= Helper Functions =======================

export function getTrackAddress(template: string, trackIndex: number): string {
  return template.replace("{n}", trackIndex.toString());
}

// Helper function to build item-specific addresses
export function getItemAddress(template: string, itemIndex: number): string {
  return template.replace("{n}", itemIndex.toString());
}
