import { contextBridge, ipcRenderer } from "electron";

/**
 * =============================================================================
 * PRELOAD SCRIPT - Exposes safe IPC methods to renderer
 * This runs in a context that has access to both Node.js and the DOM
 * =============================================================================
 */

// ======================= OSC Communication (Ableton Live) =======================

contextBridge.exposeInMainWorld("electronAPI", {
  sendOSC: (address: string, args: any[]) => {
    return ipcRenderer.invoke("osc:send", address, args);
  },

  initializeOSC: (sendPort?: number, receivePort?: number) => {
    return ipcRenderer.invoke("osc:initialize", sendPort, receivePort);
  },

  reconnectOSC: () => {
    return ipcRenderer.invoke("osc:reconnect");
  },

  closeOSC: () => {
    return ipcRenderer.invoke("osc:close");
  },

  getOSCHealth: () => {
    return ipcRenderer.invoke("osc:getHealth");
  },

  onOSCMessage: (callback: (message: any) => void) => {
    const handler = (_event: any, address: string, args: any[]) =>
      callback({ address, args });
    ipcRenderer.on("osc:message", handler);
    return () => ipcRenderer.removeListener("osc:message", handler);
  },

  // ======================= REAPER OSC Communication =======================

  sendREAPEROSC: (address: string, args: any[]) => {
    return ipcRenderer.invoke("reaper:send", address, args);
  },

  initializeREAPEROSC: (sendPort?: number, receivePort?: number) => {
    return ipcRenderer.invoke("reaper:initialize", sendPort, receivePort);
  },

  reconnectREAPEROSC: () => {
    return ipcRenderer.invoke("reaper:reconnect");
  },

  closeREAPEROSC: () => {
    return ipcRenderer.invoke("reaper:close");
  },

  getREAPEROSCHealth: () => {
    return ipcRenderer.invoke("reaper:getHealth");
  },

  onREAPEROSCMessage: (callback: (message: any) => void) => {
    const handler = (_event: any, address: string, args: any[]) =>
      callback({ address, args });
    ipcRenderer.on("reaper:message", handler);
    return () => ipcRenderer.removeListener("reaper:message", handler);
  },

  // ======================= MIDI Communication (Reserved) =======================

  getMIDIDevices: () => {
    return ipcRenderer.invoke("midi:getDevices");
  },

  sendMIDI: (deviceId: string, message: number[]) => {
    return ipcRenderer.invoke("midi:send", deviceId, message);
  },

  onMIDIMessage: (callback: (message: number[]) => void) => {
    ipcRenderer.on("midi:message", (_event, message) => callback(message));
  },

  // ======================= File Operations =======================

  saveFile: (filename: string, data: any) => {
    return ipcRenderer.invoke("file:save", filename, data);
  },

  loadFile: (filename: string) => {
    return ipcRenderer.invoke("file:load", filename);
  },
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      sendOSC: (address: string, args: any[]) => Promise<void>;
      initializeOSC: (
        sendPort?: number,
        receivePort?: number,
      ) => Promise<boolean>;
      reconnectOSC: () => Promise<boolean>;
      closeOSC: () => Promise<void>;
      getOSCHealth: () => Promise<{
        status:
          | "idle"
          | "connecting"
          | "connected"
          | "degraded"
          | "retrying"
          | "error";
        isConnected: boolean;
        isStale: boolean;
        sendPort: number;
        receivePort: number;
        retryCount: number;
        nextRetryMs: number;
        lastMessageAt: number;
        lastError: string | null;
      }>;
      onOSCMessage: (callback: (message: any) => void) => () => void;
      // REAPER OSC
      sendREAPEROSC: (address: string, args: any[]) => Promise<void>;
      initializeREAPEROSC: (
        sendPort?: number,
        receivePort?: number,
      ) => Promise<boolean>;
      reconnectREAPEROSC: () => Promise<boolean>;
      closeREAPEROSC: () => Promise<void>;
      getREAPEROSCHealth: () => Promise<{
        status:
          | "idle"
          | "connecting"
          | "connected"
          | "degraded"
          | "retrying"
          | "error";
        isConnected: boolean;
        isStale: boolean;
        sendPort: number;
        receivePort: number;
        retryCount: number;
        nextRetryMs: number;
        lastMessageAt: number;
        lastError: string | null;
      }>;
      onREAPEROSCMessage: (callback: (message: any) => void) => () => void;
      getMIDIDevices: () => Promise<any[]>;
      sendMIDI: (deviceId: string, message: number[]) => Promise<boolean>;
      onMIDIMessage: (callback: (message: number[]) => void) => void;
      saveFile: (filename: string, data: any) => Promise<void>;
      loadFile: (filename: string) => Promise<any>;
    };
  }
}
