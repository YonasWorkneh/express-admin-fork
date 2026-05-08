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

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
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
