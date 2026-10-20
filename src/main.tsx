import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// After a new deployment, an already-open tab may request page chunks that no longer exist.
// Reload once to pick up the new version (guarded so a real outage can't cause a reload loop).
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  try {
    const lastReload = Number(sessionStorage.getItem("gizmotek-chunk-reload") || 0);
    if (Date.now() - lastReload < 30_000) return;
    sessionStorage.setItem("gizmotek-chunk-reload", String(Date.now()));
  } catch {
    // sessionStorage unavailable — fall through to a single reload attempt
  }
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
