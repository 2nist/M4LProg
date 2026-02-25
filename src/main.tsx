import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./styles/index.css";
import "./styles/globals.css";
// Example: static theme load (drop-in theme file that sets CSS variables)
import "./styles/themes/my-theme.css";
import applyTheme from "./styles/applyTheme";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Enable compact mode by default for strict dense layout
if (typeof document !== "undefined") {
  document.body.classList.add("compact", "dark");
}
// Runtime override example: set a JSON object into localStorage as
// `theme-override` to dynamically apply CSS variable overrides.
// e.g. in the console:
// localStorage.setItem('theme-override', JSON.stringify({'--primary':'#00ff00'}))
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('theme-override');
    if (raw) applyTheme(JSON.parse(raw));
  } catch (e) {
    // ignore malformed JSON
  }
}
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
