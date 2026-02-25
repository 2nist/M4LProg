import '@testing-library/jest-dom'
import { vi } from "vitest";

// Minimal, resilient test environment shims (avoid using test-framework globals here)
const _ls = (globalThis as any).localStorage
if (_ls) {
  // If a platform provides localStorage (jsdom), patch its methods
  _ls.getItem = (_key: string) => null
  _ls.setItem = (_key: string, _value: string) => undefined
  _ls.removeItem = (_key: string) => undefined
  _ls.clear = () => undefined
} else {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (_key: string) => null,
      setItem: (_key: string, _value: string) => undefined,
      removeItem: (_key: string) => undefined,
      clear: () => undefined,
    },
    configurable: true,
  })
}

// Mock requestAnimationFrame / cancelAnimationFrame
;(globalThis as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
  cb(0)
  return 1 as any
}
;(globalThis as any).cancelAnimationFrame = (_id: number) => undefined

// Minimal window shim for Node/jsdom
if (typeof (globalThis as any).window === 'undefined') {
  ;(globalThis as any).window = {} as any
}

const mockElectronAPI = {
  onOSCMessage: vi.fn((_cb: any) => () => undefined),
  sendOSC: vi.fn((_msg: any) => Promise.resolve(undefined)),
  initializeOSC: vi.fn((_sendPort?: number, _receivePort?: number) => Promise.resolve(true)),
  reconnectOSC: vi.fn(() => Promise.resolve(true)),
  closeOSC: vi.fn(() => Promise.resolve()),
  getOSCHealth: vi.fn(() =>
    Promise.resolve({
      status: "connected",
      isConnected: true,
      isStale: false,
      sendPort: 11000,
      receivePort: 11001,
      retryCount: 0,
      nextRetryMs: 500,
      lastMessageAt: Date.now(),
      lastError: null,
    })),
  off: vi.fn((_cb: any) => undefined),
}

Object.defineProperty((globalThis as any).window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})
