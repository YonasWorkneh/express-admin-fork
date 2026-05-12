import type { LoginResponse, RegisterResponse } from "@/types/auth";

// const BASE_URL = import.meta.env.VITE_BASE_URL;
// const BASE_URL = "https://test-courier.servehalflife.com";
// const BASE_URL = "http://localhost:10000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const register = async (
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  // Improved error message based on API response
  const data = await response.json();
  if (!response.ok) {
    // Show a specific message if available, else a default
    throw new Error(data?.message || "Failed to register");
  }
  if (!data.success) {
    throw new Error(data?.message || "Registration unsuccessful.");
  }

  return data;
};

export type MobileLoginCredentials =
  | { email: string; password: string }
  | { phone: string; password: string };

export const login = async (
  credentials: MobileLoginCredentials,
): Promise<LoginResponse> => {
  const response = await fetch(`${BASE_URL}/auth/login/mobile`, {
    method: "POST",
    body: JSON.stringify(credentials),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  // Show a specific message if available, else a default
  if (!response.ok) {
    throw new Error(data?.message || "Failed to login");
  }
  if (!data.success) {
    // Use API message, e.g., "Invalid credentials"
    throw new Error(
      data?.message || "Login unsuccessful. Please check your credentials.",
    );
  }

  return normalizeLoginResponse(data as LoginResponse);
};

/** Alternate enum value some APIs return — treated like `PASSWORD_CHANGE_REQUIRED`. */
export const PASSWORD_CHANGE_REQUIRED_ALIASES = new Set([
  "PASSWORD_CHANGE_REQUIRED",
  "PASSWORD_REQUIRE_CHANGE",
]);

export function loginRequiresPasswordChange(res: LoginResponse): boolean {
  const t = String(res.data?.type ?? "").trim();
  return PASSWORD_CHANGE_REQUIRED_ALIASES.has(t);
}

/** Tokens may appear on `data.tokens` or flat on `data` (camelCase / snake_case). */
export function peekAuthTokens(res: LoginResponse): {
  accessToken: string;
  refreshToken: string;
} | null {
  const d = res?.data as Record<string, unknown> | undefined;
  if (!d) return null;
  const nested = d.tokens as Record<string, unknown> | undefined;
  const access = String(
    (typeof nested?.accessToken === "string" ? nested.accessToken : null) ??
      (typeof d.accessToken === "string" ? d.accessToken : null) ??
      (typeof d.access_token === "string" ? d.access_token : null) ??
      "",
  ).trim();
  const refresh = String(
    (typeof nested?.refreshToken === "string" ? nested.refreshToken : null) ??
      (typeof d.refreshToken === "string" ? d.refreshToken : null) ??
      (typeof d.refresh_token === "string" ? d.refresh_token : null) ??
      "",
  ).trim();
  if (!access || !refresh) return null;
  return { accessToken: access, refreshToken: refresh };
}

export function loginHasAuthenticatedTokens(res: LoginResponse): boolean {
  return peekAuthTokens(res) !== null;
}

/** Ensure `data.tokens` is populated so callers can safely read `login` / verify responses. */
export function normalizeLoginResponse(data: LoginResponse): LoginResponse {
  const tokens = peekAuthTokens(data);
  if (!tokens) return data;
  return {
    ...data,
    data: {
      ...data.data,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    },
  };
}

/**
 * After email OTP + new password (forced change flow).
 * Adjust path if your API differs — response should match LoginResponse / AUTH_SUCCESS.
 */
export async function confirmMobileLoginPasswordChange(args: {
  code: string;
  newPassword: string;
  email?: string;
  phone?: string;
}): Promise<LoginResponse> {
  const body: Record<string, string> = {
    code: args.code,
    newPassword: args.newPassword,
  };
  const em = args.email?.trim();
  const ph = args.phone?.trim();
  if (em) body.email = em;
  if (ph) body.phone = ph;

  const response = await fetch(
    `${BASE_URL}/auth/login/mobile/confirm-password-change`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to confirm password change");
  }
  if (!data.success) {
    throw new Error(
      data?.message || "Verification failed. Check the code and try again.",
    );
  }

  return normalizeLoginResponse(data as LoginResponse);
}

/** Resend email verification code for staff signup / password-change flow. */
export async function staffResendVerification(
  email: string,
): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/staff/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
    }),
  });

  const data = (await response.json()) as {
    success?: boolean;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data?.message || "Failed to resend verification email");
  }
  if (!data.success) {
    throw new Error(
      data?.message || "Could not resend verification. Try again later.",
    );
  }

  return {
    message: data.message?.trim() || "Verification code sent.",
  };
}

/** Confirm staff email / set password via token from email (non–digit-safe token). */
export async function staffVerifyEmail(args: {
  token: string;
  password: string;
}): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/staff/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: args.token.trim(),
      password: args.password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to verify email");
  }
  if (!data.success) {
    throw new Error(data?.message || "Verification failed. Check the token and try again.");
  }

  return normalizeLoginResponse(data as LoginResponse);
}
