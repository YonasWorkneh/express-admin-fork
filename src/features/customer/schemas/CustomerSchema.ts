import * as Yup from "yup";

export const CustomerSchema = Yup.object().shape({
  name: Yup.string()
    .required("Customer name is required")
    .min(2, "Name must be at least 2 characters"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(
      /^\+251[79]\d{8}$/,
      "Phone must be +251 followed by 9 digits, starting with 9 or 7"
    ),
  customerType: Yup.string().required("Customer type is required"),

  notes: Yup.string().nullable(),
  // Corporate specific fields
  companyName: Yup.string().when("customerType", {
    is: "CORPORATE",
    then: (schema) =>
      schema.required("Company name is required for corporate customers"),
    otherwise: (schema) => schema.nullable(),
  }),
  contactPerson: Yup.string().when("customerType", {
    is: "CORPORATE",
    then: (schema) =>
      schema.required("Contact person is required for corporate customers"),
    otherwise: (schema) => schema.nullable(),
  }),
  contactPhone: Yup.string().nullable(),
  contactEmail: Yup.string().nullable(),
  taxId: Yup.string().nullable(),
});
