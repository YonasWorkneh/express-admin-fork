import * as yup from "yup";

/** Six characters — letters, digits, or symbols (not digits-only). */
const sixCharacterCodeField = yup
  .string()
  .transform((v) => (typeof v === "string" ? v : ""))
  .required("Verification code is required")
  .length(6, "Enter all 6 characters of your verification code");

/** Any characters — length varies by generated temporary password. */
const temporaryPasswordField = yup
  .string()
  .transform((v) => (typeof v === "string" ? v : ""))
  .required("Temporary password is required");

const sharedPasswordShape = {
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("New password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Confirm your password"),
};

/**
 * Forced password change after login.
 * Phone uses a fixed 6-character SMS code; email uses a temporary
 * password of variable length (any characters).
 */
export const PasswordChangeConfirmSchema = (kind: "phone" | "email" = "phone") =>
  yup.object().shape({
    code: kind === "email" ? temporaryPasswordField : sixCharacterCodeField,
    ...sharedPasswordShape,
  });

export type PasswordChangeConfirmValues = yup.InferType<
  ReturnType<typeof PasswordChangeConfirmSchema>
>;
