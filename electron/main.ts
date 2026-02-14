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

let udpPort: any = null;
let isOSCConnected = false;

function initializeOSC(
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
        isOSCConnected = true;

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
        isOSCConnected = false;
        resolve(false);
      });

      udpPort.open();
    } catch (error) {
      console.error("[OSC] Failed to initialize:", error);
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
  if (udpPort) {
    udpPort.close();
    udpPort = null;
    isOSCConnected = false;
    console.log("[OSC] Connection closed");
  }
}

// ============================================================================
// End OSC Service
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

  // OSC: Initialize/reconnect
  ipcMain.handle(
    "osc:initialize",
    async (_event, sendPort?: number, receivePort?: number) => {
      return await initializeOSC(sendPort, receivePort);
    },
  );

  // OSC: Close connection
  ipcMain.handle("osc:close", async () => {
    closeOSC();
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
