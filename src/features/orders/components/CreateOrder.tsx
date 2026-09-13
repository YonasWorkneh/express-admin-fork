"use client";

import { Formik, Form, Field } from "formik";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Button from "@/components/common/Button";
import MapAddressSelector from "@/components/common/MapAddressSelector";
import SuccessModal from "@/components/common/SuccessModal";
import { useAuthState } from "@/hooks/useAuthState";
import {
  IoCall,
  IoLocationSharp,
  IoMailOutline,
  IoCubeOutline,
} from "react-icons/io5";
import {
  COMPANY_ADDRESS,
  COMPANY_LOGO_SRC,
  COMPANY_NAME,
  COMPANY_PHONE,
} from "@/constants/company";
import {
  MdAccountBalance,
  MdAttachMoney,
  MdLocalShipping,
  MdCreditCard,
  MdOutlineReceiptLong,
} from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Yup from "yup";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type { Branch, BranchListResponse } from "@/types/types";
import { Spinner } from "@/utils/spinner";
import { ConfigProvider, Select as Style2 } from "antd";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useOrderItemCategories } from "@/hooks/useOrderItemCategories";
import { mapOrderCategoryLinesToForm } from "@/utils/orderCategories";
import { useFleetVehicleTypesForServiceTypeQuery } from "@/hooks/useDriverCommissionConfig";
import type { FleetVehicleTypeListItem } from "@/lib/api/fleet";
import { VehicleTypeThumbnail } from "@/lib/vehicleTypeVisual";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-picker";
import { fetchOrderById } from "@/lib/api/orders";
import { createPayment, validateCoupon, type CreatePaymentInput } from "@/lib/api/payment";
import type { OrderDetailApi } from "@/types/orderDetail";
import { format } from "date-fns";

// import { useOrders } from "@/hooks/useOrders"; // custom hook

function isoToDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

const ETHIO_COUNTRY_CODE = "+251";
const phoneRegex = /^\+251[79]\d{8}$/;

/** Only digits; first digit must be 7 or 9; max 9 digits total. */
function normalizeEthioMobileLocalInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let out = "";
  for (let i = 0; i < digits.length && out.length < 9; i++) {
    const ch = digits[i]!;
    if (out.length === 0) {
      if (ch === "7" || ch === "9") out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}

function createEmptyFormValues() {
  return {
    serviceTypeId: "",
    fulfillmentType: "DROPOFF",
    name: "",
    email: "",
    phone: ETHIO_COUNTRY_CODE,
    weight: 0,
    categoryIds: [] as string[],
    /** Per-category quantity, keyed by categoryId — one entry per selected category. */
    categoryQuantities: {} as Record<string, number>,
    isFragile: false,
    shipmentType: "",
    shippingScope: "",
    length: 0,
    width: 0,
    height: 0,
    pickupAddress: "",
    pickupLatitude: 0,
    pickupLongitude: 0,
    cost: 0,
    senderEntity: "",
    isUnusual: false,
    destination: "",
    unusualReason: "",
    receiverName: "",
    receiverEmail: "",
    receiverPhone: ETHIO_COUNTRY_CODE,
    receiverAddress: "",
    receiverLatitude: 0,
    receiverLongitude: 0,
    pickupDate: "",
    deliveryDate: "",
    branchId: "",
    branchSearch: "",
    originCity: "",
    destinationCity: "",
    selectedVehicleTypeId: "",
    sessionId: "",
    vehicleTypeIds: [] as string[],
    validatedNotes: "",
    finalPrice: 0,
    paymentType: "",
    // Cash
    receiptNumber: "",
    // Bank transfer
    bankName: "",
    referenceNumber: "",
    accountName: "",
    accountNumber: "",
    depositedAt: "",
    // Check
    checkNumber: "",
    checkIssueDate: "",
    checkDueDate: "",
    payerName: "",
    // Credit
    couponCode: "",
    couponValidated: false,
  };
}

type DevPrefillOptions = {
  serviceTypeId?: string;
  categoryIds?: string[];
  branchId?: string;
  branchSearch?: string;
};

/** Dev-only: sensible sample values for every create-order field except emails. */
function createDevPrefillFormValues(options: DevPrefillOptions = {}) {
  const base = createEmptyFormValues();
  const now = new Date();
  const pickup = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const delivery = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const categoryIds = options.categoryIds ?? [];
  const categoryQuantities = Object.fromEntries(
    categoryIds.map((id, index) => [id, index === 0 ? 2 : 1]),
  );

  return {
    ...base,
    serviceTypeId: options.serviceTypeId ?? "",
    fulfillmentType: "DROPOFF",
    name: "Abebe Kebede",
    email: "",
    phone: `${ETHIO_COUNTRY_CODE}911234567`,
    weight: 2.5,
    categoryIds,
    categoryQuantities,
    isFragile: true,
    shipmentType: "PARCEL",
    shippingScope: "TOWN",
    length: 30,
    width: 20,
    height: 15,
    pickupAddress: "Bole Road, near Edna Mall, Addis Ababa",
    pickupLatitude: 8.9806,
    pickupLongitude: 38.7578,
    cost: 0,
    senderEntity: "",
    isUnusual: false,
    destination: "TOWN",
    unusualReason: "",
    receiverName: "Sara Hailu",
    receiverEmail: "",
    receiverPhone: `${ETHIO_COUNTRY_CODE}922345678`,
    receiverAddress: "CMC Michael, near Friendship Business Center, Addis Ababa",
    receiverLatitude: 9.0227,
    receiverLongitude: 38.7469,
    pickupDate: format(pickup, "yyyy-MM-dd'T'HH:mm"),
    deliveryDate: format(delivery, "yyyy-MM-dd'T'HH:mm"),
    branchId: options.branchId ?? "",
    branchSearch: options.branchSearch ?? "",
    originCity: "Addis Ababa",
    destinationCity: "Addis Ababa",
    selectedVehicleTypeId: "",
    sessionId: "",
    vehicleTypeIds: [] as string[],
    validatedNotes: "Dev prefill — sample notes",
    finalPrice: 0,
    paymentType: "bank_transfer",
    receiptNumber: "RCPT-DEV-001",
    bankName: "Commercial Bank of Ethiopia",
    referenceNumber: "TRX-DEV-998877",
    accountName: "Abebe Kebede",
    accountNumber: "1000123456789",
    depositedAt: format(now, "yyyy-MM-dd'T'HH:mm"),
    checkNumber: "CHK-000451",
    checkIssueDate: format(now, "yyyy-MM-dd"),
    checkDueDate: format(delivery, "yyyy-MM-dd"),
    payerName: "Abebe Kebede",
    couponCode: "CRD-DEVTEST01",
    couponValidated: false,
  };
}

function mapOrderDetailToFormValues(o: OrderDetailApi) {
  const base = createEmptyFormValues();
  const st = o.serviceType;
  const serviceTypeId =
    typeof st === "object" && st && "id" in st ? (st as { id: string }).id : "";
  const lat = Number.parseFloat(String(o.deliveryAddress?.lat ?? 0)) || 0;
  const lng = Number.parseFloat(String(o.deliveryAddress?.long ?? 0)) || 0;
  const addrParts = [
    o.deliveryAddress?.addressLine,
    o.deliveryAddress?.landMark,
    o.deliveryAddress?.city,
  ].filter(Boolean);
  const vehicleTypeId = o.vehicleTypeId?.trim();
  const pickupLat = Number.parseFloat(String(o.pickupAddress?.lat ?? 0)) || 0;
  const pickupLng = Number.parseFloat(String(o.pickupAddress?.long ?? 0)) || 0;
  const pickupAddrParts = [
    o.pickupAddress?.addressLine,
    o.pickupAddress?.landMark,
    o.pickupAddress?.city,
  ].filter(Boolean);

  const { categoryIds, categoryQuantities } = mapOrderCategoryLinesToForm(o);

  return {
    ...base,
    serviceTypeId,
    fulfillmentType: (o.fulfillmentType as string) || "DROPOFF",
    receiverName: o.receiver?.name ?? "",
    receiverEmail: o.receiver?.email ?? "",
    receiverPhone: o.receiver?.phone || ETHIO_COUNTRY_CODE,
    receiverAddress: addrParts.join(", ") || "",
    receiverLatitude: lat,
    receiverLongitude: lng,
    pickupAddress: pickupAddrParts.join(", ") || "",
    pickupLatitude: pickupLat,
    pickupLongitude: pickupLng,
    weight: o.weight ?? 0,
    isFragile: Boolean(o.isFragile),
    isUnusual: Boolean(o.isUnusual),
    unusualReason: o.unusualReason ?? "",
    shipmentType: (o.shipmentType as string) ?? "",
    destination: String(o.shippingScope ?? "TOWN").toUpperCase(),
    categoryIds,
    categoryQuantities,
    length: o.length ?? 0,
    width: o.width ?? 0,
    height: o.height ?? 0,
    branchId: o.branch?.id ?? "",
    branchSearch: o.branch?.name ?? "",
    vehicleTypeIds: vehicleTypeId ? [vehicleTypeId] : [],
    validatedNotes: o.validatedNotes ?? o.notes ?? "",
    finalPrice: typeof o.finalPrice === "number" ? o.finalPrice : 0,
    pickupDate: isoToDatetimeLocal(o.pickupDate),
    deliveryDate: isoToDatetimeLocal(o.deliveryDate),
    name: o.customer?.name ?? "",
    email: o.customer?.email ?? "",
    phone: o.customer?.phone || ETHIO_COUNTRY_CODE,
    originCity: o.originCityRaw ?? "",
    destinationCity: o.destinationCityRaw ?? "",
    selectedVehicleTypeId: "",
    sessionId: "",
  };
}

const buildOrderValidationSchema = () =>
  Yup.object().shape({
    receiverName: Yup.string().required("Receiver name is required"),
    receiverEmail: Yup.string().email("Invalid email"),
    receiverPhone: Yup.string()
      .matches(
        phoneRegex,
        "Phone must be +251 followed by 9 digits, starting with 9 or 7",
      )
      .required("Receiver phone is required"),
    receiverAddress: Yup.string().required("Delivery address is required"),
    pickupAddress: Yup.string().when("fulfillmentType", {
      is: "PICKUP",
      then: (schema) => schema.required("Pickup address is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    serviceTypeId: Yup.string().required("Service type is required"),
    fulfillmentType: Yup.string().required("Fulfillment type is required"),
    weight: Yup.number()
      .min(0.1, "Weight must be greater than 0")
      .required("Weight is required"),
    destination: Yup.string().required("Destination is required"),
    unusualReason: Yup.string().when("isUnusual", {
      is: true,
      then: (schema) =>
        schema.required("Reason is required when item is marked unusual"),
      otherwise: (schema) => schema.notRequired(),
    }),
    vehicleTypeIds: Yup.array()
      .of(Yup.string())
      .when("fulfillmentType", {
        is: "PICKUP",
        then: (schema) => schema.min(1, "Select at least one vehicle type"),
        otherwise: (schema) => schema,
      }),
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email"),
    phone: Yup.string()
      .matches(
        phoneRegex,
        "Phone must be +251 followed by 9 digits, starting with 9 or 7",
      )
      .required("Phone is required"),
    paymentType: Yup.string().required("Select a payment method"),
    receiptNumber: Yup.string().when("paymentType", {
      is: "direct_cash",
      then: (schema) => schema.required("Receipt number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    bankName: Yup.string().when("paymentType", {
      is: (v: string) => v === "bank_transfer" || v === "check",
      then: (schema) => schema.required("Bank name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    referenceNumber: Yup.string().when("paymentType", {
      is: "bank_transfer",
      then: (schema) => schema.required("Reference number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    accountName: Yup.string().when("paymentType", {
      is: "bank_transfer",
      then: (schema) => schema.required("Account name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    accountNumber: Yup.string().when("paymentType", {
      is: "bank_transfer",
      then: (schema) => schema.required("Account number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    depositedAt: Yup.string().when("paymentType", {
      is: "bank_transfer",
      then: (schema) => schema.required("Deposit date is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    checkNumber: Yup.string().when("paymentType", {
      is: "check",
      then: (schema) => schema.required("Check number is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    checkIssueDate: Yup.string().when("paymentType", {
      is: "check",
      then: (schema) => schema.required("Check issue date is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    checkDueDate: Yup.string().when("paymentType", {
      is: "check",
      then: (schema) => schema.required("Check due date is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    payerName: Yup.string().when("paymentType", {
      is: "check",
      then: (schema) => schema.required("Payer name is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    couponCode: Yup.string().when("paymentType", {
      is: "credit",
      then: (schema) => schema.required("Coupon code is required"),
      otherwise: (schema) => schema.notRequired(),
    }),
    couponValidated: Yup.boolean().when("paymentType", {
      is: "credit",
      then: (schema) =>
        schema.oneOf([true], "Validate the coupon code before submitting"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

interface ConvertedShipment {
  name?: any;
  email?: any;
  phone?: any;
  receiverName: any;
  receiverEmail?: any;
  receiverPhone: any;
  serviceTypeId: any;
  fulfillmentType: any;
  weight: any;
  categories?: { categoryId: string; quantity: number }[];
  isFragile: any;
  shipmentType: any;
  shippingScope: any;

  isDelivery?: any;
  pickupAddress?: {
    lat: any;
    long: any;
  };

  deliveryAddress: {
    lat: any;
    long: any;
  };

  isUnusual: any;
  unusualReason: any;
  // cost: any;
  pickupDate?: any;
  deliveryDate?: any;
  branchId?: any;

  width?: any;
  height?: any;
  length?: any;

  // NEW FIELDS FOR INTERNATIONAL OR REGIONAL ORDERS ONLY
  originCity?: any;
  destinationCity?: any;
  selectedVehicleTypeId?: string;
  /** From pricing summary vehicle row — required with selected vehicle for submit. */
  sessionId?: string;
  vehicleTypeIds?: string[];

  // Payment — created via POST /payment before order creation, then payment details are echoed onto the order payload.
  paymentType?: string;
  payment?: CreatePaymentInput;
}

/** Input styling that reads clearly as an editable field inside a `FieldCell` */
const tableInputClass =
  "rounded-md border border-gray-500 bg-gray-50 shadow-none h-9 px-2.5 py-1.5 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 transition-colors hover:border-primary/50 hover:bg-white focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/20 focus-visible:ring-[3px]";
const tableTriggerClass =
  "rounded-md border border-gray-300 bg-gray-50 shadow-none h-9 px-2.5 py-1.5 !bg-gray-50 text-sm font-semibold text-gray-900 justify-between transition-colors hover:border-primary/50 hover:!bg-white data-[state=open]:border-primary data-[state=open]:!bg-white focus-visible:ring-primary/20 focus-visible:ring-[3px]";

/** A single waybill-style table cell: small uppercase label above a flush value/input */
function FieldCell({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("bg-white px-2 py-1", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 leading-tight mb-0.5">
        {label}
      </p>
      {children}
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}

/** Wraps `FieldCell`s in a bordered grid so shared 1px lines read as a table */
function FieldTable({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px bg-primary border border-primary rounded-lg overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PaymentMethodId =
  | "bank_transfer"
  | "direct_cash"
  | "cash_on_delivery"
  | "credit"
  | "check";

const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  icon: (className: string) => ReactNode;
}[] = [
  {
    id: "bank_transfer",
    label: "Direct bank transfer",
    icon: (c) => <MdAccountBalance className={cn(c, "text-[#EE1E21]")} />,
  },
  {
    id: "direct_cash",
    label: "Direct Cash",
    icon: (c) => <MdAttachMoney className={cn(c, "text-[#EE1E21]")} />,
  },
  {
    id: "cash_on_delivery",
    label: "Cash on Delivery",
    icon: (c) => <MdLocalShipping className={cn(c, "text-[#EE1E21]")} />,
  },
  {
    id: "credit",
    label: "Credit",
    icon: (c) => <MdCreditCard className={cn(c, "text-[#EE1E21]")} />,
  },
  {
    id: "check",
    label: "Check",
    icon: (c) => <MdOutlineReceiptLong className={cn(c, "text-[#EE1E21]")} />,
  },
];

/** Which extra form fields each payment method collects, beyond `paymentType`. */
const PAYMENT_DETAIL_FIELDS: Record<PaymentMethodId, string[]> = {
  direct_cash: ["receiptNumber"],
  bank_transfer: [
    "bankName",
    "referenceNumber",
    "accountName",
    "accountNumber",
    "depositedAt",
  ],
  check: [
    "bankName",
    "checkNumber",
    "checkIssueDate",
    "checkDueDate",
    "payerName",
  ],
  credit: ["couponCode"],
  cash_on_delivery: [],
};

/** One payment-detail input bound to Formik state, with inline error text. */
function PaymentField({
  name,
  label,
  placeholder,
  type = "text",
  errors,
  touched,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
}) {
  const error = errors[name];
  const isTouched = touched[name];
  return (
    <div>
      <Label className="mb-1 font-bold">{label}</Label>
      <Field
        as={Input}
        type={type}
        name={name}
        placeholder={placeholder}
        className={`py-7 ${error && isTouched ? "border-red-500" : ""}`}
      />
      {Boolean(error) && Boolean(isTouched) && (
        <p className="text-red-500 text-sm mt-1">{String(error)}</p>
      )}
    </div>
  );
}

function PaymentMethodSection({
  values,
  errors,
  touched,
  setFieldValue,
  setFieldTouched,
  amount,
  amountMissingMessage,
  userId,
}: {
  values: Record<string, unknown> & { paymentType: string };
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
  amount?: number;
  amountMissingMessage?: string;
  userId?: string;
}) {
  const paymentType = values.paymentType as PaymentMethodId | "";
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const couponCode = String(values.couponCode ?? "").trim();
  const couponValidated = Boolean(values.couponValidated);

  useEffect(() => {
    if (values.paymentType === "credit" && values.couponValidated) {
      setFieldValue("couponValidated", false);
    }
    // Re-validate required when order amount changes after a coupon was applied.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only amount should reset validation
  }, [amount]);

  const handleValidateCoupon = async () => {
    if (!couponCode) {
      setFieldTouched("couponCode", true);
      toast.error("Enter a coupon code first.");
      return;
    }
    if (amount === undefined || !Number.isFinite(amount) || amount <= 0) {
      toast.error(
        amountMissingMessage ||
          "Estimate the order first so the coupon amount is known.",
      );
      return;
    }
    if (!userId?.trim()) {
      toast.error("You must be signed in to validate a coupon.");
      return;
    }
    try {
      setValidatingCoupon(true);
      setFieldValue("couponValidated", false);
      const result = await validateCoupon({
        code: couponCode,
        amount,
        userId,
      });
      if (!result.valid) {
        toast.error(
          result.reason || "Coupon is not valid for this order.",
        );
        setFieldValue("couponValidated", false);
        return;
      }
      setFieldValue("couponValidated", true);
      setFieldTouched("couponValidated", true);
      toast.success(
        result.reason || result.message || "Coupon validated successfully.",
      );
    } catch (error: unknown) {
      setFieldValue("couponValidated", false);
      const msg =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null;
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Could not validate coupon.",
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  return (
    <div className="space-y-4 pt-2 border-t border-primary">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Payment method</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Choose how the customer will pay for this order.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const selected = paymentType === method.id;
          const showError =
            !selected &&
            Boolean(errors.paymentType) &&
            Boolean(touched.paymentType);
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setFieldValue("paymentType", method.id);
                setFieldTouched("paymentType", true);
                setFieldValue("couponValidated", false);
                const keep = new Set(PAYMENT_DETAIL_FIELDS[method.id]);
                Object.values(PAYMENT_DETAIL_FIELDS)
                  .flat()
                  .forEach((field) => {
                    if (!keep.has(field)) setFieldValue(field, "");
                  });
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors cursor-pointer",
                selected
                  ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                  : showError
                    ? "border-red-500 bg-white"
                    : "border-primary bg-white hover:border-primary/40",
              )}
            >
              {method.icon("h-10 w-auto max-w-[100px] shrink-0")}
              <span className="text-sm font-medium text-gray-900">
                {method.label}
              </span>
            </button>
          );
        })}
      </div>

      {paymentType === "direct_cash" && (
        <div className="rounded-lg border border-primary bg-white p-4 space-y-3">
          <PaymentField
            name="receiptNumber"
            label="Receipt number"
            placeholder="e.g. RCP-00123"
            errors={errors}
            touched={touched}
          />
        </div>
      )}

      {paymentType === "bank_transfer" && (
        <div className="rounded-lg border border-primary bg-white p-4 space-y-3">
          <PaymentField
            name="bankName"
            label="Bank name"
            placeholder="e.g. Commercial Bank of Ethiopia"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="referenceNumber"
            label="Reference number"
            placeholder="e.g. TXN-2026-98765"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="accountName"
            label="Account name"
            placeholder="e.g. Hana Tadesse"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="accountNumber"
            label="Account number"
            placeholder="e.g. ****4567"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="depositedAt"
            label="Deposited at"
            type="datetime-local"
            errors={errors}
            touched={touched}
          />
        </div>
      )}

      {paymentType === "check" && (
        <div className="rounded-lg border border-primary bg-white p-4 space-y-3">
          <PaymentField
            name="bankName"
            label="Bank name"
            placeholder="e.g. Dashen Bank"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="checkNumber"
            label="Check number"
            placeholder="e.g. CHK-000451"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="checkIssueDate"
            label="Check issue date"
            type="date"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="checkDueDate"
            label="Check due date"
            type="date"
            errors={errors}
            touched={touched}
          />
          <PaymentField
            name="payerName"
            label="Payer name"
            placeholder="e.g. Meron Alemayehu"
            errors={errors}
            touched={touched}
          />
        </div>
      )}

      {paymentType === "credit" && (
        <div className="rounded-lg border border-primary bg-white p-4 space-y-3">
          <div>
            <Label className="mb-1 font-bold">Coupon code</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                name="couponCode"
                placeholder="e.g. CRD-X7K9M2P4"
                value={String(values.couponCode ?? "")}
                className={`py-7 flex-1 ${
                  errors.couponCode && touched.couponCode ? "border-red-500" : ""
                }`}
                onChange={(e) => {
                  setFieldValue("couponCode", e.target.value);
                  setFieldValue("couponValidated", false);
                }}
                onBlur={() => setFieldTouched("couponCode", true)}
              />
              <button
                type="button"
                disabled={validatingCoupon}
                onClick={() => void handleValidateCoupon()}
                className="shrink-0 rounded-lg bg-[#EE1E21] px-4 py-3 text-sm font-medium text-[#FADF4B] hover:bg-[#cc1a1c] disabled:opacity-60 cursor-pointer"
              >
                {validatingCoupon ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4 text-[#FADF4B]" />
                    Validating…
                  </span>
                ) : (
                  "Use code"
                )}
              </button>
            </div>
            {Boolean(errors.couponCode) && Boolean(touched.couponCode) && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.couponCode)}
              </p>
            )}
            {couponValidated && (
              <p className="text-green-700 text-sm mt-1">
                Coupon validated for this order amount.
              </p>
            )}
            {Boolean(errors.couponValidated) &&
              Boolean(touched.couponValidated) &&
              !couponValidated && (
                <p className="text-red-500 text-sm mt-1">
                  {String(errors.couponValidated)}
                </p>
              )}
          </div>
        </div>
      )}

      {paymentType === "cash_on_delivery" && (
        <div className="rounded-lg border border-primary bg-white p-4 text-sm text-gray-600">
          The full amount will be collected from the receiver on delivery.
        </div>
      )}

      {Boolean(touched.paymentType) && !values.paymentType && (
        <p className="text-red-500 text-sm">Select a payment method.</p>
      )}
    </div>
  );
}

interface OrderSummaryBreakdown {
  categoryId?: string;
  qty?: number;
  actualWeight?: number;
  chargeableWeight?: number;
  basePrice?: number;
  distance?: number;
}

interface OrderSummaryVehicle {
  sessionId?: string;
  vehicleTypeId: string;
  vehicleName?: string;
  imageUrl?: string | null;
  type?: string;
  commission?: number;
  totalPrice?: number;
}

interface OrderSummaryData {
  breakdown: OrderSummaryBreakdown | null;
  vehicles: OrderSummaryVehicle[];
  currency?: string;
}

/** Response shape from `POST /pricing/order/summary` (accept drop-off verify). */
export interface PricingVehicleLine {
  commission?: number;
  imageUrl: string | null;
  iconUrl?: string | null;
  profit?: number;
  sessionId: string;
  totalPrice: number;
  type?: string;
  vat?: number;
  vehicleName: string;
  vehicleTypeId: string;
}

export interface PricingData {
  baseFee: number;
  distanceKm: number;
  sessionId: string;
  vehicles: PricingVehicleLine[];
}

export interface PricingResponse {
  success: boolean;
  message: string;
  data: PricingData;
}

/** API may return `PricingData` and/or legacy `breakdown` / `currency` fields */
type PricingSummaryApiData = Partial<PricingData> & {
  breakdown?: OrderSummaryBreakdown;
  currency?: string;
  result?: { currency?: string };
  vehicles?: unknown[];
};

function applySenderToShipmentPayload(
  converted: ConvertedShipment,
  values: {
    name?: string;
    email?: string;
    phone?: string;
  },
) {
  converted.name = String(values.name ?? "").trim();
  if (values.email) converted.email = String(values.email ?? "").trim();
  converted.phone = String(values.phone ?? "").trim();
}

/** Builds the `categories` array (categoryId + per-category quantity) shared by the pricing estimate and order-create payloads. */
function buildCategoriesPayload(
  _values: any,
): { categoryId: string; quantity: number }[] {
  const ids: string[] = Array.from(
    new Set(
      (Array.isArray(_values.categoryIds) ? _values.categoryIds : [])
        .map((id: unknown) => String(id ?? "").trim())
        .filter(Boolean) as string[],
    ),
  );
  const quantities = _values.categoryQuantities || {};
  return ids.map((categoryId) => ({
    categoryId,
    quantity: Number(quantities[categoryId]) || 1,
  }));
}

/** Include parcel dimensions only when > 0 so zeros are omitted from the payload. */
function applyParcelDimensions(
  converted: ConvertedShipment,
  values: {
    shipmentType?: string;
    width?: unknown;
    height?: unknown;
    length?: unknown;
  },
) {
  if (values.shipmentType !== "PARCEL") return;
  const width = Number(values.width);
  const height = Number(values.height);
  const length = Number(values.length);
  if (Number.isFinite(width) && width > 0) converted.width = width;
  if (Number.isFinite(height) && height > 0) converted.height = height;
  if (Number.isFinite(length) && length > 0) converted.length = length;
}

/** Builds the API shipment payload from form values; shared so edit-mode can diff against the originally loaded values. */
function buildConvertedShipment(
  _values: any,
  isGeneralEdit: boolean,
): ConvertedShipment {
  const isPickupSubmit = _values.fulfillmentType === "PICKUP";
  const converted: ConvertedShipment = {
    receiverName: _values.receiverName,

    receiverPhone: _values.receiverPhone,

    serviceTypeId: _values.serviceTypeId,
    fulfillmentType: _values.fulfillmentType,
    isDelivery: isPickupSubmit,

    weight: _values.weight,
    isFragile: _values.isFragile,
    shipmentType: _values.shipmentType,
    shippingScope: _values.destination,

    deliveryAddress: {
      lat: String(_values.receiverLatitude),
      long: String(_values.receiverLongitude),
    },

    isUnusual: _values.isUnusual,
    unusualReason: _values.unusualReason,

    deliveryDate: _values.deliveryDate
      ? new Date(_values.deliveryDate).toISOString()
      : undefined,
    vehicleTypeIds: [...(_values.vehicleTypeIds || [])],
  };

  if (!isGeneralEdit) {
    converted.selectedVehicleTypeId = _values.selectedVehicleTypeId;
    converted.sessionId = _values.sessionId?.trim();
  }
  if (_values.receiverEmail != "")
    converted.receiverEmail = _values.receiverEmail;

  if (_values.fulfillmentType === "PICKUP") {
    converted.pickupAddress = {
      lat: String(_values.pickupLatitude),
      long: String(_values.pickupLongitude),
    };
    if (_values.pickupDate) {
      converted.pickupDate = new Date(_values.pickupDate).toISOString();
    }
  }

  if (
    _values.destination === "REGIONAL" ||
    _values.destination === "INTERNATIONAL"
  ) {
    converted.originCity = _values.originCity;
    converted.destinationCity = _values.destinationCity;
  }

  const branchIdTrim = String(_values.branchId ?? "").trim();
  if (branchIdTrim) {
    converted.branchId = branchIdTrim;
  }

  applySenderToShipmentPayload(converted, _values);

  const categories = buildCategoriesPayload(_values);
  if (categories.length > 0) {
    converted.categories = categories;
  }

  applyParcelDimensions(converted, _values);

  return converted;
}

/** Shallow key diff (deep-compared via JSON) between the submitted and originally loaded payload, so edit PATCHes only send what changed. */
function diffShipmentPayload(
  current: ConvertedShipment,
  original: ConvertedShipment,
): Partial<ConvertedShipment> {
  const changed: Partial<ConvertedShipment> = {};
  (Object.keys(current) as (keyof ConvertedShipment)[]).forEach((key) => {
    if (JSON.stringify(current[key]) !== JSON.stringify(original[key])) {
      (changed as Record<string, unknown>)[key] = current[key];
    }
  });
  return changed;
}

function formatOrderMoney(
  amount: number | undefined,
  currency?: string,
): string {
  if (amount === undefined || Number.isNaN(amount)) return "—";
  const c = currency?.trim();
  if (c && c.length === 3) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: c,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      /* invalid ISO code */
    }
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** For PICKUP, the price of the selected vehicle; otherwise the flat estimate for the order. */
function getOrderAmount(
  values: {
    fulfillmentType?: string;
    selectedVehicleTypeId?: string;
    sessionId?: string;
    finalPrice?: number;
  },
  summary: OrderSummaryData | null,
): number | undefined {
  if (!summary) return undefined;

  const selectedVehicle = summary.vehicles.find(
    (v) =>
      v.vehicleTypeId === values.selectedVehicleTypeId &&
      (v.sessionId?.trim() ?? "") === String(values.sessionId ?? "").trim(),
  );
  if (
    selectedVehicle?.totalPrice != null &&
    Number.isFinite(selectedVehicle.totalPrice) &&
    selectedVehicle.totalPrice > 0
  ) {
    return selectedVehicle.totalPrice;
  }

  if (values.fulfillmentType === "PICKUP") {
    // Estimate exists, but the user still needs to pick a priced vehicle option.
    return undefined;
  }

  const candidates = [
    summary.breakdown?.basePrice,
    summary.vehicles[0]?.totalPrice,
    typeof values.finalPrice === "number" ? values.finalPrice : undefined,
  ];
  for (const candidate of candidates) {
    if (candidate != null && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }
  return undefined;
}

function getCouponAmountMissingMessage(
  values: { fulfillmentType?: string; selectedVehicleTypeId?: string },
  summary: OrderSummaryData | null,
): string {
  if (!summary) {
    return "Estimate the order first so the coupon amount is known.";
  }
  if (
    values.fulfillmentType === "PICKUP" &&
    !String(values.selectedVehicleTypeId ?? "").trim()
  ) {
    return "Select a vehicle option first so the coupon amount is known.";
  }
  return "Could not determine the order amount for this coupon. Re-estimate the order and try again.";
}

/** Builds the POST /payment body for the chosen method from the payment-section form fields. */
function buildPaymentInput(
  paymentType: PaymentMethodId,
  amount: number,
  currency: string,
  values: Record<string, unknown>,
  receivedBy: { id: string; name: string } | null,
): CreatePaymentInput {
  const str = (key: string) => String(values[key] ?? "").trim();
  switch (paymentType) {
    case "direct_cash":
      return {
        method: "CASH",
        amount,
        currency,
        receivedById: receivedBy?.id ?? "",
        receivedByName: receivedBy?.name ?? "",
        receiptNumber: str("receiptNumber"),
      };
    case "bank_transfer":
      return {
        method: "BANK_TRANSFER",
        amount,
        currency,
        bankName: str("bankName"),
        referenceNumber: str("referenceNumber"),
        accountName: str("accountName"),
        accountNumber: str("accountNumber"),
        depositedAt: values.depositedAt
          ? new Date(String(values.depositedAt)).toISOString()
          : "",
      };
    case "check":
      return {
        method: "CHECK",
        amount,
        currency,
        bankName: str("bankName"),
        checkNumber: str("checkNumber"),
        checkIssueDate: str("checkIssueDate"),
        checkDueDate: str("checkDueDate"),
        payerName: str("payerName"),
      };
    case "credit":
      return {
        method: "CREDIT",
        amount,
        currency,
        couponCode: str("couponCode"),
      };
    case "cash_on_delivery":
      return {
        method: "CASH_ON_DELIVERY",
        amount,
        currency,
      };
  }
}

function VehicleTypeTile({
  vt,
  selected,
  onToggle,
}: {
  vt: FleetVehicleTypeListItem;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "border rounded-lg p-3 flex flex-col items-center gap-2 transition-colors text-center cursor-pointer",
        selected
          ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
          : "border-primary hover:border-primary/40 bg-white",
      )}
    >
      <VehicleTypeThumbnail
        vt={vt}
        imgClassName="max-h-14 max-w-14 object-contain"
      />
      <span className="text-xs font-medium text-gray-900 leading-tight line-clamp-2">
        {vt.name}
      </span>
    </button>
  );
}

function OrderVehicleTypesSection({
  serviceTypeId,
  vehicleTypeIds,
  isDropoffAcceptEdit,
  setFieldValue,
  setFieldTouched,
  vehicleTypeIdsError,
  vehicleTypeIdsTouched,
  className,
}: {
  serviceTypeId: string;
  vehicleTypeIds: string[];
  isDropoffAcceptEdit: boolean;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
  vehicleTypeIdsError: unknown;
  vehicleTypeIdsTouched: boolean;
  className?: string;
}) {
  const {
    data: fleetVehicleTypes = [],
    isLoading: loadingVehicleTypes,
    isError: vehicleTypesError,
  } = useFleetVehicleTypesForServiceTypeQuery(serviceTypeId);

  const trimmedServiceTypeId = serviceTypeId.trim();

  return (
    <div
      className={cn(
        "bg-gray-50 p-6 rounded-lg border border-primary shadow-sm mt-6 space-y-4",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-medium text-gray-900">Vehicle types</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isDropoffAcceptEdit
            ? "Optional — choose a vehicle type if needed for this drop-off."
            : "Choose suitable vehicle categories for this shipment (based on service type)."}
        </p>
      </div>

      <div>
        <Label className="mb-2 font-bold">
          Selection{isDropoffAcceptEdit ? "" : " *"}
        </Label>
        {!trimmedServiceTypeId && (
          <p className="text-sm text-amber-800 py-2">
            Select a service type above to load available vehicle categories.
          </p>
        )}
        {trimmedServiceTypeId && loadingVehicleTypes && (
          <div className="flex items-center gap-2 py-4 text-gray-600">
            <Spinner className="h-6 w-6 text-[#EE1E21]" />
            Loading vehicle types…
          </div>
        )}
        {trimmedServiceTypeId && vehicleTypesError && (
          <p className="text-red-600 text-sm py-2">
            Could not load vehicle types for this service.
          </p>
        )}
        {trimmedServiceTypeId &&
          !loadingVehicleTypes &&
          !vehicleTypesError &&
          fleetVehicleTypes.length === 0 && (
            <p className="text-amber-700 text-sm py-2">
              No vehicle types configured for this service type.
            </p>
          )}
        {trimmedServiceTypeId &&
          !loadingVehicleTypes &&
          fleetVehicleTypes.length > 0 && (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
              role="group"
              aria-label="Vehicle types"
            >
              {fleetVehicleTypes.map((vt) => {
                const selected = vehicleTypeIds.includes(vt.id);
                return (
                  <VehicleTypeTile
                    key={vt.id}
                    vt={vt}
                    selected={selected}
                    onToggle={() => {
                      if (isDropoffAcceptEdit) {
                        const next = selected ? [] : [vt.id];
                        setFieldValue("vehicleTypeIds", next);
                        setFieldValue("selectedVehicleTypeId", next[0] ?? "");
                        setFieldValue("sessionId", "");
                        setFieldTouched("vehicleTypeIds", true);
                        return;
                      }
                      const next = selected
                        ? vehicleTypeIds.filter((id) => id !== vt.id)
                        : [...vehicleTypeIds, vt.id];
                      setFieldValue("vehicleTypeIds", next);
                      setFieldValue("selectedVehicleTypeId", next[0] ?? "");
                      setFieldValue("sessionId", "");
                      setFieldTouched("vehicleTypeIds", true);
                    }}
                  />
                );
              })}
            </div>
          )}
        {vehicleTypeIdsTouched &&
          vehicleTypeIdsError != null &&
          vehicleTypeIdsError !== "" && (
            <p className="text-red-500 text-sm mt-2">
              {typeof vehicleTypeIdsError === "string"
                ? vehicleTypeIdsError
                : "Select at least one vehicle type"}
            </p>
          )}
      </div>
    </div>
  );
}

export default function OrderForm() {
  //   const { createOrder, isCreatingOrder } = useOrders();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeOrderId } = useParams<{ id?: string }>();
  const editOrderId = (
    routeOrderId ||
    searchParams.get("orderId") ||
    ""
  ).trim();
  const isDropoffAcceptEdit =
    searchParams.get("editMode") === "dropoffAccept" && Boolean(editOrderId);
  /** Full order edit (all create fields editable) reached via /order/edit/:id — PATCHes /order/:id. */
  const isGeneralEdit = Boolean(routeOrderId?.trim()) && !isDropoffAcceptEdit;
  const isEditingOrder = isDropoffAcceptEdit || isGeneralEdit;
  const orderValidationSchema = useMemo(() => buildOrderValidationSchema(), []);

  const [formInitialValues, setFormInitialValues] = useState(() =>
    createEmptyFormValues(),
  );
  const [loadingEditOrder, setLoadingEditOrder] = useState(false);
  const [confirmingDropoffUpdate, setConfirmingDropoffUpdate] = useState(false);
  /** Order `finalPrice` at load — shown as “previous price” vs pricing summary */
  const [originalDropoffPrice, setOriginalDropoffPrice] = useState<
    number | null
  >(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(
    null,
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuthState();

  const [priceLoading, setPriceLoading] = useState(false);

  // Branch selection state (for DROPOFF)
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesError, setBranchesError] = useState(false);
  const {
    data: serviceTypes,
    isLoading: serviceTypesLoading,
    isError: serviceTypesError,
  } = useServiceTypes();
  const {
    data: orderItemCategories = [],
    isLoading: loadingOrderItemCategories,
    isError: orderItemCategoriesError,
  } = useOrderItemCategories();

  const fetchBranches = async () => {
    try {
      setLoadingBranch(true);
      setBranchesError(false);

      const response = await api.get<BranchListResponse>(
        `/branch?search=all:&page=${1}&pageSize=${100}`,
      );
      setBranches(response.data.data);
      setLoadingBranch(false);
    } catch (error: any) {
      setLoadingBranch(false);
      setBranchesError(true);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!isEditingOrder || !editOrderId) {
      setFormInitialValues(createEmptyFormValues());
      setOriginalDropoffPrice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingEditOrder(true);
        const order = await fetchOrderById(editOrderId);
        if (cancelled) return;
        const mapped = mapOrderDetailToFormValues(order);
        setFormInitialValues(mapped);
        setOrderSummary(null);
        const fpRaw = order.finalPrice;
        const fpNum =
          typeof fpRaw === "number"
            ? fpRaw
            : fpRaw != null
              ? Number(fpRaw)
              : NaN;
        setOriginalDropoffPrice(Number.isFinite(fpNum) ? fpNum : null);
      } catch (e: unknown) {
        const msg =
          e &&
          typeof e === "object" &&
          "response" in e &&
          (e as { response?: { data?: { message?: string } } }).response?.data
            ?.message;
        toast.error(
          typeof msg === "string" && msg.trim()
            ? msg
            : "Could not load order for editing.",
        );
        navigate("/order");
      } finally {
        if (!cancelled) setLoadingEditOrder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditingOrder, editOrderId, navigate]);

  const onEstimate = async (
    _values: any,
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    const isPickupEstimate = _values.fulfillmentType === "PICKUP";
    setPriceLoading(true);
    setOrderSummary(null);
    if (!isDropoffAcceptEdit) {
      setFieldValue("selectedVehicleTypeId", "");
      setFieldValue("sessionId", "");
    }
    const selectedVehicleTypeIds = (
      Array.isArray(_values.vehicleTypeIds) ? _values.vehicleTypeIds : []
    )
      .map((id: unknown) => String(id ?? "").trim())
      .filter(Boolean);
    const converted: ConvertedShipment = {
      // receiver info
      receiverName: _values.receiverName,
      receiverPhone: _values.receiverPhone,

      // service
      serviceTypeId: _values.serviceTypeId,
      fulfillmentType: _values.fulfillmentType,
      isDelivery: isPickupEstimate,

      // package details
      weight: _values.weight,
      isFragile: _values.isFragile,
      shipmentType: _values.shipmentType,
      shippingScope: _values.destination,

      // locations (converted to template structure)
      deliveryAddress: {
        lat: String(_values.receiverLatitude),
        long: String(_values.receiverLongitude),
      },

      // unusual item fields
      isUnusual: _values.isUnusual,
      unusualReason: _values.unusualReason,

      deliveryDate: _values.deliveryDate
        ? new Date(_values.deliveryDate).toISOString()
        : undefined,
    };

    if (selectedVehicleTypeIds.length > 0) {
      converted.vehicleTypeIds = isDropoffAcceptEdit
        ? [selectedVehicleTypeIds[0]]
        : selectedVehicleTypeIds;
    }

    const branchIdTrimEstimate = String(_values.branchId ?? "").trim();
    if (branchIdTrimEstimate) {
      converted.branchId = branchIdTrimEstimate;
    }
    if (_values.receiverEmail) converted.receiverEmail = _values.receiverEmail;

    if (_values.fulfillmentType === "PICKUP") {
      converted.pickupAddress = {
        lat: String(_values.pickupLatitude),
        long: String(_values.pickupLongitude),
      };
      if (_values.pickupDate) {
        converted.pickupDate = new Date(_values.pickupDate).toISOString();
      }
    }

    if (
      _values.destination === "REGIONAL" ||
      _values.destination === "INTERNATIONAL"
    ) {
      converted.originCity = _values.originCity;
      converted.destinationCity = _values.destinationCity;
    }

    console.log("converted: ", converted);

    applySenderToShipmentPayload(converted, _values);

    const categoriesEstimate = buildCategoriesPayload(_values);
    if (categoriesEstimate.length > 0) {
      converted.categories = categoriesEstimate;
    }

    applyParcelDimensions(converted, _values);
    try {
      const res = await api.post<{
        data?: PricingSummaryApiData;
        message?: string;
      }>("/pricing/order/summary", converted);
      toast.success(res.data?.message?.trim() || "Pricing updated.");
      const payload = res.data?.data;
      let breakdown: OrderSummaryBreakdown | null =
        payload?.breakdown && typeof payload.breakdown === "object"
          ? payload.breakdown
          : null;
      if (
        !breakdown &&
        payload &&
        typeof payload === "object" &&
        ("baseFee" in payload || "distanceKm" in payload)
      ) {
        breakdown = {};
        if (typeof payload.baseFee === "number")
          breakdown.basePrice = payload.baseFee;
        if (typeof payload.distanceKm === "number")
          breakdown.distance = payload.distanceKm;
      }
      const vehiclesRaw = payload?.vehicles;
      const vehicles: OrderSummaryVehicle[] = Array.isArray(vehiclesRaw)
        ? vehiclesRaw
            .filter(
              (v: unknown) =>
                v &&
                typeof v === "object" &&
                typeof (v as OrderSummaryVehicle).vehicleTypeId === "string",
            )
            .map((v: unknown) => v as OrderSummaryVehicle)
        : [];
      const currency =
        typeof payload?.currency === "string"
          ? payload.currency
          : typeof payload?.result?.currency === "string"
            ? payload.result.currency
            : undefined;

      if (vehicles.length === 0 && isPickupEstimate) {
        toast.error("Estimate returned no vehicles to choose from.");
        setOrderSummary(null);
      } else {
        setOrderSummary({ breakdown, vehicles, currency });
        if (isDropoffAcceptEdit && vehicles.length === 1) {
          const v = vehicles[0];
          setFieldValue("selectedVehicleTypeId", v.vehicleTypeId);
          setFieldValue("sessionId", (v.sessionId ?? "").trim());
          setFieldValue("finalPrice", v.totalPrice ?? 0);
        } else if (
          isDropoffAcceptEdit &&
          vehicles.length === 0 &&
          breakdown?.basePrice != null &&
          Number.isFinite(breakdown.basePrice)
        ) {
          setFieldValue("finalPrice", breakdown.basePrice);
        }
      }
      setPriceLoading(false);
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSubmit = async (
    _values: any,
    { resetForm }: { resetForm: () => void },
  ) => {
    if (isDropoffAcceptEdit) {
      return;
    }
    const isPickupSubmit = _values.fulfillmentType === "PICKUP";
    if (!isGeneralEdit && isPickupSubmit) {
      if (!_values.selectedVehicleTypeId?.trim()) {
        toast.error(
          "Generate an estimate and select a vehicle before submitting.",
        );
        return;
      }
      if (!_values.sessionId?.trim()) {
        toast.error(
          "Generate an estimate and select a vehicle so the pricing session is included.",
        );
        return;
      }
    }
    const converted = buildConvertedShipment(_values, isGeneralEdit);

    try {
      setLoading(true);

      if (isGeneralEdit) {
        const original = buildConvertedShipment(formInitialValues, true);
        const changedFields = diffShipmentPayload(converted, original);
        if (Object.keys(changedFields).length === 0) {
          toast.success("No changes to save");
          navigate(`/order/details/${editOrderId}`);
          setLoading(false);
          return;
        }
        const res = await api.patch(`/order/${editOrderId}`, changedFields);
        toast.success(res.data?.message || "Order updated successfully");
        navigate(`/order/details/${editOrderId}`);
        setLoading(false);
        return;
      }

      const amount = getOrderAmount(_values, orderSummary);
      if (amount === undefined || !Number.isFinite(amount) || amount <= 0) {
        toast.error("Could not determine the order amount for payment.");
        setLoading(false);
        return;
      }
      const currency = orderSummary?.currency?.trim() || "ETB";
      const paymentInput = buildPaymentInput(
        _values.paymentType as PaymentMethodId,
        amount,
        currency,
        _values,
        user ? { id: user.id, name: user.name } : null,
      );

      try {
        await createPayment(paymentInput);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Payment could not be recorded.",
        );
        setLoading(false);
        return;
      }
      converted.paymentType = _values.paymentType;
      converted.payment = paymentInput;

      const res = await api.post("/order", converted);
      console.log("res of create order: ", res.data);
      toast.success(res.data?.message);
      // const tracking = generateTrackingNumber();
      const trackingCode = res.data.data?.trackingCode ?? "";
      setTrackingNumber(trackingCode);
      setCreatedOrderId(res.data.data?.id ?? "");
      setIsSuccessModalOpen(true);
      resetForm();
      setOrderSummary(null);
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(error?.response?.data?.message || "Somethign went wrong!");
    } finally {
      setLoading(false);
    }
    // Generate tracking number

    // Show success modal

    // Reset form after a short delay
    // setTimeout(() => {

    // }, 1000);
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setTrackingNumber("");
    setCreatedOrderId("");
  };

  const clearPickupFields = (
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    setFieldValue("pickupAddress", "");
    setFieldValue("pickupLatitude", 0);
    setFieldValue("pickupLongitude", 0);
    setFieldValue("pickupDate", "");
  };

  const handleDropoffConfirmUpdate = async (
    values: Record<string, unknown>,
  ) => {
    const vehicleTypeId = String(
      values.selectedVehicleTypeId ??
        (Array.isArray(values.vehicleTypeIds)
          ? values.vehicleTypeIds[0]
          : "") ??
        "",
    ).trim();
    const sessionId = String(values.sessionId ?? "").trim();
    const finalPrice = Number(values.finalPrice);
    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      toast.error("Enter a valid final price.");
      return;
    }
    try {
      setConfirmingDropoffUpdate(true);
      const payload: Record<string, unknown> = {
        weight: values.weight,
        isFragile: values.isFragile,
        isUnusual: values.isUnusual,
        unusualReason: values.unusualReason ?? "",
        validatedNotes: String(values.validatedNotes ?? ""),
        finalPrice,
      };
      if (vehicleTypeId) {
        payload.vehicleTypeId = vehicleTypeId;
      }
      if (sessionId) {
        payload.sessionId = sessionId;
      }
      const res = await api.patch(`/order/validate/${editOrderId}`, payload);
      toast.success(
        (res.data as { message?: string } | undefined)?.message?.trim() ||
          "Order verified successfully.",
      );
      navigate("/order");
    } catch (error: unknown) {
      const msg =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof msg === "string" && msg.trim()
          ? msg
          : "Could not confirm update.",
      );
    } finally {
      setConfirmingDropoffUpdate(false);
    }
  };

  return (
    <div className="px-6 py-2 bg-white relative">
      {loadingEditOrder && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-lg">
          <Spinner className="h-10 w-10 text-[#EE1E21]" />
        </div>
      )}
      <Formik
        initialValues={formInitialValues}
        enableReinitialize
        validationSchema={orderValidationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          setFieldValue,
          setValues,
          errors,
          touched,
          setFieldTouched,
        }) => {
          const isPickup = values.fulfillmentType === "PICKUP";
          const showVehicleTypes = isDropoffAcceptEdit || isPickup;
          const showDevPrefill =
            import.meta.env.DEV && !isEditingOrder;
          return (
            <Form>
              {/* Header */}
              <header className="relative">
                <div className="h-full top-0 left-0 flex items-center gap-3 mb-2">
                  <Button
                    type="button"
                    className="!text-[#FADF4B] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-lg !p-0 !py-0 flex items-center justify-center !cursor-pointer !w-[60px]"
                    onClick={() => navigate(-1)}
                  >
                    Back
                  </Button>
                  {isGeneralEdit ? (
                    <h1 className="text-xl font-medium text-gray-700">
                      Edit Order
                    </h1>
                  ) : null}
                  {showDevPrefill ? (
                    <button
                      type="button"
                      className="ml-auto rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 cursor-pointer"
                      onClick={() => {
                        const firstCategoryIds = orderItemCategories
                          .slice(0, 2)
                          .map((c) => c.id);
                        const firstBranch = branches[0];
                        setValues(
                          createDevPrefillFormValues({
                            serviceTypeId: serviceTypes?.[0]?.id ?? "",
                            categoryIds: firstCategoryIds,
                            branchId: firstBranch?.id ?? "",
                            branchSearch: firstBranch?.name ?? "",
                          }),
                        );
                        setOrderSummary(null);
                        toast.success("Dev prefill applied (emails left blank)");
                      }}
                    >
                      Prefill (dev)
                    </button>
                  ) : null}
                </div>
                {/* <div className="flex gap-5 items-center justify-center mb-6">
                <div className="flex gap-4 items-center">
                  <IoLogoDropbox className="text-4xl text-[#EE1E21]" />
                  <h1 className="text-2xl font-medium text-gray-700">
                    {isDropoffAcceptEdit
                      ? "Accept drop-off"
                      : "Place New Order"}
                  </h1>
                </div>
              </div> */}
              </header>
              {/* Waybill document: banner + Shipper/Consignee + Shipment + Service Info + Vehicle Types + Complete Order, all one table */}
              <div className="rounded-lg overflow-hidden border border-primary mb-6 bg-white">
                {/* Company banner header row */}
                <div className="bg-[#FADF4B] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <img
                    src={COMPANY_LOGO_SRC}
                    alt={COMPANY_NAME}
                    className="h-20 w-auto"
                  />
                  <div className="text-right text-[#8a1a1c]">
                    <p className="flex items-center justify-end gap-1 font-semibold text-xs sm:text-sm">
                      <IoCall className="shrink-0" /> {COMPANY_PHONE}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs mt-1 max-w-md">
                      <IoLocationSharp className="shrink-0" /> {COMPANY_ADDRESS}
                    </p>
                  </div>
                </div>
                <div className="h-1 bg-[#EE1E21]" />
                {/* Shipper / Consignee row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-primary border-b border-primary">
                  {/* Customer Info */}
                  <div className="space-y-4 p-4">
                    <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 border-b border-primary">
                      Shipper Details
                    </h2>
                    <div className="bg-gray-50  rounded-lg space-y-4">
                      <div className="space-y-3">
                        <FieldTable>
                          <FieldCell
                            label="Name of Sender"
                            error={
                              errors.name && touched.name
                                ? String(errors.name)
                                : undefined
                            }
                          >
                            <Field
                              as={Input}
                              name="name"
                              placeholder="Sender name"
                              className={tableInputClass}
                            />
                          </FieldCell>
                          <FieldCell
                            label="Phone"
                            error={
                              errors.phone && touched.phone
                                ? String(errors.phone)
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-gray-900 shrink-0">
                                {ETHIO_COUNTRY_CODE}
                              </span>
                              <Input
                                type="tel"
                                inputMode="numeric"
                                maxLength={9}
                                placeholder="912345678"
                                value={values.phone.replace(
                                  ETHIO_COUNTRY_CODE,
                                  "",
                                )}
                                onChange={(e) =>
                                  setFieldValue(
                                    "phone",
                                    ETHIO_COUNTRY_CODE +
                                      normalizeEthioMobileLocalInput(
                                        e.target.value,
                                      ),
                                  )
                                }
                                onBlur={() => setFieldTouched("phone", true)}
                                className={tableInputClass}
                              />
                            </div>
                          </FieldCell>
                          <FieldCell
                            label="Email"
                            className="col-span-2"
                            error={
                              errors.email && touched.email
                                ? String(errors.email)
                                : undefined
                            }
                          >
                            <Field
                              as={Input}
                              type="email"
                              name="email"
                              placeholder="Sender email"
                              className={tableInputClass}
                            />
                          </FieldCell>
                        </FieldTable>
                      </div>
                    </div>
                  </div>

                  {/* Receiver Info */}
                  <div className="space-y-4 p-4">
                    <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 border-b border-primary">
                      Consignee Details
                    </h2>
                    <FieldTable>
                      <FieldCell
                        label="Contact Person"
                        error={
                          errors.receiverName && touched.receiverName
                            ? String(errors.receiverName)
                            : undefined
                        }
                      >
                        <Field
                          as={Input}
                          name="receiverName"
                          placeholder="Receiver name"
                          className={tableInputClass}
                        />
                      </FieldCell>
                      <FieldCell
                        label="Phone"
                        error={
                          errors.receiverPhone && touched.receiverPhone
                            ? String(errors.receiverPhone)
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900 shrink-0">
                            {ETHIO_COUNTRY_CODE}
                          </span>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            maxLength={9}
                            placeholder="912345678"
                            value={values.receiverPhone.replace(
                              ETHIO_COUNTRY_CODE,
                              "",
                            )}
                            onChange={(e) =>
                              setFieldValue(
                                "receiverPhone",
                                ETHIO_COUNTRY_CODE +
                                  normalizeEthioMobileLocalInput(
                                    e.target.value,
                                  ),
                              )
                            }
                            onBlur={() =>
                              setFieldTouched("receiverPhone", true)
                            }
                            className={tableInputClass}
                          />
                        </div>
                      </FieldCell>
                      <FieldCell
                        label="Email"
                        className="col-span-2"
                        error={
                          errors.receiverEmail && touched.receiverEmail
                            ? String(errors.receiverEmail)
                            : undefined
                        }
                      >
                        <Field
                          as={Input}
                          type="email"
                          name="receiverEmail"
                          placeholder="Receiver email"
                          className={tableInputClass}
                        />
                      </FieldCell>
                    </FieldTable>
                    {!isDropoffAcceptEdit && (
                      <div>
                        <Label className="mb-1 font-bold">
                          Delivery Address
                        </Label>
                        <MapAddressSelector
                          onAddressSelect={(addressData) => {
                            setFieldValue(
                              "receiverAddress",
                              addressData.address,
                            );
                            setFieldValue(
                              "receiverLatitude",
                              addressData.latitude,
                            );
                            setFieldValue(
                              "receiverLongitude",
                              addressData.longitude,
                            );
                          }}
                          initialAddress={values.receiverAddress}
                          initialLat={values.receiverLatitude}
                          initialLng={values.receiverLongitude}
                          height="300px"
                        />
                        {errors.receiverAddress && touched.receiverAddress && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.receiverAddress}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Shipment Details · Service Info row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-primary border-b border-primary">
                  <div className="p-4">
                    <h2 className="text-xs font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-3 border-b border-primary">
                      Shipment Details
                    </h2>

                    <FieldTable>
                      <FieldCell label="Shipment Type">
                        <Select
                          value={String(values.shipmentType)}
                          onValueChange={(val) =>
                            setFieldValue("shipmentType", val)
                          }
                        >
                          <SelectTrigger
                            className={cn(tableTriggerClass, "!w-full")}
                          >
                            <SelectValue placeholder="Select shipment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CARRIER">
                              <IoMailOutline className="text-[#EE1E21]" />
                              Parcel-Envelope
                            </SelectItem>
                            <SelectItem value="PARCEL">
                              <IoCubeOutline className="text-[#EE1E21]" />
                              Parcel-Box
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldCell>

                      <FieldCell
                        label="Actual Weight of Shipment (kg)"
                        error={
                          errors.weight && touched.weight
                            ? String(errors.weight)
                            : undefined
                        }
                      >
                        <Field
                          as={Input}
                          type="number"
                          step="0.1"
                          name="weight"
                          className={tableInputClass}
                        />
                      </FieldCell>
                      {values.shipmentType === "PARCEL" ? (
                        <>
                          <FieldCell label="Length">
                            <Field
                              as={Input}
                              type="number"
                              step="0.1"
                              name="length"
                              className={tableInputClass}
                            />
                          </FieldCell>
                          <FieldCell label="Width">
                            <Field
                              as={Input}
                              type="number"
                              step="0.1"
                              name="width"
                              className={tableInputClass}
                            />
                          </FieldCell>
                          <FieldCell label="Height">
                            <Field
                              as={Input}
                              type="number"
                              step="0.1"
                              name="height"
                              className={tableInputClass}
                            />
                          </FieldCell>
                        </>
                      ) : (
                        <></>
                      )}
                      <FieldCell label="Order Categories">
                        {loadingOrderItemCategories && (
                          <div className="flex items-center gap-2 py-1 text-xs text-gray-600">
                            <Spinner className="h-4 w-4 text-[#EE1E21]" />
                            Loading categories…
                          </div>
                        )}
                        {orderItemCategoriesError && (
                          <p className="text-red-600 text-xs py-1">
                            Could not load item categories.
                          </p>
                        )}
                        {!loadingOrderItemCategories &&
                          !orderItemCategoriesError &&
                          orderItemCategories.length === 0 && (
                            <p className="text-amber-700 text-xs py-1">
                              No item categories configured. Add them under
                              Orders → Item categories.
                            </p>
                          )}
                        <ConfigProvider
                          theme={{
                            components: {
                              Select: {
                                colorBorder: "#d1d5db",
                                colorBgContainer: "#f9fafb",
                                hoverBorderColor: "rgba(238, 30, 33, 0.5)",
                                activeBorderColor: "#EE1E21",
                                activeOutlineColor: "rgba(238, 30, 33, 0.2)",
                              },
                            },
                          }}
                        >
                          <Style2
                            mode="multiple"
                            allowClear
                            placeholder="Select categories"
                            value={values.categoryIds}
                            onChange={(val) => {
                              const ids: string[] = val ?? [];
                              setFieldValue("categoryIds", ids);
                              const currentQuantities: Record<string, number> =
                                values.categoryQuantities || {};
                              const nextQuantities: Record<string, number> = {};
                              ids.forEach((id) => {
                                nextQuantities[id] = currentQuantities[id] ?? 1;
                              });
                              setFieldValue(
                                "categoryQuantities",
                                nextQuantities,
                              );
                            }}
                            disabled={
                              loadingOrderItemCategories ||
                              orderItemCategories.length === 0
                            }
                            maxTagTextLength={18}
                            className="[&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:!min-h-9 [&_.ant-select-selector]:!px-2.5 [&_.ant-select-selector]:!py-1"
                            style={{ width: "100%" }}
                          >
                            {orderItemCategories.map((cat) => (
                              <Style2.Option key={cat.id} value={cat.id}>
                                {cat.name}
                              </Style2.Option>
                            ))}
                          </Style2>
                        </ConfigProvider>
                        {values.categoryIds.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {(values.categoryIds as string[]).map((id) => {
                              const cat = orderItemCategories.find(
                                (c) => c.id === id,
                              );
                              return (
                                <div
                                  key={id}
                                  className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-white px-2 py-1"
                                >
                                  <span className="text-xs text-gray-700 truncate">
                                    {cat?.name ?? id}
                                  </span>
                                  <Input
                                    type="number"
                                    min={1}
                                    step="1"
                                    value={values.categoryQuantities?.[id] ?? 1}
                                    onChange={(e) => {
                                      const qty = Math.max(
                                        1,
                                        Number(e.target.value) || 1,
                                      );
                                      setFieldValue("categoryQuantities", {
                                        ...values.categoryQuantities,
                                        [id]: qty,
                                      });
                                    }}
                                    className="h-7 w-20 text-xs px-2"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </FieldCell>
                      <FieldCell
                        label="Destination"
                        error={
                          errors.destination && touched.destination
                            ? String(errors.destination)
                            : undefined
                        }
                      >
                        <Select
                          value={String(values.destination)}
                          onValueChange={(val) =>
                            setFieldValue("destination", val)
                          }
                        >
                          <SelectTrigger
                            className={cn(tableTriggerClass, "!w-full")}
                          >
                            <SelectValue placeholder="Select destination" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOWN">TOWN</SelectItem>
                            <SelectItem value="REGIONAL">REGIONAL</SelectItem>
                            <SelectItem value="INTERNATIONAL">
                              INTERNATIONAL
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FieldCell>
                      {/* Origin and Destination City - only for REGIONAL/INTERNATIONAL */}
                      {(values.destination === "REGIONAL" ||
                        values.destination === "INTERNATIONAL") && (
                        <>
                          <FieldCell label="Origin City">
                            <Field
                              as={Input}
                              name="originCity"
                              placeholder="Origin city (ex: Addis Ababa)"
                              className={tableInputClass}
                            />
                          </FieldCell>
                          <FieldCell label="Destination City">
                            <Field
                              as={Input}
                              name="destinationCity"
                              placeholder="Destination city (ex: Mekelle)"
                              className={tableInputClass}
                            />
                          </FieldCell>
                        </>
                      )}
                    </FieldTable>
                  </div>
                  <div className="p-4 space-y-3">
                    <h2 className="text-xs font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-3 border-b border-primary">
                      Service Info
                    </h2>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="mb-1 text-xs font-bold">
                          Service Type
                        </Label>
                        <Select
                          value={values.serviceTypeId || undefined}
                          onValueChange={(val) => {
                            setFieldValue("serviceTypeId", val);
                            setFieldValue("vehicleTypeIds", []);
                            setFieldValue("selectedVehicleTypeId", "");
                            setFieldValue("sessionId", "");
                            setOrderSummary(null);
                          }}
                        >
                          <SelectTrigger
                            className={`py-2 !w-full text-xs bg-none border ${
                              errors.serviceTypeId && touched.serviceTypeId
                                ? "border-red-500"
                                : ""
                            }`}
                          >
                            <SelectValue
                              placeholder={
                                serviceTypesLoading
                                  ? "Loading service types..."
                                  : serviceTypesError
                                    ? "Could not load service types"
                                    : "Select service"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypesLoading ? (
                              <div className="py-2 px-4 text-gray-500">
                                Loading service types...
                              </div>
                            ) : serviceTypesError ? (
                              <div className="py-2 px-4 text-red-500">
                                Could not load service types.
                              </div>
                            ) : !serviceTypes || serviceTypes.length === 0 ? (
                              <div className="py-2 px-4 text-gray-500">
                                No service types configured.
                              </div>
                            ) : (
                              serviceTypes.map((serviceType) => (
                                <SelectItem
                                  key={serviceType.id}
                                  value={serviceType.id}
                                >
                                  {serviceType.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {errors.serviceTypeId && touched.serviceTypeId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.serviceTypeId}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-1 text-xs font-bold">
                          Collection Type
                        </Label>
                        <Select
                          value={values.fulfillmentType}
                          onValueChange={(val) => {
                            setFieldValue("fulfillmentType", val);
                            if (val === "DROPOFF") {
                              clearPickupFields(setFieldValue);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`bg-none py-2 !w-full text-xs ${
                              errors.fulfillmentType && touched.fulfillmentType
                                ? "border-red-500"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="Select fulfillment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PICKUP">PICKUP</SelectItem>
                            <SelectItem value="DROPOFF">DROPOFF</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.fulfillmentType && touched.fulfillmentType && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.fulfillmentType}
                          </p>
                        )}
                      </div>
                    </div>

                    {values.fulfillmentType === "PICKUP" && (
                      <div>
                        <Label className="mb-1 text-xs font-bold">
                          Pickup Address
                        </Label>
                        <MapAddressSelector
                          onAddressSelect={(addressData) => {
                            setFieldValue("pickupAddress", addressData.address);
                            setFieldValue(
                              "pickupLatitude",
                              addressData.latitude,
                            );
                            setFieldValue(
                              "pickupLongitude",
                              addressData.longitude,
                            );
                          }}
                          initialAddress={values.pickupAddress}
                          initialLat={values.pickupLatitude}
                          initialLng={values.pickupLongitude}
                          height="200px"
                        />
                        {errors.pickupAddress && touched.pickupAddress && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.pickupAddress}
                          </p>
                        )}
                      </div>
                    )}

                    {values.fulfillmentType === "PICKUP" && (
                      <div>
                        <Label
                          className="mb-1 text-xs font-bold"
                          htmlFor="order-pickup-datetime"
                        >
                          Pickup Date
                        </Label>
                        <DateTimePicker
                          id="order-pickup-datetime"
                          value={values.pickupDate}
                          onChange={(v) => setFieldValue("pickupDate", v)}
                          onBlur={() => setFieldTouched("pickupDate", true)}
                          placeholder="Pick date and time"
                          error={Boolean(
                            errors.pickupDate && touched.pickupDate,
                          )}
                        />
                        {errors.pickupDate && touched.pickupDate && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.pickupDate}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Branch + Delivery Date side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 text-xs font-bold">
                          Branch *
                        </Label>
                        <Select
                          value={values.branchId || undefined}
                          onValueChange={(val) =>
                            setFieldValue("branchId", val)
                          }
                          disabled={loadingBranch}
                        >
                          <SelectTrigger
                            className={`py-2 !w-full text-xs bg-none border ${
                              !values.branchId ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue
                              placeholder={
                                loadingBranch
                                  ? "Loading branches..."
                                  : branchesError
                                    ? "Could not load branches"
                                    : "Select branch"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {loadingBranch ? (
                              <div className="py-2 px-4 text-gray-500">
                                Loading branches...
                              </div>
                            ) : branchesError ? (
                              <div className="py-2 px-4 text-red-500">
                                Could not load branches.
                              </div>
                            ) : branches.length === 0 ? (
                              <div className="py-2 px-4 text-gray-500">
                                No branches found.
                              </div>
                            ) : (
                              branches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  {branch.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {branchesError ? (
                          <p className="text-red-500 text-xs mt-1">
                            Could not load branches. Refresh to try again.
                          </p>
                        ) : (
                          !values.branchId && (
                            <p className="text-red-500 text-xs mt-1">
                              Branch is required for the order
                            </p>
                          )
                        )}
                      </div>

                      <div>
                        <Label
                          className="mb-1 text-xs font-bold"
                          htmlFor="order-delivery-datetime"
                        >
                          Delivery Date
                        </Label>
                        <DateTimePicker
                          id="order-delivery-datetime"
                          value={values.deliveryDate}
                          onChange={(v) => setFieldValue("deliveryDate", v)}
                          onBlur={() => setFieldTouched("deliveryDate", true)}
                          placeholder="Pick date and time"
                          error={Boolean(
                            errors.deliveryDate && touched.deliveryDate,
                          )}
                        />
                        {errors.deliveryDate && touched.deliveryDate && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.deliveryDate}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* <div>
                <Label className="mb-1 font-bold">Sender Entity</Label>
                <Select
                  value={String(values.senderEntity)}
                  onValueChange={(val) => setFieldValue("senderEntity", val)}
                >
                  <SelectTrigger className="py-7 !w-full">
                    <SelectValue placeholder="Indvidual/Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Indvidual</SelectItem>
                    <SelectItem value="false">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
                  </div>
                </div>
                {/* Row 2: Vehicle Types · Complete Order */}
                <div
                  className={cn(
                    "grid grid-cols-1 divide-y lg:divide-y-0 divide-primary border-t border-primary",
                    showVehicleTypes && "lg:grid-cols-2 lg:divide-x",
                  )}
                >
                  {showVehicleTypes && (
                    <OrderVehicleTypesSection
                      serviceTypeId={values.serviceTypeId}
                      vehicleTypeIds={values.vehicleTypeIds}
                      isDropoffAcceptEdit={isDropoffAcceptEdit}
                      setFieldValue={setFieldValue}
                      setFieldTouched={setFieldTouched}
                      vehicleTypeIdsError={errors.vehicleTypeIds}
                      vehicleTypeIdsTouched={Boolean(touched.vehicleTypeIds)}
                      className="bg-transparent p-4 rounded-none border-0 shadow-none mt-0"
                    />
                  )}

                  {/* Estimate & submit */}
                  <div className="p-4 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-4 border-b border-primary">
                      Complete Order
                    </h2>

                    {isDropoffAcceptEdit && !orderSummary && (
                      <div className="flex flex-col sm:flex-row gap-3 w-full border-t border-primary pt-4">
                        <Button
                          type="button"
                          disabled={priceLoading}
                          onClick={() => navigate("/order")}
                          className="flex-1 min-h-[48px] bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-primary/30"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 min-h-[48px] flex flex-row justify-center items-center cursor-pointer bg-[#EE1E21] hover:bg-[#cc1a1c]"
                          disabled={priceLoading}
                          onClick={() => onEstimate(values, setFieldValue)}
                        >
                          {priceLoading ? (
                            <Spinner className="h-6 w-6 text-center text-[#FADF4B] mr-2" />
                          ) : null}
                          Verify order
                        </Button>
                      </div>
                    )}

                    {!isDropoffAcceptEdit && !isGeneralEdit && (
                      <div className="flex flex-row gap-3">
                        {!orderSummary && (
                          <Button
                            type="button"
                            disabled={priceLoading}
                            onClick={() => navigate(-1)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-primary/30"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          type="button"
                          className="flex flex-1 flex-row justify-center items-center cursor-pointer hover:bg-[#cc1a1c]"
                          onClick={() => onEstimate(values, setFieldValue)}
                        >
                          {priceLoading ? (
                            <Spinner className="h-6 w-6 text-center text-[#FADF4B] mr-2" />
                          ) : (
                            "Generate estimate"
                          )}
                        </Button>
                      </div>
                    )}

                    {isGeneralEdit && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <Button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            handleSubmit(values, { resetForm: () => {} })
                          }
                          className="flex flex-row justify-center items-center cursor-pointer hover:bg-[#cc1a1c]"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center w-full">
                              <Spinner className="h-6 w-6 text-[#FADF4B] mr-2" />
                              <span>Updating...</span>
                            </span>
                          ) : (
                            "Update order"
                          )}
                        </Button>
                        <Button
                          disabled={loading}
                          type="button"
                          onClick={() => navigate(-1)}
                          className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-primary/30 !w-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {orderSummary && !isDropoffAcceptEdit && !isGeneralEdit && (
                      <div className="space-y-4 pt-2 border-t border-primary">
                        {orderSummary.breakdown && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                              Price breakdown
                            </h3>
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-3">
                              <div>
                                <dt className="text-gray-500">Qty</dt>
                                <dd>{orderSummary.breakdown.qty ?? "—"}</dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">Actual weight</dt>
                                <dd>
                                  {orderSummary.breakdown.actualWeight ?? "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">
                                  Chargeable weight
                                </dt>
                                <dd>
                                  {orderSummary.breakdown.chargeableWeight ??
                                    "—"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">Base price</dt>
                                <dd>
                                  {formatOrderMoney(
                                    orderSummary.breakdown.basePrice,
                                    orderSummary.currency,
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-gray-500">Distance</dt>
                                <dd>
                                  {orderSummary.breakdown.distance != null
                                    ? `${orderSummary.breakdown.distance} km`
                                    : "—"}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        )}

                        {isPickup && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                              Choose a vehicle
                            </h3>
                            <p className="text-xs text-gray-500 mb-3">
                              Select one option below.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {orderSummary.vehicles.map((v) => {
                                const selected =
                                  values.selectedVehicleTypeId ===
                                    v.vehicleTypeId &&
                                  values.sessionId ===
                                    (v.sessionId?.trim() ?? "");
                                return (
                                  <button
                                    key={`${v.sessionId ?? ""}-${v.vehicleTypeId}`}
                                    type="button"
                                    onClick={() => {
                                      setFieldValue(
                                        "selectedVehicleTypeId",
                                        v.vehicleTypeId,
                                      );
                                      setFieldValue(
                                        "sessionId",
                                        v.sessionId?.trim() ?? "",
                                      );
                                      setFieldValue(
                                        "finalPrice",
                                        v.totalPrice ?? 0,
                                      );
                                      setFieldValue("couponValidated", false);
                                      setFieldTouched(
                                        "selectedVehicleTypeId",
                                        true,
                                      );
                                    }}
                                    className={cn(
                                      "flex gap-3 p-3 rounded-lg border text-left transition-colors",
                                      selected
                                        ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                                        : "border-primary bg-white hover:border-primary/40",
                                    )}
                                  >
                                    {v.imageUrl ? (
                                      <img
                                        src={v.imageUrl}
                                        alt=""
                                        className="h-16 w-16 shrink-0 rounded object-contain bg-gray-50"
                                      />
                                    ) : (
                                      <div className="h-16 w-16 shrink-0 rounded bg-gray-100" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-gray-900 truncate">
                                        {v.vehicleName ?? v.vehicleTypeId}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {v.type ? `${v.type} · ` : ""}
                                        Commission:{" "}
                                        {formatOrderMoney(
                                          v.commission,
                                          orderSummary.currency,
                                        )}
                                      </div>
                                      <div className="text-sm font-semibold text-gray-800 mt-1">
                                        Total:{" "}
                                        {formatOrderMoney(
                                          v.totalPrice,
                                          orderSummary.currency,
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <PaymentMethodSection
                          values={values}
                          errors={errors}
                          touched={touched}
                          setFieldValue={setFieldValue}
                          setFieldTouched={setFieldTouched}
                          amount={getOrderAmount(values, orderSummary)}
                          amountMissingMessage={getCouponAmountMissingMessage(
                            values,
                            orderSummary,
                          )}
                          userId={user?.id}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <Button
                            type="submit"
                            disabled={
                              loading ||
                              (isPickup &&
                                (!values.selectedVehicleTypeId?.trim() ||
                                  !values.sessionId?.trim()))
                            }
                            className="flex flex-row justify-center items-center cursor-pointer hover:bg-[#cc1a1c]"
                          >
                            {loading ? (
                              <span className="flex items-center justify-center w-full">
                                <Spinner className="h-6 w-6 text-[#FADF4B] mr-2" />
                                <span>Submitting...</span>
                              </span>
                            ) : (
                              "Submit order"
                            )}
                          </Button>
                          <Button
                            disabled={loading}
                            type="button"
                            onClick={() => navigate(-1)}
                            className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-primary/30 !w-full"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {orderSummary && isDropoffAcceptEdit && (
                      <div className="space-y-4 pt-2 border-t border-primary">
                        <div>
                          <Label className="mb-1 font-bold">
                            Validation notes
                          </Label>
                          <Field
                            as={Textarea}
                            name="validatedNotes"
                            placeholder="Notes for validation"
                            className="min-h-[100px] py-3"
                          />
                        </div>

                        <div className="rounded-lg border border-primary bg-white p-4">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3">
                            Price comparison
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-md bg-gray-50 p-4 text-center sm:text-left">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Previous price
                              </p>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatOrderMoney(
                                  originalDropoffPrice ?? undefined,
                                  orderSummary.currency,
                                )}
                              </p>
                            </div>
                            <div className="rounded-md bg-[#EE1E21]/5 p-4 text-center sm:text-left">
                              <p className="text-xs font-medium text-[#EE1E21] uppercase tracking-wide">
                                New price
                              </p>
                              <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatOrderMoney(
                                  (() => {
                                    const fp = Number(values.finalPrice);
                                    if (Number.isFinite(fp) && fp >= 0)
                                      return fp;
                                    if (orderSummary.vehicles.length === 1) {
                                      return orderSummary.vehicles[0]
                                        .totalPrice;
                                    }
                                    return undefined;
                                  })(),
                                  orderSummary.currency,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {orderSummary.vehicles.length > 1 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800 mb-2">
                              Choose priced option
                              <span className="font-normal text-gray-500">
                                {" "}
                                (optional)
                              </span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {orderSummary.vehicles.map((v) => {
                                const selected =
                                  values.selectedVehicleTypeId ===
                                    v.vehicleTypeId &&
                                  values.sessionId ===
                                    (v.sessionId?.trim() ?? "");
                                return (
                                  <button
                                    key={`${v.sessionId ?? ""}-${v.vehicleTypeId}`}
                                    type="button"
                                    onClick={() => {
                                      setFieldValue(
                                        "selectedVehicleTypeId",
                                        v.vehicleTypeId,
                                      );
                                      setFieldValue(
                                        "sessionId",
                                        v.sessionId?.trim() ?? "",
                                      );
                                      setFieldValue(
                                        "finalPrice",
                                        v.totalPrice ?? 0,
                                      );
                                      setFieldTouched(
                                        "selectedVehicleTypeId",
                                        true,
                                      );
                                    }}
                                    className={cn(
                                      "flex gap-3 p-3 rounded-lg border text-left transition-colors",
                                      selected
                                        ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                                        : "border-primary bg-white hover:border-primary/40",
                                    )}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-gray-900 truncate">
                                        {v.vehicleName ?? v.vehicleTypeId}
                                      </div>
                                      <div className="text-sm font-semibold text-gray-800 mt-1">
                                        {formatOrderMoney(
                                          v.totalPrice,
                                          orderSummary.currency,
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div>
                          <Label className="mb-1 font-bold">Final price</Label>
                          <Field
                            as={Input}
                            type="number"
                            name="finalPrice"
                            step="0.01"
                            min={0}
                            className="py-7"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Confirmed amount sent on update. Currency:{" "}
                            {orderSummary.currency ?? "—"}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full">
                          <Button
                            type="button"
                            disabled={confirmingDropoffUpdate}
                            onClick={() => navigate("/order")}
                            className="flex-1 min-h-[48px] bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-primary/30"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            disabled={confirmingDropoffUpdate}
                            className="flex-1 min-h-[48px] flex flex-row justify-center items-center cursor-pointer bg-[#EE1E21] hover:bg-[#cc1a1c]"
                            onClick={() => handleDropoffConfirmUpdate(values)}
                          >
                            {confirmingDropoffUpdate ? (
                              <Spinner className="h-6 w-6 text-[#FADF4B] mr-2" />
                            ) : null}
                            Confirm Update
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>{" "}
                {/* end Vehicle+Complete grid */}
              </div>{" "}
              {/* end waybill document */}
            </Form>
          );
        }}
      </Formik>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={trackingNumber}
        orderId={createdOrderId || undefined}
      />
    </div>
  );
}
