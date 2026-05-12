import {
  login,
  register,
  confirmMobileLoginPasswordChange,
} from "@/lib/api/auth";
import type { LoginResponse, RegisterResponse } from "@/types/auth";
import { useMutation } from "@tanstack/react-query";

export type LoginMutationVariables =
  | { email: string; password: string }
  | { phone: string; password: string };

export const useLogin = (
  onSuccess?: (data: LoginResponse, variables: LoginMutationVariables) => void,
  onError?: (error: Error) => void,
) => {
  const { data, isPending, error, mutate } = useMutation<
    LoginResponse,
    Error,
    LoginMutationVariables
  >({
    mutationFn: (vars) =>
      "email" in vars
        ? login({ email: vars.email.trim(), password: vars.password })
        : login({ phone: vars.phone.trim(), password: vars.password }),
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { data, isPending, error, mutate };
};

export const useConfirmMobileLoginPasswordChange = (
  onSuccess?: (data: LoginResponse) => void,
  onError?: (error: Error) => void,
) =>
  useMutation<
    LoginResponse,
    Error,
    { email?: string; phone?: string; code: string; newPassword: string }
  >({
    mutationFn: ({ email, phone, code, newPassword }) =>
      confirmMobileLoginPasswordChange({
        email,
        phone,
        code,
        newPassword,
      }),
    onSuccess: (data) => onSuccess?.(data),
    onError: (err) => onError?.(err),
  });

export const useRegister = () => {
  const { data, isPending, error, mutate } = useMutation<
    RegisterResponse,
    Error,
    { name: string; email: string; password: string }
  >({
    mutationFn: ({
      name,
      email,
      password,
    }: {
      name: string;
      email: string;
      password: string;
    }) => register(name, email, password),
    onSuccess: () => {},
    onError: () => {},
  });
  return { data, isPending, error, mutate };
};
