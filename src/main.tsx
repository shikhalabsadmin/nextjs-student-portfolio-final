import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize Sentry BEFORE rendering the app
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  
  // Enable Performance Tracing
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Performance Monitoring: Capture 100% of transactions in dev, reduce in prod
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
  
  // Session Replay: Capture 10% of sessions, 100% on error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Send default PII data (IP address, etc.)
  sendDefaultPii: true,
  
  // Enable structured logs
  _experiments: {
    enableLogs: true,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
