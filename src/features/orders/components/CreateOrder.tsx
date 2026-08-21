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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Yup from "yup";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type { Branch, BranchListResponse } from "@/types/types";
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
  const pickupLat = Number.parseFloat(String(o.pickupAddress?.lat ?? 0)) || 0;
  const pickupLng = Number.parseFloat(String(o.pickupAddress?.long ?? 0)) || 0;
  const pickupAddrParts = [
    o.pickupAddress?.addressLine,
    o.pickupAddress?.landMark,
    o.pickupAddress?.city,
  ].filter(Boolean);

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

/** Input styling that reads clearly as an editable field inside a `FieldCell` */
const tableInputClass =
  "rounded-md border border-gray-300 bg-gray-50 shadow-none h-9 px-2.5 py-1.5 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 transition-colors hover:border-primary/50 hover:bg-white focus-visible:border-primary focus-visible:bg-white focus-visible:ring-primary/20 focus-visible:ring-[3px]";
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
        "grid grid-cols-2 gap-px bg-primary/20 border border-primary/20 rounded-lg overflow-hidden",
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
      <img
        src="/images/cbe.png"
        alt="CBE"
        className={cn(c, "object-contain")}
      />
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
    <div className="space-y-4 pt-2 border-t border-primary">
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

      {(values.paymentType === "cbe" || values.paymentType === "telebirr") && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {values.paymentType === "cbe" ? "CBE Birr" : "telebirr"} payments are
          coming soon. Please choose direct bank transfer for now.
        </div>
      )}

      {values.paymentType === "bank_transfer" && (
        <div className="rounded-lg border border-primary bg-white p-4 space-y-3">
          <div>
            <Label className="mb-1 font-bold">Bank name</Label>
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
            <Label className="mb-1 font-bold">Transaction ID</Label>
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

function applySenderToShipmentPayload(
  converted: ConvertedShipment,
  values: {
    name?: string;
    email?: string;
    phone?: string;
  },
) {
  converted.name = String(values.name ?? "").trim();
  converted.email = String(values.email ?? "").trim();
  converted.phone = String(values.phone ?? "").trim();
}

/** Builds the API shipment payload from form values; shared so edit-mode can diff against the originally loaded values. */
function buildConvertedShipment(
  _values: any,
  isGeneralEdit: boolean,
): ConvertedShipment {
  const isPickupSubmit = _values.fulfillmentType === "PICKUP";
  const converted: ConvertedShipment = {
    receiverName: _values.receiverName,
    receiverEmail: _values.receiverEmail,
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

    quantity: _values.quantity,
    deliveryDate: _values.deliveryDate
      ? new Date(_values.deliveryDate).toISOString()
      : undefined,
    vehicleTypeIds: [...(_values.vehicleTypeIds || [])],
  };

  if (!isGeneralEdit) {
    converted.selectedVehicleTypeId = _values.selectedVehicleTypeId;
    converted.sessionId = _values.sessionId?.trim();
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

  const branchIdTrim = String(_values.branchId ?? "").trim();
  if (branchIdTrim) {
    converted.branchId = branchIdTrim;
  }

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

  if (!isGeneralEdit) {
    converted.paymentType = "bank_transfer";
    converted.bankName = _values.bankName.trim();
    converted.transactionId = _values.transactionId.trim();
  }

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
            ? "Select exactly one vehicle type."
            : "Choose suitable vehicle categories for this shipment (based on service type)."}
        </p>
      </div>

      <div>
        <Label className="mb-2 font-bold">Selection *</Label>
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
  const [waybillData, setWaybillData] = useState<WaybillData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthState();

  const [priceLoading, setPriceLoading] = useState(false);

  // Branch selection state (for DROPOFF)
  const [loadingBranch, setLoadingBranch] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const { data: serviceTypes } = useServiceTypes();
  const {
    data: orderItemCategories = [],
    isLoading: loadingOrderItemCategories,
    isError: orderItemCategoriesError,
  } = useOrderItemCategories();

  const fetchBranches = async () => {
    try {
      setLoadingBranch(true);

      const response = await api.get<BranchListResponse>(
        `/branch?search=all:&page=${1}&pageSize=${100}`,
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
        (veh.sessionId?.trim() ?? "") === String(v.sessionId ?? "").trim(),
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
        name: v.name || "",
        phone: v.phone || "",
        companyLine: shipperCompanyLine || undefined,
      },
      consignee: {
        name: v.receiverName,
        phone: v.receiverPhone,
        companyLine: v.receiverAddress || undefined,
      },
      weightKg:
        v.weight !== "" && v.weight != null ? Number(v.weight) : undefined,
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
    if (!isGeneralEdit && _values.paymentType !== "bank_transfer") {
      toast.error(
        "This payment method is coming soon. Please choose direct bank transfer for now.",
      );
      return;
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

      const res = await api.post("/order", converted);
      console.log("res of create order: ", res.data);
      toast.success(res.data?.message);
      // const tracking = generateTrackingNumber();
      const trackingCode = res.data.data?.trackingCode ?? "";
      setTrackingNumber(trackingCode);
      setCreatedOrderId(res.data.data?.id ?? "");
      setWaybillData(buildWaybillData(trackingCode, _values));
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
    setWaybillData(null);
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
        {({ values, setFieldValue, errors, touched, setFieldTouched }) => {
          const isPickup = values.fulfillmentType === "PICKUP";
          const showVehicleTypes = isDropoffAcceptEdit || isPickup;
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
                        <Label className="mb-1 font-bold">Delivery Address</Label>
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
                              No item categories configured. Add them under
                              Orders → Item categories.
                            </p>
                          )}
                        <Style2
                          allowClear
                          variant="borderless"
                          placeholder="Select category"
                          value={values.categoryId || undefined}
                          onChange={(val) =>
                            setFieldValue("categoryId", val ?? "")
                          }
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
                        <Label className="mb-1 text-xs font-bold">Service Type</Label>
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
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes?.map((serviceType) => (
                              <SelectItem
                                key={serviceType.id}
                                value={serviceType.id}
                              >
                                {serviceType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.serviceTypeId && touched.serviceTypeId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.serviceTypeId}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="mb-1 text-xs font-bold">Collection Type</Label>
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
                        <Label className="mb-1 text-xs font-bold">Pickup Address</Label>
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
                        <Label className="mb-1 text-xs font-bold">Branch *</Label>
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
                                  : "Select branch"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!values.branchId && (
                          <p className="text-red-500 text-xs mt-1">
                            Branch is required for the order
                          </p>
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
                          <Label className="mb-1 font-bold">Validation notes</Label>
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
        waybill={waybillData ?? undefined}
        orderId={createdOrderId || undefined}
      />
    </div>
  );
}
