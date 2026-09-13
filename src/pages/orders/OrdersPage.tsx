"use client";

import { useCallback, useEffect, useState, useRef, type MouseEvent } from "react";
import {
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MdEdit, MdCancel } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import PrintWaybillButton from "@/components/common/PrintWaybillButton";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type {
  Order,
  OrderListResponse,
  Pagination,
  Driver,
} from "@/types/types";

/** Order summary from /report/dashboard/order-summary */
interface OrderSummaryData {
  totalOrders?: { value: number; change: number };
  thisWeekOrders?: { value: number; change: number };
  thisMonthOrders?: { value: number; change: number };
  returnOrders?: { value: number; change: number };
  fulfilledOrders?: { value: number; change: number };
  onTimeDeliveryRate?: number;
  avgPickupToDeliveryTime?: number;
  avgBranchProcessingTime?: number;
  [key: string]: unknown;
}

/** Driver with optional user display fields from API */
interface DriverWithUser extends Driver {
  name?: string;
  email?: string;
  user?: { name?: string; email?: string };
}
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Skeleton } from "antd";
import { Spinner } from "@/utils/spinner";
import { exportToExcel } from "@/utils/exportToExcel";
import { formatOrderCategoriesSummary } from "@/utils/orderCategories";
import { getOrderTotalAmount } from "@/utils/orderTotal";
import { Label } from "@/components/ui/label";

// Helper to reverse-geocode lat/long to place name using MapAddressSelector.tsx nominatim endpoint
const reverseGeocode = async (lat: string, lng: string) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "Unknown";
    const data = await response.json();
    // prefer display_name if exists, fallback to address fields or coordinates
    if (data?.display_name) return data.display_name;
    if (data?.address) {
      return Object.values(data.address).filter(Boolean).join(", ");
    }
    return `(${lat}, ${lng})`;
  } catch (error: unknown) {
    console.error(error);
    return "Unknown";
  }
};

export interface OrderStats {
  totalOrders: {
    value: number;
    change: number;
  };
  thisWeekOrders: {
    value: number;
    change: number;
  };
  thisMonthOrders: {
    value: number;
    change: number;
  };
  returnOrders: {
    value: number;
    change: number;
  };
  fulfilledOrders: {
    value: number;
    change: number;
  };
  onTimeDeliveryRate: number;
  avgPickupToDeliveryTime: number;
  avgBranchProcessingTime: number;
}

const MiniChart = ({ color }: { color: string }) => {
  const colors = {
    orange: "stroke-orange-500",
    green: "stroke-green-500",
    red: "stroke-red-500",
    teal: "stroke-teal-500",
  };

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" className="ml-auto">
      <path
        d="M2 18 L8 12 L14 15 L20 8 L26 11 L32 5 L38 9 L44 3 L50 7 L56 2"
        fill="none"
        strokeWidth="1.5"
        className={colors[color as keyof typeof colors]}
      />
      <path
        d="M2 18 L8 12 L14 15 L20 8 L26 11 L32 5 L38 9 L44 3 L50 7 L56 2 L60 20 L2 20 Z"
        fill="currentColor"
        className={`${colors[color as keyof typeof colors]} opacity-10`}
      />
    </svg>
  );
};

const tabs = [
  "All",
  "CREATED",
  "ASSIGNED",
  "PENDING",
  // "paid",
  "APPROVED",
  "DISPATCHED",
  // "rejected",
];

interface Metric {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down";
  color: "orange" | "green" | "red" | "teal";
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const navigate = useNavigate();

  // Calculate pagination
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(
    null,
  );
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [searchText, setSearchText] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportLoading, setIsExportLoading] = useState(false);
  // ........................ request states

  const [weight, setWeight] = useState(0);
  const [isFragile, setIsFragile] = useState(true);
  const [isUnusual, setIsUnusual] = useState(true);
  const [unusualReason, setUnusualReason] = useState(
    "i did not understand the items",
  );

  // /................................................
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] =
    useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // const [reason, setReason] = useState("");

  const [driverSearch, setDriverSearch] = useState("");
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [, setPaginationDriver] = useState<Pagination | null>(null);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [driver, setDriver] = useState<DriverWithUser[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithUser | null>(
    null,
  );

  // Reverse geocode memory for this session (orderId-address purpose)
  const geoCacheRef = useRef<Record<string, { [purpose: string]: string }>>({});

  // Only decode orders with missing known pickup/delivery address
  useEffect(() => {
    let cancelled = false;
    // Helper to check and decode missing labels for pickup/delivery
    const decodeMissingAddresses = async () => {
      let changed = false;
      const newOrders = await Promise.all(
        orders.map(async (order) => {
          let pickupDisplay = order?.pickupAddress?.landMark || "";
          let deliveryDisplay = order?.deliveryAddress?.landMark || "";
          console.log(pickupDisplay, "order?.pickupAddress", deliveryDisplay);
          const newPickup =
            order?.pickupAddress &&
            (order?.pickupAddress.addressLine === "Unknown" ||
              order?.pickupAddress.landMark === "Unknown" ||
              !order?.pickupAddress.addressLine ||
              order?.pickupAddress.addressLine.trim() === "") &&
            order?.pickupAddress.lat &&
            order?.pickupAddress.long;

          const newDelivery =
            order?.deliveryAddress &&
            (order?.deliveryAddress.addressLine === "Unknown" ||
              order?.deliveryAddress.landMark === "Unknown" ||
              !order?.deliveryAddress.addressLine ||
              order?.deliveryAddress.addressLine.trim() === "") &&
            order?.deliveryAddress.lat &&
            order?.deliveryAddress.long;

          const cacheKey = order.id;

          // Use cache if available (avoid repeated queries)
          if (!geoCacheRef.current[cacheKey])
            geoCacheRef.current[cacheKey] = {};

          if (newPickup && !geoCacheRef.current[cacheKey].pickup) {
            pickupDisplay = "Loading...";
            geoCacheRef.current[cacheKey].pickup = "Loading...";
            // Fetch and update
            reverseGeocode(
              order.pickupAddress.lat,
              order.pickupAddress.long,
            ).then((label) => {
              geoCacheRef.current[cacheKey].pickup = label;
              // Update this order in the list
              setOrders((prevOrders) =>
                prevOrders.map((o) => {
                  if (o.id === order.id) {
                    return {
                      ...o,
                      pickupAddress: {
                        ...o.pickupAddress,
                        landMark: label,
                        addressLine: label,
                      },
                    };
                  }
                  return o;
                }),
              );
            });
            changed = true;
          } else if (geoCacheRef.current[cacheKey]?.pickup) {
            pickupDisplay = geoCacheRef.current[cacheKey].pickup;
          }

          if (newDelivery && !geoCacheRef.current[cacheKey].delivery) {
            deliveryDisplay = "Loading...";
            geoCacheRef.current[cacheKey].delivery = "Loading...";
            // Fetch and update
            reverseGeocode(
              order.deliveryAddress.lat,
              order.deliveryAddress.long,
            ).then((label) => {
              geoCacheRef.current[cacheKey].delivery = label;
              setOrders((prevOrders) =>
                prevOrders.map((o) => {
                  if (o.id === order.id) {
                    return {
                      ...o,
                      deliveryAddress: {
                        ...o.deliveryAddress,
                        landMark: label,
                        addressLine: label,
                      },
                    };
                  }
                  return o;
                }),
              );
            });
            changed = true;
          } else if (geoCacheRef.current[cacheKey]?.delivery) {
            deliveryDisplay = geoCacheRef.current[cacheKey].delivery;
          }

          return order;
        }),
      );
      console.log(cancelled, "cancelled", newOrders, changed);
      // update only if order array changed (to trigger re-render for Loading...)
      // (not required, as setOrders is called above once label loads)
    };

    // Only decode when not loading and there are orders
    if (!loading && orders.length > 0) {
      decodeMissingAddresses();
    }
    return () => {
      cancelled = true;
    };
  }, [orders, loading]);

  const fetchOrders = useCallback(
    async (page = 1, limit = 10) => {
      try {
        setLoading(true);

        const response = await api.get<OrderListResponse>(
          `/order?search=all:${searchText}&page=${page}&pageSize=${limit}&filter=${activeTab !== "All" ? `status:${activeTab}` : ""}`,
        );
        setOrders(response.data.data);
        setPagination(response.data.pagination);
        setLoading(false);
      } catch (error: unknown) {
        setLoading(false);
        const message =
          (error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : null) || "Something went wrong. Please try again.";
        toast.error(message);
        console.error(error);
      }
    },
    [searchText, activeTab],
  );

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
  }, [fetchOrders, currentPage, pageSize]);

  const fetchOrderSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get<{ data: OrderSummaryData }>(
        "/report/dashboard/order-summary",
      );
      setOrderSummary(res.data.data);
    } catch (error: unknown) {
      const message =
        (error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) || "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoadingSummary(false);
    }
  };
  useEffect(() => {
    if (orderSummary) {
      const newMetrics: Metric[] = [
        {
          title: "Total Orders",
          value: orderSummary.totalOrders?.value ?? 0,
          change: `${orderSummary.totalOrders?.change ?? 0}% last week`,
          trend: (orderSummary.totalOrders?.change ?? 0) >= 0 ? "up" : "down",
          color: "orange",
        },
        {
          title: "Orders This Week",
          value: orderSummary.thisWeekOrders?.value ?? 0,
          change: `${orderSummary.thisWeekOrders?.change ?? 0}% last week`,
          trend:
            (orderSummary.thisWeekOrders?.change ?? 0) >= 0 ? "up" : "down",
          color: "green",
        },
        {
          title: "Return Orders",
          value: orderSummary.returnOrders?.value ?? 0,
          change: `${orderSummary.returnOrders?.change ?? 0}% last week`,
          trend: (orderSummary.returnOrders?.change ?? 0) >= 0 ? "up" : "down",
          color: "red",
        },
        {
          title: "Fulfilled Orders",
          value: orderSummary.fulfilledOrders?.value ?? 0,
          change: `${orderSummary.fulfilledOrders?.change ?? 0}% last week`,
          trend:
            (orderSummary.fulfilledOrders?.change ?? 0) >= 0 ? "up" : "down",
          color: "teal",
        },
      ];

      setMetrics(newMetrics);
    }
  }, [orderSummary]);
  useEffect(() => {
    fetchOrderSummary();
  }, []);
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // const handleApprove = async () => {
  //   try {
  //     setIsApproveLoading(true);
  //     const res = await api.post("/order/approve", {
  //       orderId: selectedOrder?.id,
  //       reason: reason,
  //     });
  //     toast.success(res.data.message);
  //     featchOrders(currentPage, pageSize);
  //     setIsDialogOpen(false);
  //     setIsApproveLoading(false);
  //   } catch (error: any) {
  //     toast.error(error?.response.data.message || "Something went wrong!");
  //     setIsApproveLoading(false);
  //   }
  // };

  const handleRequest = async () => {
    try {
      setIsActionLoading(true);
      const payload = {
        weight,
        isFragile,
        isUnusual,
        unusualReason,
      };
      const res = await api.patch(
        "/order/validate/" + selectedOrder?.id,
        payload,
      );
      toast.success(res.data.message);
      fetchOrders(currentPage, pageSize);
      setIsDialogOpen(false);
      setIsActionLoading(false);
    } catch (error: unknown) {
      const msg =
        (error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) || "Something went wrong!";
      toast.error(msg);
      setIsActionLoading(false);
    }
  };
  const handleRequestTwo = async () => {
    try {
      setIsActionLoading(true);
      const payload = [selectedOrder?.id];
      const res = await api.post("/order/request/approval", payload);
      toast.success(res.data.message);
      fetchOrders(currentPage, pageSize);
      setIsDialogOpen(false);
      setIsActionLoading(false);
    } catch (error: unknown) {
      const msg =
        (error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) || "Something went wrong!";
      toast.error(msg);
      setIsActionLoading(false);
    }
  };
  const handleAssignDriver = async () => {
    try {
      setIsActionLoading(true);
      const res = await api.post("/dispatch/assign-pickup", {
        orderId: selectedOrder?.id,
        driverId: selectedDriver?.id,
      });
      toast.success(res.data.message);
      fetchOrders(currentPage, pageSize);
      setIsAssignDriverDialogOpen(false);
      setIsActionLoading(false);
    } catch (error: unknown) {
      const msg =
        (error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) || "Something went wrong!";
      toast.error(msg);
      setIsActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    try {
      setIsCancelling(true);
      const res = await api.patch("/order/cancel", {
        orderId: orderToCancel.id.replace(/^#/, ""),
        reason: cancelReason.trim(),
      });
      toast.success(res.data?.message || "Order cancelled successfully");
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
      setCancelReason("");
      fetchOrders(currentPage, pageSize);
    } catch (error: unknown) {
      const msg =
        (error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : null) || "Failed to cancel order";
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExportLoading(true);
      exportToExcel("orders", orders, (order) => ({
        "Tracking Code": order.trackingCode ?? "",
        Customer: order.customer?.name ?? "",
        Payment: (() => {
          const status = String(order?.payment?.status ?? "").trim();
          if (status) return status;
          if (order?.paymentCompleted) return "COMPLETED";
          if (order?.payment) return "PENDING";
          return "N/A";
        })(),
        Total: getOrderTotalAmount(order) ?? "",
        "Pickup address": Number(order?.pickupAddress?.city),
        "Delivery Address": Number(order?.deliveryAddress?.city),
        "Fulfillment Type": order?.fulfillmentType,
        Status: order?.status,
      }));
      // Small delay to show loading state for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: unknown) {
      toast.error("Failed to export orders");
      console.error(error);
    } finally {
      setIsExportLoading(false);
    }
  };

  const fetchDriver = useCallback(
    async (page = 1, limit = 10) => {
      try {
        setLoadingDriver(true);

        const response = await api.get<{
          data?: { drivers?: DriverWithUser[] };
          pagination?: Pagination;
        }>(
          `/users/driver?search=all:${driverSearch}&page=${page}&pageSize=${limit}`,
        );
        setDriver(response.data.data?.drivers ?? []);
        setPaginationDriver(response.data.pagination ?? null);
        setLoadingDriver(false);
      } catch (error: unknown) {
        setLoadingDriver(false);
        const message =
          (error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : null) || "Something went wrong. Please try again.";
        toast.error(message);
        console.error(error);
      }
    },
    [driverSearch],
  );

  useEffect(() => {
    fetchDriver();
  }, [fetchDriver]);

  const acceptDropoffButtonClassName =
    "p-2 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 cursor-pointer border border-green-200";

  const navigateToAcceptDropoff = (
    order: Order,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    navigate(
      `/order/new?editMode=dropoffAccept&orderId=${encodeURIComponent(order.id)}`,
    );
  };

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExportLoading || orders.length === 0}
              className="text-gray-600 bg-transparent cursor-pointer"
            >
              {isExportLoading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="text-gray-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
              onClick={() => navigate("/order/item-categories")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Item categories
            </Button>

            <Button
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] !cursor-pointer"
              onClick={() => navigate("/order/new")}
            >
              Create order
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loadingSummary
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-white p-4">
                  <Skeleton
                    active
                    title={{ width: "60%" }}
                    paragraph={{ rows: 2, width: ["100%", "80%"] }}
                  />
                </Card>
              ))
            : metrics.map((metric, index) => (
                <Card key={index} className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {metric.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {metric.value}
                          <span className="text-lg font-normal text-gray-400 ml-1">
                            -
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          {metric.trend === "up" ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span
                            className={
                              metric.trend === "up"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {metric.change}
                          </span>
                        </div>
                      </div>
                      <MiniChart color={metric.color} />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-10 mb-6">
          <div className="flex items-center space-x-1 bg-[#edeaea24] rounded-md p-2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={`hover:bg-white cursor-pointer ${
                  activeTab === tab
                    ? "bg-white text-gray-900 "
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {tab}
              </Button>
            ))}
          </div>
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
            <Input
              onChange={(val) => setSearchText(val.target.value)}
              value={searchText}
              placeholder="Search..."
              className="pl-10 pr-3 w-full py-6"
            />
          </div>
        </div>

        {/* Orders Table */}
        <Card className="bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Order
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    <div className="flex items-center">
                      Date
                      {/* <ArrowUpDown className="h-3 w-3 ml-1" /> */}
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Pickup Date
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Customer
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Payment
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Total
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Pickup address
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Categories
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Destination
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Shipping Scope
                  </TableHead>

                  <TableHead className="text-gray-600 font-medium">
                    Service Mode
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="flex justify-center items-center py-8">
                        <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                        <span className="text-gray-600 font-medium">
                          Loading Order data...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <div className="flex justify-center items-center py-8">
                        <span className="text-gray-500 font-medium">
                          No orders found
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => (
                    <TableRow
                      key={index}
                      className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/order/details/${order.id.replace("#", "")}`)
                      }
                    >
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        <div
                          className="flex items-center gap-1.5 max-w-[240px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate text-[#EE1E21] font-medium">
                            {order?.trackingCode}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-gray-500 hover:text-[#cc1a1c]"
                            aria-label="Copy tracking code"
                            onClick={() => {
                              const code = order.trackingCode ?? "";
                              void navigator.clipboard.writeText(code);
                              toast.success("Tracking code copied");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order.pickupDate
                          ? new Date(order.pickupDate).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {order.customer?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const raw = String(
                            order.payment?.status ??
                              (order.paymentCompleted
                                ? "COMPLETED"
                                : order.payment
                                  ? "PENDING"
                                  : ""),
                          )
                            .trim()
                            .toUpperCase();

                          if (!raw) {
                            return (
                              <span className="text-gray-400 text-sm">—</span>
                            );
                          }

                          const style =
                            raw === "COMPLETED" ||
                            raw === "SUCCESS" ||
                            raw === "PAID"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : raw === "FAILED"
                                ? "bg-red-100 text-red-700 hover:bg-red-100"
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";

                          const label =
                            raw === "COMPLETED" ||
                            raw === "SUCCESS" ||
                            raw === "PAID"
                              ? "Success"
                              : raw === "FAILED"
                                ? "Failed"
                                : raw === "PENDING"
                                  ? "Pending"
                                  : raw.charAt(0) +
                                    raw.slice(1).toLowerCase();

                          return (
                            <Badge className={style}>● {label}</Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {(() => {
                          const total = getOrderTotalAmount(order);
                          return total != null
                            ? `${total.toFixed(2)} ETB`
                            : "—";
                        })()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order?.pickupAddress?.addressLine === "Unknown" ||
                        order?.pickupAddress?.landMark === "Unknown" ||
                        !order?.pickupAddress?.addressLine ||
                        order?.pickupAddress?.addressLine?.trim() === ""
                          ? // Use decoded in-memory label if available, otherwise loading text, otherwise initial
                            order?.pickupAddress?.landMark &&
                            order?.pickupAddress?.landMark !== "Unknown"
                            ? order?.pickupAddress?.landMark
                            : order?.pickupAddress?.lat &&
                                order?.pickupAddress?.long
                              ? "Loading..."
                              : "Unknown"
                          : order?.pickupAddress?.landMark}
                      </TableCell>
                      <TableCell className="text-gray-600 max-w-[220px]">
                        {formatOrderCategoriesSummary(order)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order?.deliveryAddress?.addressLine === "Unknown" ||
                        order?.deliveryAddress?.landMark === "Unknown" ||
                        !order?.deliveryAddress?.addressLine ||
                        order?.deliveryAddress?.addressLine?.trim() === ""
                          ? order?.deliveryAddress?.landMark &&
                            order?.deliveryAddress?.landMark !== "Unknown"
                            ? order?.deliveryAddress?.landMark
                            : order?.deliveryAddress?.lat &&
                                order?.deliveryAddress?.long
                              ? "Loading..."
                              : "Unknown"
                          : order?.deliveryAddress?.landMark}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {order?.shippingScope}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.fulfillmentType === "Fulfilled"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.fulfillmentType === "Fulfilled"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          }
                        >
                          ● {order.fulfillmentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            order.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                        {/* -- ACTION BUTTON LOGIC -- */}
                        {(() => {
                          // Extract values for readability
                          const status = order?.status;
                          const scope = (
                            order?.shippingScope || ""
                          ).toUpperCase();
                          const fulfillmentType = (
                            order?.fulfillmentType || ""
                          ).toUpperCase();

                          // 1. Status-based batch logic [not implemented here, just order logic]
                          // 2. Order logic

                          // 1. STATUS: CREATED
                          if (status === "CREATED") {
                            if (
                              scope === "TOWN" &&
                              fulfillmentType === "PICKUP"
                            ) {
                              // 1. Status: CREATED, ShippingScope: TOWN, fulfillmentType: PICKUP => Action Request Approval
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDialogOpen(true);
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Request Approval
                                </Button>
                              );
                            }
                            if (
                              scope === "TOWN" &&
                              fulfillmentType === "DROPOFF"
                            ) {
                              // CREATED + DROPOFF: accept dropoff — prefilled editable order form
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={acceptDropoffButtonClassName}
                                  onClick={(e) =>
                                    navigateToAcceptDropoff(order, e)
                                  }
                                >
                                  Accept Dropoff
                                </Button>
                              );
                            }
                            if (
                              (scope === "REGIONAL" ||
                                scope === "INTERNATIONAL") &&
                              fulfillmentType === "PICKUP"
                            ) {
                              // 3. Status: CREATED, ShippingScope: REGIONAL/INTERNATIONAL, fulfillmentType: PICKUP => Action Request Approval
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDialogOpen(true);
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Request Approval
                                </Button>
                              );
                            }
                            if (
                              (scope === "REGIONAL" ||
                                scope === "INTERNATIONAL") &&
                              fulfillmentType === "DROPOFF"
                            ) {
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={acceptDropoffButtonClassName}
                                  onClick={(e) =>
                                    navigateToAcceptDropoff(order, e)
                                  }
                                >
                                  Accept Dropoff
                                </Button>
                              );
                            }
                          }
                          // 2. STATUS: PICKED_UP
                          if (
                            status === "PICKED_UP" &&
                            (scope === "TOWN" ||
                              scope === "REGIONAL" ||
                              scope === "INTERNATIONAL") &&
                            fulfillmentType === "PICKUP"
                          ) {
                            // 5/6. Status: PICKED_UP, any scope, fulfillmentType: PICKUP => Action Accept Dropoff
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={acceptDropoffButtonClassName}
                                onClick={(e) =>
                                  navigateToAcceptDropoff(order, e)
                                }
                              >
                                Accept Dropoff
                              </Button>
                            );
                          }
                          // 3. STATUS: DROPPED_OFF, fulfillmentType: PICKUP
                          // REGIONAL/INTERNATIONAL orders fall through to "No Action" below.
                          if (
                            status === "DROPPED_OFF" &&
                            scope === "TOWN" &&
                            fulfillmentType === "PICKUP"
                          ) {
                            // 7. Status: DROPPED_OFF, scope: TOWN, fulfillmentType: PICKUP => Action Validate/request approval
                            return (
                              <div className="flex flex-row gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDialogOpen(true);
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Validate
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDialogOpen(true);
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Request Approval
                                </Button>
                              </div>
                            );
                          }
                          // If no logic matched:
                          return (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-gray-400 bg-gray-50 cursor-not-allowed"
                              disabled
                            >
                              No Action
                            </Button>
                          );
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/order/edit/${order.id.replace(/^#/, "")}`);
                          }}
                        >
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={["CANCELLED", "DELIVERED", "COMPLETED"].includes(
                            (order?.status || "").toUpperCase(),
                          )}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderToCancel(order);
                            setCancelReason("");
                            setIsCancelDialogOpen(true);
                          }}
                        >
                          <MdCancel className="h-4 w-4" />
                        </Button>
                        <PrintWaybillButton
                          orderId={order.id.replace(/^#/, "")}
                          iconOnly
                        />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            pageSize={pagination?.pageSize || 10}
            totalItems={pagination?.total || 0}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      </main>

      {/* <ConfirmationModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Approve Staff Member"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        onConfirm={handleApprove}
        variant="info"
        confirmText="Approve"
        // loading={deleteLaoding}
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="reason "
          className=" placeholder-gray-500 py-4 h-32 resize-none border rounded-md px-4 w-full"
        />
      </ConfirmationModal> */}

      <ConfirmationModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Request Approval"
        description="Submit a request for approval. Please review the items information as needed before sending your request."
        onConfirm={
          selectedOrder?.fulfillmentType == "DROPOFF"
            ? handleRequest
            : handleRequestTwo
        }
        variant="info"
        confirmText="Request"
        isLoading={isActionLoading}
      >
        {selectedOrder?.fulfillmentType == "DROPOFF" && (
          <>
            {/* Weight */}
            <div className="mb-4">
              <label className="block mb-1 font-medium">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="border rounded-md px-4 py-2 w-full"
                placeholder="Enter weight"
              />
            </div>

            {/* Fragile */}
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                checked={isFragile}
                onCheckedChange={(checked) => setIsFragile(checked as boolean)}
              />
              <span className="font-medium">Is Fragile?</span>
            </div>

            {/* Unusual */}
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                checked={isUnusual}
                onCheckedChange={(checked) => setIsUnusual(checked as boolean)}
              />
              <span className="font-medium">Is Unusual?</span>
            </div>

            {/* Unusual Reason */}
            {isUnusual && (
              <div>
                <textarea
                  value={unusualReason}
                  onChange={(e) => setUnusualReason(e.target.value)}
                  placeholder="Explain why this items is unusual"
                  className="placeholder-gray-500 py-4 h-32 resize-none border rounded-md px-4 w-full"
                />
              </div>
            )}
          </>
        )}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isAssignDriverDialogOpen}
        onClose={() => setIsAssignDriverDialogOpen(false)}
        title="Assign Driver"
        description=""
        onConfirm={handleAssignDriver}
        variant="info"
        confirmText="Assign"
        isLoading={isActionLoading}
      >
        <div className="relative">
          <Label className="mb-2">Driver *</Label>
          <div className="relative">
            <Input
              // type="text"
              placeholder="Search driver "
              value={driverSearch}
              onChange={(e) => {
                console.log(e.target.value);
                setDriverSearch(e.target.value);
                setShowDriverDropdown(true);
                if (!e.target.value) {
                  // clearManager(setFieldValue);
                  setSelectedDriver(null);
                }
              }}
              onFocus={() => setShowDriverDropdown(true)}
              onBlur={() => setTimeout(() => setShowDriverDropdown(false), 200)}
              className="py-7"
            />
            {selectedDriver && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDriver(null);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {showDriverDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {loadingDriver && (
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                </div>
              )}
              {driver.length > 0 ? (
                driver.map((driverItem) => (
                  <div
                    key={driverItem.id}
                    onClick={() => {
                      setSelectedDriver(driverItem);
                      setDriverSearch(
                        driverItem.name ?? driverItem.user?.name ?? "",
                      );
                    }}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {driverItem.name ?? driverItem.user?.name ?? "Unknown"}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {driverItem.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {driverItem.email ?? driverItem.user?.email ?? ""}
                    </div>
                  </div>
                ))
              ) : !loadingDriver ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No drivers found
                </div>
              ) : null}
            </div>
          )}
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Cancel Order"
        description="This will cancel the order. Please provide a reason before confirming."
        onConfirm={handleCancelOrder}
        variant="danger"
        confirmText="Cancel Order"
        cancelText="Back"
        isLoading={isCancelling}
      >
        <div>
          <Label className="mb-2">Reason *</Label>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Customer requested cancellation"
            className="min-h-[100px] py-3"
          />
        </div>
      </ConfirmationModal>
    </div>
  );
}
