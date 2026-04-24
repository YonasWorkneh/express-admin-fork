import * as yup from "yup";

const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const phoneRegex: RegExp = /^(\+?\d{9,15})$/;

export const CreateStaffSchema = yup.object().shape({
  name: yup.string().trim().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .matches(
      emailRegex,
      "Please enter a valid email address (e.g., example@domain.com)"
    )
    .required("Email is required"),
  role: yup.string().default(""),
  branchId: yup.string().optional().nullable(),
  phone: yup
    .string()
    .matches(phoneRegex, "Please enter a valid phone number")
    .required("Phone is required"),
});

export const UpdateStaffSchema = yup.object().shape({
  name: yup.string().trim().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .matches(
      emailRegex,
      "Please enter a valid email address (e.g., example@domain.com)"
    )
    .required("Email is required"),
  role: yup.string().default(""),
  branchId: yup.string().optional().nullable(),
  phone: yup
    .string()
    .matches(phoneRegex, "Please enter a valid phone number")
    .required("Phone is required"),
});
