import * as yup from "yup";

/** Six characters — letters, digits, or symbols (not digits-only). */
const sixCharacterCodeField = yup
  .string()
  .transform((v) => (typeof v === "string" ? v : ""))
  .required("Verification code is required")
  .length(6, "Enter all 6 characters of your verification code");

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

/** Forced password change after login — SMS or email (6-character codes). */
export const PasswordChangeConfirmSchema = yup.object().shape({
  code: sixCharacterCodeField,
  ...sharedPasswordShape,
});

export type PasswordChangeConfirmValues = yup.InferType<
  typeof PasswordChangeConfirmSchema
>;
