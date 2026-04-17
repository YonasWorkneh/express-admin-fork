import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { logout } from "@/utils/auth";
import { setCredentials } from "@/features/auth/authSlice";

interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const API_BASE_URL =
  "https://courier-app-production.up.railway.app";

const api: AxiosInstance = axios.create({
  // baseURL: "https://localhost:10000/",
  // baseURL: "http://localhost:10000",
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Setup function for Axios interceptors
 */
const setup = (store: { dispatch: (action: unknown) => void }) => {
  // Request interceptor
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      const originalConfig = error.config as CustomAxiosRequestConfig;

      // Skip refresh logic for login endpoint
      if (
        originalConfig.url === "/auth/login" ||
        originalConfig.url === "/auth/refresh"
      ) {
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalConfig._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalConfig.headers) {
                originalConfig.headers["Authorization"] = `Bearer ${token}`;
              }
              return api(originalConfig);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalConfig._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token, logout user
          processQueue(error, null);
          isRefreshing = false;
          logout();
          return Promise.reject(error);
        }

        try {
          // Call refresh endpoint
          const response = await api.get<RefreshResponse>("/auth/refresh", {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } =
              response.data.data;

            // Save tokens in localStorage
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", newRefreshToken);

            // Update Redux state
            const userStr = localStorage.getItem("user");
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                store.dispatch(
                  setCredentials({
                    user,
                    accessToken,
                    refreshToken: newRefreshToken,
                  })
                );
              } catch {
                // If user parsing fails, continue anyway
              }
            }

            // Process queued requests
            processQueue(null, accessToken);

            // Update the original request with new token
            if (originalConfig.headers) {
              originalConfig.headers["Authorization"] = `Bearer ${accessToken}`;
            }

            isRefreshing = false;
            return api(originalConfig);
          } else {
            throw new Error("Refresh failed: Invalid response");
          }
        } catch (_error: unknown) {
          // Refresh token expired or invalid, logout user
          processQueue(_error as AxiosError, null);
          isRefreshing = false;
          logout();
          return Promise.reject(_error);
        }
      }

      return Promise.reject(error);
    }
  );
};

export default api;
export { setup };
