import * as yup from "yup";

export const CreateBranchSchema = yup.object().shape({
  name: yup.string().trim().required("Branch name is required"),
  location: yup.string().trim().required("Location is required"),
  locatedInCapital: yup.boolean().optional().default(false),
});
