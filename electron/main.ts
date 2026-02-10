import { app, BrowserWindow, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Set up Content Security Policy for Electron
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          process.env.NODE_ENV === "development"
            ? // Development: Allow unsafe-eval for hot reload and dev tools
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:* ws://localhost:*;"
            : // Production: Stricter CSP without unsafe-eval
              "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';",
        ],
      },
    });
  });

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
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process code
// You can also put them in separate files and import them here
