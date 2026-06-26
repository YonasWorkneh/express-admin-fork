import { useState, useEffect } from "react";
import { useRevenueReport } from "@/hooks/useRevenueReport";
import {
  ReportPreset,
  exportRevenueReportPdf,
  type RevenueReportFilters,
} from "@/lib/api/report";
import type { RevenueReportGroup } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  DollarSign,
  Package,
  Calendar,
  X,
  Download,
} from "lucide-react";
import { format } from "date-fns";

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

function getDefaultRevenueFilters(): RevenueReportFilters {
  return {
    preset: ReportPreset.THIS_MONTH,
    page: 1,
    limit: 20,
    groupBy: "month",
    revenueType: "gross",
    currency: "ETB",
    serviceType: undefined,
    shippingScope: undefined,
    fulfillmentType: undefined,
    deliveredOnly: false,
    lateOnly: false,
    onTimeOnly: false,
  };
}

export default function RevenueReportPage() {
  const [filters, setFilters] = useState<RevenueReportFilters>(() =>
    getDefaultRevenueFilters(),
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data, isLoading, error, refetch } = useRevenueReport(filters);

  const customRangeInvalid =
    filters.preset === ReportPreset.CUSTOM &&
    (!filters.startDate || !filters.endDate);

  const groups: RevenueReportGroup[] = Array.isArray(data) ? data : [];
  const totalRevenue = groups.reduce(
    (sum, g) => sum + (g.total_revenue ?? 0),
    0,
  );
  const totalOrders = groups.reduce((sum, g) => sum + (g.total_orders ?? 0), 0);
  const totalDriverEarnings = groups.reduce(
    (sum, g) => sum + (g.total_driver_earnings ?? 0),
    0,
  );

  useEffect(() => {
    console.log("Revenue Report Data:", data);
  }, [data]);

  const handleApplyFilters = () => {
    refetch();
  };

  const handleExportPdf = async () => {
    if (customRangeInvalid) return;
    setIsExportingPdf(true);
    try {
      await exportRevenueReportPdf(filters);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Failed to export revenue report PDF",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Revenue Reports
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Revenue analytics with filters and grouping
        </p>
      </div>

      {/* Applied Filters */}
      {(filters.preset !== ReportPreset.THIS_MONTH ||
        !!filters.startDate ||
        !!filters.endDate ||
        filters.shippingScope ||
        filters.serviceType ||
        filters.fulfillmentType ||
        filters.revenueType !== "gross" ||
        filters.groupBy !== "month" ||
        filters.deliveredOnly ||
        filters.lateOnly ||
        filters.onTimeOnly) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Applied filters:</span>

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
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              <span>
                Preset:{" "}
                {getPresetLabel(filters.preset ?? ReportPreset.THIS_MONTH)}
              </span>
              <X className="h-3 w-3" />
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
                className="inline-flex items-center gap-1 rounded-full border border-[#EE1E21]/20 bg-[#EE1E21]/5 px-3 py-1 text-xs text-[#EE1E21] hover:bg-[#EE1E21]/10"
              >
                <span>
                  Date: {filters.startDate} → {filters.endDate}
                </span>
                <X className="h-3 w-3" />
              </button>
            )}

          {filters.groupBy && filters.groupBy !== "month" && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  groupBy: "month",
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              <span>Group by: {filters.groupBy}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {filters.revenueType && filters.revenueType !== "gross" && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  revenueType: "gross",
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
            >
              <span>Type: {filters.revenueType}</span>
              <X className="h-3 w-3" />
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
              className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-700 hover:bg-orange-100"
            >
              <span>Scope: {filters.shippingScope}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {filters.serviceType && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  serviceType: undefined,
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-100"
            >
              <span>Service: {filters.serviceType}</span>
              <X className="h-3 w-3" />
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
              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
            >
              <span>Fulfillment: {filters.fulfillmentType}</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {filters.deliveredOnly && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  deliveredOnly: false,
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700 hover:bg-teal-100"
            >
              <span>Delivered only</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {filters.lateOnly && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  lateOnly: false,
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
            >
              <span>Late only</span>
              <X className="h-3 w-3" />
            </button>
          )}

          {filters.onTimeOnly && (
            <button
              type="button"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  onTimeOnly: false,
                }))
              }
              className="inline-flex items-center gap-1 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs text-lime-700 hover:bg-lime-100"
            >
              <span>On time only</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-2 items-start">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[11rem]">
            <Label htmlFor="revenue-preset" className="text-xs font-medium">
              Date preset
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
              <SelectTrigger id="revenue-preset" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ReportPreset.TODAY}>Today</SelectItem>
                <SelectItem value={ReportPreset.YESTERDAY}>Yesterday</SelectItem>
                <SelectItem value={ReportPreset.THIS_WEEK}>This Week</SelectItem>
                <SelectItem value={ReportPreset.LAST_WEEK}>Last Week</SelectItem>
                <SelectItem value={ReportPreset.THIS_MONTH}>This Month</SelectItem>
                <SelectItem value={ReportPreset.LAST_MONTH}>Last Month</SelectItem>
                <SelectItem value={ReportPreset.CUSTOM}>Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filters.preset === ReportPreset.CUSTOM && (
            <>
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-xs font-medium">
                  From
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value || undefined,
                    }))
                  }
                  className="h-9 w-40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-xs font-medium">
                  To
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value || undefined,
                    }))
                  }
                  className="h-9 w-40"
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="groupBy" className="text-xs font-medium">
              Group by
            </Label>
            <Select
              value={filters.groupBy ?? "month"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  groupBy: v as "day" | "week" | "month",
                }))
              }
            >
              <SelectTrigger id="groupBy" className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="revenueType" className="text-xs font-medium">
              Revenue type
            </Label>
            <Select
              value={filters.revenueType ?? "gross"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  revenueType: v as "gross" | "net",
                }))
              }
            >
              <SelectTrigger id="revenueType" className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gross">Gross</SelectItem>
                <SelectItem value="net">Net</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="currency" className="text-xs font-medium">
              Currency
            </Label>
            <Input
              id="currency"
              value={filters.currency ?? "ETB"}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  currency: e.target.value || "ETB",
                }))
              }
              className="h-9 w-24"
              placeholder="ETB"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="shippingScope" className="text-xs font-medium">
              Shipping Scope
            </Label>
            <Select
              value={filters.shippingScope ?? "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  shippingScope: (v === "all"
                    ? undefined
                    : v) as RevenueReportFilters["shippingScope"],
                }))
              }
            >
              <SelectTrigger id="shippingScope" className="h-9 w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="REGIONAL">Regional</SelectItem>
                <SelectItem value="TOWN">Town</SelectItem>
                <SelectItem value="INTERNATIONAL">International</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="serviceType" className="text-xs font-medium">
              Service Type
            </Label>
            <Select
              value={filters.serviceType ?? "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  serviceType: (v === "all"
                    ? undefined
                    : v) as RevenueReportFilters["serviceType"],
                }))
              }
            >
              <SelectTrigger id="serviceType" className="h-9 w-40">
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
          <div className="space-y-1">
            <Label htmlFor="fulfillmentType" className="text-xs font-medium">
              Fulfillment Type
            </Label>
            <Select
              value={filters.fulfillmentType ?? "all"}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  fulfillmentType: (v === "all"
                    ? undefined
                    : v) as RevenueReportFilters["fulfillmentType"],
                }))
              }
            >
              <SelectTrigger id="fulfillmentType" className="h-9 w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PICKUP">Pickup</SelectItem>
                <SelectItem value="DROPOFF">Dropoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="deliveredOnly"
                checked={!!filters.deliveredOnly}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    deliveredOnly: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="deliveredOnly" className="text-xs font-medium">
                Delivered
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="lateOnly"
                checked={!!filters.lateOnly}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    lateOnly: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="lateOnly" className="text-xs font-medium">
                Late
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="onTimeOnly"
                checked={!!filters.onTimeOnly}
                onCheckedChange={(checked) =>
                  setFilters((prev) => ({
                    ...prev,
                    onTimeOnly: Boolean(checked),
                  }))
                }
              />
              <Label htmlFor="onTimeOnly" className="text-xs font-medium">
                On time
              </Label>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(getDefaultRevenueFilters())}
            className="cursor-pointer"
          >
            Reset all
          </Button>
          <Button
            size="sm"
            onClick={handleApplyFilters}
            disabled={isLoading || customRangeInvalid}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] cursor-pointer text-[#FADF4B]"
          >
            Apply now
          </Button>
          <Button
            onClick={() => refetch()}
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#EE1E21]" />
          <span className="ml-3 text-gray-600">Loading revenue report...</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">
              Error loading revenue report: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                    {filters.currency ?? "ETB"}
                  </span>
                </div>
              </CardContent>
            </Card>
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
                  Total Driver Payments 
                </CardTitle>
                <DollarSign className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalDriverEarnings.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-gray-500">
                    {filters.currency ?? "ETB"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Groups and orders */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by period</CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <p className="text-sm text-gray-500">No revenue data found.</p>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <details
                      key={group.group_key}
                      className="group border rounded-lg p-3 hover:bg-gray-50"
                    >
                      <summary className="flex items-center justify-between cursor-pointer list-none">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {group.group_key
                              ? format(new Date(group.group_key), "MMM d, yyyy")
                              : "—"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {group.total_orders ?? 0} orders
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {(group.total_revenue ?? 0).toLocaleString()}{" "}
                            {filters.currency ?? "ETB"}
                          </span>
                          <span className="text-xs text-amber-600">
                            Driver:{" "}
                            {(
                              group.total_driver_earnings ?? 0
                            ).toLocaleString()}
                          </span>
                        </div>
                      </summary>
                      <div className="mt-3 space-y-2 pl-6">
                        {(group.orders ?? []).length === 0 ? (
                          <p className="text-xs text-gray-500">
                            No orders in this period.
                          </p>
                        ) : (
                          group.orders.map((order) => (
                            <details
                              key={order.orderId}
                              className="border rounded-md p-2 hover:bg-gray-50/80"
                            >
                              <summary className="flex items-center justify-between cursor-pointer list-none text-sm">
                                <span className="font-medium text-gray-900">
                                  {order.trackingCode ?? order.orderId}
                                </span>
                                <span className="text-gray-600">
                                  {order.customer ?? "—"}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {(
                                    order.net ??
                                    order.revenue ??
                                    order.gross ??
                                    0
                                  ).toLocaleString()}{" "}
                                  {filters.currency ?? "ETB"}
                                </span>
                              </summary>
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 pl-2">
                                <div>
                                  <span className="font-semibold">
                                    Customer:
                                  </span>{" "}
                                  {order.customer ?? "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">
                                    Receiver:
                                  </span>{" "}
                                  {order.receiver ?? "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">Gross:</span>{" "}
                                  {order.gross != null
                                    ? order.gross.toLocaleString()
                                    : "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">Net:</span>{" "}
                                  {order.net != null
                                    ? order.net.toLocaleString()
                                    : "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">
                                    Revenue:
                                  </span>{" "}
                                  {order.revenue != null
                                    ? order.revenue.toLocaleString()
                                    : "—"}
                                </div>
                                <div>
                                  <span className="font-semibold">
                                    Driver earnings:
                                  </span>{" "}
                                  {order.driverEarnings != null
                                    ? order.driverEarnings.toLocaleString()
                                    : "—"}
                                </div>
                              </div>
                            </details>
                          ))
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
