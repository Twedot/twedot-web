"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { AuthStorage } from "./authStorage";
import { getDeviceId } from "./deviceId";
import { apiGet } from "./api";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://prodapi.twedot.com";
const JOB_BADGE_KEY  = "tw_job_badge";
const NOTIF_BADGE_KEY = "tw_notif_badge";

export interface LiveServiceRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterPhoto: string | null;
  requesterCity: string | null;
  requesterCountry: string | null;
  category: string;
  description: string;
  photoUrl: string | null;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "searching";
  createdAt: string;
  expiresAt: string;
}

interface JobSocketContextValue {
  // job requests
  badgeCount: number;
  liveRequests: LiveServiceRequest[];
  clearBadge: () => void;
  removeLiveRequest: (id: string) => void;
  // notifications
  unreadNotifCount: number;
  clearNotifBadge: () => void;
  // raw socket — for status-specific events (like, comment, join_status_room)
  socket: Socket | null;
}

const JobSocketContext = createContext<JobSocketContextValue>({
  badgeCount: 0,
  liveRequests: [],
  clearBadge: () => {},
  removeLiveRequest: () => {},
  unreadNotifCount: 0,
  clearNotifBadge: () => {},
  socket: null,
});

function loadInt(key: string): number {
  try { return parseInt(localStorage.getItem(key) ?? "0", 10) || 0; } catch { return 0; }
}
function saveInt(key: string, n: number) {
  try { localStorage.setItem(key, String(n)); } catch {}
}

export function JobSocketProvider({ children }: { children: ReactNode }) {
  const [badgeCount, setBadgeCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [liveSocket, setLiveSocket] = useState<Socket | null>(null);
  const [liveRequests, setLiveRequests] = useState<LiveServiceRequest[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Restore badges from localStorage on mount
  useEffect(() => {
    setBadgeCount(loadInt(JOB_BADGE_KEY));
    setUnreadNotifCount(loadInt(NOTIF_BADGE_KEY));
  }, []);

  // Fetch initial unread notification count from the server
  useEffect(() => {
    const token = AuthStorage.getToken();
    if (!token) return;
    apiGet<{ count: number }>("/notifications/unread-count")
      .then((res) => {
        if (res && typeof res.count === "number") {
          setUnreadNotifCount(res.count);
          saveInt(NOTIF_BADGE_KEY, res.count);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = AuthStorage.getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    setLiveSocket(socket);

    socket.on("connect", () => {
      socket.emit("authenticate", { token, deviceId: getDeviceId() });
    });

    socket.on("new_service_request", (data: {
      requestId: string;
      requesterId?: string;
      requesterName: string;
      requesterPhoto: string | null;
      requesterCity?: string | null;
      requesterCountry?: string | null;
      category: string;
      description: string;
      photoUrl: string | null;
      locationLabel?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      createdAt: string;
    }) => {
      const req: LiveServiceRequest = {
        id: data.requestId,
        requesterId: data.requesterId ?? "",
        requesterName: data.requesterName,
        requesterPhoto: data.requesterPhoto,
        requesterCity: data.requesterCity ?? null,
        requesterCountry: data.requesterCountry ?? null,
        category: data.category,
        description: data.description,
        photoUrl: data.photoUrl,
        locationLabel: data.locationLabel ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        status: "searching",
        createdAt: data.createdAt,
        expiresAt: "",
      };
      setLiveRequests((prev) => prev.some((r) => r.id === req.id) ? prev : [req, ...prev]);
      setBadgeCount((prev) => { const n = prev + 1; saveInt(JOB_BADGE_KEY, n); return n; });
    });

    socket.on("service_request_cancelled", (data: { requestId: string }) => {
      setLiveRequests((prev) => prev.filter((r) => r.id !== data.requestId));
    });

    socket.on("new_notification", () => {
      setUnreadNotifCount((prev) => { const n = prev + 1; saveInt(NOTIF_BADGE_KEY, n); return n; });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setLiveSocket(null);
    };
  }, []);

  function clearBadge() {
    setBadgeCount(0);
    saveInt(JOB_BADGE_KEY, 0);
  }

  function removeLiveRequest(id: string) {
    setLiveRequests((prev) => prev.filter((r) => r.id !== id));
  }

  function clearNotifBadge() {
    setUnreadNotifCount(0);
    saveInt(NOTIF_BADGE_KEY, 0);
  }

  return (
    <JobSocketContext.Provider value={{
      badgeCount, liveRequests, clearBadge, removeLiveRequest,
      unreadNotifCount, clearNotifBadge,
      socket: liveSocket,
    }}>
      {children}
    </JobSocketContext.Provider>
  );
}

export function useJobSocket() {
  return useContext(JobSocketContext);
}
