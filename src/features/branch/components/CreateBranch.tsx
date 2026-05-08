import { useState } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Button from "../../../components/common/Button";
import MapAddressSelector from "@/components/common/MapAddressSelector";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import { CreateBranchSchema } from "../schemas/CreateBranchSchema";
import { IoArrowBack } from "react-icons/io5";
import { BsBuildingFillAdd } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";

const CreateBranch = () => {
  const [status] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialValues] = useState({
    name: "",
    location: "",
    address: "",
    latitude: 0,
    longitude: 0,
    phone: "",
    email: "",
    description: "",
    locatedInCapital: false,
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Fetch branch data if in edit mode
  // useEffect(() => {
  //   const fetchBranchData = async () => {
  //     if (!isEditMode) return;

  //     setLoading(true);
  //     try {
  //       const response = await api.get(`/branch/${id}`);
  //       const { success, data } = response.data;

  //       if (success && data) {
  //         setInitialValues({
  //           name: data.name || "",
  //           location: data.location || "",
  //           address: data.address || "",
  //           latitude: data.latitude || 0,
  //           longitude: data.longitude || 0,
  //           phone: data.phone || "",
  //           email: data.email || "",
  //           description: data.description || "",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error fetching branch data:", error);
  //       setMessage("Failed to load branch data");
  //       setStatus("error");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchBranchData();
  // }, [id, isEditMode]);

  const handleSubmit = async (
    value: typeof initialValues,
    { resetForm }: { resetForm: () => void },
  ) => {
    if (isEditMode) return;
    try {
      setLoading(true);
      const data = {
        name: value.name,
        location: value.location,
        isCapital: value.locatedInCapital === true,
        address: {
          lat: value.latitude,
          long: value.longitude,
        },
      };

      const res = await api.post("/branch", data);
      toast.success(res.data?.message ?? "Branch created.");
      resetForm();
      navigate("/branch");
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleSubmitLegacy = async (
  //   values: typeof initialValues,
  //   { resetForm }: { resetForm: () => void }
  // ) => {
  //   try {
  //     setStatus("submitting");
  //     setMessage(null);

  //     const endpoint = isEditMode ? `/branch/${id}` : "/branch";
  //     const method = isEditMode ? "put" : "post";

  //     // Send only { name, location }
  //     const response = await api[method](endpoint, {
  //       name: values.name,
  //       location: values.location,
  //     });
  //     const { success, message: responseMessage } = response.data;

  //     if (success) {
  //       setStatus("success");
  //       setMessage(
  //         responseMessage ||
  //           (isEditMode
  //             ? "Branch updated successfully!"
  //             : "Branch created successfully!")
  //       );
  //       if (!isEditMode) {
  //         resetForm();
  //       }
  //       setTimeout(() => {
  //         navigate("/branch");
  //       }, 2000);
  //     } else {
  //       setStatus("error");
  //       setMessage(
  //         responseMessage ||
  //           (isEditMode ? "Failed to update branch" : "Failed to create branch")
  //       );
  //     }
  //   } catch (error) {
  //     setStatus("error");
  //     setMessage("Something went wrong. Please try again.");
  //     console.error(
  //       isEditMode ? "Update branch error:" : "Add branch error:",
  //       error
  //     );
  //   } finally {
  //     setTimeout(() => setStatus("idle"), 2500);
  //   }
  // };

  if (loading) {
    return (
      <div className="max-w-4xl p-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading branch data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={CreateBranchSchema}
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
                  className="!text-white !size-[40px] bg-blue-500 hover:bg-blue-400 !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer"
                  onClick={() => navigate(-1)}
                >
                  <IoArrowBack className="text-white text-lg" />
                </Button>
              </div>
              <div className="flex gap-5 items-center justify-center mb-6">
                <div className="flex gap-4 items-center">
                  <BsBuildingFillAdd className="text-3xl text-blue-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode ? "Edit Branch" : "Create New Branch"}
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
              {/* Branch Info */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Branch Information</h2>
                <div>
                  <Label className="mb-1">Branch Name *</Label>
                  <Field
                    as={Input}
                    name="name"
                    placeholder="Enter branch name"
                    className={`py-7 ${
                      errors.name && touched.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">City/Location *</Label>
                  <Field
                    as={Input}
                    name="location"
                    placeholder="e.g., Addis Ababa, Dire Dawa"
                    className={`py-7 ${
                      errors.location && touched.location
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.location && touched.location && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-white px-3 py-3">
                  <Checkbox
                    id="branch-located-in-capital"
                    checked={values.locatedInCapital}
                    onCheckedChange={(checked) =>
                      setFieldValue("locatedInCapital", checked === true)
                    }
                    className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white focus-visible:ring-blue-500/40"
                  />
                  <Label
                    htmlFor="branch-located-in-capital"
                    className="text-sm font-normal text-gray-700 leading-snug cursor-pointer"
                  >
                    Located in capital
                  </Label>
                </div>
                <div>
                  <Label className="mb-1">Phone Number</Label>
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
                <div>
                  <Label className="mb-1">Email Address</Label>
                  <Field
                    as={Input}
                    type="email"
                    name="email"
                    placeholder="branch@company.com"
                    className={`py-7 ${
                      errors.email && touched.email ? "border-red-500" : ""
                    }`}
                  />
                  {errors.email && touched.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Address & Map */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Physical Address</h2>
                <div>
                  <Label className="mb-1">Branch Address</Label>
                  <MapAddressSelector
                    onAddressSelect={(addressData) => {
                      setFieldValue("address", addressData.address);
                      setFieldValue("latitude", addressData.latitude);
                      setFieldValue("longitude", addressData.longitude);
                    }}
                    initialAddress={values.address}
                    initialLat={values.latitude}
                    initialLng={values.longitude}
                    height="300px"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium mb-4">Additional Details</h2>
              <div>
                <Label className="mb-1">Branch Description</Label>
                <Field
                  as={Textarea}
                  name="description"
                  placeholder="Brief description about this branch, services offered, etc."
                  className="py-4 min-h-[100px]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode
                  ? "Update Branch Information"
                  : "Complete Branch Setup"}
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
                  disabled={loading || status === "submitting"}
                  className={`flex-1 cursor-pointer hover:bg-blue-700 ${
                    loading || status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading || status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {isEditMode
                          ? "Updating Branch..."
                          : "Creating Branch..."}
                      </span>
                    </span>
                  ) : isEditMode ? (
                    "Update Branch"
                  ) : (
                    "Create Branch"
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

export default CreateBranch;
