import type { UserProfile } from "./types";

const TOKEN_KEY = "twedot_token";
const PROFILE_KEY = "twedot_profile";

export const AuthStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },

  getProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  setProfile(profile: UserProfile) {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
  },
};
