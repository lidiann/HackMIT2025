import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Determine if we're in popup or sidepanel mode
const isPopup = window.location.pathname.includes('popup.html');
const isSidepanel = window.location.pathname.includes('sidepanel.html');

// Add mode to document for styling
document.documentElement.setAttribute('data-mode', isPopup ? 'popup' : isSidepanel ? 'sidepanel' : 'web');

createRoot(document.getElementById("root")!).render(<App />);
