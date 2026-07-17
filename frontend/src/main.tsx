import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeNativeApp } from "@/lib/nativeApp";
import AppErrorBoundary from "@/components/common/AppErrorBoundary";

void initializeNativeApp();

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
