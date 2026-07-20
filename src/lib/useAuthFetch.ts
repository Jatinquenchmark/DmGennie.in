import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

// Token-bound fetch for pages outside Dashboard.tsx (which has its own copy).
// Mirrors the Dashboard authFetch: attaches the Supabase bearer token + JSON headers.
export function useAuthFetch() {
  const { session } = useAuth();
  return useCallback(
    (url: string, options: RequestInit = {}) => {
      const token = session?.access_token;
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
      });
    },
    [session],
  );
}
