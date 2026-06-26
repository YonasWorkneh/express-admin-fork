import { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Button from "../../../components/common/Button";
// import api from "../../../lib/api/api";
import { IoArrowBack, IoStar, IoAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";

const AddPointsSchema = Yup.object().shape({
  customerId: Yup.string().required("Customer selection is required"),
  points: Yup.number()
    .required("Points amount is required")
    .min(1, "Points must be at least 1")
    .max(10000, "Points cannot exceed 10,000"),
  reason: Yup.string()
    .required("Reason is required")
    .min(5, "Reason must be at least 5 characters"),
  type: Yup.string().required("Points type is required"),
  notes: Yup.string().nullable(),
});

const AddPoints = () => {
  const [status] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [message] = useState<string | null>(null);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  const navigate = useNavigate();

  const initialValues = {
    customerId: "",
    points: "",
    reason: "",
    type: "",
    notes: "",
  };

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Simulate API call - replace with actual API call
        const mockCustomers = [
          { id: "CUST-001", name: "Abebe Kebede", email: "abebe.k@email.com" },
          { id: "CUST-003", name: "Marta Tadesse", email: "marta.t@email.com" },
          { id: "CUST-005", name: "Dawit Alemu", email: "dawit.a@email.com" },
          { id: "CUST-006", name: "Tigist Hailu", email: "tigist.h@email.com" },
          {
            id: "CUST-007",
            name: "Yohannes Desta",
            email: "yohannes.d@email.com",
          },
        ];
        setCustomers(mockCustomers);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleSubmit = async () =>
    // values: typeof initialValues,
    // { resetForm }: { resetForm: () => void }
    {
      // try {
      //   setStatus("submitting");
      //   setMessage(null);
      //   const payload = {
      //     customerId: values.customerId,
      //     points: parseInt(values.points),
      //     reason: values.reason,
      //     type: values.type,
      //     notes: values.notes || null,
      //   };
      //   const response = await api.post("/loyalty/points", payload);
      //   const { success, message: responseMessage } = response.data;
      //   if (success) {
      //     setStatus("success");
      //     setMessage(responseMessage || "Points added successfully!");
      //     resetForm();
      //     setTimeout(() => {
      //       navigate("/customer/loyalty");
      //     }, 2000);
      //   } else {
      //     setStatus("error");
      //     setMessage(responseMessage || "Failed to add points");
      //   }
      // } catch (error) {
      //   setStatus("error");
      //   setMessage("Something went wrong. Please try again.");
      //   console.error("Add points error:", error);
      // } finally {
      //   setTimeout(() => setStatus("idle"), 2500);
      // }
    };

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={AddPointsSchema}
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
                  <IoStar className="text-3xl text-yellow-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    Add Loyalty Points
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
              {/* Customer & Points Info */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Customer & Points Information
                </h2>
                <div>
                  <Label className="mb-1">Select Customer *</Label>
                  <Select
                    value={values.customerId}
                    onValueChange={(val) => setFieldValue("customerId", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.customerId && touched.customerId
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Choose customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            <span className="text-sm text-gray-500">
                              {customer.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.customerId && touched.customerId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerId}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Points Amount *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="points"
                    placeholder="Enter points to add"
                    className={`py-7 ${
                      errors.points && touched.points ? "border-red-500" : ""
                    }`}
                  />
                  {errors.points && touched.points && (
                    <p className="text-red-500 text-sm mt-1">{errors.points}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Points Type *</Label>
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
                      <SelectItem value="Purchase">Purchase Reward</SelectItem>
                      <SelectItem value="Referral">Referral Bonus</SelectItem>
                      <SelectItem value="Promotion">
                        Promotional Points
                      </SelectItem>
                      <SelectItem value="Compensation">Compensation</SelectItem>
                      <SelectItem value="Manual">Manual Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && touched.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              {/* Reason & Details */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Reason & Details</h2>
                <div>
                  <Label className="mb-1">Reason for Points *</Label>
                  <Field
                    as={Input}
                    name="reason"
                    placeholder="e.g., Purchase completion, Referral bonus"
                    className={`py-7 ${
                      errors.reason && touched.reason ? "border-red-500" : ""
                    }`}
                  />
                  {errors.reason && touched.reason && (
                    <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Additional Notes</Label>
                  <Field
                    as={Textarea}
                    name="notes"
                    placeholder="Any additional information about these points..."
                    className="py-4 min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                Complete Points Addition
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
                  className={`flex-1 cursor-pointer bg-yellow-500 hover:bg-yellow-600 ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding Points...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <IoAdd className="h-4 w-4" />
                      Add Points
                    </span>
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

export default AddPoints;
