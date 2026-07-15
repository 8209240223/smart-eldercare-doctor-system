import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initializeNativeApp } from "@/lib/nativeApp";

void initializeNativeApp();

createRoot(document.getElementById("root")!).render(<App />);
