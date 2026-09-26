const DEVICE_ID_KEY = "twedot_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `web-${crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
