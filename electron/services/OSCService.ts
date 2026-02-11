/**
 * OSC Service for Main Process
 * Handles OSC communication with Ableton Live via M4L
 */

import { BrowserWindow } from "electron";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const osc = require("osc");

// Default ports
const DEFAULT_SEND_PORT = 11000; // Electron → Max
const DEFAULT_RECEIVE_PORT = 11001; // Max → Electron

let udpPort: any = null;
let isConnected = false;
let mainWindow: BrowserWindow | null = null;

/**
 * Set the main window reference for sending messages to renderer
 */
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindow = window;
}

/**
 * Initialize OSC communication
 */
export function initializeOSC(
  sendPort: number = DEFAULT_SEND_PORT,
  receivePort: number = DEFAULT_RECEIVE_PORT,
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      udpPort = new osc.UDPPort({
        localAddress: "127.0.0.1",
        localPort: receivePort,
        remoteAddress: "127.0.0.1",
        remotePort: sendPort,
        metadata: true,
      });

      udpPort.on("ready", () => {
        console.log("[OSC] Server ready on port", receivePort);
        isConnected = true;

        // Send handshake
        sendOSCMessage("/chordgen/handshake", {
          version: "1.0.0",
          clientId: "chordgen-pro",
        });

        resolve(true);
      });

      udpPort.on("message", (oscMsg: any) => {
        console.log("[OSC] Received:", oscMsg.address, oscMsg.args);

        // Forward message to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(
            "osc:message",
            oscMsg.address,
            oscMsg.args,
          );
        }
      });

      udpPort.on("error", (error: any) => {
        console.error("[OSC] Error:", error);
        isConnected = false;
        resolve(false);
      });

      udpPort.open();
    } catch (error) {
      console.error("[OSC] Failed to initialize:", error);
      resolve(false);
    }
  });
}

/**
 * Send OSC message
 */
export function sendOSCMessage(address: string, args: any): void {
  if (!udpPort || !isConnected) {
    console.warn("[OSC] Not connected");
    return;
  }

  const oscMsg: any = {
    address,
    args: Array.isArray(args) ? args : [args],
  };

  try {
    udpPort.send(oscMsg);
    console.log("[OSC] Sent:", address, args);
  } catch (error) {
    console.error("[OSC] Send failed:", error);
  }
}

/**
 * Close OSC connection
 */
export function closeOSC(): void {
  if (udpPort) {
    udpPort.close();
    udpPort = null;
    isConnected = false;
    console.log("[OSC] Connection closed");
  }
}

/**
 * Get connection status
 */
export function isOSCConnected(): boolean {
  return isConnected;
}
