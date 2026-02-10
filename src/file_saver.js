/**
 * File Saver
 * Handles MIDI file export from progression data
 */

const theory = require("./Music Theory Engine");

function saveMidiFile(filename, midiData) {
  if (!filename || !midiData) {
    max.outlet(0, "ERROR: Missing filename or MIDI data");
    return;
  }

  try {
    // midiData is expected to be an array of bytes
    // Output filename and data separately for routing
    max.outlet(0, "filename", filename);
    max.outlet(0, "data", ...midiData);
  } catch (error) {
    max.outlet(0, "ERROR: " + error.message);
  }
}

// Handle export_midi command
max.addHandler("export_midi", (filename) => {
  // This would be called from Main Controller
  // The MIDI data generation happens in Music Theory Engine
  // Here we just pass through the request
  max.outlet(0, "export", filename);
});

// Handle export_midi_with_settings
max.addHandler(
  "export_midi_with_settings",
  (filename, tempo, timeSigNum, timeSigDen) => {
    max.outlet(0, "export_settings", filename, tempo, timeSigNum, timeSigDen);
  },
);
