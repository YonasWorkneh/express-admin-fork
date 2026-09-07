import { useState, useEffect, useMemo } from "react";
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
import {
  createCoupon,
  type CouponScope,
  type CouponRecord,
} from "../../../lib/api/payment";
import {
  useCoupons,
  useInvalidateCoupons,
  useUpdateCoupon,
} from "@/hooks/useCoupons";
import toast from "react-hot-toast";
import { IoArrowBack, IoAdd, IoSave } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import type { Customer, CustomerListResponse } from "@/types/types";
import { Spinner } from "@/utils/spinner";

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

type CouponFormValues = {
  creditAmount: string;
  maxOrders: string;
  dueDate: string;
  description: string;
  scope: CouponScope | "";
  userId: string;
  corporateId: string;
};

function dueDateForInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value.slice(0, 10);
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function mapCouponToFormValues(coupon: CouponRecord): CouponFormValues {
  const isCorporate = Boolean(coupon.corporateId || coupon.corporate);
  return {
    creditAmount: String(coupon.creditAmount ?? ""),
    maxOrders: String(coupon.maxOrders ?? ""),
    dueDate: dueDateForInput(coupon.dueDate),
    description: coupon.description ?? "",
    scope: isCorporate ? "CORPORATE" : "INDIVIDUAL",
    userId: coupon.userId ?? coupon.user?.id ?? "",
    corporateId: coupon.corporateId ?? coupon.corporate?.id ?? "",
  };
}

const emptyFormValues: CouponFormValues = {
  creditAmount: "",
  maxOrders: "",
  dueDate: "",
  description: "",
  scope: "",
  userId: "",
  corporateId: "",
};

const AddCoupon = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersError, setCustomersError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const isEdit = Boolean(editId?.trim());
  const invalidateCoupons = useInvalidateCoupons();
  const updateCouponMutation = useUpdateCoupon();
  const {
    data: coupons = [],
    isLoading: loadingCoupons,
    isError: couponsLoadError,
  } = useCoupons();

  const editingCoupon = useMemo(() => {
    if (!isEdit || !editId) return undefined;
    return coupons.find((c) => c.id === editId);
  }, [coupons, editId, isEdit]);

  const initialValues = useMemo(() => {
    if (editingCoupon) return mapCouponToFormValues(editingCoupon);
    return emptyFormValues;
  }, [editingCoupon]);

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
    values: CouponFormValues,
    { resetForm }: { resetForm: () => void },
  ) => {
    const payload = {
      creditAmount: Number(values.creditAmount),
      maxOrders: Number(values.maxOrders),
      dueDate: values.dueDate,
      description: values.description.trim() || undefined,
      ...(values.scope === "INDIVIDUAL"
        ? { userId: values.userId }
        : { corporateId: values.corporateId }),
    };

    try {
      setSubmitting(true);
      if (isEdit && editId) {
        const coupon = await updateCouponMutation.mutateAsync({
          id: editId,
          input: payload,
        });
        toast.success(
          coupon.code
            ? `Coupon ${coupon.code} updated successfully.`
            : "Coupon updated successfully.",
        );
        invalidateCoupons();
        navigate("/customer/loyalty");
        return;
      }

      const coupon = await createCoupon(payload);
      toast.success(
        coupon.code
          ? `Coupon ${coupon.code} created successfully.`
          : "Coupon created successfully.",
      );
      invalidateCoupons();
      resetForm();
      navigate("/customer/loyalty");
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : isEdit
            ? "Could not update the coupon."
            : "Could not create the coupon.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loadingCoupons) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center gap-2 text-gray-600">
        <Spinner className="h-6 w-6 text-[#EE1E21]" />
        Loading coupon…
      </div>
    );
  }

  if (isEdit && (couponsLoadError || !editingCoupon)) {
    return (
      <div className="max-w-4xl p-6 bg-white space-y-4">
        <p className="text-red-600">Could not load this coupon.</p>
        <Button
          type="button"
          onClick={() => navigate("/customer/loyalty")}
          className="!w-auto cursor-pointer"
        >
          Back to Credit Program
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 bg-white">
      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={AddCouponSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <Form>
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
                    {isEdit ? "Edit Coupon" : "Add Coupon"}
                  </h1>
                </div>
              </div>
              {isEdit && editingCoupon?.code ? (
                <p className="text-center text-sm text-gray-500 -mt-4 mb-6 font-mono">
                  {editingCoupon.code}
                </p>
              ) : null}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                      errors.dueDate && touched.dueDate ? "border-red-500" : ""
                    }`}
                  />
                  {errors.dueDate && touched.dueDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.dueDate}
                    </p>
                  )}
                </div>
              </div>

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
                      <span>
                        {isEdit ? "Updating coupon..." : "Creating coupon..."}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isEdit ? (
                        <IoSave className="h-4 w-4" />
                      ) : (
                        <IoAdd className="h-4 w-4" />
                      )}
                      {isEdit ? "Save changes" : "Add Coupon"}
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
