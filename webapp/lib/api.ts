import { AuthStorage } from "./authStorage";
import { getDeviceId } from "./deviceId";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-device-id": getDeviceId(),
  };

  if (auth) {
    const token = AuthStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !json || !json.success) {
    throw new ApiError(json?.message ?? `Request failed (${res.status})`, res.status);
  }

  return json.data;
}

export const apiGet = <T>(path: string, opts?: { auth?: boolean }) =>
  request<T>("GET", path, undefined, opts);
export const apiPost = <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
  request<T>("POST", path, body, opts);
export const apiPatch = <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
  request<T>("PATCH", path, body, opts);
