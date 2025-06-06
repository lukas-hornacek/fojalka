import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./ui/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>

    <App />

  </StrictMode>,
);
