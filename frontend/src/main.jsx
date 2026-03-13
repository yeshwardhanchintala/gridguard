import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#0d1b2e", color: "#f1f5f9", border: "1px solid #1a3a5c" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#0d1b2e" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#0d1b2e" } },
        }}
      />
    </AuthProvider>
  </React.StrictMode>
);
