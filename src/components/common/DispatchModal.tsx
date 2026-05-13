"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  IoClose,
  IoPerson,
  // IoPhone,
  IoLocation,
  IoTime,
  IoCheckmarkCircle,
  // IoAdd,
  IoMail,
  IoPhonePortraitOutline,
  IoPodium,
} from "react-icons/io5";
import type { Order } from "@/types/types";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import {
  fetchFleetVehicleTypeById,
  type FleetVehicleTypeListItem,
} from "@/lib/api/fleet";
import { Spinner } from "@/utils/spinner";

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Derived from order, so no need to pass separately
  onDispatch: (driverId: string, notes?: string) => void;
  order: Order;
}

const toDisplayText = (value: unknown, fallback = "-"): string => {
  if (value == null) return fallback;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    const text = String(value).trim();
    return text || fallback;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["name", "label", "title", "value", "id"]) {
      const v = obj[key];
      if (typeof v === "string" || typeof v === "number") {
        const text = String(v).trim();
        if (text) return text;
      }
    }
  }
  return fallback;
};

const getOrderVehicleTypeId = (order: Order): string => {
  const extended = order as Order & {
    vehicleType?: { id?: string | null } | null;
  };
  return String(
    extended.vehicleTypeId ?? extended.vehicleType?.id ?? "",
  ).trim();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Available":
      return "bg-green-100 text-green-700";
    case "Busy":
      return "bg-red-100 text-red-700";
    case "On Break":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function DispatchModal({ isOpen, onClose, order }: DispatchModalProps) {
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [selectedExternalDrivers, setSelectedExternalDrivers] = useState<any[]>(
    [],
  );
  const [dispatchNotes, setDispatchNotes] = useState("");
  const [activeTab, setActiveTab] = useState("internal");
  const [loading, setLoading] = useState(false);
  // const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [loadingDriver, setLoadingDriver] = useState(false);
  const [driver, setDriver] = useState<any[]>([
    // {
    //   "driverId": "cmhx9ab12000kjn89xyz88pq1",
    //   "userId": "cmhx9ab0d0009jn89lkc672aa",
    //   "user": {
    //     "id": "cmhx9ab0d0009jn89lkc672aa",
    //     "name": "Alice Smith",
    //     "email": "alice.smith@example.com",
    //     "phone": "+251911556677"
    //   },
    //   "distanceKm": 12.457,
    //   "currentLat": 9.032145781234,
    //   "currentLon": 38.754321987654,
    //   "activeOrders": 0,
    //   "lastUpdated": "2025-12-10T11:15:22.300Z",
    //   "score": 0.812349875,
    //   "suggestedForOrders": [
    //     "cmizveh450002jmmjk2sd90pq",
    //     "cmizveh450003jmmjk2sd90pr"
    //   ],
    //   "rank": 1
    // },
    // {
    //   "driverId": "cmhx9ac34000lmn55tuv99rs2",
    //   "userId": "cmhx9ac2a0008mn55asf887bb",
    //   "user": {
    //     "id": "cmhx9ac2a0008mn55asf887bb",
    //     "name": "Michael Brown",
    //     "email": "michael.brown@example.org",
    //     "phone": "+251912334455"
    //   },
    //   "distanceKm": 28.992,
    //   "currentLat": 9.089234556721,
    //   "currentLon": 38.901234880012,
    //   "activeOrders": 2,
    //   "lastUpdated": "2025-12-10T11:20:05.142Z",
    //   "score": 0.59322144,
    //   "suggestedForOrders": [],
    //   "rank": 2
    // },
    // {
    //   "driverId": "cmhx9ad56000opq22uvw00cd3",
    //   "userId": "cmhx9ad4b0007opq22qwe551c",
    //   "user": {
    //     "id": "cmhx9ad4b0007opq22qwe551c",
    //     "name": "Sara Johnson",
    //     "email": "sara.johnson@example.net",
    //     "phone": "+251910112233"
    //   },
    //   "distanceKm": 5.602,
    //   "currentLat": 9.065778234110,
    //   "currentLon": 38.889990223344,
    //   "activeOrders": 0,
    //   "lastUpdated": "2025-12-10T11:31:47.890Z",
    //   "score": 0.92100422,
    //   "suggestedForOrders": [
    //     "cmizveh460001jmmjk2sd91aa"
    //   ],
    //   "rank": 3
    // }
  ]);
  // const [selectedDriver,setSelectedDriver] = useState<any>(null)
  const [loadingExternalDriver, setLoadingExternalDriver] = useState(false);
  const [externalDriver, setExternalDriver] = useState<any[]>([
    // {
    //   "driverId": "cmfzjxyza0009jmq7abc12345",
    //   "distanceKm": 12.443,
    //   "user": {
    //     "id": "cmfzjxyza0009jmq7abc12345",
    //     "name": "driver 47",
    //     "email": "driver47@example.com",
    //     "phone": "0921998877",
    //     "driver": {
    //       "type": "EXTERNAL",
    //       "status": "ONLINE"
    //     }
    //   },
    //   "coordinates": {
    //     "lon": 38.901234567812,
    //     "lat": 9.075432198765
    //   }
    // },
    // {
    //   "driverId": "cmfzjxbbb0010jmq7xyz56789",
    //   "distanceKm": 25.991,
    //   "user": {
    //     "id": "cmfzjxbbb0010jmq7xyz56789",
    //     "name": "driver 11",
    //     "email": "driver11@example.com",
    //     "phone": "0921222333",
    //     "driver": {
    //       "type": "EXTERNAL",
    //       "status": "OFFLINE"
    //     }
    //   },
    //   "coordinates": {
    //     "lon": 38.889900112200,
    //     "lat": 9.062345990011
    //   }
    // },
    // {
    //   "driverId": "cmfzjxccc0011jmq7qwe90876",
    //   "distanceKm": 7.220,
    //   "user": {
    //     "id": "cmfzjxccc0011jmq7qwe90876",
    //     "name": "driver 03",
    //     "email": "driver03@example.com",
    //     "phone": "0921333555",
    //     "driver": {
    //       "type": "EXTERNAL",
    //       "status": "ONLINE"
    //     }
    //   },
    //   "coordinates": {
    //     "lon": 38.912345678001,
    //     "lat": 9.082341567899
    //   }
    // }
  ]);
  const [vehicleType, setVehicleType] = useState<FleetVehicleTypeListItem | null>(
    null,
  );
  const [loadingVehicleType, setLoadingVehicleType] = useState(false);
  const orderVehicleTypeId = getOrderVehicleTypeId(order);
  // Reset selections when switching tabs
  useEffect(() => {
    console.log("[DispatchModal] mounted/open state", {
      isOpen,
      orderId: order?.id,
      trackingCode: order?.trackingCode,
      fulfillmentType: order?.fulfillmentType,
      serviceTypeType: typeof order?.serviceType,
      serviceTypeRaw: order?.serviceType,
    });
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen) {
      setVehicleType(null);
      setLoadingVehicleType(false);
      return;
    }
    if (!orderVehicleTypeId) {
      setVehicleType(null);
      setLoadingVehicleType(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingVehicleType(true);
        const vt = await fetchFleetVehicleTypeById(orderVehicleTypeId);
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
  }, [isOpen, orderVehicleTypeId]);

  useEffect(() => {
    if (activeTab === "internal") {
      setSelectedExternalDrivers([]);
    } else {
      setSelectedDriver(null);
    }
  }, [activeTab]);

  const handleDispatch = async () => {
    // Check if we have at least one driver selected
    if (activeTab === "internal" && !selectedDriver) {
      toast.error("Please select a driver");
      return;
    }
    if (activeTab === "external" && selectedExternalDrivers.length === 0) {
      toast.error("Please select at least one driver");
      return;
    }

    setLoading(true);

    try {
      if (activeTab === "external") {
        // For external drivers: create request with multiple driverIds
        const driverIds = selectedExternalDrivers.map(
          (driver) => driver.driverId,
        );
        const payload = {
          orderId: order?.id,
          driverIds: driverIds,
        };
        console.log("[DispatchModal] external dispatch payload", payload);

        const res = await api.post<any>("/dispatch/driver/requests", payload);

        toast.success(
          res.data.message || "Driver request created successfully",
        );

        // Reset form
        setSelectedExternalDrivers([]);
        setDispatchNotes("");
        onClose();
      } else {
        // For internal drivers: assign pickup with single driverId
        const payload = {
          orderId: order?.id,
          driverId: selectedDriver?.userId,
        };
        console.log("[DispatchModal] internal dispatch payload", {
          payload,
          selectedDriver,
        });

        const res = await api.post<any>("/dispatch/assign-pickup", payload);

        toast.success(res.data.message || "Order dispatched successfully");

        // Optionally handle pagination if needed in the future
        // Reset form
        setSelectedDriver(null);
        setDispatchNotes("");
        onClose();
      }
    } catch (error: any) {
      console.error("[DispatchModal] dispatch error", {
        activeTab,
        selectedDriver,
        selectedExternalDrivers,
        errorResponse: error?.response?.data,
        errorMessage: error?.message,
      });
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const handleContactExternal = (driver: { name: string; company: string }) => {
  //   setIsContactingExternal(true);
  //   // Simulate contacting external driver
  //   setTimeout(() => {
  //     setIsContactingExternal(false);
  //     alert(`Contacting ${driver.name} at ${driver.company}...`);
  //   }, 2000);
  // };

  const fetchInternalDriver = useCallback(async () => {
    if (!order?.id) {
      console.warn(
        "[DispatchModal] fetchInternalDriver skipped: missing order id",
      );
      return;
    }
    try {
      setLoadingDriver(true);
      const res = await api.post<any>(`/maps/nearby-drivers`, {
        orderIds: [order.id],
        radius: 2000000,
      });
      if (res.data?.data) {
        setDriver(res.data.data);
      }
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Something went wrong. Please try again.",
      );
      console.error(error);
    } finally {
      setLoadingDriver(false);
    }
  }, [order?.id]);

  const fetchExternalDriver = useCallback(async () => {
    console.log("[DispatchModal] order", order);
    if (!order?.id) {
      console.warn(
        "[DispatchModal] fetchExternalDriver skipped: missing order id",
      );
      return;
    }
    const pickupLat =
      Number(order?.pickupAddress?.lat) || Number(order?.deliveryAddress?.lat);
    const pickupLon =
      Number(order?.pickupAddress?.long) ||
      Number(order?.deliveryAddress?.long);
    if (!Number.isFinite(pickupLat) || !Number.isFinite(pickupLon)) {
      console.warn(
        "[DispatchModal] fetchExternalDriver skipped: invalid pickup coordinates",
        {
          orderId: order?.id,
          pickupLatRaw: order?.pickupAddress?.lat,
          pickupLonRaw: order?.pickupAddress?.long,
        },
      );
      setExternalDriver([]);
      return;
    }
    try {
      setLoadingExternalDriver(true);
      const res = await api.get<any>(
        `/maps/external/nearby-drivers?orderId=${encodeURIComponent(
          order.id,
        )}&lat=${encodeURIComponent(String(pickupLat))}&lon=${encodeURIComponent(
          String(pickupLon),
        )}&radius=10000`,
      );
      setExternalDriver(res.data?.data ?? []);
    } catch (error: unknown) {
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Something went wrong. Please try again.",
      );
      console.error(error);
    } finally {
      setLoadingExternalDriver(false);
    }
  }, [order?.id, order?.pickupAddress?.lat, order?.pickupAddress?.long]);

  /** Refetch whenever the modal is open and the active tab expects a different driver list */
  useEffect(() => {
    if (!isOpen || !order?.id) return;
    if (activeTab === "internal") {
      void fetchInternalDriver();
    }
  }, [isOpen, activeTab, order?.id, fetchInternalDriver]);

  useEffect(() => {
    if (!isOpen || !order?.id) return;
    if (activeTab === "external") {
      void fetchExternalDriver();
    }
  }, [isOpen, activeTab, order?.id, fetchExternalDriver]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4"
      style={{ backdropFilter: "blur(2px)" }}
    >
      <Card className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">
              Dispatch Order {order?.trackingCode}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <IoClose className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Customer: {toDisplayText(order?.customer?.name)} • Scope:{" "}
            {toDisplayText(order?.shippingScope)} • Service:{" "}
            {toDisplayText(order?.serviceType)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-600">Order Tracking Code</Label>
                <p className="font-medium">{order?.trackingCode}</p>
              </div>
              <div>
                <Label className="text-gray-600">Customer</Label>
                <p className="font-medium">{order?.customer?.name}</p>
              </div>
              <div>
                <Label className="text-gray-600">Vehicle type</Label>
                <p className="font-medium">
                  {loadingVehicleType ? (
                    <span className="inline-flex items-center gap-2 text-gray-500">
                      <Spinner className="h-4 w-4 text-blue-600" />
                      Loading…
                    </span>
                  ) : (
                    vehicleType?.name ??
                    (orderVehicleTypeId ? "—" : "Not assigned")
                  )}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-gray-600">Delivery Address</Label>
                <p className="font-medium">
                  {toDisplayText(
                    order?.deliveryAddress?.label ??
                      order?.deliveryAddress?.landMark ??
                      order?.deliveryAddress?.addressLine,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Driver Selection Tabs */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: "internal", label: "Internal Drivers" },
                { id: "external", label: "External Drivers" },
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className={`hover:bg-white cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900"
                      : "text-gray-600 hover:text-gray-900 "
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Internal Drivers */}
            {activeTab === "internal" && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Available Internal Drivers
                </h3>
                {loadingDriver ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading drivers...
                    </span>
                  </div>
                ) : driver.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No internal drivers available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {driver.map((driver) => (
                      <Card
                        key={
                          driver.driverId ?? driver.userId ?? driver?.user?.id
                        }
                        className={`cursor-pointer transition-all ${
                          selectedDriver?.driverId === driver.driverId
                            ? "ring-2 ring-blue-500 bg-blue-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedDriver(driver)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <IoPerson className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {driver?.user?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ★ {driver.rank} • {driver.user.phone}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(driver.status)}>
                              {"Available"}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <IoPodium className="h-4 w-4 text-gray-400" />
                              <span>{driver.score}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IoLocation className="h-4 w-4 text-gray-400" />
                              <span>{driver.distanceKm} KM</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IoTime className="h-4 w-4 text-gray-400" />
                              <span>
                                Last update:{" "}
                                {new Date(driver.lastUpdated).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center gap-4 text-sm mb-1">
                              <span>Active Orders: </span>
                              <span>{driver.activeOrders}</span>
                            </div>
                            {/* <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${
                                  (driver.currentLoad / driver.capacity) * 100
                                }%`,
                              }}
                            ></div>
                          </div> */}
                          </div>

                          {selectedDriver?.driverId === driver.driverId && (
                            <div className="mt-3 flex items-center gap-2 text-blue-600">
                              <IoCheckmarkCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Selected
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* External Drivers */}
            {activeTab === "external" && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  External Driver Partners (Select Multiple)
                </h3>
                {loadingExternalDriver ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">
                      Loading drivers...
                    </span>
                  </div>
                ) : externalDriver.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No external drivers available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {externalDriver.map((driver) => {
                      const isSelected = selectedExternalDrivers.some(
                        (d) => d.driverId === driver.driverId,
                      );
                      return (
                        <Card
                          key={driver.driverId}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExternalDrivers((prev) =>
                                prev.filter(
                                  (d) => d.driverId !== driver.driverId,
                                ),
                              );
                            } else {
                              setSelectedExternalDrivers((prev) => [
                                ...prev,
                                driver,
                              ]);
                            }
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <IoPerson className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {driver?.user?.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {driver.distanceKm} Km
                                  </p>
                                  {/* <p className="text-sm text-gray-500">
                                ★ {driver.rating}
                              </p> */}
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-700">
                                {"Available"}
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <IoPhonePortraitOutline className="h-4 w-4 text-gray-400" />
                                <span>{driver?.user?.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <IoMail className="h-4 w-4 text-gray-400" />
                                <span>{driver?.user?.email}</span>
                              </div>
                            </div>

                            <div className="mt-3">
                              {isSelected && (
                                <div className="flex items-center gap-2 text-blue-600">
                                  <IoCheckmarkCircle className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    Selected
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dispatch Notes */}
          <div>
            <Label className="mb-2">Dispatch Notes (Optional)</Label>
            <Textarea
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="Add any special instructions for the driver..."
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleDispatch}
              disabled={
                (activeTab === "internal" && !selectedDriver) ||
                (activeTab === "external" &&
                  selectedExternalDrivers.length === 0) ||
                loading
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoCheckmarkCircle className="h-4 w-4 mr-2" />
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </span>
              ) : activeTab === "external" ? (
                `Create Request (${selectedExternalDrivers.length} driver${selectedExternalDrivers.length !== 1 ? "s" : ""})`
              ) : (
                "Dispatch Order"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DispatchModal;
