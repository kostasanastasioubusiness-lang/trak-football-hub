import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Catch unhandled promise rejections so they surface in the console
// (and later in Sentry once monitoring is wired up).
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Trak] Unhandled promise rejection:', event.reason)
  event.preventDefault()
})

if (import.meta.env.DEV) {
  // Runtime render-performance overlay — highlights components that re-render
  const { scan } = await import("react-scan");
  scan({ enabled: true, showToolbar: true });

  // Accessibility audit — logs violations to the browser console
  const axe = await import("@axe-core/react");
  const React = await import("react");
  const ReactDOM = await import("react-dom");
  axe.default(React.default, ReactDOM.default, 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
