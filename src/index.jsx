import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <ConfirmProvider>
            <App />
          </ConfirmProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  </React.StrictMode>
);

// Disable service worker caching for reliable fresh deploys.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if (window.caches) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)));
      }
    } catch (error) {
      console.warn("Service worker cleanup failed:", error);
    }
  });
}