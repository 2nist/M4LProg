import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0)
  return 1
})
global.cancelAnimationFrame = vi.fn()

// Mock window object for node environment
global.window = {
  electronAPI: {
    onOSCMessage: vi.fn(),
    sendOSC: vi.fn(),
    off: vi.fn(),
  },
} as any

// Mock electron API
const mockElectronAPI = {
  onOSCMessage: vi.fn(),
  sendOSC: vi.fn(),
  off: vi.fn(),
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})