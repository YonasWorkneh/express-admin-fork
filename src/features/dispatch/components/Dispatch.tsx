"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  // IoLocation,
  // IoMap,
  IoRefresh,
  // IoCheckmarkCircle,
  // IoPlay,
  // IoPause,
  IoTrendingUp,
  IoTrendingDown,
  IoStatsChart,
} from "react-icons/io5";
// import { ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DispatchModal from "@/components/common/DispatchModal";
import DriversMapView from "@/components/common/DriversMapView";
import CreateDriverModal from "@/components/common/CreateDriverModal";
import TablePagination from "@/components/common/TablePagination";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import { Skeleton } from "antd";
import type { Order, OrderListResponse, Pagination } from "@/types/types";
import { Spinner } from "@/utils/spinner";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Input } from "@/components/ui/input";

// Mock data for demonstration
// const drivers = [
//   {
//     id: "1",
//     name: "John Smith",
//     status: "On Route",
//     currentLocation: "123 Main St",
//     vehicle: "Van #001",
//     capacity: 15,
//     currentLoad: 8,
//     rating: 4.8,
//     phone: "+1 (555) 123-4567",
//     lastUpdate: "2 min ago",
//     route: "Route A",
//     deliveries: 12,
//     completed: 8,
//     remaining: 4,
//   },
//   {
//     id: "2",
//     name: "Sarah Johnson",
//     status: "Available",
//     currentLocation: "Warehouse",
//     vehicle: "Truck #002",
//     capacity: 25,
//     currentLoad: 0,
//     rating: 4.9,
//     phone: "+1 (555) 234-5678",
//     lastUpdate: "5 min ago",
//     route: "None",
//     deliveries: 0,
//     completed: 0,
//     remaining: 0,
//   },
//   {
//     id: "3",
//     name: "Mike Wilson",
//     status: "On Break",
//     currentLocation: "456 Oak Ave",
//     vehicle: "Van #003",
//     capacity: 12,
//     currentLoad: 5,
//     rating: 4.7,
//     phone: "+1 (555) 345-6789",
//     lastUpdate: "10 min ago",
//     route: "Route B",
//     deliveries: 6,
//     completed: 3,
//     remaining: 3,
//   },
//   {
//     id: "4",
//     name: "Lisa Brown",
//     status: "Offline",
//     currentLocation: "Home",
//     vehicle: "Van #004",
//     capacity: 10,
//     currentLoad: 0,
//     rating: 4.6,
//     phone: "+1 (555) 456-7890",
//     lastUpdate: "1 hour ago",
//     route: "None",
//     deliveries: 0,
//     completed: 0,
//     remaining: 0,
//   },
// ];

// const pendingDeliveries = [
//   {
//     id: "#1002",
//     customer: "Wade Warren",
//     address: "123 Main St, New York, NY",
//     priority: "High",
//     serviceType: "Same-day",
//     weight: 2.5,
//     status: "Ready for Dispatch",
//     estimatedTime: "30 min",
//     distance: "2.3 mi",
//     driver: null,
//   },
//   {
//     id: "#1004",
//     customer: "Esther Howard",
//     address: "456 Oak Ave, Brooklyn, NY",
//     priority: "Normal",
//     serviceType: "Standard",
//     weight: 1.8,
//     status: "Ready for Dispatch",
//     estimatedTime: "45 min",
//     distance: "3.1 mi",
//     driver: null,
//   },
//   {
//     id: "#1007",
//     customer: "Jenny Wilson",
//     address: "789 Pine St, Queens, NY",
//     priority: "Low",
//     serviceType: "Overnight",
//     weight: 3.2,
//     status: "Assigned",
//     estimatedTime: "60 min",
//     distance: "4.5 mi",
//     driver: "John Smith",
//   },
// ];

// const routes = [
//   {
//     id: "route-a",
//     name: "Route A - Downtown",
//     driver: "John Smith",
//     status: "Active",
//     deliveries: 8,
//     completed: 4,
//     remaining: 4,
//     estimatedCompletion: "2:30 PM",
//     totalDistance: "15.2 mi",
//     efficiency: 85,
//   },
//   {
//     id: "route-b",
//     name: "Route B - Brooklyn",
//     driver: "Mike Wilson",
//     status: "Active",
//     deliveries: 6,
//     completed: 3,
//     remaining: 3,
//     estimatedCompletion: "3:15 PM",
//     totalDistance: "12.8 mi",
//     efficiency: 78,
//   },
//   {
//     id: "route-c",
//     name: "Route C - Queens",
//     driver: null,
//     status: "Planned",
//     deliveries: 5,
//     completed: 0,
//     remaining: 5,
//     estimatedCompletion: "4:00 PM",
//     totalDistance: "18.5 mi",
//     efficiency: 0,
//   },
// ];



// const getStatusColor = (status: string) => {
//   switch (status) {
//     case "On Route":
//       return "bg-blue-100 text-blue-700";
//     case "Available":
//       return "bg-green-100 text-green-700";
//     case "On Break":
//       return "bg-yellow-100 text-yellow-700";
//     case "Offline":
//       return "bg-gray-100 text-gray-700";
//     case "Active":
//       return "bg-green-100 text-green-700";
//     case "Planned":
//       return "bg-orange-100 text-orange-700";
//     case "Completed":
//       return "bg-blue-100 text-blue-700";
//     default:
//       return "bg-gray-100 text-gray-700";
//   }
// };

// const getPriorityColor = (priority: string) => {
//   switch (priority) {
//     case "High":
//       return "bg-red-100 text-red-700";
//     case "Normal":
//       return "bg-blue-100 text-blue-700";
//     case "Low":
//       return "bg-gray-100 text-gray-700";
//     default:
//       return "bg-gray-100 text-gray-700";
//   }
// };


export interface Metric {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  color: "green" | "blue" | "purple" | "orange" | "red";
}
export interface DashboardStats {
  totalDispatches: number;

  byStatus: {
    COMPLETED: number;
    ASSIGNED: number;
    PENDING: number;
  };

  byScope: {
    TOWN: number;
    REGIONAL: number;
  };

  byServiceType: {
    EXPRESS: number;
    SAME_DAY: number;
    STANDARD: number;
  };

  assignedToDrivers: number;
  unassigned: number;

  avgWeightPerDispatch: number;
  totalWeight: number;

  dispatchedOrders: number;
  completedOrders: number;
  failedOrders: number;

  vehiclesUsed: number;
  driversUsed: number;

  originBranches: number;
  destinationBranches: number;

  dispatchesToday: number;
  dispatchesThisWeek: number;

  activeDrivers: number;
  activeDriverChange: number;

  deliveriesToday: number;
  deliveryChange: number;

  onTimeRate: number;
  onTimeImprovement: number;

  routeEfficiency: number;
  routeEfficiencyChange: number;

  utilizationChange: number;
}

// Helper to reverse-geocode lat/long to place name using MapAddressSelector.tsx nominatim endpoint
const reverseGeocode = async (lat: string, lng: string) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) return "Unknown";
    const data = await response.json();
    // prefer display_name if exists, fallback to address fields or coordinates
    if (data?.display_name) return data.display_name;
    if (data?.address) {
      return Object.values(data.address).filter(Boolean).join(", ");
    }
    return `(${lat}, ${lng})`;
  } catch (err) {
    return "Unknown";
  }
};

const toDisplayText = (value: unknown, fallback = "-"): string => {
  if (value == null) return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = String(value).trim();
    return text.length ? text : fallback;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["name", "label", "title", "value", "id"]) {
      const v = record[key];
      if (typeof v === "string" || typeof v === "number") {
        const text = String(v).trim();
        if (text.length) return text;
      }
    }
  }
  return fallback;
};

export default function Dispatch() {
  const navigate = useNavigate();
  // const [selectedDriver, setSelectedDriver] = useState("");
  // const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isCreateDriverModalOpen, setIsCreateDriverModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Calculate pagination
  // const totalItems = orders.length;
  // const totalPages = Math.ceil(totalItems / pageSize);
  // const paginatedOrders = orders.slice(startIndex, endIndex);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);

  const [orderSearchText, setOrderSearchText] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderPagination, setOrderPagination] = useState<Pagination | null>(
    null
  );
  const [orderLoading, setOrderLoading] = useState<boolean>(true);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const [isApproveLoading, setIsApproveLoading] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);
  const [isAssignCargoOfficerLoading, setIsAssignCargoOfficerLoading] = useState(false);
  const [showCargoOfficerDropdown, setShowCargoOfficerDropdown] = useState(false);
  const [selectedCargoOfficer,setSelectedCargoOfficer] = useState<any>(null)
  const [loadingCargoOfficer, setLoadingCargoOfficer] = useState(false);
  const  [cargoOfficers,setCargoOfficers] = useState<any>([])
  const  [cargoOfficersPagination,setCargoOfficersPagination] = useState([])
console.log(cargoOfficersPagination)

  const [isAssignCargoOfficerModal,setisAssignCargoOfficerModal] = useState(false)

const [cargoOfficerSearch,setCargoOfficerSearch] = useState("")

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOrderSearchText("")
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const featchOrders = async (page = 1, limit = 10) => {
    try {
      setOrderLoading(true);

      const staffs = await api.get<OrderListResponse>(
        `/order?search=all:${orderSearchText}&page=${page}&pageSize=${limit}`
      );
      setOrders(staffs.data.data);
      setOrderPagination(staffs.data.pagination);
      // toast.success(staffs.data.message);
      setOrderLoading(false);
    } catch (error: any) {
      setOrderLoading(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };
  const geoCacheRef = useRef<Record<
  string, 
  { [purpose: string]: string }
>>({});
const [loading] = useState<boolean>(true);


  useEffect(() => {
    let cancelled = false;
    // Helper to check and decode missing labels for pickup/delivery
    const decodeMissingAddresses = async () => {
      let changed = false;
      const newOrders = await Promise.all(
        orders.map(async (order) => {
          let pickupDisplay = order?.pickupAddress?.landMark || "";
          let deliveryDisplay = order?.deliveryAddress?.landMark || "";
          console.log(pickupDisplay,"order?.pickupAddress",deliveryDisplay)
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
          if (!geoCacheRef.current[cacheKey]) geoCacheRef.current[cacheKey] = {};

          if (newPickup && !geoCacheRef.current[cacheKey].pickup) {
            pickupDisplay = "Loading...";
            geoCacheRef.current[cacheKey].pickup = "Loading...";
            // Fetch and update
            reverseGeocode(order.pickupAddress.lat, order.pickupAddress.long).then(label => {
              geoCacheRef.current[cacheKey].pickup = label;
              // Update this order in the list
              setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === order.id) {
                  return {
                    ...o,
                    pickupAddress: {
                      ...o.pickupAddress,
                      landMark: label,
                      addressLine: label
                    }
                  }
                }
                return o;
              }));
            });
            changed = true;
          } else if (geoCacheRef.current[cacheKey]?.pickup) {
            pickupDisplay = geoCacheRef.current[cacheKey].pickup;
          }

          if (newDelivery && !geoCacheRef.current[cacheKey].delivery) {
            deliveryDisplay = "Loading...";
            geoCacheRef.current[cacheKey].delivery = "Loading...";
            // Fetch and update
            reverseGeocode(order.deliveryAddress.lat, order.deliveryAddress.long).then(label => {
              geoCacheRef.current[cacheKey].delivery = label;
              setOrders(prevOrders => prevOrders.map(o => {
                if (o.id === order.id) {
                  return {
                    ...o,
                    deliveryAddress: {
                      ...o.deliveryAddress,
                      landMark: label,
                      addressLine: label
                    }
                  }
                }
                return o;
              }));
            });
            changed = true;
          } else if (geoCacheRef.current[cacheKey]?.delivery) {
            deliveryDisplay = geoCacheRef.current[cacheKey].delivery;
          }

          return order;
        })
      );
      console.log(cancelled,"cancelled",newOrders,changed)
      // update only if order array changed (to trigger re-render for Loading...) 
      // (not required, as setOrders is called above once label loads)
    };

    // Only decode when not loading and there are orders
    if (!loading && orders.length > 0) {
      decodeMissingAddresses();
    }
    return () => {
      cancelled = true;
    }
    // eslint-disable-next-line
  }, [orders, loading]);


  useEffect(() => {
    featchOrders(currentPage, pageSize);
  }, [orderSearchText, currentPage, pageSize, activeTab]);

  const featchSummary = async () => {
    try {
      setLoadingSummary(true);

      const staffs = await api.get<any>("/report/dashboard/dispatch-summary");
      setSummary(staffs.data?.data);
      // toast.success(staffs.data.message);
      setLoadingSummary(false);
    } catch (error: any) {
      setLoadingSummary(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };
  useEffect(() => {
    featchSummary();
  }, []);
  useEffect(() => {
    if (!summary) return;

    setMetrics([
      {
        title: "Active Drivers",
        value: summary.activeDrivers,
        change: `${summary.activeDriverChange >= 0 ? "+" : ""}${
          summary.activeDriverChange
        } from yesterday`,
        trend: summary.activeDriverChange >= 0 ? "up" : "down",
        color: "green",
      },
      {
        title: "Deliveries Today",
        value: summary.deliveriesToday,
        change: `${summary.deliveryChange >= 0 ? "+" : ""}${
          summary.deliveryChange
        } change`,
        trend: summary.deliveryChange >= 0 ? "up" : "down",
        color: "blue",
      },
      {
        title: "On-Time Rate",
        value: `${summary.onTimeRate}%`,
        change: `${summary.onTimeImprovement >= 0 ? "+" : ""}${
          summary.onTimeImprovement
        }% improvement`,
        trend: summary.onTimeImprovement >= 0 ? "up" : "down",
        color: "green",
      },
      {
        title: "Route Efficiency",
        value: `${summary.routeEfficiency}%`,
        change: `${summary.routeEfficiencyChange >= 0 ? "+" : ""}${
          summary.routeEfficiencyChange
        }% change`,
        trend: summary.routeEfficiencyChange >= 0 ? "up" : "down",
        color: "purple",
      },
    ]);
  }, [summary]);
  // const handleDriverSelection = (driverId: string) => {
  //   setSelectedDriver(driverId);
  // };

  // const handleDeliverySelection = (deliveryId: string) => {
  //   setSelectedDeliveries((prev) =>
  //     prev.includes(deliveryId)
  //       ? prev.filter((id) => id !== deliveryId)
  //       : [...prev, deliveryId]
  //   );
  // };

  // const handleAssignDelivery = () => {
  //   if (selectedDriver && selectedDeliveries.length > 0) {
  //     console.log("Assigning deliveries to driver:", {
  //       driver: selectedDriver,
  //       deliveries: selectedDeliveries,
  //     });
  //     // Handle assignment logic here
  //   }
  // };

  // const handleStartRoute = (routeId: string) => {
  //   console.log("Starting route:", routeId);
  //   // Handle route start logic here
  // };

  // const handlePauseRoute = (routeId: string) => {
  //   console.log("Pausing route:", routeId);
  //   // Handle route pause logic here
  // };

  // const handleCompleteRoute = (routeId: string) => {
  //   console.log("Completing route:", routeId);
  //   // Handle route completion logic here
  // };

  const handleDispatchOrder = (order: any) => {
    console.log("[Dispatch] opening assign driver modal", {
      orderId: order?.id,
      trackingCode: order?.trackingCode,
      status: order?.status,
      fulfillmentType: order?.fulfillmentType,
      shippingScope: order?.shippingScope,
      serviceTypeType: typeof order?.serviceType,
      serviceTypeRaw: order?.serviceType,
      deliveryAddress: order?.deliveryAddress,
    });
    setSelectedOrder(order);
    setIsDispatchModalOpen(true);
  };

  const handleDispatch = (driverId: string, notes?: string) => {
    console.log("Dispatching order:", {
      order: selectedOrder,
      driverId,
      notes,
    });
    featchOrders(currentPage, pageSize);

    // Handle dispatch logic here
    setIsDispatchModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCloseDispatchModal = () => {
    console.log("[Dispatch] closing assign driver modal", {
      selectedOrderId: selectedOrder?.id,
    });
    setIsDispatchModalOpen(false);
    setSelectedOrder(null);
  };

  const handleCreateDriver = () => {
    setIsCreateDriverModalOpen(true);
  };

  const handleSaveDriver = (driverData: unknown) => {
    console.log("Creating new driver:", driverData);
    // Handle driver creation logic here
    setIsCreateDriverModalOpen(false);
  };

  const handleCloseCreateDriverModal = () => {
    setIsCreateDriverModalOpen(false);
  };
  const handleApprove = async () => {
    try {
      setIsApproveLoading(true);
      const res = await api.post("/order/approve", {
        orderId:[ selectedOrder?.id],
        reason: reason,
      });
      toast.success(res.data.message);
      featchOrders(currentPage, pageSize);
      setApproveModal(false);
      setReason("");
      setIsApproveLoading(false);
    } catch (error: any) {
      toast.error(error?.response.data.message || "Something went wrong!");
      setIsApproveLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejectLoading(true);
      const res = await api.patch("/order/cancel", {
        orderId: selectedOrder?.id,
        reason: reason,
      });
      toast.success(res.data.message);
      featchOrders(currentPage, pageSize);
      setApproveModal(false);
      setReason("");
      setIsRejectLoading(false);
    } catch (error: any) {
      toast.error(error?.response.data.message || "Something went wrong!");
      setIsRejectLoading(false);
    }
  };

  const featchCargoOfficer= async (page = 1, limit = 10) => {
    try {
      setLoadingCargoOfficer(true);

      const staffs = await api.get<any>(
        `/users/cargo-officer?search=all:${cargoOfficerSearch}&page=${page}&pageSize=${limit}`
      );
      setCargoOfficers(staffs.data.data?.cargoOfficers);
      setCargoOfficersPagination(staffs.data.pagination);
      // toast.success(staffs.data.message);
      setLoadingCargoOfficer(false);
    } catch (error: any) {
      setLoadingCargoOfficer(false);

      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error); // optional: log the full error
    }
  };
  useEffect(() => {
    featchCargoOfficer();
  }, [cargoOfficerSearch]);
  const handleAssignCargoOfficer = async () => {
    try {
      setIsAssignCargoOfficerLoading(true);
      const res = await api.post("/dispatch/assign-pickup", {
        orderId: selectedOrder?.id,
        driverId: selectedCargoOfficer?.id,
      });
      toast.success(res.data.message);
      featchOrders(currentPage, pageSize);
      setisAssignCargoOfficerModal(false);
      setSelectedCargoOfficer(null);
      setCargoOfficerSearch("");
      setIsAssignCargoOfficerLoading(false);
    } catch (error: any) {
      toast.error(error?.response.data.message || "Something went wrong!");
      setIsAssignCargoOfficerLoading(false);
    }
  };
 

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dispatch Center
            </h1>
            <p className="text-gray-600 mt-2">
              Manage drivers, routes, and deliveries in real-time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <IoRefresh className="h-4 w-4" />
              Refresh
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
                        </div>
                        <div className="flex items-center text-sm">
                          {metric.trend === "up" ? (
                            <IoTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <IoTrendingDown className="h-3 w-3 text-red-500 mr-1" />
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
                      <IoStatsChart className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-6">
          {["orders", "drivers"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`capitalize hover:bg-white ${
                activeTab === tab
                  ? "bg-white text-gray-900"
                  : "text-gray-600 hover:text-gray-900 "
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Orders Table */}
        {activeTab === "orders" && (
          <Card className="bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">Order</TableHead>
                    <TableHead className="text-gray-600 font-medium">
                      <div className="flex items-center">
                        Date
                        {/* <ArrowUpDown className="h-3 w-3 ml-1" /> */}
                      </div>
                    </TableHead>
                    <TableHead className="text-gray-600 font-medium">Pickup Date</TableHead>
                    <TableHead className="text-gray-600 font-medium">Customer</TableHead>
                    <TableHead className="text-gray-600 font-medium">Payment</TableHead>
                    <TableHead className="text-gray-600 font-medium">Total</TableHead>
                    <TableHead className="text-gray-600 font-medium">Pickup address</TableHead>
                    <TableHead className="text-gray-600 font-medium">Items</TableHead>
                    <TableHead className="text-gray-600 font-medium">Destination</TableHead>
                    <TableHead className="text-gray-600 font-medium">Shipping Scope</TableHead>
                    <TableHead className="text-gray-600 font-medium">Service Mode</TableHead>
                    <TableHead className="text-gray-600 font-medium">Status</TableHead>
                    <TableHead className="text-gray-600 font-medium">Batch</TableHead>
                    <TableHead className="text-gray-600 font-medium">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderLoading ? (
                    <TableRow>
                      <TableCell colSpan={13}>
                        <div className="flex justify-center items-center py-8">
                          <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                          <span className="text-gray-600 font-medium">
                            Loading order data...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13}>
                        <div className="flex justify-center items-center py-8">
                          <span className="text-gray-500 font-medium">
                            No orders found
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order, index) => {
                      // Check if batchId is NOT null/undefined/empty to indicate In Batch
                      const hasBatch = order.batchId !== null && order.batchId !== undefined;
                      return (
                        <TableRow
                          key={index}
                          className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() =>
                            navigate(
                              `/order/details/${order.id.replace("#", "")}`,
                            )
                          }
                        >
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            <Button
                              variant="ghost"
                              className="p-0 text-[#EE1E21] hover:text-[#cc1a1c] cursor-pointer"
                            >
                              {order?.trackingCode}
                            </Button>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true
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
                                  hour12: true
                                })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-gray-900">
                            {toDisplayText(order?.customer?.name ?? (order as any)?.customer)}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              // Mock payment statuses
                              const statuses = [
                                { label: "Pending", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", variant: "secondary" },
                                { label: "Success", color: "bg-green-100 text-green-700 hover:bg-green-100", variant: "default" },
                                { label: "Failed",  color: "bg-red-100 text-red-700 hover:bg-red-100", variant: "secondary" }
                              ];
                              // Pick random status each render
                              const mockPayment = statuses[Math.floor(Math.random() * statuses.length)];
                              return (
                                <Badge
                                  // variant={mockPayment.variant}
                                  className={mockPayment.color}
                                >
                                  ● {mockPayment.label}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            {Number.isFinite(Number(order?.finalPrice))
                              ? `${Number(order.finalPrice).toFixed(2)} ETB`
                              : "-"}
                          </TableCell>
                        

                          <TableCell className="text-gray-600">
                    {toDisplayText(
                      (
                      (order?.pickupAddress?.addressLine === "Unknown" ||
                        order?.pickupAddress?.landMark === "Unknown" ||
                        !order?.pickupAddress?.addressLine ||
                        order?.pickupAddress?.addressLine?.trim() === "")
                      ?
                        // Use decoded in-memory label if available, otherwise loading text, otherwise initial
                        (order?.pickupAddress?.landMark && order?.pickupAddress?.landMark !== "Unknown"
                          ? order?.pickupAddress?.landMark
                          : (order?.pickupAddress?.lat && order?.pickupAddress?.long
                              ? "Loading..."
                              : "Unknown"
                            )
                        )
                      : order?.pickupAddress?.landMark
                      )
                    )}
                  </TableCell>

                          <TableCell className="text-gray-600">
                            {(order as any).quantity ?? 0}
                          </TableCell>
                          <TableCell className="text-gray-600">
                    {toDisplayText(
                      (
                      (order?.deliveryAddress?.addressLine === "Unknown" ||
                        order?.deliveryAddress?.landMark === "Unknown" ||
                        !order?.deliveryAddress?.addressLine ||
                        order?.deliveryAddress?.addressLine?.trim() === "")
                      ?
                        (order?.deliveryAddress?.landMark && order?.deliveryAddress?.landMark !== "Unknown"
                          ? order?.deliveryAddress?.landMark
                          : (order?.deliveryAddress?.lat && order?.deliveryAddress?.long
                              ? "Loading..."
                              : "Unknown"
                            )
                        )
                      : order?.deliveryAddress?.landMark
                      )
                    )}
                  </TableCell>
                          <TableCell className="text-gray-600">
                            {toDisplayText(order?.shippingScope)}
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
                              ● {toDisplayText(order?.fulfillmentType)}
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
                              {toDisplayText(order?.status)}
                            </Badge>
                          </TableCell>
                          {/* Batch indicator */}
                          <TableCell>
                            {hasBatch ? (
                              <Badge className="bg-purple-100 text-purple-700">
                                In Batch
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-700">
                                No Batch
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasBatch ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-gray-400 bg-gray-100 cursor-not-allowed"
                                disabled
                              >
                                No Action
                              </Button>
                            ) : ((order.fulfillmentType == "PICKUP" || order.fulfillmentType == "DROPOFF") &&
                                order.status == "CREATED") ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                disabled
                              >
                                Waiting for request
                              </Button>
                            ) : ((order.fulfillmentType == "PICKUP" || order.fulfillmentType == "DROPOFF") &&
                                order.status == "PENDING_APPROVAL") ? (
                              <div className="flex flex-row gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setApproveModal(true); //
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRejectModal(true); //
                                    setSelectedOrder(order);
                                  }}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) 
                            // : (order.fulfillmentType == "DROPOFF" &&
                            //     order.status == "APPROVED" &&
                            //     order?.shippingScope != "TOWN") ? (
                            //   <Button
                            //     variant="ghost"
                            //     size="sm"
                            //     className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                            //     onClick={(e) => {
                            //       e.stopPropagation();
                            //       setisAssignCargoOfficerModal(true);
                            //       setSelectedOrder(order);
                            //     }}
                            //   >
                            //     Assign Cargo Officer
                            //   </Button>
                            // )
                             : ((order.fulfillmentType == "PICKUP" || order.fulfillmentType == "DROPOFF") &&
                                order.status == "APPROVED" &&
                                order?.shippingScope == "TOWN") ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // setIsDialogOpen(true);
                                  // setSelectedOrder(order)
                                  console.log("order to assign driver", order);
                                  handleDispatchOrder(order);
                                }}
                              >
                                Assign Driver
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                                disabled
                              >
                                No Action
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={orderPagination?.totalPages || 1}
              pageSize={orderPagination?.pageSize || 10}
              totalItems={orderPagination?.total || 0}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </Card>
        )}

        {/* Drivers Tab */}
        {activeTab === "drivers" && (
          <DriversMapView onCreateDriver={handleCreateDriver} />
        )}

        {/* Routes Tab */}
        {/* {activeTab === "routes" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IoMap className="h-5 w-5" />
                  Route Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {routes.map((route) => (
                    <Card key={route.id} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {route.name}
                          </CardTitle>
                          <Badge className={getStatusColor(route.status)}>
                            {route.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Driver: {route.driver || "Unassigned"}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Deliveries</p>
                            <p className="font-medium">
                              {route.completed}/{route.deliveries}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Distance</p>
                            <p className="font-medium">{route.totalDistance}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Efficiency</p>
                            <p className="font-medium">{route.efficiency}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">ETA</p>
                            <p className="font-medium">
                              {route.estimatedCompletion}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3">
                          {route.status === "Active" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePauseRoute(route.id)}
                              >
                                <IoPause className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteRoute(route.id)}
                              >
                                <IoCheckmarkCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {route.status === "Planned" && (
                            <Button
                              size="sm"
                              onClick={() => handleStartRoute(route.id)}
                            >
                              <IoPlay className="h-4 w-4 mr-2" />
                              Start Route
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )} */}

        {/* Deliveries Tab */}
        {
          //activeTab === "deliveries" && (
          // <div className="space-y-6">
          //   {/* Assignment Panel */}
          //   {/* <Card>
          //     <CardHeader>
          //       <CardTitle className="flex items-center gap-2">
          //         <IoLocation className="h-5 w-5" />
          //         Delivery Assignment
          //       </CardTitle>
          //     </CardHeader>
          //     <CardContent>
          //       <div className="flex items-center gap-4 mb-4">
          //         <div className="flex-1">
          //           <label className="text-sm font-medium text-gray-600 mb-2 block">
          //             Select Driver
          //           </label>
          //           <Select
          //             value={selectedDriver}
          //             onValueChange={handleDriverSelection}
          //           >
          //             <SelectTrigger className="bg-gray-50 border-0 py-3">
          //               <SelectValue placeholder="Choose a driver" />
          //             </SelectTrigger>
          //             <SelectContent>
          //               {drivers
          //                 .filter((driver) => driver.status === "Available")
          //                 .map((driver) => (
          //                   <SelectItem key={driver.id} value={driver.id}>
          //                     <div className="flex items-center justify-between w-full">
          //                       <span>{driver.name}</span>
          //                       <span className="text-sm text-gray-500 ml-4">
          //                         {driver.vehicle}
          //                       </span>
          //                     </div>
          //                   </SelectItem>
          //                 ))}
          //             </SelectContent>
          //           </Select>
          //         </div>
          //         <Button
          //           onClick={handleAssignDelivery}
          //           disabled={
          //             !selectedDriver || selectedDeliveries.length === 0
          //           }
          //           className="mt-6"
          //         >
          //           Assign Deliveries
          //         </Button>
          //       </div>
          //       <div className="bg-blue-50 p-4 rounded-lg">
          //         <p className="text-blue-700 text-sm">
          //           {selectedDeliveries.length} delivery(ies) selected for
          //           assignment
          //         </p>
          //       </div>
          //     </CardContent>
          //   </Card> */}
          //   {/* Deliveries Table */}
          //   {/* <Card>
          //     <CardHeader>
          //       <CardTitle className="flex items-center gap-2">
          //         <IoLocation className="h-5 w-5" />
          //         All Deliveries
          //       </CardTitle>
          //     </CardHeader>
          //     <CardContent>
          //       <Table>
          //         <TableHeader>
          //           <TableRow>
          //             <TableHead className="w-12">
          //               <Checkbox />
          //             </TableHead>
          //             <TableHead>Order ID</TableHead>
          //             <TableHead>Customer</TableHead>
          //             <TableHead>Address</TableHead>
          //             <TableHead>Priority</TableHead>
          //             <TableHead>Service Type</TableHead>
          //             <TableHead>Status</TableHead>
          //             <TableHead>Driver</TableHead>
          //           </TableRow>
          //         </TableHeader>
          //         <TableBody>
          //           {pendingDeliveries.map((delivery) => (
          //             <TableRow key={delivery.id}>
          //               <TableCell>
          //                 <Checkbox
          //                   checked={selectedDeliveries.includes(delivery.id)}
          //                   onCheckedChange={() =>
          //                     handleDeliverySelection(delivery.id)
          //                   }
          //                 />
          //               </TableCell>
          //               <TableCell className="font-medium">
          //                 {delivery.id}
          //               </TableCell>
          //               <TableCell>{delivery.customer}</TableCell>
          //               <TableCell>
          //                 <div>
          //                   <p className="text-sm">{delivery.address}</p>
          //                   <p className="text-xs text-gray-500">
          //                     {delivery.distance} • {delivery.estimatedTime}
          //                   </p>
          //                 </div>
          //               </TableCell>
          //               <TableCell>
          //                 <Badge
          //                   className={getPriorityColor(delivery.priority)}
          //                 >
          //                   {delivery.priority}
          //                 </Badge>
          //               </TableCell>
          //               <TableCell>
          //                 <Badge variant="outline">
          //                   {delivery.serviceType}
          //                 </Badge>
          //               </TableCell>
          //               <TableCell>
          //                 <Badge
          //                   variant={
          //                     delivery.status === "Assigned"
          //                       ? "default"
          //                       : "secondary"
          //                   }
          //                   className={
          //                     delivery.status === "Assigned"
          //                       ? "bg-green-100 text-green-700"
          //                       : "bg-orange-100 text-orange-700"
          //                   }
          //                 >
          //                   {delivery.status}
          //                 </Badge>
          //               </TableCell>
          //               <TableCell>
          //                 <span className="text-sm text-gray-600">
          //                   {delivery.driver || "Unassigned"}
          //                 </span>
          //               </TableCell>
          //             </TableRow>
          //           ))}
          //         </TableBody>
          //       </Table>
          //     </CardContent>
          //   </Card> */}
          // </div>
          //)}
        }

        {/* Dispatch Modal */}
        {selectedOrder && (
          <DispatchModal
            isOpen={isDispatchModalOpen}
            onClose={handleCloseDispatchModal}
            order={selectedOrder}
            onDispatch={handleDispatch}
          />
        )}

        {/* Create Driver Modal */}
        <CreateDriverModal
          isOpen={isCreateDriverModalOpen}
          onClose={handleCloseCreateDriverModal}
          onSave={handleSaveDriver}
        />

        <ConfirmationModal
          isOpen={approveModal}
          onClose={() => setApproveModal(false)}
          title="Approve Order"
          description="Are you sure you want to approve this order?"
          onConfirm={handleApprove}
          variant="info"
          confirmText="Approve"
          isLoading={isApproveLoading}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="reason "
            className=" placeholder-gray-500 py-4 h-32 resize-none border rounded-md px-4 w-full"
          />
        </ConfirmationModal>

        <ConfirmationModal
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          title="Cancel Order"
          description="Are you sure you want to cancel this order?"
          onConfirm={handleReject}
          variant="info"
          confirmText="Reject"
          isLoading={isRejectLoading}
        >
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="reason "
            className=" placeholder-gray-500 py-4 h-32 resize-none border rounded-md px-4 w-full"
          />
        </ConfirmationModal>

         
      <ConfirmationModal
        isOpen={isAssignCargoOfficerModal}
        onClose={() => setisAssignCargoOfficerModal(false)}
        title="Assign Cargo Officer"
        description="Select a cargo officer to assign for this order pickup."
        onConfirm={handleAssignCargoOfficer}
        variant="info"
        confirmText="Assign"
        isLoading={isAssignCargoOfficerLoading}
      >
     <div>
     <div className="relative">
      <p className=" px-2 py-2">Cargo Officer</p>
                    {/* <Label className="mb-2">Driver *</Label> */}
                   <div className="relative">
                      <Input
                        // type="text"
                        placeholder="Search cargo officer "
                        value={cargoOfficerSearch}
                        onChange={(e) => {
                          console.log(e.target.value);
                          setCargoOfficerSearch(e.target.value);
                          setShowCargoOfficerDropdown(true);
                          if (!e.target.value) {
                            // clearManager(setFieldValue);
                            setSelectedCargoOfficer(null)
                          }
                        }}
                        onFocus={() => setShowCargoOfficerDropdown(true)}
                        onBlur={() =>
                          setTimeout(() => setShowCargoOfficerDropdown(false), 200)
                        }
                        className="py-7"
                      />
                      {selectedCargoOfficer && (
                        <button
                          type="button"
                          onClick={() =>{
                            setSelectedCargoOfficer(null)
                          }}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
  
                    {showCargoOfficerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingCargoOfficer && (
                          <div className="flex justify-center items-center py-8">
                            <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                          </div>
                        )}
                        {cargoOfficers.length > 0 ? (
                          cargoOfficers.map((manager:any) => (
                            <div
                              key={manager?.id}
                              onClick={() =>
                               {setSelectedCargoOfficer(manager)
                               setCargoOfficerSearch(manager?.name)}
                              }
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {manager?.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                ID: {manager?.id}
                              </div>
                              <div className="text-sm text-gray-500">
                                {manager?.email}
                              </div>
                            </div>
                          ))
                        ) : !loadingCargoOfficer ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No cargo officers found
                          </div>
                        ) : null}
                      </div>
                    )} 
                   
                  </div>
     </div>
      </ConfirmationModal>
      </div>
    </div>
  );
}
