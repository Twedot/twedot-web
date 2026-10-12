"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const TOKEN_KEY = "twedot_token";
const DEVICE_ID_KEY = "twedot_device_id";

export default function AuthBridgeContent() {
  const params = useSearchParams();
  const origin = params.get("origin");
  const mode = params.get("mode");
  const [status, setStatus] = useState<
    "loading" | "need_login" | "success" | "error" | "invalid"
  >("loading");

  const attemptBridge = useCallback(() => {
    if (!origin || !/^https?:\/\/localhost[:/]/.test(origin)) {
      setStatus("invalid");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!token || !deviceId) {
      setStatus("need_login");
      return;
    }

    setStatus("loading");

    fetch(`${API_BASE_URL}/users/auth/session-bridge/code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-device-id": deviceId,
        "x-platform": "web",
      },
      credentials: "include",
      body: JSON.stringify({ redirect: origin }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.code) {
          if (mode === "redirect") {
            window.location.href = `${origin}?bridge_code=${json.data.code}`;
            return;
          }
          const msg = { type: "twedot-bridge", code: json.data.code };
          if (window.opener) {
            window.opener.postMessage(msg, origin);
            setStatus("success");
            setTimeout(() => window.close(), 400);
          } else if (window.parent !== window) {
            window.parent.postMessage(msg, origin);
            setStatus("success");
          } else {
            setStatus("success");
          }
        } else {
          setStatus("need_login");
        }
      })
      .catch(() => {
        setStatus("error");
      });
  }, [origin, mode]);

  useEffect(() => {
    attemptBridge();
  }, [attemptBridge]);

  return (
    <div style={containerStyle}>
      {status === "loading" && (
        <div style={{ color: "#7df9c0", fontSize: 18, fontWeight: 600 }}>
          Connecting...
        </div>
      )}

      {status === "need_login" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
          <h2 style={headingStyle}>Sign in to continue</h2>
          <p style={subtextStyle}>
            Log in to twedot.com first, then tap Connect.
          </p>
          <a
            href="https://twedot.com/login"
            target="_blank"
            rel="noopener"
            style={{ ...btnStyle, display: "inline-block", textDecoration: "none", marginBottom: 12 }}
          >
            Log in to Twedot
          </a>
          <br />
          <button onClick={attemptBridge} style={{ ...btnStyle, background: "#2a2e3e" }}>
            Connect
          </button>
        </div>
      )}

      {status === "success" && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ color: "#7df9c0", fontSize: 18, fontWeight: 600 }}>
            Connected — closing...
          </div>
        </div>
      )}

      {status === "error" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h2 style={headingStyle}>Connection failed</h2>
          <p style={subtextStyle}>Please try again.</p>
          <button onClick={attemptBridge} style={btnStyle}>
            Retry
          </button>
        </div>
      )}

      {status === "invalid" && (
        <div style={{ color: "#ff6b6b", fontSize: 16 }}>Invalid origin</div>
      )}
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  background: "#0a0e1e",
  fontFamily: "system-ui, sans-serif",
};

const cardStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "32px 28px",
  maxWidth: 320,
};

const headingStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  color: "#fff",
};

const subtextStyle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: 14,
  color: "#7df9c0",
  opacity: 0.8,
  lineHeight: 1.5,
};

const btnStyle: React.CSSProperties = {
  padding: "12px 32px",
  background: "#4F7CF7",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
