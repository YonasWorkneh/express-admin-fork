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
import type { WaybillData } from "@/components/common/WaybillDocument";
import { useAuthState } from "@/hooks/useAuthState";
import {
  IoArrowBack,
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
import { MdAccountBalance } from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import * as Yup from "yup";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type {
  Customer,
  CustomerListResponse,
  Branch,
  BranchListResponse,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";
import { Select as Style2 } from "antd";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useOrderItemCategories } from "@/hooks/useOrderItemCategories";
import { useFleetVehicleTypesForServiceTypeQuery } from "@/hooks/useDriverCommissionConfig";
import type { FleetVehicleTypeListItem } from "@/lib/api/fleet";
import { VehicleTypeThumbnail } from "@/lib/vehicleTypeVisual";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-picker";
import { fetchOrderById } from "@/lib/api/orders";
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
    customerId: "",
    weight: 0,
    quantity: 0,
    categoryId: "",
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
    bankName: "",
    transactionId: "",
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
    weight: o.weight ?? 0,
    isFragile: Boolean(o.isFragile),
    isUnusual: Boolean(o.isUnusual),
    unusualReason: o.unusualReason ?? "",
    shipmentType: (o.shipmentType as string) ?? "",
    destination: String(o.shippingScope ?? "TOWN").toUpperCase(),
    categoryId: o.category?.id ?? "",
    quantity: o.quantity ?? 0,
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
    customerId: o.customer?.id ?? "",
    name: o.customer?.name ?? "",
    email: o.customer?.email ?? "",
    phone: o.customer?.phone || ETHIO_COUNTRY_CODE,
    originCity: o.originCityRaw ?? "",
    destinationCity: o.destinationCityRaw ?? "",
    selectedVehicleTypeId: "",
    sessionId: "",
  };
}

const hasSelectedCustomer = (customerId: unknown) =>
  Boolean(String(customerId ?? "").trim());

const OrderValidationSchema = Yup.object().shape({
  customerId: Yup.string(),
  receiverName: Yup.string().required("Receiver name is required"),
  receiverEmail: Yup.string()
    .email("Invalid email")
    .required("Receiver email is required"),
  receiverPhone: Yup.string()
    .matches(phoneRegex, "Phone must be +251 followed by 9 digits, starting with 9 or 7")
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
  vehicleTypeIds: Yup.array()
    .of(Yup.string())
    .when("fulfillmentType", {
      is: "PICKUP",
      then: (schema) => schema.min(1, "Select at least one vehicle type"),
      otherwise: (schema) => schema,
    }),
  /** When no customer is selected from search, sender name / email / phone are required */
  name: Yup.string().when("customerId", {
    is: (val: unknown) => !hasSelectedCustomer(val),
    then: (schema) =>
      schema.required("Name is required when no customer is selected"),
    otherwise: (schema) => schema.notRequired(),
  }),
  email: Yup.string()
    .transform((v) => (v === "" ? undefined : v))
    .when("customerId", {
      is: (val: unknown) => !hasSelectedCustomer(val),
      then: (schema) =>
        schema
          .required("Email is required when no customer is selected")
          .email("Invalid email"),
      otherwise: (schema) =>
        schema
          .transform((v) => (v === "" ? undefined : v))
          .email("Invalid email")
          .optional(),
    }),
  phone: Yup.string().when("customerId", {
    is: (val: unknown) => !hasSelectedCustomer(val),
    then: (schema) =>
      schema
        .matches(phoneRegex, "Phone must be +251 followed by 9 digits, starting with 9 or 7")
        .required("Phone is required when no customer is selected"),
    otherwise: (schema) => schema.notRequired(),
  }),
  paymentType: Yup.string().required("Select a payment method"),
  bankName: Yup.string().when("paymentType", {
    is: "bank_transfer",
    then: (schema) => schema.required("Bank name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  transactionId: Yup.string().when("paymentType", {
    is: "bank_transfer",
    then: (schema) => schema.required("Transaction ID is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

interface ConvertedShipment {
  customerId?: any;
  name?: any;
  email?: any;
  phone?: any;
  receiverName: any;
  receiverEmail: any;
  receiverPhone: any;
  serviceTypeId: any;
  fulfillmentType: any;
  weight: any;
  categoryId?: any;
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
  quantity: any;
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

  // Payment
  paymentType?: string;
  bankName?: string;
  transactionId?: string;
}

/** Borderless input styling so fields sit flush inside a `FieldCell`, table-style */
const tableInputClass =
  "border-0 rounded-none shadow-none px-0 py-0 h-auto bg-transparent focus-visible:ring-0 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400";
const tableTriggerClass =
  "border-0 rounded-none shadow-none px-0 py-0 h-auto !bg-transparent focus-visible:ring-0 text-sm font-semibold text-gray-900 justify-start";

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
    <div className={cn("bg-white p-3", className)}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </p>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
        "grid grid-cols-2 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

type PaymentMethodId = "cbe" | "telebirr" | "bank_transfer";

const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  icon: (className: string) => ReactNode;
}[] = [
  {
    id: "cbe",
    label: "CBE Birr",
    icon: (c) => (
      <img src="/images/cbe.png" alt="CBE" className={cn(c, "object-contain")} />
    ),
  },
  {
    id: "telebirr",
    label: "telebirr",
    icon: (c) => (
      <img
        src="/images/telebirr.png"
        alt="telebirr"
        className={cn(c, "object-contain")}
      />
    ),
  },
  {
    id: "bank_transfer",
    label: "Direct bank transfer",
    icon: (c) => <MdAccountBalance className={cn(c, "text-[#EE1E21]")} />,
  },
];

function PaymentMethodSection({
  values,
  errors,
  touched,
  setFieldValue,
  setFieldTouched,
}: {
  values: { paymentType: string; bankName: string; transactionId: string };
  errors: Record<string, unknown>;
  touched: Record<string, unknown>;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
}) {
  return (
    <div className="space-y-4 pt-2 border-t border-gray-200">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">Payment method</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Choose how the customer will pay for this order.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PAYMENT_METHODS.map((method) => {
          const selected = values.paymentType === method.id;
          const showError =
            !selected && Boolean(errors.paymentType) && Boolean(touched.paymentType);
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => {
                setFieldValue("paymentType", method.id);
                setFieldTouched("paymentType", true);
                if (method.id !== "bank_transfer") {
                  setFieldValue("bankName", "");
                  setFieldValue("transactionId", "");
                }
              }}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors cursor-pointer",
                selected
                  ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                  : showError
                    ? "border-red-500 bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300",
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

      {(values.paymentType === "cbe" || values.paymentType === "telebirr") && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {values.paymentType === "cbe" ? "CBE Birr" : "telebirr"} payments
          are coming soon. Please choose direct bank transfer for now.
        </div>
      )}

      {values.paymentType === "bank_transfer" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <Label className="mb-1">Bank name</Label>
            <Field
              as={Input}
              name="bankName"
              placeholder="e.g. Commercial Bank of Ethiopia"
              className={`py-7 ${
                errors.bankName && touched.bankName ? "border-red-500" : ""
              }`}
            />
            {Boolean(errors.bankName) && Boolean(touched.bankName) && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.bankName)}
              </p>
            )}
          </div>
          <div>
            <Label className="mb-1">Transaction ID</Label>
            <Field
              as={Input}
              name="transactionId"
              placeholder="e.g. TXN-1234567890"
              className={`py-7 ${
                errors.transactionId && touched.transactionId
                  ? "border-red-500"
                  : ""
              }`}
            />
            {Boolean(errors.transactionId) &&
              Boolean(touched.transactionId) && (
                <p className="text-red-500 text-sm mt-1">
                  {String(errors.transactionId)}
                </p>
              )}
          </div>
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

/** Sender: either existing `customerId` or manual `name` + `email` + `phone` (validated in schema). */
function applySenderToShipmentPayload(
  converted: ConvertedShipment,
  values: {
    customerId?: string;
    name?: string;
    email?: string;
    phone?: string;
  },
) {
  const cid = String(values.customerId ?? "").trim();
  if (cid) {
    converted.customerId = cid;
    return;
  }
  converted.name = String(values.name ?? "").trim();
  converted.email = String(values.email ?? "").trim();
  converted.phone = String(values.phone ?? "").trim();
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
          : "border-gray-200 hover:border-gray-300 bg-white",
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
    <div className={cn("bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm mt-6 space-y-4", className)}>
      <div>
        <h2 className="text-lg font-medium text-gray-900">Vehicle types</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isDropoffAcceptEdit
            ? "Select exactly one vehicle type."
            : "Choose suitable vehicle categories for this shipment (based on service type)."}
        </p>
      </div>

      <div>
        <Label className="mb-2">Selection *</Label>
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
  const editOrderId = (searchParams.get("orderId") ?? "").trim();
  const isDropoffAcceptEdit =
    searchParams.get("editMode") === "dropoffAccept" && Boolean(editOrderId);

  const [formInitialValues, setFormInitialValues] = useState(() =>
    createEmptyFormValues(),
  );
  const [loadingEditOrder, setLoadingEditOrder] = useState(false);
  const [confirmingDropoffUpdate, setConfirmingDropoffUpdate] = useState(false);
  /** Order `finalPrice` at load — shown as “previous price” vs pricing summary */
  const [originalDropoffPrice, setOriginalDropoffPrice] = useState<number | null>(
    null,
  );
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(
    null,
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [waybillData, setWaybillData] = useState<WaybillData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthState();

  const [managerSearch, setManagerSearch] = useState("");
  // const [branchSearch, setBranchSearch] = useState("");
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  // const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  // const [pagination, setPagination] = useState<Pagination | null>(null);
  // const [searchText, setSearchText] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [custoemr, setCustomer] = useState<Customer[]>([]);
  /** Last customer picked in the sender dropdown — used to prefill optional sender contact fields */
  const [selectedCustomerForSender, setSelectedCustomerForSender] =
    useState<Customer | null>(null);
  const canPrefillSender = useMemo(() => {
    if (!selectedCustomerForSender) return false;
    const name = selectedCustomerForSender.name?.trim();
    const email = selectedCustomerForSender.email?.trim();
    const phone = selectedCustomerForSender.phone?.trim();
    return Boolean(name || email || phone);
  }, [selectedCustomerForSender]);
  const [priceLoading, setPriceLoading] = useState(false);

  // Branch selection state (for DROPOFF)
  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { data: serviceTypes } = useServiceTypes();
  const {
    data: orderItemCategories = [],
    isLoading: loadingOrderItemCategories,
    isError: orderItemCategoriesError,
  } = useOrderItemCategories();

  const featchStaffs = async () => {
    try {
      setLoadingStaff(true);

      const staffs = await api.get<CustomerListResponse>(
        `/users/customers?search=all:${managerSearch}&page=${1}&pageSize=${20}`,
      );
      setCustomer(staffs.data.data);
      // setPagination(staffs.data.pagination);
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

  const fetchBranches = async () => {
    try {
      setLoadingBranch(true);

      const response = await api.get<BranchListResponse>(
        `/branch?search=all:${branchSearch}&page=${1}&pageSize=${20}`,
      );
      setBranches(response.data.data);
      setLoadingBranch(false);
    } catch (error: any) {
      setLoadingBranch(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [branchSearch]);

  useEffect(() => {
    if (!isDropoffAcceptEdit || !editOrderId) {
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
        if (order.customer?.name) {
          setManagerSearch(order.customer.name);
        }
        if (order.branch?.name) {
          setBranchSearch(order.branch.name);
        }
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
  }, [isDropoffAcceptEdit, editOrderId, navigate]);

  const onEstimate = async (
    _values: any,
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    if (isDropoffAcceptEdit) {
      const one = (_values.vehicleTypeIds || [])[0];
      if (!one) {
        toast.error("Select exactly one vehicle type for the estimate.");
        return;
      }
    }
    const isPickupEstimate = _values.fulfillmentType === "PICKUP";
    setPriceLoading(true);
    setOrderSummary(null);
    if (!isDropoffAcceptEdit) {
      setFieldValue("selectedVehicleTypeId", "");
      setFieldValue("sessionId", "");
    }
    const converted: ConvertedShipment = {
      // receiver info
      receiverName: _values.receiverName,
      receiverEmail: _values.receiverEmail,
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
      // length: _values.length,
      // width: _values.width,
      // height: _values.height,

      // locations (converted to template structure)
      deliveryAddress: {
        lat: String(_values.receiverLatitude),
        long: String(_values.receiverLongitude),
      },

      // unusual item fields
      isUnusual: _values.isUnusual,
      unusualReason: _values.unusualReason,

      // extra from your input (since they exist)
      quantity: _values.quantity,
      // pickupAddressText: _values.pickupAddress,
      // deliveryAddressText: _values.receiverAddress,
      // name / email / phone — sender contact
      // senderEntity: _values.senderEntity,
      // shippingScope: _values.destination,
      // cost: _values.cost,
      deliveryDate: _values.deliveryDate
        ? new Date(_values.deliveryDate).toISOString()
        : undefined,
      vehicleTypeIds: isDropoffAcceptEdit
        ? [String((_values.vehicleTypeIds || [])[0] ?? "")]
        : [...(_values.vehicleTypeIds || [])],
    };

    const branchIdTrimEstimate = String(_values.branchId ?? "").trim();
    if (branchIdTrimEstimate) {
      converted.branchId = branchIdTrimEstimate;
    }

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

    const categoryIdTrim = String(_values.categoryId ?? "").trim();
    if (categoryIdTrim) {
      converted.categoryId = categoryIdTrim;
    }

    if (_values.shipmentType == "PARCEL") {
      converted.width = _values?.width;
      converted.height = _values?.height;
      converted.length = _values?.length;
    }
    try {
      const res = await api.post<{ data?: PricingSummaryApiData; message?: string }>(
        "/pricing/order/summary",
        converted,
      );
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
        if (typeof payload.baseFee === "number") breakdown.basePrice = payload.baseFee;
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

      if (vehicles.length === 0 && (isDropoffAcceptEdit || isPickupEstimate)) {
        toast.error("Estimate returned no vehicles to choose from.");
        setOrderSummary(null);
      } else {
        setOrderSummary({ breakdown, vehicles, currency });
        if (isDropoffAcceptEdit && vehicles.length === 1) {
          const v = vehicles[0];
          setFieldValue("selectedVehicleTypeId", v.vehicleTypeId);
          setFieldValue("sessionId", (v.sessionId ?? "").trim());
          setFieldValue("finalPrice", v.totalPrice ?? 0);
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

  const buildWaybillData = (trackingCode: string, v: any): WaybillData => {
    const categoryName = orderItemCategories.find(
      (c) => c.id === v.categoryId,
    )?.name;
    const serviceTypeName = serviceTypes?.find(
      (s) => s.id === v.serviceTypeId,
    )?.name;
    const selectedVehicle = orderSummary?.vehicles.find(
      (veh) =>
        veh.vehicleTypeId === v.selectedVehicleTypeId &&
        (veh.sessionId?.trim() ?? "") === (String(v.sessionId ?? "").trim()),
    );
    const paymentMethodLabel = PAYMENT_METHODS.find(
      (m) => m.id === v.paymentType,
    )?.label;

    const shipperCompanyLine =
      v.fulfillmentType === "PICKUP" && v.pickupAddress
        ? v.pickupAddress
        : v.originCity || "";

    return {
      trackingCode,
      shipper: {
        name: v.name || managerSearch,
        phone: v.phone || selectedCustomerForSender?.phone || "",
        companyLine: shipperCompanyLine || undefined,
      },
      consignee: {
        name: v.receiverName,
        phone: v.receiverPhone,
        companyLine: v.receiverAddress || undefined,
      },
      weightKg: v.weight !== "" && v.weight != null ? Number(v.weight) : undefined,
      dimensions:
        v.shipmentType === "PARCEL"
          ? {
              length: Number(v.length) || 0,
              width: Number(v.width) || 0,
              height: Number(v.height) || 0,
            }
          : undefined,
      goods: categoryName
        ? { categoryName, quantity: Number(v.quantity) || 0 }
        : undefined,
      amount: selectedVehicle?.totalPrice,
      currency: orderSummary?.currency,
      paymentMethodLabel,
      serviceTypeName,
      receivedBy: user?.name || undefined,
      createdAt: new Date(),
    };
  };

  const handleSubmit = async (
    _values: any,
    { resetForm }: { resetForm: () => void },
  ) => {
    if (isDropoffAcceptEdit) {
      return;
    }
    const isPickupSubmit = _values.fulfillmentType === "PICKUP";
    if (isPickupSubmit) {
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
    if (_values.paymentType !== "bank_transfer") {
      toast.error(
        "This payment method is coming soon. Please choose direct bank transfer for now.",
      );
      return;
    }
    console.log(
      "-----------------------------------------: ========: ",
      _values,
    );
    const converted: ConvertedShipment = {
      // receiver info
      receiverName: _values.receiverName,
      receiverEmail: _values.receiverEmail,
      receiverPhone: _values.receiverPhone,

      // service
      serviceTypeId: _values.serviceTypeId,
      fulfillmentType: _values.fulfillmentType,
      isDelivery: isPickupSubmit,

      // package details
      weight: _values.weight,
      isFragile: _values.isFragile,
      shipmentType: _values.shipmentType,
      shippingScope: _values.destination,
      // length: _values.length,
      // width: _values.width,
      // height: _values.height,

      deliveryAddress: {
        lat: String(_values.receiverLatitude),
        long: String(_values.receiverLongitude),
      },

      // unusual item fields
      isUnusual: _values.isUnusual,
      unusualReason: _values.unusualReason,

      // extra from your input (since they exist)
      quantity: _values.quantity,
      // pickupAddressText: _values.pickupAddress,
      // deliveryAddressText: _values.receiverAddress,
      // name / email / phone — sender contact
      // senderEntity: _values.senderEntity,
      // shippingScope: _values.destination,
      // cost: _values.cost,
      deliveryDate: _values.deliveryDate
        ? new Date(_values.deliveryDate).toISOString()
        : undefined,
      selectedVehicleTypeId: _values.selectedVehicleTypeId,
      sessionId: _values.sessionId?.trim(),
      vehicleTypeIds: [...(_values.vehicleTypeIds || [])],
    };

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

    const branchIdTrimSubmit = String(_values.branchId ?? "").trim();
    console.log("branchIdTrimSubmit: ", branchIdTrimSubmit);
    if (branchIdTrimSubmit) {
      converted.branchId = branchIdTrimSubmit;
    }

    applySenderToShipmentPayload(converted, _values);

    const categoryIdTrimSubmit = String(_values.categoryId ?? "").trim();
    if (categoryIdTrimSubmit) {
      converted.categoryId = categoryIdTrimSubmit;
    }

    console.log("values: ", converted);
    if (_values.shipmentType == "PARCEL") {
      converted.width = _values?.width;
      converted.height = _values?.height;
      converted.length = _values?.length;
    }

    converted.paymentType = "bank_transfer";
    converted.bankName = _values.bankName.trim();
    converted.transactionId = _values.transactionId.trim();

    try {
      setLoading(true);

      const res = await api.post("/order", converted);
      console.log("res of create order: ", res.data);
      toast.success(res.data?.message);
      // const tracking = generateTrackingNumber();
      const trackingCode = res.data.data?.trackingCode ?? "";
      setTrackingNumber(trackingCode);
      setWaybillData(buildWaybillData(trackingCode, _values));
      setIsSuccessModalOpen(true);
      resetForm();
      setOrderSummary(null);

      setManagerSearch("");
      setBranchSearch("");
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
    setWaybillData(null);
  };

  const clearManager = (
    setFieldValue: (field: string, value: string) => void,
  ) => {
    setFieldValue("customerId", "");
    setFieldValue("managerName", "");
    setManagerSearch("");
    setSelectedCustomerForSender(null);
  };

  const selectManager = (
    manager: Customer,
    setFieldValue: (field: string, value: string | unknown) => void,
  ) => {
    setFieldValue("customerId", manager.id);
    setFieldValue("managerName", manager.name);
    setManagerSearch(manager.name);
    setSelectedCustomerForSender(manager);
    setShowManagerDropdown(false);
  };

  const prefillSenderFromSelectedCustomer = (
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    if (!selectedCustomerForSender || !canPrefillSender) return;
    setFieldValue("name", selectedCustomerForSender.name ?? "");
    setFieldValue("email", selectedCustomerForSender.email ?? "");
    setFieldValue("phone", selectedCustomerForSender.phone || ETHIO_COUNTRY_CODE);
  };

  const clearBranch = (
    setFieldValue: (field: string, value: string) => void,
  ) => {
    setFieldValue("branchId", "");
    setBranchSearch("");
  };

  const clearPickupFields = (
    setFieldValue: (field: string, value: unknown) => void,
  ) => {
    setFieldValue("pickupAddress", "");
    setFieldValue("pickupLatitude", 0);
    setFieldValue("pickupLongitude", 0);
    setFieldValue("pickupDate", "");
  };

  const selectBranch = (
    branch: { id: string; name: string },
    setFieldValue: (field: string, value: string) => void,
  ) => {
    setFieldValue("branchId", branch.id);
    setBranchSearch(branch.name);
    setShowBranchDropdown(false);
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
    if (!vehicleTypeId) {
      toast.error("Select a vehicle option from the pricing summary.");
      return;
    }
    const sessionId = String(values.sessionId ?? "").trim();
    if (!sessionId) {
      toast.error("Pricing session is missing. Run verify again.");
      return;
    }
    const finalPrice = Number(values.finalPrice);
    if (!Number.isFinite(finalPrice) || finalPrice < 0) {
      toast.error("Enter a valid final price.");
      return;
    }
    try {
      setConfirmingDropoffUpdate(true);
      const res = await api.patch(`/order/validate/${editOrderId}`, {
        weight: values.weight,
        isFragile: values.isFragile,
        isUnusual: values.isUnusual,
        unusualReason: values.unusualReason ?? "",
        validatedNotes: String(values.validatedNotes ?? ""),
        vehicleTypeId,
        sessionId,
        finalPrice,
      });
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
        typeof msg === "string" && msg.trim() ? msg : "Could not confirm update.",
      );
    } finally {
      setConfirmingDropoffUpdate(false);
    }
  };

  return (
    <div className="p-6 bg-white relative">
      {loadingEditOrder && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-lg">
          <Spinner className="h-10 w-10 text-[#EE1E21]" />
        </div>
      )}
      <Formik
        initialValues={formInitialValues}
        enableReinitialize
        validationSchema={OrderValidationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, errors, touched, setFieldTouched }) => {
          const isPickup = values.fulfillmentType === "PICKUP";
          const showVehicleTypes = isDropoffAcceptEdit || isPickup;
          return (
          <Form>
            {/* Header */}
            <header className="relative">
              <div className=" h-full top-0 left-0 flex items-center mb-5">
                <Button
                  type="button"
                  className="!text-[#FADF4B] !size-[40px] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer "
                  onClick={() => navigate(-1)}
                >
                  <IoArrowBack className="text-[#FADF4B] text-lg" />
                </Button>
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
            <div className="rounded-lg overflow-hidden border border-gray-200 mb-6 bg-white">
              {/* Company banner header row */}
              <div className="bg-gradient-to-r from-[#FADF4B] to-[#f2c94c] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 border-b border-gray-200">
              {/* Customer Info */}
              <div className="space-y-4 p-4">
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 border-b border-gray-200">
                  Shipper Details
                </h2>
                <div className="bg-gray-50  rounded-lg space-y-4">
                  <div className="relative">
                    <Label className="mb-2">
                      Customer (optional if sender details below)
                    </Label>
                    <div className="relative">
                      <Input
                        // type="text"
                        placeholder="Search customer "
                        value={managerSearch}
                        onChange={(e) => {
                          console.log(e.target.value);
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
                      {values.customerId && (
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
                        {loadingStaff && (
                          <div className="flex justify-center items-center py-8">
                            <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                          </div>
                        )}
                        {custoemr.length > 0 ? (
                          custoemr.map((manager) => (
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
                  </div>

                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      If you did not pick a customer above, enter sender name,
                      email, and phone (all required). Otherwise only{" "}
                      <span className="font-medium">customerId</span> is sent.
                    </p>
                    <Button
                      type="button"
                      disabled={!canPrefillSender}
                      className={cn(
                        "!w-full text-sm border transition-colors",
                        canPrefillSender
                          ? "!bg-[#EE1E21] hover:!bg-[#cc1a1c] !text-[#FADF4B] border-[#EE1E21] cursor-pointer"
                          : "!bg-gray-100 !text-gray-400 border-gray-200 cursor-not-allowed opacity-80",
                      )}
                      onClick={() =>
                        prefillSenderFromSelectedCustomer(setFieldValue)
                      }
                    >
                      Prefill from selected customer
                    </Button>
                    <FieldTable>
                      <FieldCell
                        label="Name of Sender (required without customer)"
                        error={errors.name && touched.name ? String(errors.name) : undefined}
                      >
                        <Field
                          as={Input}
                          name="name"
                          placeholder="Sender name"
                          className={tableInputClass}
                        />
                      </FieldCell>
                      <FieldCell
                        label="Phone (required without customer)"
                        error={errors.phone && touched.phone ? String(errors.phone) : undefined}
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
                            value={values.phone.replace(ETHIO_COUNTRY_CODE, "")}
                            onChange={(e) =>
                              setFieldValue(
                                "phone",
                                ETHIO_COUNTRY_CODE +
                                  normalizeEthioMobileLocalInput(e.target.value),
                              )
                            }
                            onBlur={() => setFieldTouched("phone", true)}
                            className={tableInputClass}
                          />
                        </div>
                      </FieldCell>
                      <FieldCell
                        label="Email (required without customer)"
                        className="col-span-2"
                        error={errors.email && touched.email ? String(errors.email) : undefined}
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
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 border-b border-gray-200">
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
                        value={values.receiverPhone.replace(ETHIO_COUNTRY_CODE, "")}
                        onChange={(e) =>
                          setFieldValue(
                            "receiverPhone",
                            ETHIO_COUNTRY_CODE +
                              normalizeEthioMobileLocalInput(e.target.value),
                          )
                        }
                        onBlur={() => setFieldTouched("receiverPhone", true)}
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
                    <Label className="mb-1">Delivery Address</Label>
                    <MapAddressSelector
                      onAddressSelect={(addressData) => {
                        setFieldValue("receiverAddress", addressData.address);
                        setFieldValue("receiverLatitude", addressData.latitude);
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

              {/* Shipment Details row */}
              <div className="p-4">
                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-4 border-b border-gray-200">
                  Shipment Details
                </h2>

                <FieldTable>
                  <FieldCell label="Shipment Type">
                    <Select
                      value={String(values.shipmentType)}
                      onValueChange={(val) => setFieldValue("shipmentType", val)}
                    >
                      <SelectTrigger className={cn(tableTriggerClass, "!w-full")}>
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

                  <FieldCell label="Quantity">
                    <Field
                      as={Input}
                      type="number"
                      step="0.1"
                      name="quantity"
                      className={tableInputClass}
                    />
                  </FieldCell>

                  <FieldCell
                    label="Actual Weight of Shipment (kg)"
                    error={errors.weight && touched.weight ? String(errors.weight) : undefined}
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
                  <FieldCell label="Description of Goods">
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
                          No item categories configured. Add them under Orders →
                          Item categories.
                        </p>
                      )}
                    <Style2
                      allowClear
                      variant="borderless"
                      placeholder="Select category"
                      value={values.categoryId || undefined}
                      onChange={(val) => setFieldValue("categoryId", val ?? "")}
                      disabled={
                        loadingOrderItemCategories ||
                        orderItemCategories.length === 0
                      }
                      className="!p-0 [&_.ant-select-selector]:!p-0"
                      style={{ width: "100%" }}
                    >
                      {orderItemCategories.map((cat) => (
                        <Style2.Option key={cat.id} value={cat.id}>
                          {cat.name}
                        </Style2.Option>
                      ))}
                    </Style2>
                  </FieldCell>
                  <FieldCell label="Fragile">
                    <Select
                      value={String(values.isFragile)}
                      onValueChange={(val) =>
                        setFieldValue("isFragile", val === "true" ? true : false)
                      }
                    >
                      <SelectTrigger className={cn(tableTriggerClass, "!w-full")}>
                        <SelectValue placeholder="Fragile ?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">YES</SelectItem>
                        <SelectItem value="false">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldCell>
                  <FieldCell label="Unusual Item">
                    <Select
                      value={String(values.isUnusual)}
                      onValueChange={(val) =>
                        setFieldValue("isUnusual", val === "true" ? true : false)
                      }
                    >
                      <SelectTrigger className={cn(tableTriggerClass, "!w-full")}>
                        <SelectValue placeholder="Is Unusual ?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">YES</SelectItem>
                        <SelectItem value="false">NO</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldCell>
                  {values.unusualReason ? (
                    <FieldCell label="Unusuality Reason" className="col-span-2">
                      <Field
                        as={Textarea}
                        cols={15}
                        name="unusualReason"
                        placeholder="Reason for being unusual"
                        className="border-0 shadow-none px-0 py-0 min-h-[60px] bg-transparent focus-visible:ring-0 text-sm font-semibold text-gray-900"
                      />
                    </FieldCell>
                  ) : (
                    <></>
                  )}
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
                      onValueChange={(val) => setFieldValue("destination", val)}
                    >
                      <SelectTrigger className={cn(tableTriggerClass, "!w-full")}>
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

              {/* Service Info row */}
              <div className="p-4 space-y-4 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-4 border-b border-gray-200">
                Service Info
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1">Service Type</Label>
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
                      className={`py-7 !w-full bg-none border ${
                        errors.serviceTypeId && touched.serviceTypeId
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes?.map((serviceType) => (
                        <SelectItem key={serviceType.id} value={serviceType.id}>
                          {serviceType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.serviceTypeId && touched.serviceTypeId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.serviceTypeId}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-1">Collection Type</Label>
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
                      className={`bg-none py-7 !w-full ${
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
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fulfillmentType}
                    </p>
                  )}
                </div>
              </div>

              {values.fulfillmentType === "PICKUP" && (
                <div>
                  <Label className="mb-1">Pickup Address</Label>
                  <MapAddressSelector
                    onAddressSelect={(addressData) => {
                      setFieldValue("pickupAddress", addressData.address);
                      setFieldValue("pickupLatitude", addressData.latitude);
                      setFieldValue("pickupLongitude", addressData.longitude);
                    }}
                    initialAddress={values.pickupAddress}
                    initialLat={values.pickupLatitude}
                    initialLng={values.pickupLongitude}
                    height="300px"
                  />
                  {errors.pickupAddress && touched.pickupAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.pickupAddress}
                    </p>
                  )}
                </div>
              )}

              {/* Branch — sent on estimate & create whenever selected (PICKUP or DROPOFF) */}
              <div className="relative space-y-3">
                <Label className="mb-2">Branch *</Label>
                <p className="text-sm text-gray-600">
                  Search and select the branch for the order.
                </p>
                <div className="relative">
                  <Input
                    placeholder="Search branch"
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
                  {values.branchId && (
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
                    {loadingBranch && (
                      <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      </div>
                    )}
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
                          {branch.location && (
                            <div className="text-sm text-gray-500">
                              {branch.location}
                            </div>
                          )}
                        </div>
                      ))
                    ) : !loadingBranch ? (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No branches found
                      </div>
                    ) : null}
                  </div>
                )}
                {!values.branchId && (
                  <p className="text-red-500 text-sm mt-1">
                    Branch is required for the order
                  </p>
                )}
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${values.fulfillmentType === "PICKUP" ? "md:grid-cols-2" : ""}`}
              >
                {values.fulfillmentType === "PICKUP" && (
                  <div>
                    <Label className="mb-1" htmlFor="order-pickup-datetime">
                      Pickup Date
                    </Label>
                    <DateTimePicker
                      id="order-pickup-datetime"
                      value={values.pickupDate}
                      onChange={(v) => setFieldValue("pickupDate", v)}
                      onBlur={() => setFieldTouched("pickupDate", true)}
                      placeholder="Pick date and time"
                      error={Boolean(errors.pickupDate && touched.pickupDate)}
                    />
                    {errors.pickupDate && touched.pickupDate && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pickupDate}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Label className="mb-1" htmlFor="order-delivery-datetime">
                    Delivery Date
                  </Label>
                  <DateTimePicker
                    id="order-delivery-datetime"
                    value={values.deliveryDate}
                    onChange={(v) => setFieldValue("deliveryDate", v)}
                    onBlur={() => setFieldTouched("deliveryDate", true)}
                    placeholder="Pick date and time"
                    error={Boolean(errors.deliveryDate && touched.deliveryDate)}
                  />
                  {errors.deliveryDate && touched.deliveryDate && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.deliveryDate}
                    </p>
                  )}
                </div>
              </div>
              {/* <div>
                <Label className="mb-1">Sender Entity</Label>
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

            {/* Row 2: Vehicle Types · Complete Order */}
            <div
              className={cn(
                "grid grid-cols-1 divide-y lg:divide-y-0 divide-gray-200 border-t border-gray-200",
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
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide pb-2 mb-4 border-b border-gray-200">
                Complete Order
              </h2>

              {!isDropoffAcceptEdit && (
                <div className="flex items-center gap-2">
                  <Label
                    className="mb-1 text-lg font-medium"
                    htmlFor="requirement"
                  >
                    Requirement Checklist
                  </Label>
                  <Checkbox className="border-gray-300 ml-2 data-[state=checked]:bg-[#EE1E21] data-[state=checked]:border-[#EE1E21] data-[state=checked]:text-[#FADF4B]" />
                </div>
              )}

              {isDropoffAcceptEdit && !orderSummary && (
                <div className="flex flex-col sm:flex-row gap-3 w-full border-t border-gray-200 pt-4">
                  <Button
                    type="button"
                    disabled={priceLoading}
                    onClick={() => navigate("/order")}
                    className="flex-1 min-h-[48px] bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300"
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

              {!isDropoffAcceptEdit && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    className="flex flex-row justify-center items-center cursor-pointer hover:bg-[#cc1a1c] sm:flex-1"
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

              {orderSummary && !isDropoffAcceptEdit && (
                <div className="space-y-4 pt-2 border-t border-gray-200">
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
                          <dd>{orderSummary.breakdown.actualWeight ?? "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Chargeable weight</dt>
                          <dd>
                            {orderSummary.breakdown.chargeableWeight ?? "—"}
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
                        Select one option below. Submit sends{" "}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          selectedVehicleTypeId
                        </code>{" "}
                        and{" "}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          sessionId
                        </code>{" "}
                        from this estimate.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {orderSummary.vehicles.map((v) => {
                          const selected =
                            values.selectedVehicleTypeId === v.vehicleTypeId &&
                            values.sessionId === (v.sessionId?.trim() ?? "");
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
                                setFieldTouched("selectedVehicleTypeId", true);
                              }}
                              className={cn(
                                "flex gap-3 p-3 rounded-lg border text-left transition-colors",
                                selected
                                  ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                                  : "border-gray-200 bg-white hover:border-gray-300",
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
                      className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {orderSummary && isDropoffAcceptEdit && (
                <div className="space-y-4 pt-2 border-t border-gray-200">
                  <div>
                    <Label className="mb-1">Validation notes</Label>
                    <Field
                      as={Textarea}
                      name="validatedNotes"
                      placeholder="Notes for validation"
                      className="min-h-[100px] py-3"
                    />
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4">
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
                              if (Number.isFinite(fp) && fp >= 0) return fp;
                              if (orderSummary.vehicles.length === 1) {
                                return orderSummary.vehicles[0].totalPrice;
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
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {orderSummary.vehicles.map((v) => {
                          const selected =
                            values.selectedVehicleTypeId === v.vehicleTypeId &&
                            values.sessionId === (v.sessionId?.trim() ?? "");
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
                                setFieldValue("finalPrice", v.totalPrice ?? 0);
                                setFieldTouched("selectedVehicleTypeId", true);
                              }}
                              className={cn(
                                "flex gap-3 p-3 rounded-lg border text-left transition-colors",
                                selected
                                  ? "border-[#EE1E21] bg-[#EE1E21]/5 ring-2 ring-[#EE1E21]"
                                  : "border-gray-200 bg-white hover:border-gray-300",
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
                    <Label className="mb-1">Final price</Label>
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
                      className="flex-1 min-h-[48px] bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300"
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

              {!orderSummary && !isDropoffAcceptEdit && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    disabled={loading}
                    type="button"
                    onClick={() => navigate(-1)}
                    className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full sm:col-span-2"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            </div> {/* end Vehicle+Complete grid */}
            </div> {/* end waybill document */}
          </Form>
          );
        }}
      </Formik>

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={trackingNumber}
        waybill={waybillData ?? undefined}
      />
    </div>
  );
}
