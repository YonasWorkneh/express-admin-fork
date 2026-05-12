import * as yup from "yup";

export const PasswordChangeConfirmSchema = yup.object().shape({
  code: yup
    .string()
    .required("Verification code is required")
    .matches(/^\d{6}$/, "Enter the 6-digit code from your email"),
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your password"),
});

export type PasswordChangeConfirmValues = yup.InferType<
  typeof PasswordChangeConfirmSchema
>;
