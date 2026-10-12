import { Suspense } from "react";
import AuthBridgeContent from "./AuthBridgeContent";

export default function AuthBridgePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#0a0e1e",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ color: "#7df9c0", fontSize: 18, fontWeight: 600 }}>
            Connecting...
          </div>
        </div>
      }
    >
      <AuthBridgeContent />
    </Suspense>
  );
}
