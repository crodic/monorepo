"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { SocialAccount, User } from "@/types/apis";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import xior from "xior";

export const PROFILE_QUERY_KEY = ["user-profile"] as const;
export const SOCIAL_ACCOUNTS_QUERY_KEY = ["user-social-accounts"] as const;

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (
      error as { response?: { data?: { message?: string | string[] } } }
    ).response;
    const msg = res?.data?.message;
    if (Array.isArray(msg)) {
      return msg.join(", ");
    }
    if (typeof msg === "string") {
      return msg;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export function useProfile() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  return useQuery<User | null>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await http.get<User>("/api/v1/user/auth/me");
        return response.data;
      } catch (error: unknown) {
        const status =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        // Genuinely unauthenticated: return null
        if (status === 401) {
          return null;
        }
        // Network error / server down: throw so React Query can track error & retry
        throw error;
      }
    },
    enabled: !isHydrating && !!accessToken,
    staleTime: 1000 * 60 * 2,
    retry: (count, error: unknown) => {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      return status !== 401 && count < 3;
    },
    refetchOnWindowFocus: true,
  });
}

export function useSocialAccounts() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrating = useAuthStore((state) => state.isHydrating);

  return useQuery<SocialAccount[]>({
    queryKey: SOCIAL_ACCOUNTS_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await http.get<SocialAccount[]>(
          "/api/v1/user/auth/me/social-accounts",
        );
        return response.data;
      } catch (error: unknown) {
        const status =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
        if (status === 401) {
          return [];
        }
        throw error;
      }
    },
    enabled: !isHydrating && !!accessToken,
    staleTime: 1000 * 60 * 2,
    retry: (count, error: unknown) => {
      const status =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;
      return status !== 401 && count < 3;
    },
    refetchOnWindowFocus: true,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      const response = await http.put<{ message: string }>(
        "/api/v1/user/auth/me",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      password: string;
      newPassword: string;
      confirmNewPassword: string;
    }) => {
      const response = await http.post<{ message: string }>(
        "/api/v1/user/auth/me/change-password",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useSetupPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { password: string; confirmPassword: string }) => {
      const response = await http.post<{ message: string }>(
        "/api/v1/user/auth/me/setup-password",
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}

export function useLinkGoogle() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await http.post<{ url: string }>(
        "/api/v1/user/auth/me/social/google/link",
      );
      return data.url;
    },
    onSuccess: (url) => {
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await xior
        .post<{ message: string }>(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/logout`,
          {},
          {
            credentials: "same-origin",
          },
        )
        .catch(() => null);

      useAuthStore.getState().logout();
      queryClient.setQueryData(PROFILE_QUERY_KEY, null);
      queryClient.setQueryData(SOCIAL_ACCOUNTS_QUERY_KEY, []);
      router.push("/auth/login");
    },
  });
}
