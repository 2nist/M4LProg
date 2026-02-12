import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
(globalThis as any).localStorage = localStorageMock

// Mock requestAnimationFrame
;(globalThis as any).requestAnimationFrame = vi.fn((cb) => {
  cb(0)
  return 1
})
;(globalThis as any).cancelAnimationFrame = vi.fn()

// Mock window object for node environment
;(globalThis as any).window = {
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
Object.defineProperty((globalThis as any).window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})