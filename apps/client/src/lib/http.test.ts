import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { http } from "./http";
import { useAuthStore } from "@/store/use-auth-store";

describe("HTTP Client & Refresh Token Interceptor (In-Memory Zustand Architecture)", () => {
  const originalEnv = process.env;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_URL: "http://api.example.com",
      NEXT_PUBLIC_APP_URL: "http://client.example.com",
    };

    useAuthStore.getState().logout();
    if (http.defaults.headers) {
      delete http.defaults.headers.Authorization;
    }

    if (typeof document !== "undefined") {
      document.cookie = "accessToken=; path=/; max-age=0";
    }

    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("SYNCHRONOUS ATTACH: attaches Authorization header directly from useAuthStore RAM with 0ms network overhead", async () => {
    useAuthStore.getState().setTokens({ accessToken: "token-abc-123" });

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/test")) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    const res = await http.get("/api/v1/test");
    expect(res.data).toEqual({ success: true });

    // Assert /api/auth/tokens was NEVER called (0ms overhead!)
    const tokensCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/auth/tokens"),
    );
    expect(tokensCall).toBeUndefined();

    // Assert Authorization header was sent
    const testCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/v1/test"),
    );
    expect(testCall).toBeDefined();
    const headers = new Headers(testCall![1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer token-abc-123");
  });

  it("USES EXISTING TOKEN: uses existing valid accessToken from Zustand store without calling /api/auth/refresh", async () => {
    useAuthStore.getState().setTokens({
      accessToken: "still-valid-token-from-previous-session",
    });

    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes("/api/v1/profile")) {
        return new Response(JSON.stringify({ id: 1, name: "Alice" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    });

    const res = await http.get("/api/v1/profile");
    expect(res.data).toEqual({ id: 1, name: "Alice" });

    // Assert /api/auth/refresh was NEVER called
    const refreshCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/auth/refresh"),
    );
    expect(refreshCall).toBeUndefined();

    // Assert Authorization header used the existing store token directly
    const profileCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/v1/profile"),
    );
    const headers = new Headers(profileCall![1]?.headers);
    expect(headers.get("authorization")).toBe(
      "Bearer still-valid-token-from-previous-session",
    );
  });

  it("handles 401 error: refreshes token, updates useAuthStore, and seamlessly retries the request", async () => {
    useAuthStore.getState().setTokens({ accessToken: "initial-expired-token" });

    let apiCallAttempts = 0;
    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/tokens")) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlStr.includes("/api/auth/refresh")) {
        return new Response(
          JSON.stringify({ accessToken: "refreshed-token-999" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (urlStr.includes("/api/v1/protected-data")) {
        apiCallAttempts++;
        if (apiCallAttempts === 1) {
          return new Response(JSON.stringify({ message: "Token expired" }), {
            status: 401,
          });
        }
        return new Response(JSON.stringify({ data: "secret content" }), {
          status: 200,
        });
      }

      return new Response("Not Found", { status: 404 });
    });

    const response = await http.get("/api/v1/protected-data");
    expect(response.data).toEqual({ data: "secret content" });
    expect(apiCallAttempts).toBe(2);

    // Verify /api/auth/refresh was called
    const refreshCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/auth/refresh"),
    );
    expect(refreshCall).toBeDefined();

    // Verify useAuthStore RAM was updated with new token
    expect(useAuthStore.getState().accessToken).toBe("refreshed-token-999");
  });

  it("SINGLE-FLIGHT DEDUPLICATION: 10 concurrent 401 requests trigger EXACTLY 1 refresh call", async () => {
    const initialToken = "expired-token";
    const newToken = "brand-new-token";
    useAuthStore.getState().setTokens({ accessToken: initialToken });

    let refreshCallCount = 0;

    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/tokens")) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlStr.includes("/api/auth/refresh")) {
        refreshCallCount++;
        // Simulate network latency of 30ms during refresh
        await new Promise((r) => setTimeout(r, 30));
        return new Response(JSON.stringify({ accessToken: newToken }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (urlStr.includes("/api/v1/resource/")) {
        const headers = new Headers(init?.headers);
        const auth = headers.get("authorization") || "";

        // First attempt with initial token -> 401
        if (auth.includes(initialToken) || !auth) {
          return new Response(JSON.stringify({ message: "Expired" }), {
            status: 401,
          });
        }

        // Retried attempt with new token -> 200
        return new Response(JSON.stringify({ ok: true, url: urlStr }), {
          status: 200,
        });
      }

      return new Response("Not Found", { status: 404 });
    });

    // Fire 10 concurrent requests at the exact same time
    const promises = Array.from({ length: 10 }).map((_, i) =>
      http.get(`/api/v1/resource/${i}`),
    );

    const results = await Promise.all(promises);

    // CRITICAL: Refresh must have been called EXACTLY ONCE
    expect(refreshCallCount).toBe(1);

    // All 10 requests must have resolved successfully
    expect(results).toHaveLength(10);
    results.forEach((res) => {
      expect(res.data.ok).toBe(true);
    });

    // Verify useAuthStore RAM was updated
    expect(useAuthStore.getState().accessToken).toBe(newToken);
  });

  it("INFINITE LOOP PREVENTION: stops recursion when retried request also fails with 401", async () => {
    useAuthStore.getState().setTokens({ accessToken: "token-1" });

    let refreshCallCount = 0;
    let endpointCallCount = 0;

    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/tokens")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      if (urlStr.includes("/api/auth/refresh")) {
        refreshCallCount++;
        return new Response(JSON.stringify({ accessToken: "token-2" }), {
          status: 200,
        });
      }

      if (urlStr.includes("/api/v1/permanently-unauthorized")) {
        endpointCallCount++;
        // Always returns 401 (e.g., account revoked)
        return new Response(
          JSON.stringify({ message: "Unauthorized forever" }),
          {
            status: 401,
          },
        );
      }

      return new Response("Not Found", { status: 404 });
    });

    await expect(
      http.get("/api/v1/permanently-unauthorized"),
    ).rejects.toThrow();

    // Must only refresh ONCE
    expect(refreshCallCount).toBe(1);
    // Must only retry once (initial call + 1 retry = 2 calls total)
    expect(endpointCallCount).toBe(2);
  });

  it("403 FORBIDDEN: does NOT trigger refresh token", async () => {
    useAuthStore.getState().setTokens({ accessToken: "token-1" });

    let refreshCalled = false;

    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/refresh")) {
        refreshCalled = true;
        return new Response(JSON.stringify({ accessToken: "token-2" }), {
          status: 200,
        });
      }

      if (urlStr.includes("/api/v1/admin-only")) {
        return new Response(JSON.stringify({ message: "Forbidden" }), {
          status: 403,
        });
      }

      return new Response("Not Found", { status: 404 });
    });

    await expect(http.get("/api/v1/admin-only")).rejects.toThrow();

    // Must NOT call refresh token for 403
    expect(refreshCalled).toBe(false);
  });

  it("REFRESH 401 FAILURE: calls logout, resets store, and rejects", async () => {
    useAuthStore.getState().setTokens({ accessToken: "expired-token" });

    let logoutCalled = false;

    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/tokens")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      if (urlStr.includes("/api/auth/refresh")) {
        // Refresh token itself is expired/revoked
        return new Response(JSON.stringify({ message: "Session expired" }), {
          status: 401,
        });
      }

      if (urlStr.includes("/api/auth/logout")) {
        logoutCalled = true;
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
        });
      }

      if (urlStr.includes("/api/v1/user-info")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        });
      }

      return new Response("Not Found", { status: 404 });
    });

    await expect(http.get("/api/v1/user-info")).rejects.toThrow();

    // Must trigger logout API
    expect(logoutCalled).toBe(true);

    // RAM Token must be cleared
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("TRANSIENT 500 FAILURE: rejects without calling logout (preserves session)", async () => {
    useAuthStore.getState().setTokens({ accessToken: "valid-token" });

    let logoutCalled = false;

    fetchMock.mockImplementation(async (url: string) => {
      const urlStr = String(url);

      if (urlStr.includes("/api/auth/tokens")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }

      if (urlStr.includes("/api/auth/refresh")) {
        // Transient 500 server error
        return new Response(
          JSON.stringify({ message: "Internal server error" }),
          {
            status: 500,
          },
        );
      }

      if (urlStr.includes("/api/auth/logout")) {
        logoutCalled = true;
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
        });
      }

      if (urlStr.includes("/api/v1/data")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
        });
      }

      return new Response("Not Found", { status: 404 });
    });

    await expect(http.get("/api/v1/data")).rejects.toThrow();

    // MUST NOT call logout on transient error
    expect(logoutCalled).toBe(false);
  });
});
