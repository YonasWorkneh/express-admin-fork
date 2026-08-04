import * as yup from "yup";

export const CreateBranchSchema = yup.object().shape({
  name: yup.string().trim().required("Branch name is required"),
  location: yup.string().trim().required("Location is required"),
  locatedInCapital: yup.boolean().optional().default(false),
  phone: yup
    .string()
    .matches(/^\+251[79]\d{8}$/, {
      message: "Phone must be +251 followed by 9 digits, starting with 9 or 7",
      excludeEmptyString: true,
    })
    .optional(),
});
