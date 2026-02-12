import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as OSCService from '../../src/services/live/OSCService';
import { useLiveStore } from '../../src/stores/liveStore';
import { OSC_ADDRESSES } from '../../src/types/osc';

// Mock the OSC library (for main process, though we test renderer)
vi.mock('osc', () => ({
  UDPPort: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    close: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
  })),
}));

describe('OSC Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset OSC service state
    (OSCService as any).isInitialized = false;
    (OSCService as any).messageHandlers = new Map();
  });

  afterEach(() => {
    // Clean up any handlers
    (window as any).electronAPI.onOSCMessage.mockClear();
    (window as any).electronAPI.sendOSC.mockClear();
  });

  describe('OSC Service Functions', () => {
    it('should initialize OSC connection successfully', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const result = await OSCService.initializeOSC();

      expect(result).toBe(true);
      expect((window as any).electronAPI.onOSCMessage).toHaveBeenCalled();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith('/chordgen/initialize', []);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.HANDSHAKE, {
        version: '1.0.0',
        clientId: 'chordgen-pro',
      });
    });

    it('should not reinitialize if already initialized', async () => {
      (OSCService as any).isInitialized = true;

      const result = await OSCService.initializeOSC();

      expect(result).toBe(true);
      expect((window as any).electronAPI.sendOSC).not.toHaveBeenCalled();
    });

    it('should handle initialization failure', async () => {
      (window as any).electronAPI.sendOSC.mockRejectedValue(new Error('Connection failed'));

      const result = await OSCService.initializeOSC();

      expect(result).toBe(false);
    });

    it('should send transport commands', () => {
      // Initialize first
      (OSCService as any).isInitialized = true;

      OSCService.play();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.PLAY, []);

      OSCService.pause();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.PAUSE, []);

      OSCService.stop();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.STOP, []);
    });

    it('should send jump commands', () => {
      (OSCService as any).isInitialized = true;

      OSCService.jumpByBars(4);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.JUMP_BY, [4]);

      OSCService.jumpToBeat(16);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.JUMP_TO, [16]);
    });

    it('should set tempo', () => {
      (OSCService as any).isInitialized = true;

      OSCService.setTempo(140);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.SET_TEMPO, [140]);
    });

    it('should request transport and track state', () => {
      (OSCService as any).isInitialized = true;

      OSCService.requestTransportState();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.GET_TRANSPORT, []);

      OSCService.requestTrackList();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.GET_TRACKS, []);
    });

    it('should create progression', () => {
      (OSCService as any).isInitialized = true;

      const progression = [
        { notes: [60, 64, 67], duration: 4 },
        { notes: [62, 65, 69], duration: 4 },
      ];

      OSCService.createProgression(progression, 1, 8);

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.CREATE_PROGRESSION, {
        trackIndex: 1,
        startBeat: 8,
        notes: [
          { pitch: 60, startTime: 0, duration: 4, velocity: 100 },
          { pitch: 64, startTime: 0, duration: 4, velocity: 100 },
          { pitch: 67, startTime: 0, duration: 4, velocity: 100 },
          { pitch: 62, startTime: 4, duration: 4, velocity: 100 },
          { pitch: 65, startTime: 4, duration: 4, velocity: 100 },
          { pitch: 69, startTime: 4, duration: 4, velocity: 100 },
        ],
      });
    });

    it('should play chord immediately', () => {
      (OSCService as any).isInitialized = true;

      OSCService.playChord([60, 64, 67], 80, 1000);

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith('/chordgen/play_chord', {
        notes: [60, 64, 67],
        velocity: 80,
        duration: 1000,
      });
    });

    it('should handle incoming messages', () => {
      const mockHandler = vi.fn();
      const unsubscribe = OSCService.onOSCMessage('/test/address', mockHandler);

      // Simulate incoming message
      const mockMessageCallback = (window as any).electronAPI.onOSCMessage.mock.calls[0][0];
      mockMessageCallback({ address: '/test/address', args: [1, 2, 3] });

      expect(mockHandler).toHaveBeenCalledWith([1, 2, 3]);

      // Test unsubscribe
      unsubscribe();
      mockMessageCallback({ address: '/test/address', args: [4, 5, 6] });
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle wildcard message handlers', () => {
      const mockHandler = vi.fn();
      OSCService.onOSCMessage('*', mockHandler);

      const mockMessageCallback = (window as any).electronAPI.onOSCMessage.mock.calls[0][0];
      mockMessageCallback({ address: '/any/address', args: ['test'] });

      expect(mockHandler).toHaveBeenCalledWith({ address: '/any/address', args: ['test'] });
    });

    it('should close OSC connection', () => {
      (OSCService as any).isInitialized = true;

      OSCService.closeOSC();

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith('/chordgen/close', []);
      expect(OSCService.isOSCConnected()).toBe(false);
    });

    it('should not send messages when not initialized', () => {
      OSCService.play();
      expect((window as any).electronAPI.sendOSC).not.toHaveBeenCalled();
    });
  });

  describe('Live Store Integration', () => {
    it('should initialize OSC and set up message handlers', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC } = useLiveStore.getState();

      const result = await initializeOSC();

      expect(result).toBe(true);
      expect((window as any).electronAPI.onOSCMessage).toHaveBeenCalled();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.GET_TRANSPORT, []);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.GET_TRACKS, []);
    });

    it('should update transport state from OSC messages', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC } = useLiveStore.getState();
      await initializeOSC();

      // Simulate transport update message
      const mockMessageCallback = (window as any).electronAPI.onOSCMessage.mock.calls[0][0];
      mockMessageCallback({
        address: OSC_ADDRESSES.TRANSPORT_UPDATE,
        args: [1, 16.5, 140]
      });

      const state = useLiveStore.getState();
      expect(state.transport.isPlaying).toBe(true);
      expect(state.transport.currentBeat).toBe(16.5);
      expect(state.transport.tempo).toBe(140);
    });

    it('should update track information from OSC messages', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC } = useLiveStore.getState();
      await initializeOSC();

      const mockMessageCallback = (window as any).electronAPI.onOSCMessage.mock.calls[0][0];

      // Add first track
      mockMessageCallback({
        address: OSC_ADDRESSES.TRACK_INFO,
        args: [0, 'Track 1', 16711680]
      });

      // Add second track
      mockMessageCallback({
        address: OSC_ADDRESSES.TRACK_INFO,
        args: [1, 'Track 2', 65280]
      });

      const state = useLiveStore.getState();
      expect(state.tracks).toHaveLength(2);
      expect(state.tracks[0]).toEqual({ index: 0, name: 'Track 1', color: 16711680 });
      expect(state.tracks[1]).toEqual({ index: 1, name: 'Track 2', color: 65280 });
    });

    it('should handle transport controls', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC, play, pause, stop, jumpByBars, jumpToBeat } = useLiveStore.getState();

      // Initialize
      await initializeOSC();

      // Test play
      play();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.PLAY, []);

      // Test pause
      pause();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.PAUSE, []);

      // Test stop
      stop();
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.STOP, []);

      // Test jump commands
      jumpByBars(2);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.JUMP_BY, [2]);

      jumpToBeat(32);
      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.JUMP_TO, [32]);
    });

    it('should handle offline mode transport controls', () => {
      const { play, pause, stop, jumpByBars, jumpToBeat } = useLiveStore.getState();

      // Test offline play
      play();
      expect(useLiveStore.getState().transport.isPlaying).toBe(true);

      // Test offline pause
      pause();
      expect(useLiveStore.getState().transport.isPlaying).toBe(false);

      // Test offline stop
      stop();
      expect(useLiveStore.getState().transport.isPlaying).toBe(false);
      expect(useLiveStore.getState().transport.currentBeat).toBe(0);

      // Test offline jump
      jumpByBars(1);
      expect(useLiveStore.getState().transport.currentBeat).toBe(4); // 1 bar = 4 beats

      jumpToBeat(10);
      expect(useLiveStore.getState().transport.currentBeat).toBe(10);
    });

    it('should create progression', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC, createProgression } = useLiveStore.getState();
      await initializeOSC();

      const progression = [
        { notes: [60, 64, 67], duration: 2 },
      ];

      createProgression(progression, 2, 16);

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.CREATE_PROGRESSION, {
        trackIndex: 2,
        startBeat: 16,
        notes: [
          { pitch: 60, startTime: 0, duration: 2, velocity: 100 },
          { pitch: 64, startTime: 0, duration: 2, velocity: 100 },
          { pitch: 67, startTime: 0, duration: 2, velocity: 100 },
        ],
      });
    });

    it('should set tempo', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC, setTempo } = useLiveStore.getState();
      await initializeOSC();

      setTempo(160);

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith(OSC_ADDRESSES.SET_TEMPO, [160]);
      expect(useLiveStore.getState().transport.tempo).toBe(160);
    });

    it('should disconnect properly', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC, disconnect } = useLiveStore.getState();
      await initializeOSC();

      disconnect();

      expect((window as any).electronAPI.sendOSC).toHaveBeenCalledWith('/chordgen/close', []);
      expect(useLiveStore.getState().isConnected).toBe(false);
      expect(useLiveStore.getState().tracks).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle OSC response messages', async () => {
      (window as any).electronAPI.sendOSC.mockResolvedValue(undefined);

      const { initializeOSC } = useLiveStore.getState();
      await initializeOSC();

      const mockMessageCallback = (window as any).electronAPI.onOSCMessage.mock.calls[0][0];

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test success response
      mockMessageCallback({
        address: OSC_ADDRESSES.RESPONSE,
        args: [1, 'Operation successful']
      });

      expect(consoleLogSpy).toHaveBeenCalledWith('Live Response: Success Operation successful');

      // Test error response
      mockMessageCallback({
        address: OSC_ADDRESSES.ERROR,
        args: ['Connection failed']
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Live Error: Connection failed');

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle send failures gracefully', () => {
      (OSCService as any).isInitialized = true;
      (window as any).electronAPI.sendOSC.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      OSCService.play();

      expect(consoleErrorSpy).toHaveBeenCalledWith('[OSC Renderer] Send failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });
});