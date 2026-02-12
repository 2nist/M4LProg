import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHardwareStore } from '../../src/stores/hardwareStore';

// Mock WebMidi
vi.mock('webmidi', () => ({
  WebMidi: {
    sysexEnabled: true,
    inputs: [],
    outputs: [],
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
}));

// Mock HardwareService
vi.mock('../../src/services/hardware/HardwareService', () => ({
  initializeMIDIAccess: vi.fn().mockResolvedValue(true),
  initializeNativeMode: vi.fn(),
  setupMIDIInput: vi.fn(),
  updateDisplay: vi.fn(),
  setPadState: vi.fn(),
  parseRelativeCC: vi.fn().mockReturnValue({ encoderIndex: 0, delta: 1 }),
  PAD_COLORS: {
    ROOT: 1,
    WHITE: 2,
  },
}));

describe('Hardware Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize MIDI access successfully', async () => {
    const { initializeMIDI } = useHardwareStore.getState();

    const result = await initializeMIDI();

    expect(result).toBe(true);
  });

  it('should update display when encoder changes', () => {
    const { updateDisplay } = useHardwareStore.getState();

    updateDisplay(0, 'TEST', [255, 0, 0]);

    // Verify display state is updated
    const { displays } = useHardwareStore.getState();
    expect(displays[0]).toBe('TEST');
  });

  it('should handle encoder parsing', () => {
    const { parseEncoder } = useHardwareStore.getState();

    const result = parseEncoder(14, 64); // CC 14, value 64

    expect(result).toEqual({ encoderIndex: 0, delta: 1 });
  });
});