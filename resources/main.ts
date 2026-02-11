import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as osc from "osc";

/**
 * Electron Main Process
 *
 * Addresses Code Review Item #9: Missing electron/main.ts
 * Addresses Code Review Item #7: Moves OSC logic to main process
 */

let mainWindow: BrowserWindow | null = null;
let udpPort: any = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#1a1a1a",
  });

  // In development, load from Vite dev server
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// Initialize OSC (Open Sound Control)
function setupOSC() {
  // Configuration from OSC_SERVICE_README.md
  udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 11001, // Receive from Live
    remoteAddress: "127.0.0.1",
    remotePort: 11000, // Send to Live
    metadata: true,
  });

  udpPort.on("message", (oscMsg: any) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("osc-message", oscMsg);
    }
  });

  udpPort.on("error", (error: any) => {
    console.error("OSC Error:", error);
  });

  try {
    udpPort.open();
    console.log("OSC Port opened on 11001");
  } catch (err) {
    console.error("Failed to open OSC port:", err);
  }
}

app.whenReady().then(() => {
  createWindow();
  setupOSC();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
  if (udpPort) udpPort.close();
});

// IPC Handlers
ipcMain.handle("send-osc", (event, address, args) => {
  if (udpPort) {
    udpPort.send({
      address: address,
      args: args,
    });
  }
});
