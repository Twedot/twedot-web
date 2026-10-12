"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const TOKEN_KEY = "twedot_token";
const DEVICE_ID_KEY = "twedot_device_id";

export default function AuthBridgePage() {
  const params = useSearchParams();
  const redirect = params.get("redirect");
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (!redirect || !/^https?:\/\/localhost[:/]/.test(redirect)) {
      setStatus("Invalid redirect URL");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!token || !deviceId) {
      setStatus("Not logged in — please log in first");
      setTimeout(() => (window.location.href = "/login"), 2000);
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
      body: JSON.stringify({ redirect }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.code) {
          const sep = redirect.includes("?") ? "&" : "?";
          window.location.href = `${redirect}${sep}bridge_code=${json.data.code}`;
        } else {
          setStatus("Session expired — please log in again");
          setTimeout(() => (window.location.href = "/login"), 2000);
        }
      })
      .catch(() => {
        setStatus("Connection failed");
      });
  }, [redirect]);

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
