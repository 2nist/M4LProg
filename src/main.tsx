import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./styles/index.css";
import "./styles/globals.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

// Enable compact mode by default for strict dense layout
if (typeof document !== "undefined") {
  document.body.classList.add("compact", "dark");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
