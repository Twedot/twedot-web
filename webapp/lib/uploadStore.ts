export interface UploadState {
  total: number;
  done: number;
  failed: boolean;
  label?: string; // "text" | "media"
}

type Listener = (state: UploadState | null) => void;

let _state: UploadState | null = null;
const _listeners = new Set<Listener>();

export const uploadStore = {
  get: () => _state,
  set: (next: UploadState | null) => {
    _state = next;
    _listeners.forEach((l) => l(_state));
  },
  subscribe: (fn: Listener) => {
    _listeners.add(fn);
    return () => { _listeners.delete(fn); };
  },
};
