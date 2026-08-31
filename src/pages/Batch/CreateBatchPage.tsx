"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getCategorizedOrders, createBatch } from "@/lib/api/batch";
import api from "@/lib/api/api";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import type {
  Order,
  CategorizedOrdersResponse,
  Branch,
  BranchListResponse,
  CreateBatchRequest,
} from "@/types/types";
import toast from "react-hot-toast";
import { Skeleton } from "antd";
import { Spinner } from "@/utils/spinner";
import SuccessModal from "@/components/common/SuccessModal";

// Scopes and service types for UI select
const SCOPES = ["TOWN", "REGIONAL", "INTERNATIONAL"] as const;

const normalizeServiceTypeKey = (value: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const getScopeCandidates = (scopeKey: string): string[] => {
  const key = String(scopeKey ?? "").trim().toUpperCase();
  if (key === "TOWN") return ["TOWN", "IN_TOWN"];
  return [key];
};

const toCategoryLabel = (cat: unknown): string | null => {
  if (typeof cat === "string") return cat;
  if (cat && typeof cat === "object") {
    const obj = cat as Record<string, unknown>;
    if (typeof obj.name === "string") return obj.name;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.id === "string") return obj.id;
  }
  return null;
};

function CreateBatchPage() {
  const navigate = useNavigate();
  const { data: serviceTypes = [] } = useServiceTypes();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categorizedOrders, setCategorizedOrders] =
    useState<CategorizedOrdersResponse | null>(null);
  const [categorizedOrdersError, setCategorizedOrdersError] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [batchCode, setBatchCode] = useState("");

  // Form state
  const [selectedScope, setSelectedScope] = useState<typeof SCOPES[number] | "">("");
  const [selectedRoute, setSelectedRoute] = useState<string>(""); // Add selected route (country/city-pair)
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  // Remove all category input state and logic
  const [notes, setNotes] = useState("");
  const [shipmentDate, setShipmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState(false);

  // New: Origin branch state
  const [originBranchId, setOriginBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");

  const serviceTypeLabelsByNormalized = useMemo(() => {
    const map = new Map<string, string>();
    for (const st of serviceTypes) {
      const normalizedName = normalizeServiceTypeKey(st.name);
      map.set(normalizedName, st.name);
      map.set(st.id, st.name);
    }
    return map;
  }, [serviceTypes]);

  const serviceTypeIdByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const st of serviceTypes) {
      const normalizedName = normalizeServiceTypeKey(st.name);
      map.set(normalizedName, st.id);
      map.set(st.id, st.id);
      map.set(st.name, st.id);
    }
    return map;
  }, [serviceTypes]);

  const getServiceTypeLabel = (rawType: string): string => {
    const normalized = normalizeServiceTypeKey(rawType);
    return (
      serviceTypeLabelsByNormalized.get(normalized) ??
      serviceTypeLabelsByNormalized.get(rawType) ??
      rawType.replace(/_/g, " ")
    );
  };

  const getScopeData = (scopeKey: string): Record<string, unknown> | null => {
    if (!categorizedOrders) return null;
    const grouped = categorizedOrders.grouped as Record<string, unknown>;
    for (const candidate of getScopeCandidates(scopeKey)) {
      const data = grouped[candidate];
      if (data && typeof data === "object") {
        return data as Record<string, unknown>;
      }
    }
    return null;
  };

  const fetchCategorizedOrders = async () => {
    try {
      setLoading(true);
      setCategorizedOrdersError(false);
      const response = await getCategorizedOrders({ pageSize: 100 });
      const grouped = (response.data as any)?.grouped ?? {};
      const scopeKeys = Object.keys(grouped);
      const firstScopeKey = scopeKeys[0];
      const firstRouteKey = firstScopeKey
        ? Object.keys(grouped[firstScopeKey] ?? {})[0]
        : undefined;
      const firstServiceKeys =
        firstScopeKey && firstRouteKey
          ? Object.keys(grouped[firstScopeKey]?.[firstRouteKey] ?? {})
          : [];
      const sample =
        firstScopeKey && firstRouteKey && firstServiceKeys[0]
          ? grouped[firstScopeKey]?.[firstRouteKey]?.[firstServiceKeys[0]]?.[0]
          : undefined;
      console.log("[CreateBatchPage] categorized orders debug", {
        scopeKeys,
        firstScopeKey,
        firstRouteKey,
        firstServiceKeys,
        sampleServiceType: sample?.serviceType,
        sampleCategory: sample?.category,
      });
      setCategorizedOrders(response.data);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setCategorizedOrdersError(true);
      const message =
        error?.response?.data?.message ||
        "Failed to load categorized orders";
      console.error("Error fetching categorized orders:", error);
      toast.error(message);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      setBranchesError(false);
      const response = await api.get<BranchListResponse>(
        `/branch?page=1&pageSize=50`
      );
      setBranches(response.data.data);
    } catch (error: any) {
      setBranchesError(true);
      const message =
        error?.response?.data?.message ||
        "Failed to load branches";
      console.error("Error fetching branches:", error);
      toast.error(message);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchCategorizedOrders();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!serviceTypes.length) return;
    console.log(
      "[CreateBatchPage] serviceTypes from hook",
      serviceTypes.map((s) => ({ id: s.id, name: s.name })),
    );
  }, [serviceTypes]);

  const handleOrderToggle = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = (orders: Order[]) => {
    const orderIds = orders.map((o) => o.id);
    setSelectedOrders((prev) => {
      const newIds = orderIds.filter((id) => !prev.includes(id));
      return [...prev, ...newIds];
    });
  };

  const handleDeselectAll = (orders: Order[]) => {
    const orderIds = orders.map((o) => o.id);
    setSelectedOrders((prev) => prev.filter((id) => !orderIds.includes(id)));
  };

  // Utility: Get all country-route keys for a selected scope
  const getRouteKeysForScope = (scopeKey: string): string[] => {
    const scopeData = getScopeData(scopeKey);
    if (!scopeData) return [];
    return Object.keys(scopeData);
  };

  // Helper to get all possible ServiceTypes for a scope+route
  const getServiceTypesForRoute = (scopeKey: string, routeKey: string): string[] => {
    const scopeData = getScopeData(scopeKey) as Record<string, unknown> | null;
    if (!scopeData) return [];
    const routeObj = scopeData[routeKey] as Record<string, unknown> | undefined;
    if (!routeObj) return [];
    return Object.keys(routeObj).filter((typeKey) => {
      const ordersForType = routeObj[typeKey];
      return Array.isArray(ordersForType) && ordersForType.length > 0;
    });
  };

  // Aggregates all orders for current selection of scope, route, and service type
  const getOrdersForSelection = (): Order[] => {
    if (
      !categorizedOrders ||
      !selectedScope ||
      !selectedRoute ||
      !selectedServiceType
    ) {
      return [];
    }
    const scopeData = getScopeData(selectedScope) as Record<string, unknown> | null;
    if (!scopeData) return [];
    const routeObj = scopeData[selectedRoute] as Record<string, unknown> | undefined;
    if (!routeObj) return [];
    const selectedNorm = normalizeServiceTypeKey(selectedServiceType);
    const matchedServiceTypeKey =
      Object.keys(routeObj).find(
        (k) => normalizeServiceTypeKey(k) === selectedNorm
      ) ?? selectedServiceType;
    const ordersForServiceType = routeObj[matchedServiceTypeKey];
    console.log("[CreateBatchPage] serviceType match", {
      selectedScope,
      selectedRoute,
      selectedServiceType,
      matchedServiceTypeKey,
      availableServiceKeys: Object.keys(routeObj),
      ordersCount: Array.isArray(ordersForServiceType)
        ? ordersForServiceType.length
        : 0,
    });
    if (!Array.isArray(ordersForServiceType)) return [];
    return ordersForServiceType;
  };

  // Returns all available shipping scope keys based on response
  const getAvailableScopes = (): string[] => {
    if (!categorizedOrders) return [];
    const available: string[] = [];
    const grouped = categorizedOrders.grouped as any;
    if (grouped.TOWN && Object.keys(grouped.TOWN).length > 0) {
      available.push("TOWN");
    } else if (grouped.IN_TOWN && Object.keys(grouped.IN_TOWN).length > 0) {
      available.push("TOWN");
    }
    if (grouped.REGIONAL && Object.keys(grouped.REGIONAL).length > 0) {
      available.push("REGIONAL");
    }
    if (grouped.INTERNATIONAL && Object.keys(grouped.INTERNATIONAL).length > 0) {
      available.push("INTERNATIONAL");
    }
    return available;
  };

  // For a given scope, count orders across all routes and service types
  const getScopeOrderCount = (scope: string): number => {
    if (!categorizedOrders) return 0;
    const scopeData = getScopeData(scope);
    if (!scopeData) return 0;
    let total = 0;
    Object.values(scopeData).forEach((routeObj: any) => {
      Object.keys(routeObj ?? {}).forEach((serviceType) => {
        const arr: Order[] = Array.isArray(routeObj[serviceType])
          ? routeObj[serviceType]
          : [];
        total += arr.length;
      });
    });
    return total;
  };

  // For a given route within the currently-selected scope, count orders across its serviceTypes
  const getRouteOrderCount = (routeKey: string): number => {
    if (!categorizedOrders || !selectedScope) return 0;
    const scopeData = getScopeData(selectedScope);
    if (!scopeData) return 0;
    const routeObj = (scopeData as any)[routeKey];
    if (!routeObj) return 0;
    let total = 0;
    Object.keys(routeObj ?? {}).forEach((serviceType) => {
      const arr: Order[] = Array.isArray(routeObj[serviceType])
        ? routeObj[serviceType]
        : [];
      total += arr.length;
    });
    return total;
  };

  // For a given serviceType within currently-selected scope+route, count orders
  const getServiceTypeOrderCount = (type: string): number => {
    if (!categorizedOrders || !selectedScope || !selectedRoute) return 0;
    const scopeData = getScopeData(selectedScope);
    if (!scopeData) return 0;
    const routeObj = (scopeData as any)[selectedRoute];
    if (!routeObj) return 0;
    const matchedType =
      Object.keys(routeObj).find(
        (k) => normalizeServiceTypeKey(k) === normalizeServiceTypeKey(type)
      ) ?? type;
    const arr: Order[] = Array.isArray(routeObj[matchedType])
      ? routeObj[matchedType]
      : [];
    return arr.length;
  };

  // ====== Advanced logic for Batch creation based on selected orders =======
  // Helper, used to quickly lookup all order objects by id for first order info
  const orderIdToOrderMap = useMemo(() => {
    const orders = getOrdersForSelection();
    const map: Record<string, Order> = {};
    orders.forEach(order => {
      map[order.id] = order;
    });
    return map;
    // Only recalc when categorizedOrders or selection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorizedOrders, selectedScope, selectedRoute, selectedServiceType]);

  // In place of the old category state, derive unique categories from selected orders
  const ordersForSelection = getOrdersForSelection();
  const selectedOrdersData = ordersForSelection.filter((o) =>
    selectedOrders.includes(o.id)
  );
  // Get unique category values from selected orders
  const selectedCategories: string[] = Array.from(
    new Set(
      selectedOrdersData
        .flatMap((o) =>
          Array.isArray(o.category)
            ? o.category
                .map(toCategoryLabel)
                .filter((v): v is string => Boolean(v))
            : typeof o.category === "string"
              ? [o.category]
              : []
        )
        .filter((v): v is string => Boolean(v))
    )
  );
  const batchIsFragile = selectedOrdersData.some((o) => o.isFragile);

  const handleSubmit = async () => {
    if (!selectedScope || !selectedRoute || !selectedServiceType) {
      toast.error("Please select scope, route and service type");
      return;
    }

    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    if (!destinationBranchId) {
      toast.error("Please select destination branch");
      return;
    }

    if (!originBranchId) {
      toast.error("Please select origin branch");
      return;
    }

    // Get all orders for the current selection and selected orders
    const allSelectedOrdersData: Order[] = selectedOrders
      .map(orderId => orderIdToOrderMap[orderId])
      .filter(Boolean);

    // For batch creation, first order is used for category/origin logic
    const firstSelectedOrder = allSelectedOrdersData[0];

    if (!firstSelectedOrder) {
      toast.error("Unable to resolve addresses from selected order");
      return;
    }

    // Try to use branchId if exists, fallback to branch property if exists
    let originId =
      (firstSelectedOrder as any).branchId ||
      (firstSelectedOrder as any).branch?.id;

    // If originId is missing, fall back to originBranchId selected by user, otherwise use destinationBranchId
    if (!originId) {
      if (originBranchId) {
        originId = originBranchId;
      } else if (destinationBranchId) {
        originId = destinationBranchId;
      } else {
        toast.error("Unable to resolve origin branch from selected order");
        return;
      }
    } else {
      // If both a default-origin (from order) and a manually selected origin exist, prefer the selected origin
      if (originBranchId) {
        originId = originBranchId;
      }
    }

    if (!shipmentDate) {
      toast.error("Please select a shipment date");
      return;
    }

    // Calculate total weight
    const totalWeight = allSelectedOrdersData.reduce((sum, o) => sum + (o.weight || 0), 0);
    // Fragile flag
    const hasFragileItem = allSelectedOrdersData.some((o) => o.isFragile);

    // Collect categories directly from selected orders for batch
    let batchCategories: string[] | undefined;
    if (selectedCategories.length > 0) {
      batchCategories = selectedCategories;
    } else if (Array.isArray(firstSelectedOrder.category)) {
      batchCategories = firstSelectedOrder.category
        .map(toCategoryLabel)
        .filter((v): v is string => Boolean(v));
    }

    // ====== Get originCity and destinationCity from route string, fallback to "" if can't parse ======
    let originCity = "";
    let destinationCity = "";
    if (selectedRoute) {
      // Example: "Unknown → hawassa"
      const arrowIndex = selectedRoute.indexOf("→");

      if (arrowIndex !== -1) {
        originCity = selectedRoute.slice(0,arrowIndex ).trim();
        destinationCity = selectedRoute.slice(arrowIndex + 1).trim();
      } else {
        originCity = "";
        destinationCity = "";
      }
    }

    try {
      setSubmitting(true);
      const serviceTypeId =
        serviceTypeIdByKey.get(normalizeServiceTypeKey(selectedServiceType)) ??
        serviceTypeIdByKey.get(selectedServiceType);
      if (!serviceTypeId) {
        toast.error(
          `Could not resolve service type id for "${selectedServiceType}"`,
        );
        console.log("[CreateBatchPage] unresolved service type id", {
          selectedServiceType,
          availableServiceTypes: serviceTypes.map((s) => ({
            id: s.id,
            name: s.name,
          })),
        });
        setSubmitting(false);
        return;
      }
      const batchData = {
        scope: selectedScope,
        // route: selectedRoute,
        serviceTYpeId: serviceTypeId,
        category: batchCategories,
        isFragile: hasFragileItem,
        originId: originBranchId || originId, // Always prefer UI-selected originBranchId
        destinationId: destinationBranchId,
        notes: notes || undefined,
        weight: totalWeight || undefined,
        orders: selectedOrders,
        shipmentDate,
        originCity: originCity,
        destinationCity: destinationCity,
      };

      const response: any = await createBatch(batchData as CreateBatchRequest);
      toast.success(response.message || "Batch created successfully");
      const code = response?.data?.batch?.batchCode || response?.batch?.batchCode || "";
      setBatchCode(code);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create batch";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setBatchCode("");
    navigate("/batch");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/batch")}
          className="p-2 hover:bg-gray-100 w-fit flex-shrink-0 h-fit"
        >
          <IoArrowBack className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Create Batch
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a new batch from categorized orders
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scope, Route, and Service Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step 1: Select Scope */}
                <div className="space-y-2">
                  <Label>Shipping Scope</Label>
                  <Select
                    value={selectedScope}
                    onValueChange={(value) => {
                      setSelectedScope(value as typeof SCOPES[number]);
                      setSelectedRoute("");
                      setSelectedServiceType("");
                      setSelectedOrders([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          categorizedOrdersError
                            ? "Could not load order categories"
                            : "Select scope"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categorizedOrdersError ? (
                        <div className="py-2 px-4 text-red-500">
                          Could not load order categories.
                        </div>
                      ) : getAvailableScopes().length > 0 ? (
                        getAvailableScopes().map((scope) => {
                            const count = getScopeOrderCount(scope);
                            return (
                              <SelectItem
                                key={scope}
                                value={scope}
                                disabled={count === 0}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {scope === "TOWN" ? "IN TOWN" : scope.replace("_", " ")}
                                  </span>
                                  <Badge
                                    variant={count > 0 ? "default" : "secondary"}
                                    className="ml-2"
                                  >
                                    {count} {count === 1 ? "order" : "orders"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })
                      ) : (
                        SCOPES.map((scope) => {
                            const count = getScopeOrderCount(scope);
                            return (
                              <SelectItem
                                key={scope}
                                value={scope}
                                disabled={count === 0}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>
                                    {scope === "TOWN" ? "IN TOWN" : scope.replace("_", " ")}
                                  </span>
                                  <Badge
                                    variant={count > 0 ? "default" : "secondary"}
                                    className="ml-2"
                                  >
                                    {count} {count === 1 ? "order" : "orders"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Step 2: Select Country-Route after Scope */}
                {selectedScope && (
                  <div className="space-y-2">
                    <Label>Route (Country/City Pair)</Label>
                    <Select
                      value={selectedRoute}
                      onValueChange={(value) => {
                        setSelectedRoute(value);
                        setSelectedServiceType("");
                        setSelectedOrders([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        {getRouteKeysForScope(selectedScope).length === 0 ? (
                          <SelectItem value="" disabled>
                            No routes available
                          </SelectItem>
                        ) : (
                          getRouteKeysForScope(selectedScope).map((route) => {
                            const count = getRouteOrderCount(route);
                            return (
                              <SelectItem
                                key={route}
                                value={route}
                                disabled={count === 0}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{route}</span>
                                  <Badge
                                    variant={count > 0 ? "default" : "secondary"}
                                    className="ml-2"
                                  >
                                    {count} {count === 1 ? "order" : "orders"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            )
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Step 3: Select Service Type for chosen route */}
                {selectedScope && selectedRoute && (
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select
                      value={selectedServiceType}
                      onValueChange={(value) => {
                        setSelectedServiceType(value);
                        setSelectedOrders([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categorizedOrdersError
                              ? "Could not load order categories"
                              : "Select service type"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categorizedOrdersError ? (
                          <SelectItem value="" disabled>
                            Could not load order categories.
                          </SelectItem>
                        ) : getServiceTypesForRoute(selectedScope, selectedRoute).length === 0 ? (
                          <SelectItem value="" disabled>No service types available</SelectItem>
                        ) : (
                          getServiceTypesForRoute(selectedScope, selectedRoute).map((type) => {
                            const count = getServiceTypeOrderCount(type);
                            return (
                              <SelectItem
                                key={type}
                                value={type}
                                disabled={count === 0}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{getServiceTypeLabel(type)}</span>
                                  <Badge
                                    variant={count > 0 ? "default" : "secondary"}
                                    className="ml-2"
                                  >
                                    {count} {count === 1 ? "order" : "orders"}
                                  </Badge>
                                </div>
                              </SelectItem>
                            )
                          })
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Info: Orders count for final selection */}
                {selectedScope && selectedRoute && selectedServiceType && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600">
                      Available orders:{" "}
                      <span className="font-semibold">
                        {ordersForSelection.length}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Selection */}
            {selectedScope && selectedRoute && selectedServiceType && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Select Orders</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(ordersForSelection)}
                      className="text-gray-600 bg-white border-gray-300"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAll(ordersForSelection)}
                      className="text-gray-600 bg-white border-gray-300"
                    >
                      Deselect All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersForSelection.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No orders available in this category
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {ordersForSelection.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => handleOrderToggle(order.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {order.trackingCode}
                              </span>
                              {order.isFragile && (
                                <Badge variant="destructive">Fragile</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Weight: {order.weight} kg
                            </p>
                            {order.deliveryAddress && (
                              <p className="text-xs text-gray-500">
                                {order.deliveryAddress.addressLine ||
                                  "Address not available"}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Batch Details Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Batch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Shipment Date *</Label>
                  <Input
                    type="date"
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    required
                  />
                </div>

                {/* Origin Branch just below Destination Branch */}
                <div className="space-y-2">
                  <Label>Origin Branch *</Label>
                  <Select
                    value={originBranchId}
                    onValueChange={(value) => setOriginBranchId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBranches
                            ? "Loading branches..."
                            : branchesError
                              ? "Could not load branches"
                              : branches.length === 0
                                ? "No branches available"
                                : "Select origin branch"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}{" "}
                          {branch.location
                            ? `- ${branch.location}`
                            : `(${branch.id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingBranches && (
                    <p className="text-xs text-gray-500">Loading branches...</p>
                  )}
                  {!loadingBranches && branchesError && (
                    <p className="text-xs text-red-500">Could not load branches.</p>
                  )}
                  {!loadingBranches && !branchesError && branches.length === 0 && (
                    <p className="text-xs text-red-500">
                      No branches available. Please create a branch first.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Destination Branch *</Label>
                  <Select
                    value={destinationBranchId}
                    onValueChange={(value) => setDestinationBranchId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingBranches
                            ? "Loading branches..."
                            : branchesError
                              ? "Could not load branches"
                              : branches.length === 0
                                ? "No branches available"
                                : "Select destination branch"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}{" "}
                          {branch.location
                            ? `- ${branch.location}`
                            : `(${branch.id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingBranches && (
                    <p className="text-xs text-gray-500">Loading branches...</p>
                  )}
                  {!loadingBranches && branchesError && (
                    <p className="text-xs text-red-500">Could not load branches.</p>
                  )}
                  {!loadingBranches && !branchesError && branches.length === 0 && (
                    <p className="text-xs text-red-500">
                      No branches available. Please create a branch first.
                    </p>
                  )}
                </div>

                {/* Show combined (unique) categories from selected orders */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  {selectedCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">No categories found for selected orders</div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Fragile Status</Label>
                  {batchIsFragile ? (
                    <Badge variant="destructive" className="text-xs">
                      Contains fragile items
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      No fragile items
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                {selectedOrders.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">
                      Selected Orders: {selectedOrders.length}
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedOrdersData.map((order) => (
                        <Badge key={order.id} variant="outline">
                          {order.trackingCode}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => navigate("/batch")}
                variant="outline"
                className="w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2 text-sm font-medium transition-colors shadow-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || selectedOrders.length === 0}
                className="w-auto bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] px-6 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <Spinner className="h-4 w-4 text-[#FADF4B] mr-2" />
                    Creating...
                  </span>
                ) : (
                  "Create Batch"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={batchCode}
        title="Batch Created Successfully!"
        description="Your batch has been created and is ready for dispatch."
        trackingLabel="Batch Code"
        qrCodeLabel="Scan this QR code to track your batch"
      />
    </div>
  );
}

export default CreateBatchPage;
