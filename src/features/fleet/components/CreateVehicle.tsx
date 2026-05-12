import { useState, useEffect } from "react";
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
import Button from "@/components/common/Button";
// import api from "@/lib/api/api";
import * as Yup from "yup";
import { IoArrowBack, IoCarSport } from "react-icons/io5";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/lib/api/api";

/** Ownership sent to API as INTERNAL | EXTERNAL; accepts legacy casing from GET. */
function normalizeFleetOwnershipType(
  raw: unknown,
): "" | "INTERNAL" | "EXTERNAL" {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const upper = s.toUpperCase().replace(/[\s-]+/g, "_");
  if (upper === "INTERNAL" || upper === "IN_HOUSE" || upper === "INHOUSE") {
    return "INTERNAL";
  }
  if (upper === "EXTERNAL") {
    return "EXTERNAL";
  }
  const lower = s.toLowerCase();
  if (lower === "internal" || lower === "inhouse" || lower === "in-house") {
    return "INTERNAL";
  }
  if (lower === "external") {
    return "EXTERNAL";
  }
  return "";
}

// Updated validation schema to match backing field names and add ownership
const VehicleValidationSchema = Yup.object().shape({
  plateNumber: Yup.string().required("Plate number is required"),
  vehicleTypeId: Yup.string().required("Vehicle type is required"),
  model: Yup.string().required("Model is required"),
  type: Yup.string()
    .oneOf(["INTERNAL", "EXTERNAL"], "Select Internal or External")
    .required("Type is required"),
  // brand: Yup.string().required("Brand is required"),
  // year: Yup.number()
  //   .min(1990, "Year must be 1990 or later")
  //   .max(new Date().getFullYear() + 1, "Invalid year")
  //   .required("Year is required"),
  // fuelType: Yup.string().required("Fuel type is required"),
  // capacity: Yup.string().required("Capacity is required"),
  // insuranceExpiry: Yup.date().required("Insurance expiry date is required"),
});

const CreateVehicle = () => {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    plateNumber: "",
    vehicleTypeId: "",
    model: "",
    type: "",
    // brand: "",
    // year: new Date().getFullYear(),
    // driverId: "",
    // fuelType: "",
    // capacity: "",
    // currentMileage: 0,
    // insuranceNumber: "",
    // insuranceProvider: "",
    // insuranceExpiry: "",
    // registrationDate: "",
    // chassisNumber: "",
    // engineNumber: "",
    // color: "",
    // notes: "",
  });
  const [_fleet, setFleet] = useState(null);

  // New states for vehicle types
  const [vehicleTypes, setVehicleTypes] = useState<{ value: string; label: string }[]>([]);
  const [vehicleTypeLoading, setVehicleTypeLoading] = useState<boolean>(false);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const location = useLocation();
  const query = new URLSearchParams(location.search);

  const fleetDetail = query.get("fleet")
    ? JSON.parse(query.get("fleet")!)
    : null;
  // console.log(fleetDetail, "fleetDetail", fleet);

  // Fetch vehicle types from /fleet/type
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      setVehicleTypeLoading(true);
      try {
        const res = await api.get("/fleet/type");
        // Expecting: res.data?.data?.vehicleTypes
        const typeList = Array.isArray(res.data?.data?.vehicleTypes)
          ? res.data.data.vehicleTypes
          : [];
        setVehicleTypes(
          typeList.map((t: any) => ({
            value: t.id, // or t.id, but the form is using the name
            label: t.name,
            description: t.description,
          }))
        );
      } catch (e) {
        // fallback in case of error
        setVehicleTypes([
            ]);
      } finally {
        setVehicleTypeLoading(false);
      }
    };
    fetchVehicleTypes();
  }, []);

  // Fetch vehicle data if in edit mode
  useEffect(() => {
    const fetchVehicleData = async () => {
      if (!isEditMode) return;

      setFleet(fleetDetail);
      setInitialValues({
        plateNumber: fleetDetail.plateNumber || "",
        vehicleTypeId: String(
          fleetDetail.vehicleTypeId ??
            fleetDetail.vehicleType?.id ??
            "",
        ),
        model: fleetDetail.model || "",
        type: normalizeFleetOwnershipType(fleetDetail.type),
      });
    };

    fetchVehicleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleSubmit = async (values: any) => {
    try {
      setStatus("submitting");
      setLoading(true);

      const ownershipType = normalizeFleetOwnershipType(values.type);
      const payload = {
        ...values,
        type: ownershipType,
      };

      let res;
      if (isEditMode) {
        res = await api.patch("/fleet/" + id, payload);
      } else {
        res = await api.post("/fleet", payload);
      }
      toast.success(res.data?.message);
      navigate("/fleet");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Something went wrong!");
      setStatus("error");
      setMessage(error?.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="max-w-4xl p-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading vehicle data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={VehicleValidationSchema}
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
                  <IoCarSport className="text-3xl text-blue-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode ? "Edit Vehicle" : "Register New Vehicle"}
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

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
              {/* Basic Vehicle Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Basic Vehicle Information
                </h2>
                <div>
                  <Label className="mb-1">Plate Number *</Label>
                  <Field
                    as={Input}
                    name="plateNumber"
                    placeholder="AA-12345"
                    className={`py-7 ${
                      errors.plateNumber && touched.plateNumber
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.plateNumber && touched.plateNumber && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.plateNumber}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Vehicle Type *</Label>
                  <Select
                    value={values.vehicleTypeId}
                    onValueChange={(val) => setFieldValue("vehicleTypeId", val)}
                    disabled={vehicleTypeLoading}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.vehicleTypeId && touched.vehicleTypeId ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder={vehicleTypeLoading ? "Loading types..." : "Select vehicle type"} />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypeLoading ? (
                        <div className="py-2 px-4 text-gray-500">Loading types...</div>
                      ) : vehicleTypes.length === 0 ? (
                        <div className="py-2 px-4 text-gray-500">No vehicle types available</div>
                      ) : (
                        vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.vehicleTypeId && touched.vehicleTypeId && (
                    <p className="text-red-500 text-sm mt-1">{errors.vehicleTypeId}</p>
                  )}
                </div>

                {/* Ownership field (NEW) */}
                <div>
                  <Label className="mb-1">Type *</Label>
                  <Select
                    value={values.type}
                    onValueChange={val => setFieldValue("type", val)}
                    // not loading
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.type && touched.type ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                      <SelectItem value="EXTERNAL">External</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && touched.type && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.type}
                    </p>
                  )}
                </div>

                {/* <div>
                  <Label className="mb-1">Brand *</Label>
                  <Field
                    as={Input}
                    name="brand"
                    placeholder="e.g., Toyota, Isuzu, Ford"
                    className={`py-7 ${
                      errors.brand && touched.brand ? "border-red-500" : ""
                    }`}
                  />
                  {errors.brand && touched.brand && (
                    <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                  )}
                </div> */}
                <div>
                  <Label className="mb-1">Model *</Label>
                  <Field
                    as={Input}
                    name="model"
                    placeholder="e.g., Hiace, Ranger, Canter"
                    className={`py-7 ${
                      errors.model && touched.model ? "border-red-500" : ""
                    }`}
                  />
                  {errors.model && touched.model && (
                    <p className="text-red-500 text-sm mt-1">{errors.model}</p>
                  )}
                </div>
                {/* <div>
                  <Label className="mb-1">Year *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="year"
                    placeholder="2023"
                    className={`py-7 ${
                      errors.year && touched.year ? "border-red-500" : ""
                    }`}
                  />
                  {errors.year && touched.year && (
                    <p className="text-red-500 text-sm mt-1">{errors.year}</p>
                  )}
                </div> */}
                {/* <div>
                  <Label className="mb-1">Color</Label>
                  <Field
                    as={Input}
                    name="color"
                    placeholder="e.g., White, Blue, Black"
                    className="py-7"
                  />
                </div> */}
              </div>
              {/* -- other fields removed for brevity -- */}
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode
                  ? "Update Vehicle Information"
                  : "Complete Vehicle Registration"}
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
                  className={`flex-1 cursor-pointer hover:bg-blue-700 ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {isEditMode
                          ? "Updating Vehicle..."
                          : "Registering Vehicle..."}
                      </span>
                    </span>
                  ) : isEditMode ? (
                    "Update Vehicle"
                  ) : (
                    "Register Vehicle"
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

export default CreateVehicle;
