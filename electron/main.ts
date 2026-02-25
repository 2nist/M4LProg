import { app, BrowserWindow, session, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import * as fs from "fs/promises";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const osc = require("osc");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// ============================================================================
// OSC Service - Inline implementation
// ============================================================================
const DEFAULT_SEND_PORT = 11000; // Electron → Max
const DEFAULT_RECEIVE_PORT = 11001; // Max → Electron
const OSC_STALE_MS = 5000;
const OSC_HEARTBEAT_MS = 2000;
const OSC_RETRY_BASE_MS = 500;
const OSC_RETRY_MAX_MS = 8000;

let udpPort: any = null;
let isOSCConnected = false;
let isOSCConnecting = false;
let isOSCClosing = false;
let oscSendPort = DEFAULT_SEND_PORT;
let oscReceivePort = DEFAULT_RECEIVE_PORT;
let oscLastMessageAt = 0;
let oscLastError: string | null = null;
let oscRetryCount = 0;
let oscNextRetryMs = OSC_RETRY_BASE_MS;
let oscRetryTimer: ReturnType<typeof setTimeout> | null = null;
let oscHeartbeatTimer: ReturnType<typeof setInterval> | null = null;

type OSCConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "degraded"
  | "retrying"
  | "error";

let oscStatus: OSCConnectionStatus = "idle";

function getOSCHealth() {
  const now = Date.now();
  const stale = oscLastMessageAt > 0 && now - oscLastMessageAt > OSC_STALE_MS;
  const status: OSCConnectionStatus = isOSCConnecting
    ? "connecting"
    : isOSCConnected
      ? stale
        ? "degraded"
        : "connected"
      : oscStatus;

  return {
    status,
    isConnected: isOSCConnected,
    isStale: stale,
    sendPort: oscSendPort,
    receivePort: oscReceivePort,
    retryCount: oscRetryCount,
    nextRetryMs: oscNextRetryMs,
    lastMessageAt: oscLastMessageAt,
    lastError: oscLastError,
  };
}

function clearOSCIntervals(): void {
  if (oscHeartbeatTimer) {
    clearInterval(oscHeartbeatTimer);
    oscHeartbeatTimer = null;
  }
  if (oscRetryTimer) {
    clearTimeout(oscRetryTimer);
    oscRetryTimer = null;
  }
}

function startHeartbeat(): void {
  if (oscHeartbeatTimer) return;
  oscHeartbeatTimer = setInterval(() => {
    if (!isOSCConnected) return;
    sendOSCMessage("/live/ping", [Date.now()]);
  }, OSC_HEARTBEAT_MS);
}

function scheduleReconnect(): void {
  if (isOSCClosing || oscRetryTimer) return;
  oscStatus = "retrying";
  const retryMs = oscNextRetryMs;
  oscRetryTimer = setTimeout(() => {
    oscRetryTimer = null;
    initializeOSC(oscSendPort, oscReceivePort).catch((error) => {
      oscLastError = error instanceof Error ? error.message : String(error);
      scheduleReconnect();
    });
  }, retryMs);
  oscNextRetryMs = Math.min(oscNextRetryMs * 2, OSC_RETRY_MAX_MS);
}

function initializeOSC(
  sendPort: number = DEFAULT_SEND_PORT,
  receivePort: number = DEFAULT_RECEIVE_PORT,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isOSCConnecting) {
      resolve(false);
      return;
    }
    isOSCConnecting = true;
    isOSCClosing = false;
    oscSendPort = sendPort;
    oscReceivePort = receivePort;
    oscStatus = "connecting";
    oscLastError = null;

    if (udpPort) {
      try {
        udpPort.close();
      } catch {
        // Best effort
      }
      udpPort = null;
      isOSCConnected = false;
    }

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
        isOSCConnected = true;
        isOSCConnecting = false;
        oscStatus = "connected";
        oscRetryCount = 0;
        oscNextRetryMs = OSC_RETRY_BASE_MS;
        oscLastError = null;
        oscLastMessageAt = Date.now();
        clearOSCIntervals();
        startHeartbeat();

        // Send handshake
        sendOSCMessage("/live/handshake", ["1.0.0", "chordgen-pro"]);

        resolve(true);
      });

      udpPort.on("message", (oscMsg: any) => {
        console.log("[OSC] Received:", oscMsg.address, oscMsg.args);
        oscLastMessageAt = Date.now();
        if (oscStatus !== "connected") {
          oscStatus = "connected";
        }

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
        isOSCConnected = false;
        isOSCConnecting = false;
        oscRetryCount += 1;
        oscLastError = error instanceof Error ? error.message : String(error);
        oscStatus = "error";
        scheduleReconnect();
        resolve(false);
      });

      udpPort.open();
    } catch (error) {
      console.error("[OSC] Failed to initialize:", error);
      isOSCConnecting = false;
      isOSCConnected = false;
      oscRetryCount += 1;
      oscLastError = error instanceof Error ? error.message : String(error);
      oscStatus = "error";
      scheduleReconnect();
      resolve(false);
    }
  });
}

function sendOSCMessage(address: string, args: any): void {
  if (!udpPort || !isOSCConnected) {
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

function closeOSC(): void {
  isOSCClosing = true;
  clearOSCIntervals();
  if (udpPort) {
    udpPort.close();
    udpPort = null;
  }
  isOSCConnected = false;
  isOSCConnecting = false;
  oscStatus = "idle";
  console.log("[OSC] Connection closed");
}

// ============================================================================
// End OSC Service
// ============================================================================

// ============================================================================
// REAPER OSC Service - Separate from Live OSC
// ============================================================================
const DEFAULT_REAPER_SEND_PORT = 11002; // Electron → REAPER
const DEFAULT_REAPER_RECEIVE_PORT = 11003; // REAPER → Electron

let reaperUdpPort: any = null;
let isREAPEROSCConnected = false;
let isREAPEROSCConnecting = false;
let isREAPEROSCClosing = false;
let reaperSendPort = DEFAULT_REAPER_SEND_PORT;
let reaperReceivePort = DEFAULT_REAPER_RECEIVE_PORT;
let reaperLastMessageAt = 0;
let reaperLastError: string | null = null;
let reaperRetryCount = 0;
let reaperRetryTimer: ReturnType<typeof setTimeout> | null = null;

function getREAPEROSCHealth() {
  const now = Date.now();
  const stale =
    reaperLastMessageAt > 0 && now - reaperLastMessageAt > OSC_STALE_MS;
  const status: OSCConnectionStatus = isREAPEROSCConnecting
    ? "connecting"
    : isREAPEROSCConnected
      ? stale
        ? "degraded"
        : "connected"
      : "idle";

  return {
    status,
    isConnected: isREAPEROSCConnected,
    isStale: stale,
    sendPort: reaperSendPort,
    receivePort: reaperReceivePort,
    retryCount: reaperRetryCount,
    nextRetryMs: OSC_RETRY_BASE_MS,
    lastMessageAt: reaperLastMessageAt,
    lastError: reaperLastError,
  };
}

function initializeREAPEROSC(
  sendPort: number = DEFAULT_REAPER_SEND_PORT,
  receivePort: number = DEFAULT_REAPER_RECEIVE_PORT,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isREAPEROSCConnecting) {
      resolve(false);
      return;
    }
    isREAPEROSCConnecting = true;
    isREAPEROSCClosing = false;
    reaperSendPort = sendPort;
    reaperReceivePort = receivePort;
    reaperLastError = null;

    if (reaperUdpPort) {
      try {
        reaperUdpPort.close();
      } catch {
        // Best effort
      }
      reaperUdpPort = null;
      isREAPEROSCConnected = false;
    }

    try {
      reaperUdpPort = new osc.UDPPort({
        localAddress: "127.0.0.1",
        localPort: receivePort,
        remoteAddress: "127.0.0.1",
        remotePort: sendPort,
        metadata: true,
      });

      reaperUdpPort.on("ready", () => {
        console.log("[REAPER OSC] Server ready on port", receivePort);
        isREAPEROSCConnected = true;
        isREAPEROSCConnecting = false;
        reaperRetryCount = 0;
        reaperLastMessageAt = Date.now();

        // Send handshake
        sendREAPEROSCMessage("/hello", ["ChordGenPro", "1.0.0"]);

        resolve(true);
      });

      reaperUdpPort.on("message", (oscMsg: any) => {
        console.log("[REAPER OSC] Received:", oscMsg.address, oscMsg.args);
        reaperLastMessageAt = Date.now();

        // Forward message to renderer process
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(
            "reaper:message",
            oscMsg.address,
            oscMsg.args,
          );
        }
      });

      reaperUdpPort.on("error", (error: any) => {
        console.error("[REAPER OSC] Error:", error);
        isREAPEROSCConnected = false;
        isREAPEROSCConnecting = false;
        reaperRetryCount += 1;
        reaperLastError =
          error instanceof Error ? error.message : String(error);
        resolve(false);
      });

      reaperUdpPort.open();
    } catch (error) {
      console.error("[REAPER OSC] Failed to initialize:", error);
      isREAPEROSCConnecting = false;
      isREAPEROSCConnected = false;
      reaperRetryCount += 1;
      reaperLastError = error instanceof Error ? error.message : String(error);
      resolve(false);
    }
  });
}

function sendREAPEROSCMessage(address: string, args: any): void {
  if (!reaperUdpPort || !isREAPEROSCConnected) {
    console.warn("[REAPER OSC] Not connected");
    return;
  }

  const oscMsg: any = {
    address,
    args: Array.isArray(args) ? args : [args],
  };

  try {
    reaperUdpPort.send(oscMsg);
    console.log("[REAPER OSC] Sent:", address, args);
  } catch (error) {
    console.error("[REAPER OSC] Send failed:", error);
  }
}

function closeREAPEROSC(): void {
  isREAPEROSCClosing = true;
  if (reaperRetryTimer) {
    clearTimeout(reaperRetryTimer);
    reaperRetryTimer = null;
  }
  if (reaperUdpPort) {
    reaperUdpPort.close();
    reaperUdpPort = null;
  }
  isREAPEROSCConnected = false;
  isREAPEROSCConnecting = false;
  console.log("[REAPER OSC] Connection closed");
}

// ============================================================================
// End REAPER OSC Service
// ============================================================================

const createWindow = () => {
  // Set up Content Security Policy for Electron
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          process.env.NODE_ENV === "development"
            ? // Development: Disable CSP to allow all connections for dev tools
              ""
            : // Production: Stricter CSP without unsafe-eval
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
        ],
      },
    });
  });

  // WebMIDI in Electron requires both permission check + request handlers.
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      if (permission === "midi" || permission === "midiSysex") {
        return true;
      }
      return false;
    },
  );
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      if (permission === "midi" || permission === "midiSysex") {
        return callback(true);
      }
      callback(false);
    },
  );

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(
        __dirname,
        process.env.NODE_ENV === "development"
          ? "../dist-electron/preload.js"
          : "preload.js",
      ),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#111827", // Match Tailwind gray-900
    title: "ChordGen Pro",
  });

  // Load the app
  if (
    process.env.NODE_ENV === "development" ||
    process.env.VITE_DEV_SERVER_URL
  ) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    mainWindow.loadURL(devUrl);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Cleanup on close
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

// Create window when Electron is ready
app.whenReady().then(() => {
  // Set up IPC handlers
  setupIPCHandlers();

  createWindow();

  // Initialize OSC after window is created
  initializeOSC().then((success) => {
    console.log("[Main] OSC initialization:", success ? "success" : "failed");
  });

  // On macOS, re-create window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  closeOSC();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Set up IPC handlers for communication with renderer process
 */
function setupIPCHandlers(): void {
  // OSC: Send message
  ipcMain.handle("osc:send", async (_event, address: string, args: any[]) => {
    sendOSCMessage(address, args);
  });

  // OSC: Check connection status
  ipcMain.handle("osc:isConnected", async () => {
    return isOSCConnected;
  });

  // OSC: Get health/status
  ipcMain.handle("osc:getHealth", async () => {
    return getOSCHealth();
  });

  // OSC: Initialize/reconnect
  ipcMain.handle(
    "osc:initialize",
    async (_event, sendPort?: number, receivePort?: number) => {
      return await initializeOSC(sendPort, receivePort);
    },
  );

  // OSC: Force reconnect
  ipcMain.handle("osc:reconnect", async () => {
    closeOSC();
    return await initializeOSC(oscSendPort, oscReceivePort);
  });

  // OSC: Close connection
  ipcMain.handle("osc:close", async () => {
    closeOSC();
  });

  // REAPER OSC: Send message
  ipcMain.handle(
    "reaper:send",
    async (_event, address: string, args: any[]) => {
      sendREAPEROSCMessage(address, args);
    },
  );

  // REAPER OSC: Check connection status
  ipcMain.handle("reaper:isConnected", async () => {
    return isREAPEROSCConnected;
  });

  // REAPER OSC: Get health/status
  ipcMain.handle("reaper:getHealth", async () => {
    return getREAPEROSCHealth();
  });

  // REAPER OSC: Initialize/reconnect
  ipcMain.handle(
    "reaper:initialize",
    async (_event, sendPort?: number, receivePort?: number) => {
      return await initializeREAPEROSC(sendPort, receivePort);
    },
  );

  // REAPER OSC: Force reconnect
  ipcMain.handle("reaper:reconnect", async () => {
    closeREAPEROSC();
    return await initializeREAPEROSC(reaperSendPort, reaperReceivePort);
  });

  // REAPER OSC: Close connection
  ipcMain.handle("reaper:close", async () => {
    closeREAPEROSC();
  });

  // MIDI (reserved): explicit no-op handlers to avoid renderer IPC failures.
  ipcMain.handle("midi:getDevices", async () => {
    return [];
  });
  ipcMain.handle("midi:send", async () => {
    return false;
  });

  // File: Save
  ipcMain.handle("file:save", async (_event, filename: string, data: any) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Progression",
      defaultPath: filename,
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (canceled || !filePath) return false;

    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  });

  // File: Load
  ipcMain.handle("file:load", async (_event, defaultPath: string) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Load Progression",
      defaultPath: defaultPath,
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (canceled || filePaths.length === 0) return null;

    try {
      const content = await fs.readFile(filePaths[0], "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to load file:", error);
      throw error;
    }
  });
}

// In this file you can include the rest of your app's specific main process code
// You can also put them in separate files and import them here
