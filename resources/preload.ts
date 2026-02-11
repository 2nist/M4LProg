import { contextBridge, ipcRenderer } from "electron";

/**
 * Electron Preload Script
 *
 * Addresses Code Review Item #9: Missing electron/preload.ts
 * Exposes protected API for OSC communication
 */

contextBridge.exposeInMainWorld("electronAPI", {
  // Send OSC message to Main process -> Live
  sendOSC: (address: string, args: any[]) =>
    ipcRenderer.invoke("send-osc", address, args),

  // Listen for OSC messages from Main process <- Live
  onOSCMessage: (callback: (message: any) => void) => {
    const subscription = (_event: any, message: any) => callback(message);
    ipcRenderer.on("osc-message", subscription);

    // Return cleanup function
    return () => ipcRenderer.removeListener("osc-message", subscription);
  },
});
