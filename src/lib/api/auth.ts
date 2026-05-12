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

  return data;
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

export function loginHasAuthenticatedTokens(res: LoginResponse): boolean {
  const access = String(res.data?.tokens?.accessToken ?? "").trim();
  const refresh = String(res.data?.tokens?.refreshToken ?? "").trim();
  return access.length > 0 && refresh.length > 0;
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

  return data as LoginResponse;
}
