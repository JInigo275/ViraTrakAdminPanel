import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
// Suppress TypeScript error for side-effect CSS import when no type declarations are present
// @ts-ignore: CSS module with no type declarations
import "./styles/index.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  // Fallback for environments without a root element
  console.error("Root element not found");
}
