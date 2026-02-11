import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe IPC methods to renderer
 * This runs in a context that has access to both Node.js and the DOM
 */

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // OSC communication (to be implemented)
  sendOSC: (address: string, args: any[]) => {
    return ipcRenderer.invoke('osc:send', address, args);
  },
  
  onOSCMessage: (callback: (message: any) => void) => {
    const handler = (_event: any, address: string, args: any[]) => callback({ address, args });
    ipcRenderer.on('osc:message', handler);
    return () => ipcRenderer.removeListener('osc:message', handler);
  },
  
  // MIDI communication (to be implemented)
  getMIDIDevices: () => {
    return ipcRenderer.invoke('midi:getDevices');
  },
  
  sendMIDI: (deviceId: string, message: number[]) => {
    return ipcRenderer.invoke('midi:send', deviceId, message);
  },
  
  onMIDIMessage: (callback: (message: number[]) => void) => {
    ipcRenderer.on('midi:message', (_event, message) => callback(message));
  },
  
  // File operations
  saveFile: (filename: string, data: any) => {
    return ipcRenderer.invoke('file:save', filename, data);
  },
  
  loadFile: (filename: string) => {
    return ipcRenderer.invoke('file:load', filename);
  },
});

// TypeScript declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      sendOSC: (address: string, args: any[]) => Promise<void>;
      onOSCMessage: (callback: (message: any) => void) => () => void;
      getMIDIDevices: () => Promise<any[]>;
      sendMIDI: (deviceId: string, message: number[]) => Promise<void>;
      onMIDIMessage: (callback: (message: number[]) => void) => void;
      saveFile: (filename: string, data: any) => Promise<void>;
      loadFile: (filename: string) => Promise<any>;
    };
  }
}
