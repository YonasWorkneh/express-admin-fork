import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Button from "../../../components/common/Button";
// import api from "../../../lib/api/api";
import { AssignManagerSchema } from "../schemas/AssignManagerSchema";
import { IoArrowBack, IoPersonAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import type {
  BranchListResponse,
  Branch,
  Staff,
  Pagination,
  StaffListResponse,
  RoleWithPermissionsListResponse,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";

// Demo data - replace with actual API calls
const demoManagers = [
  { id: "M001", name: "John Smith", email: "john.smith@company.com" },
  { id: "M002", name: "Sarah Johnson", email: "sarah.j@company.com" },
  { id: "M003", name: "Mike Williams", email: "mike.w@company.com" },
  { id: "M004", name: "Emily Davis", email: "emily.d@company.com" },
  { id: "M005", name: "Robert Brown", email: "robert.b@company.com" },
];


const AssignManager = () => {
  const [status] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message] = useState<string | null>(null);
  const navigate = useNavigate();

  // Dropdown states
  const [managers] = useState(demoManagers);
  const [managerSearch, setManagerSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  // const [searchText, setSearchText] = useState("");

  const [loadingBrand, setLoadingBrand] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const initialValues = {
    managerID: "",
    branchID: "",
    managerName: "",
    branchName: "",
  };

  // Filter managers based on search

  // Filter branches based on search

  console.log(pagination,managers)
  const featchStaffs = async () => {
    try {
      setLoadingStaff(true);
      
      const roles = await api.get<RoleWithPermissionsListResponse>(
        "/access-control/roles?page=1&pageSize=100"
      );
      const managerRoleId = roles.data.data.find((role) => role.name=="HR_MANAGER");

      console.log(" ::::::::::",managerRoleId)

      const staffs = await api.get<StaffListResponse>(
        `/staff?search=all:${managerSearch}&page=${1}&pageSize=${20}&filter=roleId:${managerRoleId?.id}`
      );
      setStaffs(staffs.data.data);
      setPagination(staffs.data.pagination);
      // toast.success(staffs.data.message);
      setLoadingStaff(false);
    } catch (error: any) {
      setLoadingStaff(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };

  useEffect(() => {
    featchStaffs();
  }, [managerSearch]);

  const featchBranch = async () => {
    try {
      setLoadingBrand(true);

      const branch = await api.get<BranchListResponse>(`/branch?search=all:${branchSearch}`);
      setBranches(branch.data.data);
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
  }, [branchSearch]);

  const handleSubmit = async (value: any) => {
    console.log(initialValues, value);
    try {
      setLoading(true);
      const data = { managerId: value?.managerID, branchId: value?.branchID };

      const res = await api.post("/branch/assign-manager", data);
      toast.success(res.data?.message);
      navigate("/branch");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // Select manager handler
  const selectManager = (
    manager: { id: string; name: string; email: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("managerID", manager.id);
    setFieldValue("managerName", manager.name);
    setManagerSearch(`${manager.name} (${manager.id})`);
    setShowManagerDropdown(false);
  };

  // Select branch handler
  const selectBranch = (
    branch: { id: string; name: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchID", branch.id);
    setFieldValue("branchName", branch.name);
    setBranchSearch(`${branch.name} (${branch.id})`);
    setShowBranchDropdown(false);
  };

  // Clear manager selection
  const clearManager = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("managerID", "");
    setFieldValue("managerName", "");
    setManagerSearch("");
  };

  // Clear branch selection
  const clearBranch = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("branchID", "");
    setFieldValue("branchName", "");
    setBranchSearch("");
  };

  if (loading) {
    return (
      <div className="max-w-4xl p-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE1E21] mx-auto mb-4"></div>
            <p className="text-gray-500">Loading ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={AssignManagerSchema}
        onSubmit={handleSubmit}
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
                    Assign Manager to Branch
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
              {/* Manager Selection */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Select Manager</h2>
                <div className="relative">
                  <Label className="mb-2">Manager *</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search managers "
                      value={managerSearch}
                      onChange={(e) => {
                        console.log(e.target.value)
                        setManagerSearch(e.target.value);
                        setShowManagerDropdown(true);
                        if (!e.target.value) {
                          clearManager(setFieldValue);
                        }
                      }}
                      onFocus={() => setShowManagerDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowManagerDropdown(false), 200)
                      }
                      className="py-7"
                    />
                    {values.managerID && (
                      <button
                        type="button"
                        onClick={() => clearManager(setFieldValue)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {showManagerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                       {loadingStaff&&   <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      </div>}
                      {staffs.length > 0 ? (
                        staffs.map((manager) => (
                          <div
                            key={manager.id}
                            onClick={() =>
                              selectManager(manager, setFieldValue)
                            }
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {manager.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {manager.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {manager.email}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                          No managers found
                        </div>
                      )}
                    </div>
                  )}
                  {errors.managerID && touched.managerID && (
                    <div className="text-red-500 text-sm mt-1">
                      {errors.managerID}
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Selection */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Select Branch</h2>
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
                    {values.branchID && (
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
                       {loadingBrand&&   <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      </div>}
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
                  {errors.branchID && touched.branchID && (
                    <div className="text-red-500 text-sm mt-1">
                      {errors.branchID}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selected Info */}
            {(values.managerName || values.branchName) && (
              <div className="bg-[#EE1E21]/5 p-6 rounded-lg mt-6 border border-[#EE1E21]/20">
                <h3 className="font-medium text-gray-900 mb-3 text-lg">
                  Assignment Summary
                </h3>
                <div className="space-y-2">
                  {values.managerName && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Manager:</span>{" "}
                      {values.managerName} ({values.managerID})
                    </p>
                  )}
                  {values.branchName && (
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Branch:</span>{" "}
                      {values.branchName} ({values.branchID})
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                Complete Manager Assignment
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
                  disabled={
                    status === "submitting" ||
                    !values.managerID ||
                    !values.branchID
                  }
                  className={`flex-1 cursor-pointer hover:bg-[#cc1a1c] ${
                    status === "submitting" ||
                    !values.managerID ||
                    !values.branchID
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Assigning Manager...</span>
                    </span>
                  ) : (
                    "Assign Manager"
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

export default AssignManager;
