# OSC Service - Complete

## ✅ Implementation Summary

The OSC (Open Sound Control) service enables bidirectional communication between the Electron app and Ableton Live through a minimal M4L helper device.

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌──────────────┐
│  Electron App   │ ←─OSC──→│ M4L Helper   │ ←─API──→│ Ableton Live │
│  (Port 11001)   │         │ (Port 11000) │         │    (LOM)     │
└─────────────────┘         └──────────────┘         └──────────────┘
```

## Files Created

### Core Service

- **`src/services/live/OSCService.ts`** - OSC communication layer
  - `initializeOSC()` - Setup UDP ports
  - `createProgression()` - Send MIDI clips to Live
  - `requestTransportState()` - Query playback state
  - `requestTrackList()` - Get available tracks
  - `setTempo()` - Change Live's tempo
  - `onOSCMessage()` - Register message handlers

### Type Definitions

- **`src/types/osc.ts`** - OSC message interfaces
  - `OSCMessage`, `OSCNote`, `OSCTransportState`
  - `OSC_ADDRESSES` - Message routing constants

### State Management

- **`src/stores/liveStore.ts`** - Zustand store for Live state
  - Connection status
  - Transport state (tempo, position, play/pause)
  - Track list with names and colors
  - Actions for all OSC operations

### UI Component

- **`src/components/LiveTransportPanel.tsx`** - React component
  - Connection indicator
  - Transport display (tempo, position, status)
  - Track selector dropdown
  - "Send to Live" button

### M4L Helper

- **`m4l-helper/M4L_HELPER_SPEC.md`** - Complete specification
  - OSC message routes
  - Live API integration patterns
  - Implementation checklist
  - Testing instructions

- **`m4l-helper/code/osc_router.js`** - Max JavaScript router
  - Note formatting for `set_notes`
  - Message handlers
  - Response builders

## Key Features

### Bidirectional Communication

- **Electron → Live**: Commands (create clips, set tempo, query state)
- **Live → Electron**: Observations (transport updates, track info, responses)

### Message Types

1. **Commands**
   - `/live/create_progression` - Create MIDI clip
   - `/live/get_transport` - Request transport state
   - `/live/get_tracks` - Request track list
   - `/live/set_tempo` - Set tempo

2. **Observations**
   - `/live/transport` - Transport state updates
   - `/live/track_info` - Track information
   - `/live/response` - Command responses
   - `/live/error` - Error notifications

### Type-Safe API

```typescript
// Initialize OSC
const { initializeOSC } = useLiveStore();
await initializeOSC();

// Send progression to Live
const progression = [
  { notes: [60, 64, 67], duration: 4 }, // C major, 4 beats
  { notes: [62, 65, 69], duration: 4 }, // D minor, 4 beats
];
createProgression(progression, 0); // Track 0, current position
```

### React Integration

```tsx
import { LiveTransportPanel } from "@components/LiveTransportPanel";

function App() {
  return (
    <div>
      <LiveTransportPanel />
    </div>
  );
}
```

## Port Configuration

Default ports (configurable):

- **Send**: `11000` (Electron → Max)
- **Receive**: `11001` (Max → Electron)

## M4L Helper Device

The helper device is a minimal Max for Live patch (~200 lines) that:

1. Receives OSC commands via `udpreceive 11000`
2. Executes Live API calls using `live.object`, `live.path`, `live.observer`
3. Sends responses via `udpsend 127.0.0.1 11001`

See `m4l-helper/M4L_HELPER_SPEC.md` for complete implementation details.

## Dependencies

- **`osc`** - Node.js OSC library (UDP transport)
- **`zustand`** - State management with subscriptions

## Usage Example

### 1. Initialize Connection

```typescript
const { initializeOSC, isConnected } = useLiveStore();

useEffect(() => {
  initializeOSC();
}, []);
```

### 2. Monitor Transport

```typescript
const { transport } = useLiveStore();

// Automatically updates when Live transport changes
console.log(transport.tempo); // 120
console.log(transport.currentBeat); // 4.5
console.log(transport.isPlaying); // true
```

### 3. Send Progression

```typescript
const { createProgression } = useLiveStore();
const { getCurrentSection } = useProgressionStore();

const section = getCurrentSection();
createProgression(section.progression, 0); // Send to track 0
```

### 4. Select Track

```typescript
const { tracks, selectTrack } = useLiveStore();

// Display tracks
tracks.map(track => (
  <option key={track.index} value={track.index}>
    {track.name}
  </option>
));

// Select track
selectTrack(2); // Use track 2
```

## Testing Without M4L Device

You can test OSC messages using Max's `udpsend`:

```
[udpsend 127.0.0.1 11001]
|
[prepend /live/transport]
|
[message 1 0 120] (isPlaying, currentBeat, tempo)
```

## Next Steps

1. **Create M4L Device**: Build the Max patch using the specification
2. **Test OSC Communication**: Verify message routing
3. **Add More Commands**: Extend for clip manipulation, scene triggering, etc.
4. **Error Handling**: Robust reconnection and timeout logic

## Benefits Over Direct Live API

✅ **Separation of Concerns**: Electron handles UI, M4L handles Live API  
✅ **Cross-Platform**: OSC works on all platforms  
✅ **Lightweight**: Minimal M4L device footprint  
✅ **Extensible**: Easy to add new commands  
✅ **Debuggable**: OSC messages are human-readable

## Status

- [x] OSC Service implementation
- [x] Type definitions
- [x] Zustand store
- [x] React component
- [x] M4L specification
- [ ] M4L device (.amxd file)
- [ ] End-to-end testing

**Ready for M4L device creation and integration testing!**
