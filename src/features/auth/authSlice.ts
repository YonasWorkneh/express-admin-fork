import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { User, Role } from "@/types/auth";

interface AuthState {
  user: User | null;
  role: Role | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.role = action.payload.user.role;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    setRole: (state, action: PayloadAction<Role | null>) => {
      state.role = action.payload;
      if (state.user) {
        state.user.role = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    hydrateAuth: (
      state,
      action: PayloadAction<{
        user: User | null;
        role: Role | null;
        accessToken: string | null;
        refreshToken: string | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = !!(
        action.payload.accessToken || action.payload.refreshToken
      );
    },
  },
});

export const { setCredentials, setRole, logout, hydrateAuth } =
  authSlice.actions;

export default authSlice.reducer;
