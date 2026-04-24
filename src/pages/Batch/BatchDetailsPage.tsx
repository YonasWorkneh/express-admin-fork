"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { IoArrowBack, IoAdd } from "react-icons/io5";
import {  addOrdersToBatch, getCategorizedOrders } from "@/lib/api/batch";
import type { Batch, Order, CategorizedOrdersResponse } from "@/types/types";
import toast from "react-hot-toast";
import { Skeleton } from "antd";
import { Spinner } from "@/utils/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser } from "@/hooks/useUser";

/** serviceType from API can be a string, enum, or { name, id, ... }. */
function getServiceTypeLabel(
  serviceType: Batch["serviceType"] | null | undefined,
): string {
  if (serviceType == null) return "N/A";
  if (typeof serviceType === "string" || typeof serviceType === "number") {
    const t = String(serviceType).trim();
    return t || "N/A";
  }
  if (typeof serviceType === "object") {
    const o = serviceType as { name?: string; label?: string; id?: string };
    const text = o.name ?? o.label ?? o.id;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "N/A";
}

function getServiceTypeRouteKey(batch: Batch): string {
  const st = batch.serviceType;
  if (typeof st === "string" || typeof st === "number")
    return String(st).trim();
  if (st && typeof st === "object") {
    const name = (st as { name?: string }).name;
    if (name?.trim()) return name.trim();
  }
  if (typeof batch.serviceTypeId === "string" && batch.serviceTypeId.trim())
    return batch.serviceTypeId;
  return "";
}

function getCategoryLabel(cat: string | { name?: string }): string {
  if (typeof cat === "string") return cat;
  if (cat && typeof cat === "object" && typeof cat.name === "string")
    return cat.name;
  return String(cat);
}

function BatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const locationState = location.state as { batch?: Batch } | null;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [showAddOrders, setShowAddOrders] = useState(false);
  const [categorizedOrders, setCategorizedOrders] =
    useState<CategorizedOrdersResponse | any>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const officerUserQuery = useUser(batch?.officerId ?? null);

  const fetchBatch = async () => {
    // Prefer data passed via navigation state to avoid refetching
    if (locationState?.batch) {
      setBatch(locationState.batch);
      setLoading(false);
      return;
    }

    // If there is no state (e.g. direct URL access), you can either:
    // - redirect back, or
    // - optionally fetch from backend.
    // For now, just show an error and send user back to list.
    if (!id) {
      setLoading(false);
      toast.error("Invalid batch id");
      navigate("/batch");
      return;
    }

    setLoading(false);
    toast.error("Batch details not available. Please open from batch list.");
    navigate("/batch");
  };

  const fetchCategorizedOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await getCategorizedOrders({ pageSize: 100 });
      setCategorizedOrders(response.data);
      setLoadingOrders(false);
    } catch (error: any) {
      setLoadingOrders(false);
      toast.error("Failed to load available orders");
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [id]);

  useEffect(() => {
    if (showAddOrders) {
      fetchCategorizedOrders();
    }
  }, [showAddOrders]);

  const handleOrderToggle = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getAvailableOrders = (): Order[] => {
    if (!categorizedOrders || !batch) return [];
    // Handle both "TOWN" and "IN_TOWN" - API returns "TOWN" but batch may use "IN_TOWN"
    const scopeKey =
      batch.scope === "IN_TOWN" || batch.scope === "TOWN" ? "TOWN" : batch.scope;
    const serviceKey = getServiceTypeRouteKey(batch);
    if (!serviceKey) return [];
    const scopeData = categorizedOrders.grouped[scopeKey as keyof typeof categorizedOrders.grouped];
    if (!scopeData) return [];

    // Flat shape: { [serviceName]: Order[] }
    const direct = (scopeData as Record<string, unknown>)[serviceKey];
    if (Array.isArray(direct)) {
      return (direct as Order[]).filter(
        (order) => !batch.orders.some((bo) => bo.id === order.id),
      );
    }

    // Nested shape: { [routeKey]: { [serviceName]: Order[] } }
    for (const route of Object.values(scopeData)) {
      if (route && typeof route === "object" && !Array.isArray(route)) {
        const inner = (route as Record<string, Order[]>)[serviceKey];
        if (Array.isArray(inner)) {
          return inner.filter(
            (order) => !batch.orders.some((bo) => bo.id === order.id),
          );
        }
      }
    }
    return [];
  };

  const handleAddOrders = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    if (!id) return;

    try {
      setSubmitting(true);
      const response = await addOrdersToBatch(id, { orders: selectedOrders });
      toast.success(response.message || "Orders added successfully");
      setShowAddOrders(false);
      setSelectedOrders([]);
      fetchBatch();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to add orders";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-700";
      case "DISPATCHED":
        return "bg-purple-100 text-purple-700";
      case "IN_TRANSIT":
        return "bg-indigo-100 text-indigo-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-teal-100 text-teal-700";
      case "CLOSED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case "TOWN":
      case "IN_TOWN":
        return "bg-blue-100 text-blue-700";
      case "REGIONAL":
        return "bg-green-100 text-green-700";
      case "INTERNATIONAL":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (!batch) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Batch not found</p>
        <Button onClick={() => navigate("/batch")} className="mt-4">
          Back to Batches
        </Button>
      </div>
    );
  }

  const availableOrders = getAvailableOrders();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/batch")}
          className="flex items-center gap-2"
        >
          <IoArrowBack className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Batch Details
          </h1>
          <p className="text-sm text-gray-500 mt-1">{batch.batchCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Batch Information */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Batch Code</Label>
                  <p className="font-medium">{batch.batchCode}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Scope</Label>
                  <div>
                    <Badge className={getScopeColor(batch.scope)}>
                      {batch.scope}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Service Type</Label>
                  <p className="font-medium">{getServiceTypeLabel(batch.serviceType)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Weight</Label>
                  <p className="font-medium">
                    {batch.weight ? `${batch.weight} kg` : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Fragile</Label>
                  <p className="font-medium">{batch.isFragile ? "Yes" : "No"}</p>
                </div>
                {batch.awbNumber && (
                  <div>
                    <Label className="text-gray-500">AWB Number</Label>
                    <p className="font-medium">{batch.awbNumber}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500">Created At</Label>
                  <p className="font-medium">
                    {batch.createdAt
                      ? new Date(batch.createdAt).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {batch.category && batch.category.length > 0 && (
                <div>
                  <Label className="text-gray-500">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {batch.category.map((cat, i) => (
                      <Badge key={`${getCategoryLabel(cat)}-${i}`} variant="secondary">
                        {getCategoryLabel(cat)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {batch.notes && (
                <div>
                  <Label className="text-gray-500">Notes</Label>
                  <p className="mt-1">{batch.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Orders ({batch.orders?.length || 0})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddOrders(!showAddOrders)}
                className="flex items-center gap-2"
              >
                <IoAdd className="h-4 w-4" />
                Add Orders
              </Button>
            </CardHeader>
            <CardContent>
              {batch.orders && batch.orders.length > 0 ? (
                <div className="space-y-2">
                  {batch.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{order.trackingCode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No orders in this batch
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add Orders Modal */}
          {showAddOrders && (
            <Card>
              <CardHeader>
                <CardTitle>Add Orders to Batch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingOrders ? (
                  <Skeleton active paragraph={{ rows: 5 }} />
                ) : availableOrders.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No available orders in this category
                  </p>
                ) : (
                  <>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {availableOrders.map((order) => (
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
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddOrders(false);
                          setSelectedOrders([]);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddOrders}
                        disabled={submitting || selectedOrders.length === 0}
                        className="flex-1"
                      >
                        {submitting ? <Spinner /> : "Add Selected Orders"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-500">Origin</Label>
                <p className="font-medium">
                  {batch.originCity?.trim()
                    ? batch.originCity
                    : "—"}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Destination</Label>
                <p className="font-medium">
                  {batch.destinationCity?.trim()
                    ? batch.destinationCity
                    : "—"}
                </p>
              </div>
              {batch.driverId && (
                <div>
                  <Label className="text-gray-500">Driver ID</Label>
                  <p className="font-medium">{batch.driverId}</p>
                </div>
              )}
              {batch.vehicleId && (
                <div>
                  <Label className="text-gray-500">Vehicle ID</Label>
                  <p className="font-medium">{batch.vehicleId}</p>
                </div>
              )}
              {batch.officerId && (
                <div>
                  <Label className="text-gray-500">Cargo officer</Label>
                  <p className="font-medium">
                    {officerUserQuery.isPending
                      ? "Loading…"
                      : officerUserQuery.data?.name?.trim() || "—"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default BatchDetailsPage;
