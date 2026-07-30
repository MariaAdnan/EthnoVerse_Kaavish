import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { ErrorBoundary } from "./app/components/ErrorBoundary";
import "./styles/index.css";
import { Toaster } from "sonner";

if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has("audit")
) {
  void import("./lib/accessibility");
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster richColors position="top-right" />
    </ErrorBoundary>
  </React.StrictMode>
);
