"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/utils/spinner";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import PrintWaybillButton from "@/components/common/PrintWaybillButton";
import api from "@/lib/api/api";
import toast from "react-hot-toast";

import {
  IoArrowBack,
  IoPerson,
  IoLocation,
  IoTime,
  IoCube,
  IoShield,
  IoMap,
  IoList,
  IoCar,
} from "react-icons/io5";
import { fetchOrderById } from "@/lib/api/orders";
import {
  formatOrderCategoriesSummary,
  getOrderCategoriesTotalQuantity,
  normalizeOrderCategoryLines,
} from "@/utils/orderCategories";
import {
  fetchFleetVehicleTypeById,
  type FleetVehicleTypeListItem,
} from "@/lib/api/fleet";
import type { OrderDetailApi, OrderPriceLog } from "@/types/orderDetail";

function getServiceTypeLabel(st: OrderDetailApi["serviceType"]): string {
  if (st == null) return "";
  if (typeof st === "object" && st !== null && "name" in st) {
    return String((st as { name: string }).name);
  }
  return String(st);
}

function sortTrackingEntries(
  entries: NonNullable<OrderDetailApi["orderTracking"]>,
) {
  return [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function formatDimensions(order: OrderDetailApi): string {
  const { length, width, height } = order;
  if (length == null && width == null && height == null) return "—";
  const l = length ?? "—";
  const w = width ?? "—";
  const h = height ?? "—";
  return `${l}×${w}×${h} cm`;
}

function formatOrderDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function getLatestPriceLog(
  priceLogs: OrderDetailApi["priceLogs"],
): OrderPriceLog | null {
  if (!priceLogs) return null;
  if (Array.isArray(priceLogs)) {
    if (priceLogs.length === 0) return null;
    return [...priceLogs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  }
  return priceLogs;
}

function formatMoney(value?: number | null, currency?: string | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency ?? "ETB"}`;
}

export default function OrderDetails() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailApi | null>(null);
  console.log(order);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [vehicleType, setVehicleType] =
    useState<FleetVehicleTypeListItem | null>(null);
  const [loadingVehicleType, setLoadingVehicleType] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!routeId?.trim()) {
        setFetchError("Missing order id");
        setLoadingOrder(false);
        return;
      }
      try {
        setLoadingOrder(true);
        setFetchError(null);
        const data = await fetchOrderById(routeId.replace(/^#/, ""));
        if (!cancelled) setOrder(data);
      } catch (e: unknown) {
        const msg =
          e &&
          typeof e === "object" &&
          "response" in e &&
          (e as { response?: { data?: { message?: string } } }).response?.data
            ?.message;
        if (!cancelled) {
          setFetchError(
            typeof msg === "string" && msg.trim()
              ? msg
              : "Could not load order",
          );
          setOrder(null);
        }
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  useEffect(() => {
    const vehicleTypeId = order?.vehicleTypeId?.trim();
    if (!vehicleTypeId) {
      setVehicleType(null);
      setLoadingVehicleType(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingVehicleType(true);
        const vt = await fetchFleetVehicleTypeById(vehicleTypeId);
        if (!cancelled) setVehicleType(vt);
      } catch {
        if (!cancelled) setVehicleType(null);
      } finally {
        if (!cancelled) setLoadingVehicleType(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.vehicleTypeId]);

  const orderLogs = useMemo(() => {
    if (!order?.orderTracking?.length) return [];
    return sortTrackingEntries(order.orderTracking);
  }, [order?.orderTracking]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }
    try {
      setIsCancelling(true);
      const res = await api.patch("/order/cancel", {
        orderId: order.id.replace(/^#/, ""),
        reason: cancelReason.trim(),
      });
      toast.success(
        (res.data as { message?: string } | undefined)?.message ||
          "Order cancelled successfully",
      );
      setIsCancelDialogOpen(false);
      setCancelReason("");
      const refreshed = await fetchOrderById(order.id.replace(/^#/, ""));
      setOrder(refreshed);
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof msg === "string" && msg.trim() ? msg : "Failed to cancel order",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const priceLog = useMemo(
    () => getLatestPriceLog(order?.priceLogs),
    [order?.priceLogs],
  );

  const orderCategoryLines = useMemo(
    () => (order ? normalizeOrderCategoryLines(order) : []),
    [order],
  );

  const orderTotalQuantity = useMemo(
    () => (order ? getOrderCategoriesTotalQuantity(order) : null),
    [order],
  );

  const initialValues = useMemo(
    () => ({
      fulfillmentDestination: order?.shippingScope ?? "",
      serviceType: getServiceTypeLabel(order?.serviceType),
      driverId: "",
      fragilityLevel: order?.isFragile ? "true" : "false",
      category: [] as string[],
      specialInstructions: "",
      priority: "Normal",
    }),
    [order],
  );

  // const handleOrderGrouping = (orderId: string) => {
  //   setGroupedOrders((prev) =>
  //     prev.includes(orderId)
  //       ? prev.filter((id) => id !== orderId)
  //       : [...prev, orderId]
  //   );
  // };

  const getFulfillmentColor = (destination: string) => {
    switch (destination?.toUpperCase()) {
      case "INTERNATIONAL":
        return "bg-blue-100 text-blue-700";
      case "REGIONAL":
        return "bg-green-100 text-green-700";
      case "TOWN":
      case "IN_TOWN":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "SAME_DAY":
      case "SAME DAY":
        return "bg-red-100 text-red-700";
      case "OVERNIGHT":
        return "bg-purple-100 text-purple-700";
      case "STANDARD":
        return "bg-blue-100 text-blue-700";
      case "EXPRESS":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-blue-100 text-blue-700";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "DISPATCHED":
        return "bg-purple-100 text-purple-700";
      case "IN_TRANSIT":
        return "bg-indigo-100 text-indigo-700";
      case "DELIVERED":
        return "bg-teal-100 text-teal-700";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 p-6">
        <Spinner className="h-10 w-10 text-[#EE1E21]" />
        <p className="text-gray-600">Loading order…</p>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="max-w-6xl p-6 bg-white">
        <Button
          type="button"
          variant="outline"
          className="mb-4 cursor-pointer"
          onClick={() => navigate("/order")}
        >
          Back to orders
        </Button>
        <p className="text-red-600">
          {fetchError ?? "Order could not be loaded."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl p-6 bg-white">
      <Formik
        key={order.id}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={(values) => {
          console.log("Order details updated:", values);
          // Handle form submission
        }}
      >
        {({ values, setFieldValue }) => (
          <Form>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex gap-5 items-center">
                <Button
                  type="button"
                  className="!text-[#FADF4B] !size-[40px] bg-[#EE1E21] hover:bg-[#EE1E21] !rounded-full !p-0 !py-0 flex items-center justify-center !cursor-pointer"
                  onClick={() => navigate("/order")}
                >
                  <IoArrowBack className="text-[#FADF4B] text-2xl" />
                </Button>
                <div>
                  <h1 className="text-2xl font-medium text-gray-700">
                    Order Details - {order.trackingCode}
                  </h1>
                  <p className="text-gray-500">
                    Manage order fulfillment and delivery
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <PrintWaybillButton
                  orderId={order.id.replace(/^#/, "")}
                  className="border border-gray-300"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={["CANCELLED", "DELIVERED", "COMPLETED"].includes(
                    (order.status || "").toUpperCase(),
                  )}
                  className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => {
                    setCancelReason("");
                    setIsCancelDialogOpen(true);
                  }}
                >
                  Cancel order
                </Button>
                <Button
                  type="button"
                  className="!cursor-pointer !bg-[#EE1E21] hover:!bg-[#cc1a1c]"
                  onClick={() =>
                    navigate(`/order/edit/${order.id.replace(/^#/, "")}`)
                  }
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoCube className="h-5 w-5" />
                      Order Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Customer
                        </Label>
                        <p className="text-lg font-semibold">
                          {order?.customer?.name ?? "—"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order?.customer?.email ?? "—"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order?.customer?.phone ?? "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Receiver
                        </Label>
                        <p className="text-lg font-semibold">
                          {order?.receiver?.name ?? "—"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order?.receiver?.email ?? "—"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order?.receiver?.phone ?? "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Order status
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-700"
                          >
                            {order.status}
                          </Badge>
                          {order.fulfillmentType ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-700"
                            >
                              {order.fulfillmentType}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Total
                        </Label>
                        <p className="text-lg font-semibold">
                          {order.finalPrice} {order.currency ?? "ETB"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Total items
                        </Label>
                        <p className="text-lg font-semibold">
                          {orderTotalQuantity ?? "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Weight
                        </Label>
                        <p className="text-lg font-semibold">
                          {order.weight} kg
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Shipment type
                        </Label>
                        <p className="text-lg font-semibold">
                          {String(order.shipmentType ?? "—")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fulfillment Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoMap className="h-5 w-5" />
                      Fulfillment Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2">Fulfillment Destination</Label>
                        <Select
                          value={values.fulfillmentDestination}
                          disabled
                          onValueChange={(val) =>
                            setFieldValue("fulfillmentDestination", val)
                          }
                        >
                          <SelectTrigger className="bg-gray-50 border-0 py-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TOWN">TOWN</SelectItem>
                            <SelectItem value="REGIONAL">REGIONAL</SelectItem>
                            <SelectItem value="INTERNATIONAL">
                              INTERNATIONAL
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="mb-2">Service Type</Label>
                        <Select
                          value={values.serviceType}
                          disabled
                          onValueChange={(val) =>
                            setFieldValue("serviceType", val)
                          }
                        >
                          <SelectTrigger className="bg-gray-50 border-0 py-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STANDARD">STANDARD</SelectItem>
                            <SelectItem value="EXPRESS">EXPRESS</SelectItem>
                            <SelectItem value="SAME_DAY">SAME DAY</SelectItem>
                            <SelectItem value="OVERNIGHT">OVERNIGHT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge
                        className={getFulfillmentColor(
                          values.fulfillmentDestination,
                        )}
                      >
                        {values.fulfillmentDestination}
                      </Badge>
                      <Badge
                        className={getServiceTypeColor(values.serviceType)}
                      >
                        {values.serviceType}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoCar className="h-5 w-5" />
                      Delivery information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Vehicle type</Label>
                        <p className="font-medium mt-1">
                          {loadingVehicleType ? (
                            <span className="inline-flex items-center gap-2 text-gray-500">
                              <Spinner className="h-4 w-4 text-[#EE1E21]" />
                              Loading…
                            </span>
                          ) : (
                            (vehicleType?.name ??
                            (order.vehicleTypeId ? "—" : "Not assigned"))
                          )}
                        </p>
                        {vehicleType?.description ? (
                          <p className="text-gray-600 mt-1">
                            {vehicleType.description}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Label className="text-gray-600">Is delivery</Label>
                        <p className="font-medium mt-1">
                          {order.isDelivery ? "Yes" : "No"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">
                          Scheduled delivery
                        </Label>
                        <p className="font-medium mt-1">
                          {formatOrderDateTime(order.deliveryDate)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">
                          Estimated delivery
                        </Label>
                        <p className="font-medium mt-1">
                          {formatOrderDateTime(order.estimatedDeliveryAt)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Distance</Label>
                        <p className="font-medium mt-1">
                          {order.distance ?? order.estimatedDistance ?? "—"}
                          {order.distance != null ||
                          order.estimatedDistance != null
                            ? " km"
                            : ""}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Route</Label>
                        <p className="font-medium mt-1">
                          {[order.originCityRaw, order.destinationCityRaw]
                            .filter(Boolean)
                            .join(" → ") || "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Branch</Label>
                        <p className="font-medium mt-1">
                          {order.branch?.name ?? "—"}
                        </p>
                        {order.branch?.location ? (
                          <p className="text-gray-600 mt-1">
                            {order.branch.location}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <Label className="text-gray-600">Delivery driver</Label>
                        <p className="font-medium mt-1">
                          {order.deliveryDriver?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Drivers (from API) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoPerson className="h-5 w-5" />
                      Drivers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-600">Pickup driver</Label>
                        <p className="font-medium mt-1">
                          {order.pickupDriver?.name ?? "—"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Delivery driver</Label>
                        <p className="font-medium mt-1">
                          {order.deliveryDriver?.name ?? "—"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Logs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoList className="h-5 w-5" />
                      Order Activity Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No activity logs found for this order
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="text-gray-600 font-medium">
                                Status
                              </TableHead>
                              <TableHead className="text-gray-600 font-medium">
                                Location
                              </TableHead>
                              <TableHead className="text-gray-600 font-medium">
                                Notes
                              </TableHead>
                              <TableHead className="text-gray-600 font-medium">
                                Date & Time
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderLogs.map((log, index) => (
                              <TableRow
                                key={log.id}
                                className={
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                                }
                              >
                                <TableCell>
                                  <Badge className={getStatusColor(log.status)}>
                                    {log.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <IoLocation className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">
                                      {log.location || "N/A"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-sm text-gray-700 max-w-md">
                                    {log.notes || "—"}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <IoTime className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoShield className="h-5 w-5" />
                      Fragility and category
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2">Fragile</Label>
                        <Select
                          value={values.fragilityLevel}
                          disabled
                          onValueChange={(val) =>
                            setFieldValue("fragilityLevel", val)
                          }
                        >
                          <SelectTrigger className="bg-gray-50 border-0 py-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2">Categories</Label>
                        <div className="rounded-md border bg-gray-50 px-3 py-3 text-sm space-y-2">
                          {orderCategoryLines.length > 0 ? (
                            orderCategoryLines.map((line) => (
                              <div
                                key={`${line.categoryId}-${line.name}`}
                                className="flex items-start justify-between gap-3"
                              >
                                <div>
                                  <p className="font-medium">{line.name}</p>
                                  {line.description ? (
                                    <p className="text-gray-600 mt-1">
                                      {line.description}
                                    </p>
                                  ) : null}
                                </div>
                                <span className="shrink-0 font-medium text-gray-700">
                                  ×{line.quantity}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="font-medium">—</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Address Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoLocation className="h-5 w-5" />
                      Addresses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Pickup address
                      </Label>
                      {order.pickupAddress?.label ? (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {order.pickupAddress.label}
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-800 mt-1">
                        {order.pickupAddress?.addressLine ?? "—"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {[
                          order.pickupAddress?.city,
                          order.pickupAddress?.state,
                          order.pickupAddress?.postalCode,
                          order.pickupAddress?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                      {order.pickupAddress?.landMark ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Landmark: {order.pickupAddress.landMark}
                        </p>
                      ) : null}
                      <p className="text-xs text-gray-500 mt-1">
                        <IoTime className="inline h-3 w-3 mr-1" />
                        {order.pickupAddress?.createdAt
                          ? new Date(
                              order.pickupAddress.createdAt,
                            ).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Delivery address
                      </Label>
                      {order.deliveryAddress?.label ? (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {order.deliveryAddress.label}
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-800 mt-1">
                        {order.deliveryAddress?.addressLine ?? "—"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {[
                          order.deliveryAddress?.city,
                          order.deliveryAddress?.state,
                          order.deliveryAddress?.postalCode,
                          order.deliveryAddress?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                      {order.deliveryAddress?.landMark ? (
                        <p className="text-xs text-gray-500 mt-1">
                          Landmark: {order.deliveryAddress.landMark}
                        </p>
                      ) : null}
                      <p className="text-xs text-gray-500 mt-1">
                        <IoTime className="inline h-3 w-3 mr-1" />
                        {order.deliveryAddress?.createdAt
                          ? new Date(
                              order.deliveryAddress.createdAt,
                            ).toLocaleString()
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Orders Grouping */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IoPeople className="h-5 w-5" />
                      Group Related Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Select orders to group for efficient routing:
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead>Distance</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatedOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                <Checkbox
                                  checked={groupedOrders.includes(order.id)}
                                  onCheckedChange={() =>
                                    handleOrderGrouping(order.id)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">
                                    {order.id}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {order.customer}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {order.address}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {order.distance}
                                </span>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {groupedOrders.length > 0 && (
                        <div className="bg-[#EE1E21]/5 p-3 rounded-lg">
                          <p className="text-[#EE1E21] text-sm font-medium">
                            {groupedOrders.length} order(s) selected for
                            grouping
                          </p>
                          <p className="text-[#EE1E21] text-xs">
                            These orders will be bundled for efficient delivery
                            routing.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card> */}

                {/* Price Breakdown */}
                {priceLog ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Base rate:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(priceLog.baseRate, priceLog.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Applied rate:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(
                            priceLog.appliedRate,
                            priceLog.currency,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Pickup distance:
                        </span>
                        <span className="text-sm font-medium">
                          {priceLog.pickupDistance ?? "—"}
                          {priceLog.pickupDistance != null ? " km" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Pickup price:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(
                            priceLog.pickupPrice,
                            priceLog.currency,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Dropoff distance:
                        </span>
                        <span className="text-sm font-medium">
                          {priceLog.dropoffDistance ?? "—"}
                          {priceLog.dropoffDistance != null ? " km" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Dropoff price:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(
                            priceLog.dropoffPrice,
                            priceLog.currency,
                          )}
                        </span>
                      </div>
                      {priceLog.airportFee != null ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Airport fee:
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(
                              priceLog.airportFee,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                      {priceLog.surcharges != null ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Surcharges:
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(
                              priceLog.surcharges,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                      {priceLog.discounts != null ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Discounts:
                          </span>
                          <span className="text-sm font-medium">
                            -
                            {formatMoney(
                              priceLog.discounts,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                      {priceLog.miscFees != null ? (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Misc fees:
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(
                              priceLog.miscFees,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">VAT:</span>
                        <span className="text-sm font-medium">
                          {formatMoney(priceLog.vat, priceLog.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Wallet used:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMoney(
                            priceLog.walletUsed,
                            priceLog.currency,
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Amount to pay:</span>
                          <span className="font-bold">
                            {formatMoney(
                              priceLog.amountToPay,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-gray-600">
                            Final price:
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(
                              priceLog.finalPrice,
                              priceLog.currency,
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Order Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Categories:</span>
                      <span className="text-sm font-medium text-right">
                        {formatOrderCategoriesSummary(order)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total items:</span>
                      <span className="text-sm font-medium">
                        {orderTotalQuantity ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weight:</span>
                      <span className="text-sm font-medium">
                        {order.weight} kg
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-gray-600 shrink-0">
                        Dimensions:
                      </span>
                      <span className="text-sm font-medium text-right">
                        {formatDimensions(order)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cost:</span>
                      <span className="text-sm font-medium">
                        {order.cost ?? order.finalPrice}{" "}
                        {order.currency ?? "ETB"}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold">
                          {order.finalPrice} {order.currency ?? "ETB"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Form>
        )}
      </Formik>

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
