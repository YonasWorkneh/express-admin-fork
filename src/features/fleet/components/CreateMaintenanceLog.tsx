import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import Button from "../../../components/common/Button";
import { MaintenanceLogSchema } from "../schemas/MaintenanceLogSchema";
import { IoArrowBack, IoConstruct } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import type {
  FleetListResponse,
  FleetVehicle,
  Pagination,
  
} from "@/types/types";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import { Spinner } from "@/utils/spinner";

const CreateMaintenanceLog = () => {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vehicles, _setVehicles] = useState<
    Array<{ id: string; plateNumber: string }>
  >([]);
  const [initialValues] = useState({
    vehicleId: "",
    // type: "",
    // date: "",
    cost: "",
    // mileage: "",
    // provider: "",
    // status: "",
    // technician: "",
    // nextService: "",
    notes: "",
  });


  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [fleets, setSetFleet] = useState<FleetVehicle[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchText, setSearchText] = useState("");

  // const [loadingBrand, setLoadingBrand] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showFleetDropdown, setShowFleetDropdown] = useState(false);
  const [fleetSearch, setfleetSearch] = useState("");

  const featchFleets = async () => {
    try {
      setLoadingStaff(true);

      const staffs = await api.get<FleetListResponse>(`/fleet?search=type:INTERNAL`);
      setSetFleet(staffs.data.data);
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
  console.log(vehicles,pagination)
  useEffect(() => {
    featchFleets();
  }, [searchText]);

  // Fetch vehicles for dropdown
  // useEffect(() => {
  //   const fetchVehicles = async () => {
  //     try {
  //       // Simulate API call - replace with actual API call
  //       const mockVehicles = [
  //         { id: "VH-001", plateNumber: "AA-12345" },
  //         { id: "VH-002", plateNumber: "AA-67890" },
  //         { id: "VH-003", plateNumber: "AA-24680" },
  //         { id: "VH-004", plateNumber: "AA-11223" },
  //         { id: "VH-005", plateNumber: "AA-99887" },
  //       ];
  //       setVehicles(mockVehicles);
  //     } catch (error) {
  //       console.error("Error fetching vehicles:", error);
  //     }
  //   };

  //   fetchVehicles();
  // }, []);

  // Fetch maintenance log data if in edit mode
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!isEditMode) return;

      setLoading(true);
      // try {
      //   // const response = await api.get(`/maintenance/${id}`);
      //   // const { success, data } = response.data;

      //   if (success && data) {
      //     setInitialValues({
      //       vehicleId: data.vehicleId || "",
      //       type: data.type || "",
      //       service: data.service || "",
      //       date: data.date || "",
      //       cost: data.cost?.toString() || "",
      //       mileage: data.mileage?.toString() || "",
      //       provider: data.provider || "",
      //       status: data.status || "",
      //       technician: data.technician || "",
      //       nextService: data.nextService || "",
      //       notes: data.notes || "",
      //     });
      //   }
      // } catch (error) {
      //   console.error("Error fetching maintenance data:", error);
      //   setMessage("Failed to load maintenance data");
      //   setStatus("error");
      // } finally {
      //   setLoading(false);
      // }
    };

    fetchMaintenanceData();
  }, [id, isEditMode]);

  const handleSubmit = async (value: any) => {
    try {
      setStatus("submitting");
      console.log(value, "values");
      try {
        setLoading(true);

        const data = {
          vehicleId: value.vehicleId,
          cost: value.cost,
          maintenance: value.notes,
        };
        const res = await api.post("/fleet/maintenance", data);
        toast.success(res.data?.message);
        navigate("/fleet/maintenance");
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Somethign went wrong!");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      console.error(
        isEditMode ? "Update maintenance error:" : "Add maintenance error:",
        error
      );
    } finally {
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl p-6 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading maintenance data...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectfleet = (
    fleet: { id: string; model: string; plateNumber: string },
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("vehicleId", fleet.id);
    setFieldValue("fleetName", fleet.model);
    setfleetSearch(`${fleet.model} (${fleet.id})`);
    setShowFleetDropdown(false);
  };

  const clearFleet = (
    setFieldValue: (field: string, value: string) => void
  ) => {
    setFieldValue("vehicleId", "");
    setFieldValue("fleetName", "");
    setfleetSearch("");
    setSearchText("")
  };
  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={MaintenanceLogSchema}
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
                  <IoConstruct className="text-3xl text-orange-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode
                      ? "Edit Maintenance Record"
                      : "Add Maintenance Record"}
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
              {/* Vehicle & Service Info */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Vehicle & Service Information
                </h2>
                <div>
                <div className="relative">
  <Label className="mb-1">Vehicle *</Label>

  <div className="relative">
    <Input
      type="text"
      placeholder="Search managers by name, ID, or email..."
      value={fleetSearch}
      onChange={(e) => {
        setfleetSearch(e.target.value);
        setShowFleetDropdown(true);
        if (!e.target.value) {
          clearFleet(setFieldValue);
        }
      }}
      onFocus={() => setShowFleetDropdown(true)}
      onBlur={() =>
        setTimeout(() => setShowFleetDropdown(false), 200)
      }
      className="py-7"
    />

    {values.vehicleId && (
      <button
        type="button"
        onClick={() => clearFleet(setFieldValue)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    )}
  </div>

  {showFleetDropdown && (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {loadingStaff && (
                        <div className="flex justify-center items-center py-8">
                          <Spinner className="h-6 w-6 text-blue-600 mr-2" />
                        </div>
                      )}
                      {fleets.length > 0 ? (
                        fleets.map((fleet) => (
                          <div
                            key={fleet.id}
                            onClick={() => selectfleet(fleet, setFieldValue)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {fleet.model}
                            </div>
                            <div className="text-sm text-gray-600">
                              ID: {fleet.id}
                            </div>
                            <div className="text-sm text-gray-500">
                              {fleet.plateNumber}
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
</div>

               
                  {errors.vehicleId && touched.vehicleId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.vehicleId}
                    </p>
                  )}
                </div>
                {/* <div>
                  <Label className="mb-1">Maintenance Type *</Label>
                  <Select
                    value={values.type}
                    onValueChange={(val) => setFieldValue("type", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.type && touched.type ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && touched.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div> */}
                <div>
                  <Label className="mb-1">Cost (ETB) *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="cost"
                    placeholder="0"
                    className={`py-7 ${
                      errors.cost && touched.cost ? "border-red-500" : ""
                    }`}
                  />
                  {errors.cost && touched.cost && (
                    <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Notes</Label>
                  <Field
                    as={Textarea}
                    name="notes"
                    placeholder="Additional notes about the maintenance..."
                    className="py-4 min-h-[100px]"
                  />
                </div>
                {/* <div>
                  <Label className="mb-1">Service Description *</Label>
                  <Field
                    as={Input}
                    name="service"
                    placeholder="e.g., Oil Change & Filter Replacement"
                    className={`py-7 ${
                      errors.service && touched.service ? "border-red-500" : ""
                    }`}
                  />
                  {errors.service && touched.service && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.service}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Service Date *</Label>
                  <Field
                    as={Input}
                    type="date"
                    name="date"
                    className={`py-7 ${
                      errors.date && touched.date ? "border-red-500" : ""
                    }`}
                  />
                  {errors.date && touched.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                  )}
                </div> */}
              </div>

              {/* Cost & Details */}
              {/* <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Cost & Details</h2>
              
                <div>
                  <Label className="mb-1">Mileage (km) *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="mileage"
                    placeholder="0"
                    className={`py-7 ${
                      errors.mileage && touched.mileage ? "border-red-500" : ""
                    }`}
                  />
                  {errors.mileage && touched.mileage && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.mileage}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Service Provider *</Label>
                  <Field
                    as={Input}
                    name="provider"
                    placeholder="e.g., Auto Care Center"
                    className={`py-7 ${
                      errors.provider && touched.provider
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.provider && touched.provider && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.provider}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Status *</Label>
                  <Select
                    value={values.status}
                    onValueChange={(val) => setFieldValue("status", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.status && touched.status ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && touched.status && (
                    <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                  )}
                </div>
              </div> */}
            </div>

            {/* Additional Information */}
            {/* <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium mb-4">
                Additional Information
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1">Technician Name *</Label>
                  <Field
                    as={Input}
                    name="technician"
                    placeholder="e.g., Alemayehu Tesfaye"
                    className={`py-7 ${
                      errors.technician && touched.technician
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.technician && touched.technician && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.technician}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Next Service Date</Label>
                  <Field
                    as={Input}
                    type="date"
                    name="nextService"
                    className="py-7"
                  />
                </div>
              </div>
             
            </div> */}

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode
                  ? "Update Maintenance Record"
                  : "Complete Maintenance Record"}
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
                  className={`flex-1 cursor-pointer bg-orange-500 hover:bg-orange-600 ${
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
                          ? "Updating Record..."
                          : "Creating Record..."}
                      </span>
                    </span>
                  ) : isEditMode ? (
                    "Update Record"
                  ) : (
                    "Create Record"
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

export default CreateMaintenanceLog;
