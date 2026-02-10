/**
 * Ableton LOM Bridge
 * Handles Live API calls for Arrangement View clip creation.
 */

const LiveAPI = require('live_api');

// Observe current song time for placement
let currentSongTime = 0;
let currentTempo = 120;
const liveSet = new LiveAPI("live_set");
liveSet.property = "current_song_time";
liveSet.addObserver("current_song_time", (value) => {
    currentSongTime = value;
});

// Observe tempo
const tempoObserver = new LiveAPI("live_set");
tempoObserver.property = "tempo";
tempoObserver.addObserver("tempo", (value) => {
    currentTempo = value;
});

/**
 * Create Arrangement Progression
 * Uses Session Proxy pattern: create temp clip in Session View, set_notes, duplicate to Arrangement, delete proxy.
 * Places chords starting at current song time.
 * @param {Array} progression - [{notes: [midi...], duration: beats}]
 * @param {number} trackIdx - Target track index
 */
function createArrangementProgression(progression, trackIdx) {
    try {
        const startBeat = currentSongTime;

        // Get the target track LOM path
        const trackPath = `live_set tracks ${trackIdx}`;
        const track = new LiveAPI(trackPath);

        if (!track) throw new Error("Track not found");

        // Create temporary clip in Session View (first scene, target track)
        const sessionClipPath = `${trackPath} clip_slots 0 clip`;
        const sessionClip = new LiveAPI(null, sessionClipPath);

        if (!sessionClip) {
            // Create clip if doesn't exist
            track.call("create_clip", 0);
            sessionClip = new LiveAPI(null, sessionClipPath);
        }

        // Set notes for the progression
        const notes = [];
        let currentBeat = 0;

        progression.forEach(chord => {
            chord.notes.forEach(note => {
                notes.push({
                    pitch: note,
                    start_time: currentBeat,
                    duration: chord.duration,
                    velocity: 100,
                    mute: 0
                });
            });
            currentBeat += chord.duration;
        });

        sessionClip.call("set_notes", notes);

        // Duplicate to Arrangement at startBeat
        sessionClip.call("duplicate_clip_to_arrangement", trackIdx, startBeat);

        // Delete the proxy clip
        sessionClip.call("delete_clip");

    } catch (error) {
        max.post("LOM Error:", error.message);
    }
}

exports.createArrangementProgression = createArrangementProgression;