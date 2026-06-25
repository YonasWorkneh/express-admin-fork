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
import { IoArrowBack, IoWarning, IoAdd } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";

const CreateComplaintSchema = Yup.object().shape({
  customerId: Yup.string().required("Customer selection is required"),
  orderId: Yup.string().required("Order ID is required"),
  type: Yup.string().required("Complaint type is required"),
  priority: Yup.string().required("Priority is required"),
  subject: Yup.string()
    .min(5, "Subject must be at least 5 characters")
    .max(100, "Subject must not exceed 100 characters")
    .required("Subject is required"),
  description: Yup.string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must not exceed 1000 characters")
    .required("Description is required"),
  assignedTo: Yup.string().required("Assigned to is required"),
});

const CreateComplaint = () => {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [staff, setStaff] = useState<
    Array<{ id: string; name: string; role: string }>
  >([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const initialValues = {
    customerId: "",
    orderId: "",
    type: "",
    priority: "",
    subject: "",
    description: "",
    assignedTo: "",
  };

  // Fetch customers and staff for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate API calls - replace with actual API calls
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

        const mockStaff = [
          { id: "STAFF-001", name: "Tigist Hailu", role: "Customer Service" },
          { id: "STAFF-002", name: "Dawit Alemu", role: "Support Manager" },
          { id: "STAFF-003", name: "Henok Tadesse", role: "Customer Service" },
          { id: "STAFF-004", name: "Yohannes Desta", role: "Support Manager" },
          { id: "STAFF-005", name: "Marta Tadesse", role: "Customer Service" },
        ];

        setCustomers(mockCustomers);
        setStaff(mockStaff);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Fetch existing complaint data for editing
  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      const fetchComplaint = async () => {
        try {
          // Simulate API call - replace with actual API call
          const mockComplaint = {
            customerId: "CUST-001",
            orderId: "ORD-2024-001",
            type: "Delivery",
            priority: "High",
            subject: "Package delivered to wrong address",
            description:
              "The package was delivered to the wrong address and the customer is requesting immediate resolution.",
            assignedTo: "STAFF-001",
          };

          console.log("Fetched complaint:", mockComplaint);
        } catch (error) {
          console.error("Error fetching complaint:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchComplaint();
    }
  }, [isEditMode, id]);

  const handleSubmit = async () => {
    try {
      setStatus("submitting");
      setMessage(null);

      // const payload = {
      //   customerId: values.customerId,
      //   orderId: values.orderId,
      //   type: values.type,
      //   priority: values.priority,
      //   subject: values.subject,
      //   description: values.description,
      //   assignedTo: values.assignedTo,
      // };

      // const endpoint = isEditMode ? `/complaints/${id}` : "/complaints";
      // let response;
      if (isEditMode) {
        // response = await api.put(endpoint, payload);
      } else {
        // response = await api.post(endpoint, payload);
      }
      // const { success, message: responseMessage } = response.data;

      // if (success) {
      //   setStatus("success");
      //   setMessage(
      //     responseMessage ||
      //       `Complaint ${isEditMode ? "updated" : "created"} successfully!`
      //   );
      //   resetForm();
      //   setTimeout(() => {
      //     navigate("/customer/complaints");
      //   }, 2000);
      // } else {
      //   setStatus("error");
      //   setMessage(
      //     responseMessage ||
      //       `Failed to ${isEditMode ? "update" : "create"} complaint`
      //   );
      // }
    } catch (error) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      console.error("Complaint submission error:", error);
    } finally {
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={CreateComplaintSchema}
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
                  <IoWarning className="text-3xl text-red-500" />
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode ? "Edit Complaint" : "New Complaint"}
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
              {/* Customer & Order Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Customer & Order Information
                </h2>
                <div>
                  <Label className="mb-1">Customer *</Label>
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
                      <SelectValue placeholder="Select customer" />
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
                  <Label className="mb-1">Order ID *</Label>
                  <Field
                    as={Input}
                    name="orderId"
                    placeholder="e.g., ORD-2024-001"
                    className={`py-7 ${
                      errors.orderId && touched.orderId ? "border-red-500" : ""
                    }`}
                  />
                  {errors.orderId && touched.orderId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.orderId}
                    </p>
                  )}
                </div>
              </div>

              {/* Complaint Details */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Complaint Details</h2>
                <div>
                  <Label className="mb-1">Complaint Type *</Label>
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
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && touched.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Priority *</Label>
                  <Select
                    value={values.priority}
                    onValueChange={(val) => setFieldValue("priority", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.priority && touched.priority
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && touched.priority && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.priority}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Assigned To *</Label>
                  <Select
                    value={values.assignedTo}
                    onValueChange={(val) => setFieldValue("assignedTo", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.assignedTo && touched.assignedTo
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{member.name}</span>
                            <span className="text-sm text-gray-500">
                              {member.role}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assignedTo && touched.assignedTo && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.assignedTo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-6">
              {/* Complaint Description */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">
                  Complaint Description
                </h2>
                <div>
                  <Label className="mb-1">Subject *</Label>
                  <Field
                    as={Input}
                    name="subject"
                    placeholder="Brief summary of the complaint"
                    className={`py-7 ${
                      errors.subject && touched.subject ? "border-red-500" : ""
                    }`}
                  />
                  {errors.subject && touched.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Detailed Description *</Label>
                  <Field
                    as={Textarea}
                    name="description"
                    placeholder="Provide detailed information about the complaint, including what happened, when it occurred, and any relevant details..."
                    className={`py-4 min-h-[150px] ${
                      errors.description && touched.description
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.description && touched.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode ? "Update Complaint" : "Create Complaint"}
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
                  className={`flex-1 cursor-pointer bg-red-500 hover:bg-red-600 ${
                    status === "submitting"
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isEditMode ? "Updating..." : "Creating..."}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <IoAdd className="h-4 w-4" />
                      {isEditMode ? "Update Complaint" : "Create Complaint"}
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

export default CreateComplaint;
