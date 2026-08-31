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
import api from "../../../lib/api/api";
import { createCoupon, type CouponScope } from "../../../lib/api/payment";
import toast from "react-hot-toast";
import { IoArrowBack, IoAdd } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import type { Customer, CustomerListResponse } from "@/types/types";

const AddCouponSchema = Yup.object().shape({
  creditAmount: Yup.number()
    .required("Credit amount is required")
    .min(1, "Credit amount must be greater than 0"),
  maxOrders: Yup.number()
    .required("Max orders is required")
    .min(1, "Max orders must be at least 1"),
  dueDate: Yup.string().required("Due date is required"),
  description: Yup.string().notRequired(),
  scope: Yup.string().required("Scope is required"),
  userId: Yup.string().when("scope", {
    is: "INDIVIDUAL",
    then: (schema) => schema.required("Select a customer"),
    otherwise: (schema) => schema.notRequired(),
  }),
  corporateId: Yup.string().when("scope", {
    is: "CORPORATE",
    then: (schema) => schema.required("Select a corporate client"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const AddCoupon = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const initialValues = {
    creditAmount: "",
    maxOrders: "",
    dueDate: "",
    description: "",
    scope: "" as CouponScope | "",
    userId: "",
    corporateId: "",
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomersError(false);
        const res = await api.get<CustomerListResponse>(
          "/users/customers?search=all:&page=1&pageSize=200&filter=",
        );
        setCustomers(res.data.data || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        setCustomersError(true);
        toast.error("Could not load customers.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const individualCustomers = customers.filter(
    (c) => c.customerType !== "CORPORATE",
  );
  const corporateCustomers = customers.filter(
    (c) => c.customerType === "CORPORATE",
  );

  const handleSubmit = async (
    values: typeof initialValues,
    { resetForm }: { resetForm: () => void },
  ) => {
    try {
      setSubmitting(true);
      const coupon = await createCoupon({
        creditAmount: Number(values.creditAmount),
        maxOrders: Number(values.maxOrders),
        dueDate: values.dueDate,
        description: values.description.trim() || undefined,
        ...(values.scope === "INDIVIDUAL"
          ? { userId: values.userId }
          : { corporateId: values.corporateId }),
      });
      toast.success(
        coupon.code
          ? `Coupon ${coupon.code} created successfully.`
          : "Coupon created successfully.",
      );
      resetForm();
      navigate("/customer/loyalty");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Could not create the coupon.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        validationSchema={AddCouponSchema}
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
                  <h1 className="text-3xl font-medium text-gray-700">
                    Add Coupon
                  </h1>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Credit & Validity */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Credit & Validity</h2>
                <div>
                  <Label className="mb-1">Credit amount *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="creditAmount"
                    placeholder="e.g. 10000"
                    className={`py-7 ${
                      errors.creditAmount && touched.creditAmount
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total credit value (in ETB) this coupon carries.
                  </p>
                  {errors.creditAmount && touched.creditAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.creditAmount}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Max orders *</Label>
                  <Field
                    as={Input}
                    type="number"
                    name="maxOrders"
                    placeholder="e.g. 50"
                    className={`py-7 ${
                      errors.maxOrders && touched.maxOrders
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of orders this coupon can be applied to.
                  </p>
                  {errors.maxOrders && touched.maxOrders && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.maxOrders}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1">Due date *</Label>
                  <Field
                    as={Input}
                    type="date"
                    name="dueDate"
                    className={`py-7 ${
                      errors.dueDate && touched.dueDate
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.dueDate && touched.dueDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Audience & Details */}
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium mb-4">Audience & Details</h2>
                <div>
                  <Label className="mb-1">Scope *</Label>
                  <Select
                    value={values.scope}
                    onValueChange={(val) => {
                      setFieldValue("scope", val);
                      setFieldValue("userId", "");
                      setFieldValue("corporateId", "");
                    }}
                  >
                    <SelectTrigger
                      className={`py-7 !w-full ${
                        errors.scope && touched.scope ? "border-red-500" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.scope && touched.scope && (
                    <p className="text-red-500 text-sm mt-1">{errors.scope}</p>
                  )}
                </div>

                {values.scope === "INDIVIDUAL" && (
                  <div>
                    <Label className="mb-1">Customer *</Label>
                    <Select
                      value={values.userId}
                      onValueChange={(val) => setFieldValue("userId", val)}
                    >
                      <SelectTrigger
                        className={`py-7 !w-full ${
                          errors.userId && touched.userId
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingCustomers
                              ? "Loading customers..."
                              : customersError
                                ? "Could not load customers"
                                : "Choose customer"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCustomers ? (
                          <div className="py-2 px-4 text-gray-500">
                            Loading customers...
                          </div>
                        ) : customersError ? (
                          <div className="py-2 px-4 text-red-500">
                            Could not load customers.
                          </div>
                        ) : individualCustomers.length === 0 ? (
                          <div className="py-2 px-4 text-gray-500">
                            No customers found.
                          </div>
                        ) : (
                          individualCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {customer.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {customer.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.userId && touched.userId && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.userId}
                      </p>
                    )}
                  </div>
                )}

                {values.scope === "CORPORATE" && (
                  <div>
                    <Label className="mb-1">Corporate client *</Label>
                    <Select
                      value={values.corporateId}
                      onValueChange={(val) => setFieldValue("corporateId", val)}
                    >
                      <SelectTrigger
                        className={`py-7 !w-full ${
                          errors.corporateId && touched.corporateId
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingCustomers
                              ? "Loading corporate clients..."
                              : customersError
                                ? "Could not load corporate clients"
                                : "Choose corporate client"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCustomers ? (
                          <div className="py-2 px-4 text-gray-500">
                            Loading corporate clients...
                          </div>
                        ) : customersError ? (
                          <div className="py-2 px-4 text-red-500">
                            Could not load corporate clients.
                          </div>
                        ) : corporateCustomers.length === 0 ? (
                          <div className="py-2 px-4 text-gray-500">
                            No corporate clients found.
                          </div>
                        ) : (
                          corporateCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {customer.companyName || customer.name}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {customer.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.corporateId && touched.corporateId && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.corporateId}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="mb-1">Description</Label>
                  <Field
                    as={Textarea}
                    name="description"
                    placeholder="What is this coupon for?"
                    className={`py-4 min-h-[100px] ${
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
              <h2 className="text-lg font-medium mb-4">Complete Coupon</h2>

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
                  disabled={submitting}
                  className={`flex-1 cursor-pointer bg-primary ${
                    submitting
                      ? "disabled:opacity-70 disabled:cursor-not-allowed"
                      : ""
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating coupon...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <IoAdd className="h-4 w-4" />
                      Add Coupon
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

export default AddCoupon;
