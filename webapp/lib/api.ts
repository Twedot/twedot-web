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
    "x-platform": "web",
  };

  if (auth) {
    const token = AuthStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No internet connection. Please check your network and try again.", 0);
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !json || !json.success) {
    // Server-side session invalidation — clear local auth and redirect to login
    if (res.status === 401 && typeof window !== "undefined") {
      AuthStorage.clear();
      window.location.href = "/login";
    }
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
export const apiDelete = <T>(path: string, opts?: { auth?: boolean }) =>
  request<T>("DELETE", path, undefined, opts);

const UPLOAD_BASE_URL = process.env.NEXT_PUBLIC_UPLOAD_BASE_URL || "https://upload.twedot.com";

export async function apiUploadFile<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  const headers: Record<string, string> = {
    "x-device-id": getDeviceId(),
    "x-platform": "web",
  };
  const token = AuthStorage.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isDirectUpload = path.includes("upload/direct");
  const url = isDirectUpload
    ? `${UPLOAD_BASE_URL}/upload/direct`
    : `${API_BASE_URL}${path}`;

  let json: { success: boolean; message: string; data: T } | null;
  let status: number;

  if (onProgress) {
    const result = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }
      xhr.upload.onprogress = (e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
      xhr.onerror = () => reject(new ApiError("No internet connection. Please check your network and try again.", 0));
      xhr.ontimeout = () => reject(new ApiError("Upload timed out", 0));
      xhr.send(formData);
    });
    status = result.status;
    json = JSON.parse(result.body) as { success: boolean; message: string; data: T } | null;
  } else {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
    } catch {
      throw new ApiError("No internet connection. Please check your network and try again.", 0);
    }
    status = res.status;
    json = (await res.json().catch(() => null)) as { success: boolean; message: string; data: T } | null;
  }

  if (status < 200 || status >= 300 || !json || !json.success) {
    if (status === 401 && typeof window !== "undefined") {
      AuthStorage.clear();
      window.location.href = "/login";
    }
    throw new ApiError(json?.message ?? `Upload failed (${status})`, status);
  }

  return json.data;
}
