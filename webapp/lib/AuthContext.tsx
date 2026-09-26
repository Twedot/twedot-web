"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiGet, apiPatch, apiPost } from "./api";
import { AuthStorage } from "./authStorage";
import { getDeviceId } from "./deviceId";
import type { UserProfile, VerifyOtpResult } from "./types";

interface CompleteProfilePayload {
  name: string;
  occupation: string;
  city: string;
  country: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (phoneNumber: string, countryCode: string, email?: string) => Promise<void>;
  resendOtp: (phoneNumber: string) => Promise<void>;
  resendOtpViaEmail: (phoneNumber: string, email: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<VerifyOtpResult>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(AuthStorage.getProfile());
    setIsLoading(false);
  }, []);

  const register = useCallback(async (phoneNumber: string, countryCode: string, email?: string) => {
    await apiPost("/users/auth/register", { phone_number: phoneNumber, country_code: countryCode, email }, { auth: false });
  }, []);

  const resendOtp = useCallback(async (phoneNumber: string) => {
    await apiPost("/users/auth/resend-otp", { phone_number: phoneNumber }, { auth: false });
  }, []);

  const resendOtpViaEmail = useCallback(async (phoneNumber: string, email: string) => {
    await apiPost(
      "/users/auth/resend-otp-email",
      { phone_number: phoneNumber, email },
      { auth: false }
    );
  }, []);

  const verifyOtp = useCallback(async (phoneNumber: string, otp: string) => {
    const result = await apiPost<VerifyOtpResult>(
      "/users/auth/verify-otp",
      { phone_number: phoneNumber, otp, device_id: getDeviceId() },
      { auth: false }
    );
    AuthStorage.setToken(result.token);
    AuthStorage.setProfile(result.user);
    setUser(result.user);
    return result;
  }, []);

  const completeProfile = useCallback(async (payload: CompleteProfilePayload) => {
    const updated = await apiPatch<UserProfile>("/users/complete-profile", payload);
    AuthStorage.setProfile(updated);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await apiGet<UserProfile>("/users/me");
    AuthStorage.setProfile(fresh);
    setUser(fresh);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/users/auth/logout");
    } catch {
      // best-effort — clear local state regardless
    }
    AuthStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        register,
        resendOtp,
        resendOtpViaEmail,
        verifyOtp,
        completeProfile,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
