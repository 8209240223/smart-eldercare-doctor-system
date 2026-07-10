import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserInfo {
  userId?: number;
  id?: number;
  username?: string;
  realName?: string;
  role?: string;
  userType?: number | string;
  avatar?: string;
  phone?: string;
  [key: string]: unknown;
}

export type UserRole = "admin" | "doctor" | "nurse";

export function getUserRole(userInfo?: UserInfo | null): UserRole {
  if (userInfo?.role === "admin" || userInfo?.role === "nurse" || userInfo?.role === "doctor") {
    return userInfo.role;
  }
  const userType = Number(userInfo?.userType);
  if (userType === 1) return "admin";
  if (userType === 3) return "nurse";
  return "doctor";
}

interface AuthState {
  token: string | null;
  tokenId: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, userInfo: UserInfo, tokenId?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      tokenId: null,
      userInfo: null,
      isAuthenticated: false,
      setAuth: (token, userInfo, tokenId) => {
        const normalizedUserInfo = {
          ...userInfo,
          role: getUserRole(userInfo),
        };
        localStorage.setItem("token", token);
        if (tokenId) localStorage.setItem("tokenId", tokenId);
        else localStorage.removeItem("tokenId");
        localStorage.setItem("userInfo", JSON.stringify(normalizedUserInfo));
        set({ token, tokenId: tokenId || null, userInfo: normalizedUserInfo, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenId");
        localStorage.removeItem("userInfo");
        set({ token: null, tokenId: null, userInfo: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        tokenId: state.tokenId,
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export function getStoredUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem("userInfo");
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}
