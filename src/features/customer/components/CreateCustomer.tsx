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
import { CustomerSchema } from "../schemas/CustomerSchema";
import { IoArrowBack, IoPersonAdd, IoBusiness } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import type { RoleWithPermissionsListResponse } from "@/types/types";

const CreateCustomer = () => {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerRoleId, setCustomerRoleId] = useState("");
  const [loadingRole, setLoadingRole] = useState(false);

  const initialValues = {
    name: "",
    email: "",
    phone: "",
    role: customerRoleId,
    customerType: "",
    companyName: "",
    taxId: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
  };

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
console.log(setMessage,setStatus)

  // Fetch the CUSTOMER role id — sent as the role for every new customer
  useEffect(() => {
    const fetchCustomerRole = async () => {
      try {
        setLoadingRole(true);
        const response = await api.get<RoleWithPermissionsListResponse>(
          "/access-control/roles?page=1&pageSize=100",
        );
        const customerRole =
          response.data.data.find(
            (role) => role.name.toUpperCase() === "CUSTOMER",
          ) ??
          response.data.data.find(
            (role) =>
              role.name.toLowerCase().includes("customer") &&
              !role.name.toLowerCase().includes("manager"),
          );
        if (customerRole) {
          setCustomerRoleId(customerRole.id);
        } else {
          toast.error("Customer role not found. Please contact administrator.");
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message || "Failed to load roles.";
        toast.error(message);
      } finally {
        setLoadingRole(false);
      }
    };

    fetchCustomerRole();
  }, []);

  // Fetch customer data if in edit mode
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!isEditMode) return;

      // setLoading(true);
      // try {
      //   // const response = await api.get(`/customer/${id}`);
      //   // const { success, data } = response.data;

      //   if (success && data) {
      //     setInitialValues({
      //       name: data.name || "",
      //       email: data.email || "",
      //       phone: data.phone || "",
      //       type: data.type || "",
      //       address: data.address || "",
      //       city: data.city || "",
      //       notes: data.notes || "",
      //       companyName: data.companyName || "",
      //       contactPerson: data.contactPerson || "",
      //       contractNumber: data.contractNumber || "",
      //       creditLimit: data.creditLimit?.toString() || "",
      //       paymentTerms: data.paymentTerms || "",
      //       preferredLanguage: data.preferredLanguage || "",
      //       communicationPreference: data.communicationPreference || "",
      //       marketingOptIn: data.marketingOptIn || false,
      //     });
      //   }
      // } catch (error) {
      //   console.error("Error fetching customer data:", error);
      //   setMessage("Failed to load customer data");
      //   setStatus("error");
      // } finally {
      //   setLoading(false);
      // }
    };

    fetchCustomerData();
  }, [id, isEditMode]);

  const handleSubmit = async (value:any) =>{
    // values: typeof initialValues,
    // { resetForm }: { resetForm: () => void }
    console.log(initialValues, value);
    try {
      setLoading(true);
      const data = {...value}
      // if(data?.email){
      //   data.password = data.email?.split("@")[0]+"@2026"
      // }
      if( value.customerType !== "CORPORATE"  ){
                     delete data.contactEmail
                     delete data.contactPhone

      }
      const res = await api.post("/users/customer",data);
      toast.success(res.data?.message);
navigate("/customer")
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
            <p className="text-gray-500">Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={CustomerSchema}
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
                  {values.customerType === "CORPORATE" ? (
                    <IoBusiness className="text-3xl text-purple-500" />
                  ) : (
                    <IoPersonAdd className="text-3xl text-[#EE1E21]" />
                  )}
                  <h1 className="text-3xl font-medium text-gray-700">
                    {isEditMode ? "Edit Customer" : "Add New Customer"}
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
              {/* Basic Information */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Basic Information</h2>
                <div>
                  <Label className="mb-1">Customer Type *</Label>
                  <Select
                    value={values.customerType}
                    onValueChange={(val) => setFieldValue("customerType", val)}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.customerType && touched.customerType ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.customerType && touched.customerType && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerType}</p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Full Name *</Label>
                  <Field
                    as={Input}
                    name="name"
                    placeholder="Enter customer full name"
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
                    placeholder="customer@email.com"
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
                
              </div>

            </div>

            {/* Corporate Information - Only show for Corporate type */}
            {values.customerType === "CORPORATE" && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
                <h2 className="text-lg font-medium mb-4">
                  Corporate Information
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1">Company Name *</Label>
                    <Field
                      as={Input}
                      name="companyName"
                      placeholder="Enter company name"
                      className={`py-7 ${
                        errors.companyName && touched.companyName
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors.companyName && touched.companyName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.companyName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1">Contact Person *</Label>
                    <Field
                      as={Input}
                      name="contactPerson"
                      placeholder="Enter contact person name"
                      className={`py-7 ${
                        errors.contactPerson && touched.contactPerson
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    {errors.contactPerson && touched.contactPerson && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.contactPerson}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-1">Phone Number</Label>
                    <Field
                      as={Input}
                      name="contactPhone"
                      placeholder="Enter phone number"
                      className="py-7"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Email</Label>
                    <Field
                      as={Input}
                      name="contactEmail"
                      placeholder="Enter email"
                      className="py-7"
                    />
                  </div>
                 <div>
                    <Label className="mb-1">TIN</Label>
                    <Field
                      as={Input}
                      name="taxId"
                      placeholder="Enter TIN"
                      className="py-7"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Notes</Label>
                    <Field
                      as={Textarea}
                      name="notes"
                      placeholder="Enter contract number"
                      className="py-7"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {/* <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
              <h2 className="text-lg font-medium mb-4">
                Additional Information
              </h2>
              <div>
                <Label className="mb-1">Notes</Label>
                <Field
                  as={Textarea}
                  name="notes"
                  placeholder="Additional notes about this customer..."
                  className="py-4 min-h-[100px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Field
                  as={Checkbox}
                  name="marketingOptIn"
                  id="marketingOptIn"
                />
                <Label htmlFor="marketingOptIn" className="text-sm">
                  Customer has opted in for marketing communications
                </Label>
              </div>
            </div> */}

            {/* Action buttons */}
            <div className="bg-gray-50 p-6 rounded-lg mt-6 space-y-4">
              <h2 className="text-lg font-medium mb-4">
                {isEditMode
                  ? "Update Customer Information"
                  : "Complete Customer Registration"}
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
                  disabled={status === "submitting" || loadingRole}
                  className={`flex-1 cursor-pointer hover:bg-[#cc1a1c] ${
                    status === "submitting" || loadingRole
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {status === "submitting" ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {isEditMode
                          ? "Updating Customer..."
                          : "Creating Customer..."}
                      </span>
                    </span>
                  ) : isEditMode ? (
                    "Update Customer"
                  ) : (
                    "Create Customer"
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

export default CreateCustomer;
