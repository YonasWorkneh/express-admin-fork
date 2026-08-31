import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import { Spinner } from "@/utils/spinner";
import {
  ArrowLeft,
  User,
  SlidersHorizontal,
  Wallet,
  Contact,
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  Building2,
  Bell,
  MapPin,
} from "lucide-react";

type CustomerOrder = {
  trackingCode?: string;
  createdAt?: string;
  status?: string;
  finalPrice?: number | string | null;
  estimatedPrice?: number | string | null;
  shippingScope?: string;
  serviceType?: string | { name?: string };
  category?: { name?: string; label?: string };
  actualDeliveryAt?: string | null;
};

type AddressEntry = {
  label?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
};

type CustomerDetail = {
  customId?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  customerType?: string;
  isActive?: boolean;
  ordersCount?: number;
  ordersTotalPrice?: number;
  loyaltyPoints?: number;
  companyName?: string | null;
  contactPerson?: string | null;
  preferredLanguage?: string | null;
  creditLimit?: string | number | null;
  paymentTerms?: string | null;
  discountRate?: string | number | null;
  preferredDeliveryTime?: string | null;
  specialInstructions?: string | null;
  createdAt?: string;
  updatedAt?: string;
  address?: string | { label?: string; city?: string; addressLine?: string } | null;
  addresses?: AddressEntry[];
  wallet?: { balance?: string | number | null } | null;
  corporateInfo?: { companyName?: string; contactPerson?: string } | null;
  notificationPreference?: {
    email?: boolean;
    inApp?: boolean;
    push?: boolean;
  } | null;
  preferences?: unknown;
  orders?: CustomerOrder[];
  createdBy?: string;
};

const toText = (value: unknown, fallback = "—"): string => {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized || fallback;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const candidate = record.label ?? record.name ?? record.addressLine ?? record.city;
    if (typeof candidate === "string" || typeof candidate === "number") {
      const normalized = String(candidate).trim();
      return normalized || fallback;
    }
  }
  return fallback;
};

/** Backend may return `data` as a single object or a one-item list. */
function extractCustomerPayload(
  raw: unknown,
): CustomerDetail | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (first && typeof first === "object") return first as CustomerDetail;
    return null;
  }
  if (typeof raw === "object") return raw as CustomerDetail;
  return null;
}

function formatAddressLine(a: AddressEntry): string {
  const line =
    toText(a.addressLine, "") ||
    toText(a.label, "");
  const city = toText(a.city, "");
  const state = toText(a.state, "");
  const country = toText(a.country, "");
  const parts = [line, city, state, country].filter((p) => p && p !== "—");
  return parts.length ? parts.join(" · ") : toText(a.label);
}

function orderDeliveryLabel(order: CustomerOrder): string | null {
  if (order.actualDeliveryAt) return "Delivered";
  if (order.status) return String(order.status);
  return null;
}

export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getStatusColor = (isActive: boolean) =>
    isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "CORPORATE":
        return "bg-purple-100 text-purple-700";
      case "INDIVIDUAL":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchCustomerDetail = async () => {
      if (!id) {
        setFetchError("Missing customer id");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setFetchError(null);
        const res = await api.get<{
          data?: CustomerDetail | CustomerDetail[];
          message?: string;
        }>(`/users/customer/detail/${id}`);
        if (!cancelled) {
          setCustomer(extractCustomerPayload(res.data?.data));
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Failed to load customer detail.";
        if (!cancelled) {
          setFetchError(message);
          setCustomer(null);
        }
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchCustomerDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const recentOrders = useMemo(() => {
    if (!Array.isArray(customer?.orders)) return [];
    return customer.orders.slice(0, 8);
  }, [customer?.orders]);

  const addressLines = useMemo(() => {
    if (!customer?.addresses?.length) return [];
    const lines = customer.addresses.map(formatAddressLine).filter(Boolean);
    return [...new Set(lines)];
  }, [customer?.addresses]);

  const lastActivityDate = useMemo(() => {
    if (customer?.updatedAt) {
      return new Date(customer.updatedAt).toLocaleDateString();
    }
    if (!customer?.orders?.length) return "—";
    const times = customer.orders
      .map((o) => (o.createdAt ? new Date(o.createdAt).getTime() : 0))
      .filter(Boolean);
    if (!times.length) return "—";
    return new Date(Math.max(...times)).toLocaleDateString();
  }, [customer?.updatedAt, customer?.orders]);

  const walletBalance = customer?.wallet?.balance;
  const corporate = customer?.corporateInfo;
  const notif = customer?.notificationPreference;

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Spinner className="h-6 w-6 text-[#EE1E21]" />
          <span>Loading customer details...</span>
        </div>
      </div>
    );
  }

  if (fetchError || !customer) {
    return (
      <div className="min-h-screen p-6 max-w-7xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/customer")}
          className="p-2 rounded-full bg-[#EE1E21]/10 hover:bg-[#EE1E21]/20 mb-4"
        >
          <ArrowLeft className="h-4 w-4 text-[#EE1E21]" />
        </Button>
        <p className="text-red-600">{fetchError || "Customer not found."}</p>
      </div>
    );
  }

  const customerType = toText(customer.customerType, "UNKNOWN");
  const displayStatus = customer.isActive ? "Active" : "Inactive";
  const primaryAddress = customer.addresses?.[0];
  const displayAddress =
    addressLines[0] ||
    toText(customer.address) ||
    (primaryAddress ? formatAddressLine(primaryAddress) : "—");
  const displayCity =
    toText(
      primaryAddress?.city ??
        (typeof customer.address === "object" && customer.address
          ? customer.address.city
          : null),
      "—",
    );
  const totalSpent = Number(customer.ordersTotalPrice ?? 0);
  const registrationDate = customer.createdAt
    ? new Date(customer.createdAt).toLocaleDateString()
    : "—";

  const formatServiceType = (value: unknown) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const name = (value as { name?: string }).name;
      if (name) return name;
    }
    return "—";
  };

  const formatCategory = (value: unknown) => {
    if (value && typeof value === "object") {
      const name = (value as { name?: string }).name;
      if (name) return name;
    }
    return "—";
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/customer")}
            className="p-2 rounded-full bg-[#EE1E21]/10 hover:bg-[#EE1E21]/20"
          >
            <ArrowLeft className="h-4 w-4 text-[#EE1E21]" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {toText(customer.name)}
            </h1>
            <p className="text-gray-500 text-sm">
              Manage customer information and service preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <User className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Customer Name
                  </Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {toText(customer.name)}
                  </p>
                  {customer.customId ? (
                    <p className="text-sm text-gray-500">
                      Reference: {customer.customId}
                    </p>
                  ) : null}
                  <p className="text-sm text-gray-500">{toText(customer.email)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Customer Status
                  </Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getStatusColor(Boolean(customer.isActive))}>
                      ● {displayStatus}
                    </Badge>
                    <Badge className={getTypeColor(customerType)}>
                      {customerType}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Total Orders
                  </Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {customer.ordersCount ?? 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Total Spent
                  </Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalSpent.toLocaleString()} ETB
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Credit points
                  </Label>
                  <p className="text-lg font-semibold text-gray-900">
                    {typeof customer.loyaltyPoints === "number"
                      ? customer.loyaltyPoints
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <SlidersHorizontal className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Customer type
                  </Label>
                  <p className="font-medium mt-1">{customerType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Notification channels
                  </Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {notif ? (
                      <>
                        {notif.email ? (
                          <Badge className="bg-[#EE1E21]/10 text-[#EE1E21]">Email</Badge>
                        ) : null}
                        {notif.inApp ? (
                          <Badge className="bg-slate-100 text-slate-700">In-app</Badge>
                        ) : null}
                        {notif.push ? (
                          <Badge className="bg-amber-100 text-amber-800">Push</Badge>
                        ) : null}
                        {!notif.email && !notif.inApp && !notif.push ? (
                          <span className="text-gray-500">None enabled</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-gray-500">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-2 border-t text-gray-600">
                <Bell className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  {customer.preferences == null
                    ? "No additional preferences on file."
                    : "Additional preferences are saved for this account."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Wallet className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Wallet balance</Label>
                  <p className="font-medium mt-1">
                    {walletBalance != null && String(walletBalance).trim() !== ""
                      ? `${Number(walletBalance).toLocaleString()} ETB`
                      : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Credit limit</Label>
                  <p className="font-medium mt-1">{toText(customer.creditLimit)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment terms</Label>
                  <p className="font-medium mt-1">{toText(customer.paymentTerms)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Discount rate</Label>
                  <p className="font-medium mt-1">{toText(customer.discountRate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Preferred delivery time</Label>
                  <p className="font-medium mt-1">{toText(customer.preferredDeliveryTime)}</p>
                </div>
                {corporate?.companyName ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Company</Label>
                    <p className="font-medium mt-1">{corporate.companyName}</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Contact className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Phone
                  </Label>
                  <div className="flex items-center space-x-1 min-w-0">
                    <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 text-right break-all">
                      {customer.phone
                        ? String(customer.phone)
                        : "Not provided"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium text-gray-600">
                    Email
                  </Label>
                  <div className="flex items-center space-x-1 min-w-0">
                    <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-900 text-right break-all">
                      {toText(customer.email)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-1">
                    City
                  </Label>
                  <p className="text-sm text-gray-900">{displayCity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600 block mb-1">
                    Primary location
                  </Label>
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {displayAddress}
                  </p>
                </div>
                {addressLines.length > 1 ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-600 block mb-2">
                      All saved addresses
                    </Label>
                    <ul className="space-y-2">
                      {addressLines.map((line, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-gray-800 p-2 rounded-md bg-gray-50"
                        >
                          <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {(corporate?.companyName || customer.companyName) && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-600">
                      Company
                    </Label>
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {corporate?.companyName || customer.companyName}
                      </span>
                    </div>
                  </div>
                )}
                {(corporate?.contactPerson || customer.contactPerson) && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-600">
                      Contact person
                    </Label>
                    <span className="text-sm text-gray-900">
                      {corporate?.contactPerson || customer.contactPerson}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Calendar className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Customer Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Registration Date
                  </Label>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {registrationDate}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Last activity
                  </Label>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {lastActivityDate}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-600">
                  Special Instructions
                </Label>
                <p className="text-sm text-gray-900 mt-1">
                  {toText(customer.specialInstructions)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <TrendingUp className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Recent Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const amount = Number(order.finalPrice ?? order.estimatedPrice ?? 0);
                    const statusLabel = orderDeliveryLabel(order);
                    return (
                      <div
                        key={`${order.trackingCode ?? "order"}-${order.createdAt ?? ""}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {toText(order.trackingCode)}
                            </span>
                            {statusLabel ? (
                              <Badge
                                className={
                                  statusLabel === "Delivered"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-slate-100 text-slate-700"
                                }
                              >
                                {statusLabel}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {toText(order.shippingScope)} ·{" "}
                            {formatServiceType(order.serviceType)} ·{" "}
                            {formatCategory(order.category)}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString()
                                : "—"}
                            </span>
                            <span>{amount.toLocaleString()} ETB</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No recent orders found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
