import { useState, useEffect, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { useOrderReport } from "@/hooks/useOrderReport";
import {
  ReportPreset,
  exportOrderReportPdf,
  type OrderReportFilters,
  type OrderDetailedReportRow,
  type OrderReportGroup,
} from "@/lib/api/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Download,
  Package,
  DollarSign,
  X,
} from "lucide-react";

function formatOrderGroupLabel(
  groupKey: string,
  groupBy: OrderReportFilters["groupBy"],
): string {
  if (!groupKey) return "—";
  const d = new Date(groupKey);
  if (Number.isNaN(d.getTime())) return groupKey;
  if (groupBy === "day") return format(d, "MMM d, yyyy");
  if (groupBy === "week") return `Week of ${format(d, "MMM d, yyyy")}`;
  return format(d, "MMMM yyyy");
}

export function OrderRowDetails({ order }: { order: OrderDetailedReportRow }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-700">
      <div>
        <span className="font-semibold">Order ID:</span> {order.id}
      </div>
      <div>
        <span className="font-semibold">Tracking:</span>{" "}
        {order.trackingCode ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Group:</span>{" "}
        {order.group_key &&
        !Number.isNaN(new Date(order.group_key).getTime())
          ? format(new Date(order.group_key), "PP")
          : order.group_key || "—"}
      </div>
      <div>
        <span className="font-semibold">Branch:</span>{" "}
        {order.branchName ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Batch:</span>{" "}
        {order.batchCode ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Tariff:</span>{" "}
        {order.tariffName ?? "—"}
      </div>
      <div className="sm:col-span-2">
        <span className="font-semibold">Customer:</span>{" "}
        {order.customerName ?? "—"}
      </div>
      <div className="sm:col-span-2">
        <span className="font-semibold">Receiver:</span>{" "}
        {order.receiverName ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Pickup driver:</span>{" "}
        {order.pickupDriverName ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Delivery driver:</span>{" "}
        {order.deliveryDriverName ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Service / fulfillment:</span>{" "}
        {order.serviceType ?? "—"} · {order.fulfillmentType ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Scope:</span>{" "}
        {order.shippingScope ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Amount (ETB):</span>{" "}
        {order.finalPrice != null
          ? order.finalPrice.toLocaleString()
          : "—"}
      </div>
      <div className="sm:col-span-2">
        <span className="font-semibold">Created:</span>{" "}
        {order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "—"}
      </div>
    </div>
  );
}

const getPresetLabel = (preset: ReportPreset) => {
  switch (preset) {
    case ReportPreset.TODAY:
      return "Today";
    case ReportPreset.YESTERDAY:
      return "Yesterday";
    case ReportPreset.THIS_WEEK:
      return "This Week";
    case ReportPreset.LAST_WEEK:
      return "Last Week";
    case ReportPreset.THIS_MONTH:
      return "This Month";
    case ReportPreset.LAST_MONTH:
      return "Last Month";
    case ReportPreset.CUSTOM:
      return "Custom Range";
    default:
      return preset;
  }
};

function getDefaultOrderReportFilters(): OrderReportFilters {
  return {
    preset: ReportPreset.THIS_MONTH,
    dateField: "createdAt",
    groupBy: "month",
    serviceType: undefined,
    shippingScope: undefined,
    fulfillmentType: undefined,
    shipmentType: undefined,
    isFragile: undefined,
    isUnusual: undefined,
    lateDeliveryOnly: undefined,
  };
}

export default function OrderReportPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderReportFilters>(() =>
    getDefaultOrderReportFilters(),
  );

  const { data, isLoading, error, refetch } = useOrderReport(filters);

  const groups = useMemo<OrderReportGroup[]>(
    () => (Array.isArray(data) ? data : []),
    [data],
  );

  const totalOrders = useMemo(
    () => groups.reduce((sum, g) => sum + (g.total_orders ?? 0), 0),
    [groups],
  );

  const totalRevenue = useMemo(
    () => groups.reduce((sum, g) => sum + (g.total_revenue ?? 0), 0),
    [groups],
  );

  const hasActiveFilters =
    filters.preset !== ReportPreset.THIS_MONTH ||
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.serviceType ||
    !!filters.shippingScope ||
    !!filters.fulfillmentType ||
    !!filters.shipmentType ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.minWeight != null ||
    filters.maxWeight != null ||
    !!filters.isFragile ||
    !!filters.lateDeliveryOnly;

  useEffect(() => {
    console.log("Order Detailed Report Data:", data);
  }, [data]);

  const handleApplyFilters = () => {
    refetch();
    setIsFilterOpen(false);
  };

  const customRangeInvalid =
    filters.preset === ReportPreset.CUSTOM &&
    (!filters.startDate || !filters.endDate);

  const handleExportPdf = async () => {
    if (customRangeInvalid) return;
    setIsExportingPdf(true);
    try {
      await exportOrderReportPdf(filters);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Failed to export order report PDF",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const toggleExpanded = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Order Reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Detailed analytics and filters for individual orders
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Order Filters</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preset" className="text-xs font-medium">
                      Date Preset
                    </Label>
                    <Select
                      value={filters.preset ?? ReportPreset.THIS_MONTH}
                      onValueChange={(value) => {
                        const preset = value as ReportPreset;
                        setFilters((prev) => ({
                          ...prev,
                          preset,
                          ...(preset === ReportPreset.CUSTOM
                            ? {}
                            : { startDate: undefined, endDate: undefined }),
                        }));
                      }}
                    >
                      <SelectTrigger id="preset" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReportPreset.TODAY}>Today</SelectItem>
                        <SelectItem value={ReportPreset.YESTERDAY}>
                          Yesterday
                        </SelectItem>
                        <SelectItem value={ReportPreset.THIS_WEEK}>
                          This Week
                        </SelectItem>
                        <SelectItem value={ReportPreset.LAST_WEEK}>
                          Last Week
                        </SelectItem>
                        <SelectItem value={ReportPreset.THIS_MONTH}>
                          This Month
                        </SelectItem>
                        <SelectItem value={ReportPreset.LAST_MONTH}>
                          Last Month
                        </SelectItem>
                        <SelectItem value={ReportPreset.CUSTOM}>
                          Custom Range
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.preset === ReportPreset.CUSTOM && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="startDate"
                          className="text-xs font-medium"
                        >
                          From
                        </Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={filters.startDate || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              startDate: e.target.value || undefined,
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-xs font-medium">
                          To
                        </Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={filters.endDate || ""}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              endDate: e.target.value || undefined,
                            }))
                          }
                          className="h-9"
                        />
                      </div>
                    </div>
                  )}

                  {/* Shipping scope */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="shippingScope"
                      className="text-xs font-medium"
                    >
                      Shipping Scope
                    </Label>
                    <Select
                      value={filters.shippingScope ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          shippingScope: (v === "all"
                            ? undefined
                            : v) as OrderReportFilters["shippingScope"],
                        }))
                      }
                    >
                      <SelectTrigger id="shippingScope" className="h-9 w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="REGIONAL">Regional</SelectItem>
                        <SelectItem value="TOWN">Town</SelectItem>
                        <SelectItem value="INTERNATIONAL">
                          International
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Service Type */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="serviceType"
                      className="text-xs font-medium"
                    >
                      Service Type
                    </Label>
                    <Select
                      value={filters.serviceType ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          serviceType: (v === "all"
                            ? undefined
                            : v) as OrderReportFilters["serviceType"],
                        }))
                      }
                    >
                      <SelectTrigger id="serviceType" className="h-9 w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="EXPRESS">Express</SelectItem>
                        <SelectItem value="SAME_DAY">Same Day</SelectItem>
                        <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fulfillment Type */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="fulfillmentType"
                      className="text-xs font-medium"
                    >
                      Fulfillment Type
                    </Label>
                    <Select
                      value={filters.fulfillmentType ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          fulfillmentType: (v === "all"
                            ? undefined
                            : v) as OrderReportFilters["fulfillmentType"],
                        }))
                      }
                    >
                      <SelectTrigger
                        id="fulfillmentType"
                        className="h-9 w-full"
                      >
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PICKUP">Pickup</SelectItem>
                        <SelectItem value="DROPOFF">Dropoff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="minPrice" className="text-xs font-medium">
                        Min Price
                      </Label>
                      <Input
                        id="minPrice"
                        type="number"
                        value={filters.minPrice ?? ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minPrice: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPrice" className="text-xs font-medium">
                        Max Price
                      </Label>
                      <Input
                        id="maxPrice"
                        type="number"
                        value={filters.maxPrice ?? ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxPrice: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="minWeight"
                        className="text-xs font-medium"
                      >
                        Min Weight
                      </Label>
                      <Input
                        id="minWeight"
                        type="number"
                        value={filters.minWeight ?? ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minWeight: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="maxWeight"
                        className="text-xs font-medium"
                      >
                        Max Weight
                      </Label>
                      <Input
                        id="maxWeight"
                        type="number"
                        value={filters.maxWeight ?? ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxWeight: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          }))
                        }
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isFragile"
                      checked={!!filters.isFragile}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({
                          ...prev,
                          isFragile: checked === true ? true : undefined,
                        }))
                      }
                    />
                    <Label htmlFor="isFragile" className="text-xs font-medium">
                      Fragile shipments only
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(getDefaultOrderReportFilters())}
                      className="flex-1 cursor-pointer"
                    >
                      Reset all
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApplyFilters}
                      disabled={isLoading || customRangeInvalid}
                      className="flex-1 bg-[#EE1E21] cursor-pointer hover:bg-[#cc1a1c] text-[#FADF4B]"
                    >
                      Apply now
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh Data
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPdf}
              disabled={isLoading || isExportingPdf || customRangeInvalid}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Download
                className={`h-4 w-4 ${isExportingPdf ? "opacity-50" : ""}`}
              />
              {isExportingPdf ? "Exporting…" : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Applied filters — same chip pattern as general Report page */}
      {hasActiveFilters && (
        <div className="mb-4 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Applied filters
            </span>

            {filters.preset !== ReportPreset.THIS_MONTH && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    preset: ReportPreset.THIS_MONTH,
                    startDate: undefined,
                    endDate: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-800 shadow-sm hover:bg-gray-50"
              >
                <span>
                  Preset: {getPresetLabel(filters.preset ?? ReportPreset.THIS_MONTH)}
                </span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.preset === ReportPreset.CUSTOM &&
              filters.startDate &&
              filters.endDate && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      preset: ReportPreset.THIS_MONTH,
                      startDate: undefined,
                      endDate: undefined,
                    }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-[#EE1E21]/20 bg-[#EE1E21]/5 px-3 py-1 text-xs text-[#EE1E21] shadow-sm hover:bg-[#EE1E21]/10"
                >
                  <span>
                    Date: {filters.startDate} → {filters.endDate}
                  </span>
                  <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </button>
              )}

            {filters.serviceType && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, serviceType: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                <span>Service: {filters.serviceType}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.fulfillmentType && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    fulfillmentType: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-800 shadow-sm hover:bg-indigo-100"
              >
                <span>Fulfillment: {filters.fulfillmentType}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.shippingScope && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    shippingScope: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 shadow-sm hover:bg-orange-100"
              >
                <span>Scope: {filters.shippingScope}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.shipmentType && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    shipmentType: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-800 shadow-sm hover:bg-teal-100"
              >
                <span>Shipment: {filters.shipmentType}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.minPrice != null && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minPrice: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-800 shadow-sm hover:bg-violet-100"
              >
                <span>Min price: {filters.minPrice}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.maxPrice != null && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, maxPrice: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-800 shadow-sm hover:bg-violet-100"
              >
                <span>Max price: {filters.maxPrice}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.minWeight != null && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, minWeight: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900 shadow-sm hover:bg-amber-100"
              >
                <span>Min weight: {filters.minWeight}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.maxWeight != null && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, maxWeight: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900 shadow-sm hover:bg-amber-100"
              >
                <span>Max weight: {filters.maxWeight}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.isFragile && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, isFragile: undefined }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-800 shadow-sm hover:bg-rose-100"
              >
                <span>Fragile only</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.lateDeliveryOnly && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    lateDeliveryOnly: undefined,
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-800 shadow-sm hover:bg-red-100"
              >
                <span>Late only</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => setFilters(getDefaultOrderReportFilters())}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#EE1E21]" />
          <span className="ml-3 text-gray-600">Loading order report...</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">
              Error loading order report: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Orders
                </CardTitle>
                <Package className="h-5 w-5 text-[#EE1E21]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalOrders.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalRevenue.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-gray-500">
                    ETB
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-gray-500 text-center">
                  No orders found for the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <Card key={group.group_key}>
                  <CardHeader>
                    <CardTitle>
                      {formatOrderGroupLabel(
                        group.group_key,
                        filters.groupBy,
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-500 font-normal">
                      {group.total_orders.toLocaleString()} orders ·{" "}
                      {group.total_revenue.toLocaleString()} ETB
                    </p>
                  </CardHeader>
                  <CardContent>
                    {group.orders.length === 0 ? (
                      <p className="text-sm text-gray-500">No orders in this group.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tracking</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead className="hidden sm:table-cell">
                                Receiver
                              </TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="hidden lg:table-cell">
                                Service
                              </TableHead>
                              <TableHead className="hidden lg:table-cell">
                                Fulfillment
                              </TableHead>
                              <TableHead className="hidden xl:table-cell">
                                Scope
                              </TableHead>
                              <TableHead className="hidden xl:table-cell">
                                Tariff
                              </TableHead>
                              <TableHead>Amount (ETB)</TableHead>
                              <TableHead className="hidden md:table-cell">
                                Created
                              </TableHead>
                              <TableHead className="text-right">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.orders.map((order) => {
                              const isExpanded = expandedOrderId === order.id;
                              return (
                                <Fragment key={order.id}>
                                  <TableRow>
                                    <TableCell className="font-medium">
                                      {order.trackingCode ?? order.id}
                                    </TableCell>
                                    <TableCell>
                                      {order.customerName || "—"}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      {order.receiverName || "—"}
                                    </TableCell>
                                    <TableCell>
                                      <span className="text-xs rounded-full bg-[#EE1E21]/5 text-[#EE1E21] px-2 py-0.5">
                                        {order.status ?? "—"}
                                      </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                      {order.serviceType ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                      {order.fulfillmentType ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell">
                                      {order.shippingScope ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell max-w-[140px] truncate" title={order.tariffName}>
                                      {order.tariffName ?? "—"}
                                    </TableCell>
                                    <TableCell>
                                      {order.finalPrice != null
                                        ? order.finalPrice.toLocaleString()
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell whitespace-nowrap">
                                      {order.createdAt
                                        ? new Date(
                                            order.createdAt,
                                          ).toLocaleString()
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleExpanded(order.id)
                                        }
                                        className="gap-2"
                                      >
                                        {isExpanded ? (
                                          <>
                                            <ChevronUp className="h-4 w-4" />
                                            Hide
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-4 w-4" />
                                            Details
                                          </>
                                        )}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow>
                                      <TableCell
                                        colSpan={11}
                                        className="bg-gray-50"
                                      >
                                        <OrderRowDetails order={order} />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
