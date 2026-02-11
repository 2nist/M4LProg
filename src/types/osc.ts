/**
 * OSC Message Type Definitions
 * For communication between Electron app and M4L helper device
 */

// OSC Message structure
export interface OSCMessage {
  address: string;
  args: OSCArgument[];
}

export type OSCArgument = number | string | boolean | Uint8Array;

// Command messages (Electron → Live)
export interface OSCCreateProgressionCommand {
  address: "/live/create_progression";
  trackIndex: number;
  startBeat: number;
  notes: OSCNote[];
}

export interface OSCNote {
  pitch: number;
  startTime: number;
  duration: number;
  velocity: number;
}

// State observation messages (Live → Electron)
export interface OSCTransportState {
  address: "/live/transport";
  isPlaying: boolean;
  currentBeat: number;
  tempo: number;
}

export interface OSCTrackInfo {
  address: "/live/track_info";
  trackIndex: number;
  name: string;
  color: number;
}

// Response messages (Live → Electron)
export interface OSCResponse {
  address: "/live/response";
  success: boolean;
  message?: string;
  data?: any;
}

// Connection handshake
export interface OSCHandshake {
  address: "/live/handshake";
  version: string;
  clientId: string;
}

// OSC Address constants
export const OSC_ADDRESSES = {
  // Commands (Electron → Live)
  CREATE_PROGRESSION: "/live/create_progression",
  GET_TRANSPORT: "/live/get_transport",
  GET_TRACKS: "/live/get_tracks",
  SET_TEMPO: "/live/set_tempo",
  
  // Transport controls
  PLAY: "/live/play",
  PAUSE: "/live/pause",
  STOP: "/live/stop",
  JUMP_BY: "/live/jump_by",
  JUMP_TO: "/live/jump_to",

  // Observations (Live → Electron)
  TRANSPORT_UPDATE: "/live/transport",
  TRACK_INFO: "/live/track_info",

  // Handshake & responses
  HANDSHAKE: "/live/handshake",
  RESPONSE: "/live/response",
  ERROR: "/live/error",
} as const;

export type OSCAddressType = (typeof OSC_ADDRESSES)[keyof typeof OSC_ADDRESSES];
