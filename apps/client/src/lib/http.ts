import xior, { XiorInterceptorRequestConfig } from "xior";
import { AUTH_CODE, AUTH_QUERY_PARAM } from "@/constants/auth";
import { useAuthStore } from "@/store/use-auth-store";

export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.split("=");
    if (key && key.trim() === name) {
      return decodeURIComponent(parts.join("="));
    }
  }
  return null;
}

export const http = xior.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "same-origin",
});

http.interceptors.request.use(
  (config) => {
    if (config.headers?.Authorization) {
      return config;
    }

    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      if (config.headers) {
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshTokenPromise: Promise<string | null> | null = null;

export async function refreshClientToken(
  failedToken?: string
): Promise<string | null> {
  if (refreshTokenPromise) {
    return refreshTokenPromise.catch(() => null);
  }

  refreshTokenPromise = (async () => {
    try {
      // 1. Check if server cookies already have a newer token (refreshed by proxy or another tab)
      const tokenRes = await xior
        .get<{ accessToken?: string }>("/api/auth/tokens")
        .catch(() => null);

      const cookieAccessToken = tokenRes?.data?.accessToken;
      if (cookieAccessToken && cookieAccessToken !== failedToken) {
        useAuthStore.getState().setTokens({ accessToken: cookieAccessToken });
        http.defaults.headers.Authorization = `Bearer ${cookieAccessToken}`;
        return cookieAccessToken;
      }

      // 2. Perform refresh via Next.js route handler (sends HttpOnly refreshToken)
      const res = await xior.post<{ accessToken?: string }>(
        "/api/auth/refresh",
        {},
        { credentials: "same-origin" }
      );

      const newAccessToken = res.data?.accessToken;
      if (!newAccessToken) {
        return null;
      }

      useAuthStore.getState().setTokens({ accessToken: newAccessToken });
      http.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
      return newAccessToken;
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      const isAuthFailure = status === 401 || status === 400;

      if (isAuthFailure) {
        useAuthStore.getState().logout();
        await xior
          .post("/api/auth/logout", {}, { credentials: "same-origin" })
          .catch(() => null);

        if (typeof window !== "undefined") {
          window.location.href = `/auth/login?${AUTH_QUERY_PARAM.CODE}=${AUTH_CODE.SESSION_EXPIRED}`;
        }
      }
      throw err;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as XiorInterceptorRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    const isAuthRoute =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register") ||
      url.includes("/auth/tokens");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      const failedToken =
        originalRequest.headers?.Authorization?.toString().replace(
          /^Bearer\s+/i,
          ""
        );

      return refreshClientToken(failedToken).then((newAccessToken) => {
        if (!newAccessToken) {
          return Promise.reject(error);
        }
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return http.request(originalRequest);
      });
    }

    return Promise.reject(error);
  }
);
