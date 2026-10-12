"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const TOKEN_KEY = "twedot_token";
const DEVICE_ID_KEY = "twedot_device_id";

export default function AuthBridgePage() {
  const params = useSearchParams();
  const origin = params.get("origin");
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (!origin || !/^https?:\/\/localhost[:/]/.test(origin)) {
      setStatus("Invalid origin");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!token || !deviceId) {
      if (window.opener) {
        window.opener.postMessage({ type: "twedot-bridge", error: "not_logged_in" }, origin);
        window.close();
      } else {
        setStatus("Not logged in");
      }
      return;
    }

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
          if (window.opener) {
            window.opener.postMessage({ type: "twedot-bridge", code: json.data.code }, origin);
            window.close();
          }
        } else {
          if (window.opener) {
            window.opener.postMessage({ type: "twedot-bridge", error: "expired" }, origin);
            window.close();
          } else {
            setStatus("Session expired");
          }
        }
      })
      .catch(() => {
        if (window.opener) {
          window.opener.postMessage({ type: "twedot-bridge", error: "network" }, origin);
          window.close();
        } else {
          setStatus("Connection failed");
        }
      });
  }, [origin]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0e1e",
        color: "#7df9c0",
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        fontWeight: 600,
      }}
    >
      {status}
    </div>
  );
}
