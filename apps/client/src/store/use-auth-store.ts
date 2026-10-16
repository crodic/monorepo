import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;

  // Actions
  setTokens: (payload: { accessToken: string }) => void;
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
      accessToken: null,
      isAuthenticated: false,
      isHydrating: true,

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

      setIsHydrating: (isHydrating) => {
        set({ isHydrating }, false, "auth/setIsHydrating");
      },

      logout: () => {
        set(
          {
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
