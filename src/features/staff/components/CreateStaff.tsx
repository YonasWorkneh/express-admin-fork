import { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Button from "../../../components/common/Button";
// import api from "../../../lib/api/api";
import { CreateStaffSchema } from "../schemas/CreateStaffSchema";
import { IoArrowBack, IoPersonAdd, IoEye, IoEyeOff } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";

const CreateStaff = () => {
  const [status] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading] = useState(false);
  const [initialValues] = useState({
    name: "",
    email: "",
    password: "",
    branchId: "",
    phone: "",
    role: "",
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Fetch staff data if in edit mode
  // useEffect(() => {
  //   const fetchStaffData = async () => {
  //     if (!isEditMode) return;

  //     setLoading(true);
  //     try {
  //       const response = await api.get(`/staff/${id}`);
  //       const { success, data } = response.data;

  //       if (success && data) {
  //         setInitialValues({
  //           name: data.name || "",
  //           email: data.email || "",
  //           password: "", // Don't pre-fill password for security
  //           branchId: data.branchId || "",
  //           phone: data.phone || "",
  //           role: data.role || "",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error fetching staff data:", error);
  //       setMessage("Failed to load staff data");
  //       setStatus("error");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchStaffData();
  // }, [id, isEditMode]);

  const handleSubmit = async () => {
    // try {
    //   setStatus("submitting");
    //   setMessage(null);
    //   const endpoint = isEditMode ? `/staff/${id}` : "/staff";
    //   const method = isEditMode ? "put" : "post";
    //   // In edit mode, only send password if it's not empty
    //   const payload =
    //     isEditMode && !values.password
    //       ? { ...values, password: undefined }
    //       : values;
    //   // const response = await api[method](endpoint, payload);
    //   // const { success, message: responseMessage } = response.data;
    //   if (success) {
    //     setStatus("success");
    //     setMessage(
    //       responseMessage ||
    //         (isEditMode
    //           ? "Staff updated successfully!"
    //           : "Staff created successfully!")
    //     );
    //     if (!isEditMode) {
    //       resetForm();
    //     }
    //     setTimeout(() => {
    //       navigate("/staff");
    //     }, 2000);
    //   } else {
    //     setStatus("error");
    //     setMessage(
    //       responseMessage ||
    //         (isEditMode ? "Failed to update staff" : "Failed to create staff")
    //     );
    //   }
    // } catch (error) {
    //   setStatus("error");
    //   setMessage("Something went wrong. Please try again.");
    //   console.error(
    //     isEditMode ? "Update staff error:" : "Add staff error:",
    //     error
    //   );
    // } finally {
    //   setTimeout(() => setStatus("idle"), 2500);
    // }
  };

  if (loading) {
    return (
      <div className="max-w-4xl p-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE1E21] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading staff data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={CreateStaffSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
            {/* Header */}
            <header className="relative">
              <div className="absolute h-full top-0 left-0 flex items-center">
                <Button
                  type="button"
                  className="!text-[#FADF4B] !size-[40px] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer"
                  onClick={() => navigate(-1)}
                >
                  <IoArrowBack className="text-[#FADF4B] text-lg" />
                </Button>
              </div>
              <div className="flex gap-5 items-center justify-center mb-6">
                <div className="flex gap-4 items-center">
                  <IoPersonAdd className="text-2xl text-[#EE1E21]" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode ? "Edit Staff Member" : "Add New Staff Member"}
                  </h1>
                </div>
              </div>
            </header>

            {/* Success/Error Message */}
            {message && (
              <div
                className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                  status === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Personal Information
                </h2>
                <div>
                  <Label className="mb-1">Full Name *</Label>
                  <Field
                    as={Input}
                    name="name"
                    placeholder="Enter staff full name"
                    className={`py-7 ${
                      errors.name && touched.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Email Address *</Label>
                  <Field
                    as={Input}
                    type="email"
                    name="email"
                    placeholder="staff@company.com"
                    className={`py-7 ${
                      errors.email && touched.email ? "border-red-500" : ""
                    }`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Phone Number *</Label>
                  <Field
                    as={Input}
                    type="tel"
                    name="phone"
                    placeholder="+251 911 234 567"
                    className={`py-7 ${
                      errors.phone && touched.phone ? "border-red-500" : ""
                    }`}
                  />
                  {errors.phone && touched.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
                <div className="relative">
                  <Label className="mb-1">Password *</Label>
                  <Field
                    as={Input}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    className={`py-7 pr-10 ${
                      errors.password && touched.password
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-12 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <IoEye className="h-5 w-5" />
                    ) : (
                      <IoEyeOff className="h-5 w-5" />
                    )}
                  </button>
                  {errors.password && touched.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Work Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Work Information</h2>
                <div>
                  <Label className="mb-1">Role *</Label>
                  <Select
                    value={values.role}
                    onValueChange={(val) => setFieldValue("role", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.role && touched.role ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="dispatcher">Dispatcher</SelectItem>
                      <SelectItem value="warehouse">Warehouse Staff</SelectItem>
                      <SelectItem value="customer-service">
                        Customer Service
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && touched.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Branch ID *</Label>
                  <Field
                    as={Input}
                    name="branchId"
                    placeholder="Enter branch ID (e.g., B001)"
                    className={`py-7 ${
                      errors.branchId && touched.branchId
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.branchId && touched.branchId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.branchId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode
                  ? "Update Staff Information"
                  : "Complete Staff Registration"}
              </h2>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className={`flex-1 cursor-pointer hover:bg-[#cc1a1c] ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {isEditMode ? "Updating Staff..." : "Creating Staff..."}
                      </span>
                    </span>
                  ) : isEditMode ? (
                    "Update Staff"
                  ) : (
                    "Create Staff"
                  )}
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateStaff;
