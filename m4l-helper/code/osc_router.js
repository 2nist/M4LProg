/**
 * OSC Router for M4L Helper Device
 * Handles complex message routing and note formatting
 */

// State
let transportState = {
  isPlaying: 0,
  currentBeat: 0,
  tempo: 120,
};

/**
 * Format notes for Live's set_notes API
 * Input: flat array [pitch, startTime, duration, velocity, ...]
 * Output: note specification for set_notes
 */
function formatNotes(flatNotes) {
  const notes = [];

  for (let i = 0; i < flatNotes.length; i += 4) {
    notes.push({
      pitch: flatNotes[i],
      start_time: flatNotes[i + 1],
      duration: flatNotes[i + 2],
      velocity: flatNotes[i + 3],
      mute: 0,
    });
  }

  return notes;
}

/**
 * Handle create_progression command
 */
function createProgression(trackIndex, startBeat, ...noteData) {
  try {
    const notes = formatNotes(noteData);

    // Send to Max for Live API execution
    outlet(0, "create_clip", trackIndex, notes, startBeat);

    // Send success response
    sendResponse(1, "Progression created");
  } catch (error) {
    sendError(error.message);
  }
}

/**
 * Send OSC response
 */
function sendResponse(success, message) {
  outlet(1, "/live/response", success, message);
}

/**
 * Send OSC error
 */
function sendError(message) {
  outlet(1, "/live/error", message);
}

/**
 * Handle transport state update
 */
function updateTransport(isPlaying, currentBeat, tempo) {
  transportState = { isPlaying, currentBeat, tempo };
  outlet(1, "/live/transport", isPlaying, currentBeat, tempo);
}

/**
 * Send track info
 */
function sendTrackInfo(index, name, color) {
  outlet(1, "/live/track_info", index, name, color);
}

// Export handlers
exports.createProgression = createProgression;
exports.updateTransport = updateTransport;
exports.sendTrackInfo = sendTrackInfo;
exports.sendResponse = sendResponse;
exports.sendError = sendError;
