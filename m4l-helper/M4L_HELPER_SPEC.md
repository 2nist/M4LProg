# M4L Helper Device - Specification

Minimal Max for Live device (~200 lines) for Live API access via OSC.

## Purpose

- Receive OSC commands from Electron app
- Execute Live API calls
- Send responses/state updates back via OSC

## Architecture

```
Electron App (Port 11001) ←→ OSC ←→ M4L Helper (Port 11000) ←→ Live API
```

## OSC Message Routes

### Commands (Electron → Live)

#### `/live/create_progression`

Create MIDI clip in Arrangement View

- Args: `[trackIndex, startBeat, ...notes]`
- Notes format: `[pitch, startTime, duration, velocity, pitch, startTime, ...]`
- Response: `/live/response [1/0, "message"]`

#### `/live/get_transport`

Request transport state

- Args: none
- Response: `/live/transport [isPlaying, currentBeat, tempo]`

#### `/live/get_tracks`

Request track list

- Args: none
- Response: Multiple `/live/track_info [index, "name", color]` messages

#### `/live/set_tempo`

Set Live tempo

- Args: `[tempo]`
- Response: `/live/response [1/0, "message"]`

#### `/live/handshake`

Client identification

- Args: `["version", "clientId"]`
- Response: `/live/response [1, "connected"]`

### Observations (Live → Electron)

#### `/live/transport`

Transport state updates (sent on change)

- Args: `[isPlaying, currentBeat, tempo]`

#### `/live/track_info`

Track information

- Args: `[index, "name", color]`

#### `/live/response`

Command response

- Args: `[success, "message"]`

#### `/live/error`

Error notification

- Args: `["error message"]`

## Max Patch Structure

```
┌─────────────────────────────────────┐
│  [udpsend] (Port 11001)            │
│  [udpreceive] (Port 11000)         │
└────────┬────────────────────────────┘
         │
    [route /live/*]
         │
    ┌────┴────┬──────┬──────┬──────┐
    │         │      │      │      │
[create_] [get_] [set_] [handshake] [...]
[progression] [transport] [tempo]
    │         │      │      │
    └─────────┴──────┴──────┴──────┘
                  │
          [live.object live_set]
          [live.path]
          [live.observer]
```

## Implementation Checklist

### Max Objects

- [x] `udpsend 127.0.0.1 11001` - Send to Electron
- [x] `udpreceive 11000` - Receive from Electron
- [x] `route /live/create_progression /live/get_transport ...` - Message router
- [x] `live.object live_set` - Access song
- [x] `live.path` - Navigate LOM
- [x] `live.observer` - Watch properties

### JavaScript (if needed)

- Optional for complex note manipulation
- Max's native objects can handle most operations

## Key Functions

### Create Progression

```
1. Receive OSC: /live/create_progression <trackIdx> <startBeat> <notes...>
2. Get track: live_set tracks <trackIdx>
3. Create clip: create_clip 0 (in session slot 0)
4. Parse notes into set_notes format
5. Call: set_notes <note_data>
6. Duplicate to arrangement: duplicate_clip_to_arrangement <trackIdx> <startBeat>
7. Delete session clip: delete_clip
8. Send response: /live/response 1 "Created"
```

### Transport Observer

```
1. live.object live_set
2. live.observer current_song_time
3. live.observer tempo
4. live.observer is_playing
5. On change → bundle → send OSC /live/transport
```

## File Structure

```
m4l-helper/
├── ChordGen Live Helper.amxd    (Max device)
└── code/
    └── osc_router.js            (Optional: complex routing)
```

## Installation

1. Place `.amxd` in User Library
2. Drag onto any MIDI track
3. Electron app auto-connects on launch

## Testing Without Electron

Use Max's `udpsend 127.0.0.1 11000` to send test messages:

- `/live/handshake "1.0.0" "test"`
- `/live/get_transport`
- `/live/get_tracks`

## Size Estimate

- udp send/receive: 2 objects
- route: 1 object
- Command handlers: ~8 subpatchers
- Live API objects: ~10 objects
- JavaScript (optional): ~50 lines

**Total: ~150-200 lines of Max patching + 50 lines JS**

## Next Steps

1. Create basic Max patch with OSC routing
2. Implement create_progression handler
3. Add transport observers
4. Test with Electron app
5. Package as .amxd device
