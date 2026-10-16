import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface AuthUser {
  id?: string | number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  role?: string;
  phoneNumber?: string;
}

interface AuthState {
  userId: string | number | null;
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  // Actions
  setAuth: (payload: {
    userId?: string | number;
    user?: AuthUser;
    accessToken: string;
  }) => void;
  setTokens: (payload: { accessToken: string }) => void;
  setUser: (user: AuthUser | null) => void;
  setUserId: (userId: string | number | null) => void;
  setIsHydrating: (isHydrating: boolean) => void;
  logout: () => void;
}

/**
 * In-Memory Zustand Auth Store
 * - Tokens are kept strictly in RAM (accessToken).
 * - No persist to localStorage (preventing XSS attack vectors).
 * - On F5 / reload, RAM is re-hydrated from HttpOnly cookie via GET /api/auth/tokens.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      userId: null,
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,

      setAuth: ({ userId, user, accessToken }) => {
        set(
          {
            userId: userId ?? null,
            user: user ?? null,
            accessToken,
            isAuthenticated: true,
            isHydrating: false,
          },
          false,
          "auth/setAuth",
        );
      },

      setTokens: ({ accessToken }) => {
        set(
          {
            accessToken,
            isAuthenticated: true,
            isHydrating: false,
          },
          false,
          "auth/setTokens",
        );
      },

      setUser: (user) => {
        set({ user }, false, "auth/setUser");
      },

      setUserId: (userId) => {
        set({ userId }, false, "auth/setUserId");
      },

      setIsHydrating: (isHydrating) => {
        set({ isHydrating }, false, "auth/setIsHydrating");
      },

      logout: () => {
        set(
          {
            userId: null,
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isHydrating: false,
          },
          false,
          "auth/logout",
        );
      },
    }),
    { name: "auth-store" },
  ),
);
