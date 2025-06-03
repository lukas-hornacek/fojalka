import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./ui/App";
import { CoreProvider } from "./core/CoreContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CoreProvider>
      <App />
    </CoreProvider>
  </StrictMode>,
);
