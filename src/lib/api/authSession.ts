import type { Role, User } from "@/types/auth";
import { API_BASE_URL } from "./api";

interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Refresh tokens using GET /auth/refresh (Bearer refresh token).
 * Used on app bootstrap; avoids the axios instance to prevent interceptor loops.
 */
export async function refreshSessionTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await res.json()) as RefreshResponse;

  if (
    !res.ok ||
    !data.success ||
    !data.data?.accessToken ||
    !data.data?.refreshToken
  ) {
    throw new Error(data.message || "Session refresh failed");
  }

  return {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  };
}

/** Reads user/role from localStorage; tolerates missing or invalid user JSON. */
export function parseStoredUserAndRole(): {
  user: User | null;
  role: Role | null;
} {
  const userStr = localStorage.getItem("user");
  const roleStr = localStorage.getItem("role");
  let user: User | null = null;
  let role: Role | null = null;

  if (userStr) {
    try {
      user = JSON.parse(userStr) as User;
      role = user.role ?? null;
    } catch {
      localStorage.removeItem("user");
    }
  }

  if (roleStr) {
    try {
      role = JSON.parse(roleStr) as Role;
    } catch {
      // ignore invalid role blob
    }
  }

  if (user && !role) {
    role = user.role ?? null;
  }

  return { user, role };
}
