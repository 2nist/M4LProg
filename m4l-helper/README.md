# ChordGen Live Helper - Max for Live Device

This directory contains the complete Max for Live device that enables communication between the ChordGen Pro Electron app and Ableton Live.

## Files

- `ChordGen_Live_Helper.maxpat` - Main M4L device patch
- `p handshake.maxpat` - Handshake command handler
- `p get_transport.maxpat` - Transport state query handler
- `p set_tempo.maxpat` - Tempo setting handler
- `p get_tracks.maxpat` - Track information query handler
- `p create_progression.maxpat` - MIDI clip creation handler
- `test_osc_sender.maxpat` - Test patch for OSC communication
- `osc_router.js` - JavaScript for complex note processing
- `MAX_PATCH_IMPLEMENTATION.md` - Detailed implementation guide
- `M4L_HELPER_SPEC.md` - Original specification document

## Setup Instructions

### 1. Install the Device in Ableton Live

1. Copy `ChordGen_Live_Helper.maxpat` to your Ableton User Library:
   - Windows: `Documents\Ableton\User Library\Presets\MIDI Effects\Max MIDI Effect`
   - macOS: `~/Music/Ableton/User Library/Presets/MIDI Effects/Max MIDI Effect`

2. Restart Ableton Live or rescan your User Library

### 2. Load the Device

1. In Ableton Live, create a new MIDI track
2. Add a "Max MIDI Effect" to the track
3. Select "ChordGen_Live_Helper" from your User Library

### 3. Configure OSC Ports

The device uses these OSC ports:
- **Input (from Electron app)**: UDP port 11000
- **Output (to Electron app)**: UDP port 11001

Make sure these ports are not blocked by your firewall.

## Testing

### Using the Test Patch

1. Open `test_osc_sender.maxpat` in Max
2. Click the message boxes to send test OSC commands
3. Check the Max console for responses

### Testing with Electron App

1. Start your ChordGen Pro Electron app
2. The app should automatically detect and connect to the M4L device
3. Use the Live Transport Panel to test commands

## OSC Message Format

### Commands (Electron → M4L)

- `/live/handshake <version> <device_name>` - Initial connection handshake
- `/live/get_transport` - Request current transport state
- `/live/set_tempo <bpm>` - Set Live tempo
- `/live/get_tracks` - Request track information
- `/live/create_progression <name> <num_chords> <root_note> <start_time> <end_time> [note_data...]` - Create MIDI clip

### Responses (M4L → Electron)

- `/live/handshake_ack <version> <device_name>` - Handshake acknowledgment
- `/live/transport <current_time> <tempo> <is_playing>` - Transport state
- `/live/set_tempo_ack <bpm>` - Tempo setting acknowledgment
- `/live/tracks <track_info>` - Track information
- `/live/create_progression_ack <success>` - Progression creation acknowledgment

## Troubleshooting

### Device Not Loading
- Ensure Max for Live is properly installed
- Check that the .maxpat file is in the correct User Library folder
- Try rescanning your User Library in Live

### OSC Communication Issues
- Verify ports 11000 and 11001 are not in use
- Check firewall settings
- Ensure Electron app and Live are on the same network (localhost)

### No Responses
- Check Max console for error messages
- Verify Live API objects are properly connected
- Test with the `test_osc_sender.maxpat` patch first

## Development

To modify the device:

1. Open the main patch in Max
2. Make changes to subpatchers as needed
3. Save and reload in Live
4. Test with the test sender patch

The `osc_router.js` file handles complex note formatting for the `set_notes` Live API calls. Modify this file for custom note processing logic.

## Dependencies

- Max 8.5.6 or later
- Max for Live
- Ableton Live 11 or later (recommended)
