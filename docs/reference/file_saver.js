/**
 * File Saver for MIDI Export
 * Handles saving MIDI data to disk using Max's file system
 */

// Handle incoming save requests
function save_midi_file(filename, byteArray) {
    try {
        // Send filename and byte array to Max for writing
        outlet(0, "filename", filename);
        outlet(0, "data", byteArray);

    } catch (error) {
        post("Error saving MIDI file:", error.message, "\n");
        outlet(0, "error", "Failed to save MIDI file: " + error.message);
    }
}