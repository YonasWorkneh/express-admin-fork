import { useEffect, useState } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import Button from "@/components/common/Button";
// import api from "../../../lib/api/api";
import { UpdateStaffSchema } from "@/features/staff/schemas/CreateStaffSchema";
import { IoArrowBack, IoPersonAdd } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import type {
  Branch,
  BranchListResponse,
  RoleWithPermissions,
  RoleWithPermissionsListResponse,
  StaffDetailApi,
  StaffDetailResponse,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";

const EditStaffPage = () => {
  const [status] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message] = useState<string | null>(null);
  // const [loading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    name: "",
    email: "",
    // password: "",
    branchId: "",
    phone: "",
    // role: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);

  const [staff, setStaff] = useState<StaffDetailApi | null>(null);

  console.log("stff detail: ", staff, loadingRole, roles);

  const featchStaff = async () => {
    try {
      setLoading(true);

      const staffs = await api.get<StaffDetailResponse>("/staff/" + id);
      const staffData = staffs.data.data;

      setStaff(staffs.data.data);
      setInitialValues({
        name: staffData.name || "",
        email: staffData.email || "",
        // password: "", // leave empty for editing
        phone: staffData.phone || "",
        // role: staffData.role?.id || "",
        branchId: staffData.branch?.id || "",
        emergencyContactName: staffData.emergencyContactName || "",
        emergencyContactPhone: staffData.emergencyContactPhone || "",
      });
      // Pre-fill branch search input
      if (staffData.branch) {
        setBranchSearch(`${staffData.branch.name} (${staffData.branch.id})`);
      }
      toast.success(staffs.data.message);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchStaff();
  }, []);

  const featchRole = async () => {
    try {
      setLoadingRole(true);

      const staffs = await api.get<RoleWithPermissionsListResponse>(
        "/access-control/roles?page=1&pageSize=100"
      );
      setRoles(staffs.data.data);

      // toast.success(staffs.data.message);
      setLoadingRole(false);
    } catch (error: any) {
      setLoadingRole(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchRole();
  }, []);

  const featchBranch = async () => {
    try {
      setLoadingBrand(true);

      const branch = await api.get<BranchListResponse>("/branch");
      setBranches(branch.data.data);
      // toast.success(staffs.data.message);
      setLoadingBrand(false);
    } catch (error: any) {
      setLoadingBrand(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchBranch();
  }, []);

  const handleSubmit = async (value: any) => {
    console.log(initialValues, value);
    try {
      setLoading(true);
      const data = { ...value };
      if (data?.branchName) {
        delete data.branchName;
      }
      const res = await api.patch("/staff/" + id, data);
      toast.success(res.data?.message);
      navigate("/staff");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setLoading(false);
    }
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

  // Select branch handler
  const selectBranch = (
    branch: { id: string; name: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchId", branch.id);
    setFieldValue("branchName", branch.name);
    setBranchSearch(`${branch.name} (${branch.id})`);
    setShowBranchDropdown(false);
  };

  const clearBranch = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchID", "");
    setFieldValue("branchName", "");
    setBranchSearch("");
  };

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={UpdateStaffSchema}
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

                {/* Emergency Contact Information Section */}
                <div>
                  <h2 className="text-lg font-medium mt-8 mb-4">
                    Emergency Contact
                  </h2>
                  <div>
                    <Label className="mb-1">Emergency Contact Name *</Label>
                    <Field
                      as={Input}
                      name="emergencyContactName"
                      placeholder="Enter emergency contact name"
                      className={`py-7 ${
                        errors.emergencyContactName && touched.emergencyContactName
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors.emergencyContactName && touched.emergencyContactName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.emergencyContactName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1">Emergency Contact Phone *</Label>
                    <Field
                      as={Input}
                      name="emergencyContactPhone"
                      placeholder="+251 9xx xxx xxx"
                      className={`py-7 ${
                        errors.emergencyContactPhone && touched.emergencyContactPhone
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors.emergencyContactPhone && touched.emergencyContactPhone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.emergencyContactPhone}
                      </p>
                    )}
                  </div>
                </div>
                {/* End Emergency Contact */}
                {/* <div className="relative">
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
                </div> */}
              </div>

              {/* Work Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Work Information</h2>
                {/* <div>
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
                   {loadingRole?   <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      </div>:
                      roles.map((role) => {
                        return (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        );
                      }) } 
                    </SelectContent>
                  </Select>
                  {errors.role && touched.role && (
                    <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                  )}
                </div> */}
                <div className="bg-gray-50  rounded-lg space-y-4">
                  <div className="relative">
                    <Label className="mb-2">Branch *</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search branches by name, ID, or location..."
                        value={branchSearch}
                        onChange={(e) => {
                          setBranchSearch(e.target.value);
                          setShowBranchDropdown(true);
                          if (!e.target.value) {
                            clearBranch(setFieldValue);
                          }
                        }}
                        onFocus={() => setShowBranchDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowBranchDropdown(false), 200)
                        }
                        className="py-7"
                      />
                      {values.branchId && (
                        <button
                          type="button"
                          onClick={() => clearBranch(setFieldValue)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {showBranchDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingBrand && (
                          <div className="flex justify-center items-center py-8">
                            <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                          </div>
                        )}
                        {branches.length > 0 ? (
                          branches.map((branch) => (
                            <div
                              key={branch.id}
                              onClick={() => selectBranch(branch, setFieldValue)}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {branch.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {branch.id}
                              </div>
                              <div className="text-sm text-gray-500">
                                {branch.location}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No branches found
                          </div>
                        )}
                      </div>
                    )}
                    {errors.branchId && touched.branchId && (
                      <div className="text-red-500 text-sm mt-1">
                        {errors.branchId}
                      </div>
                    )}
                  </div>
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
                  // disabled={status === "submitting"}
                  className={`flex-1 cursor-pointer hover:bg-[#cc1a1c] ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{"Updating Staff..."}</span>
                    </span>
                  ) : (
                    "Update Staff"
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

export default EditStaffPage;

