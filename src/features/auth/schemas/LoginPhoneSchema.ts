import * as yup from "yup";

/** Ethiopian mobile local part: exactly 9 digits, first digit 7 or 9 (after +251). */
export const LoginPhoneSchema = yup.object().shape({
  phoneLocal: yup
    .string()
    .required("Mobile number is required")
    .length(9, "Enter exactly 9 digits")
    .matches(/^[79]\d{8}$/, "Number must start with 7 or 9 and be 9 digits total"),
  password: yup.string().required("Password is required"),
});

export type LoginPhoneFormValues = yup.InferType<typeof LoginPhoneSchema>;
