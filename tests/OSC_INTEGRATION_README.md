# OSC Integration Tests

This directory contains comprehensive tests for the OSC (Open Sound Control) integration between the M4LProg application and Ableton Live via Max for Live.

## Overview

The OSC integration enables real-time communication between the Electron app and Ableton Live, allowing for:

- Transport control (play/pause/stop/jump)
- Tempo synchronization
- Track information retrieval
- Progression creation and playback
- Real-time chord preview

## Test Structure

### `osc_integration.test.ts`

Comprehensive test suite covering:

#### OSC Service Functions
- ✅ Connection initialization and handshake
- ✅ Transport commands (play, pause, stop, jump)
- ✅ Tempo setting
- ✅ State requests (transport, tracks)
- ✅ Progression creation
- ✅ Chord playback
- ✅ Message handling and subscriptions
- ✅ Connection management
- ✅ Error handling

#### Live Store Integration
- ✅ OSC initialization in Zustand store
- ✅ Transport state synchronization
- ✅ Track information updates
- ✅ Transport controls with OSC/Live integration
- ✅ Offline mode fallback
- ✅ Progression creation workflow
- ✅ Tempo management
- ✅ Connection lifecycle

#### Error Handling
- ✅ OSC response messages
- ✅ Send failure recovery
- ✅ Connection error handling

## Test Environment

The tests use Vitest with jsdom environment and comprehensive mocking:

- **Electron API**: Mocked `window.electronAPI` for IPC communication
- **OSC Library**: Mocked for main process OSC handling
- **Console Methods**: Spied for error/response logging verification
- **Zustand Store**: Tested with real store instances

## Running Tests

```bash
# Run all OSC tests
npm test -- osc_integration.test.ts

# Run with coverage
npm test -- --coverage osc_integration.test.ts

# Run manual integration test
node tests/osc_manual_test.js
```

## Manual Testing

For end-to-end testing with real Ableton Live:

1. **Start M4L Device**: Load the M4L helper device in Live
2. **Configure Ports**: Ensure OSC ports match (default: 11000/11001)
3. **Run Application**: Start the Electron app
4. **Test Transport**: Use UI controls to verify Live responds
5. **Test Progressions**: Create and send progressions to Live
6. **Monitor Logs**: Check console for OSC message flow

## OSC Message Flow

```
Electron App ↔ IPC ↔ Main Process ↔ OSC ↔ Max for Live ↔ Ableton Live
```

### Key Addresses
- `/live/play`, `/live/pause`, `/live/stop` - Transport control
- `/live/jump_by`, `/live/jump_to` - Navigation
- `/live/set_tempo` - Tempo control
- `/live/create_progression` - MIDI clip creation
- `/live/get_transport`, `/live/get_tracks` - State queries

## Integration Status

✅ **Completed:**
- OSC service implementation with full API
- Live store integration with state management
- Comprehensive test coverage
- Error handling and recovery
- TypeScript type safety
- Message subscription system

🔄 **Next Steps:**
- End-to-end testing with real M4L device
- Performance optimization for high-frequency updates
- Advanced error recovery mechanisms
- OSC bundle support for atomic operations

## Dependencies

- `osc`: ^2.4.5 - OSC protocol implementation
- `vitest`: ^4.0.18 - Test framework
- `jsdom`: Latest - DOM environment for testing
- `@testing-library/jest-dom`: ^6.9.1 - DOM assertions

## Architecture Notes

The integration follows a layered architecture:

1. **OSC Service** (`OSCService.ts`): Low-level OSC communication
2. **Live Store** (`liveStore.ts`): State management and business logic
3. **UI Components**: React components using the store
4. **Electron Main**: OSC server handling (`electron/services/OSCService.ts`)

This separation allows for:
- Easy testing with mocks
- Offline mode support
- Graceful degradation
- Future protocol extensions