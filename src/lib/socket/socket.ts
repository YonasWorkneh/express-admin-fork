import { io, Socket } from "socket.io-client";

// Get base URL from the API configuration
// This should match the baseURL in api.ts
const BASE_URL = "https://yes-express.up.railway.app";

let socket: Socket | null = null;

/**
 * Initialize socket connection with JWT authentication
 * @param token - JWT access token
 * @returns Socket instance
 */
export const initializeSocket = (token: string): Socket => {
  // Disconnect existing socket if any
  if (socket?.connected) {
    socket.disconnect();
  }

  // Create new socket connection with authentication
  socket = io(BASE_URL, {
    auth: {
      token: token,
    },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Connection event handlers
  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

/**
 * Get the current socket instance
 * @returns Socket instance or null
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect the socket
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Reconnect socket with new token (useful after token refresh)
 * @param token - New JWT access token
 */
export const reconnectSocket = (token: string): void => {
  disconnectSocket();
  initializeSocket(token);
};
