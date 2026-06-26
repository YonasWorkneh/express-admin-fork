import { useState, useEffect, Fragment } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useBranchOrderReport } from "@/hooks/useBranchOrderReport";
import {
  ReportPreset,
  type BranchOrderReportFilters,
  type OrderDetailedReportRow,
} from "@/lib/api/report";
import { OrderRowDetails } from "@/pages/Report/OrderReportPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Filter,
  RefreshCw,
  X,
  Package,
  DollarSign,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const ORDER_STATUS_OPTIONS = [
  "PENDING",
  "CREATED",
  "APPROVED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELED",
] as const;

function getPresetLabel(preset: ReportPreset) {
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
}

function getDefaultBranchOrderFilters(): BranchOrderReportFilters {
  return {
    preset: ReportPreset.THIS_MONTH,
    dateField: "createdAt",
    groupBy: "month",
    statuses: [],
    serviceType: undefined,
    fulfillmentType: undefined,
    shippingScope: undefined,
  };
}

function toggleStatus(list: string[] | undefined, code: string): string[] {
  const cur = list ?? [];
  return cur.includes(code)
    ? cur.filter((s) => s !== code)
    : [...cur, code];
}

export default function BranchOrderReportPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const [searchParams] = useSearchParams();
  const branchDisplayName =
    searchParams.get("branchName")?.trim() || "Branch";

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BranchOrderReportFilters>(() =>
    getDefaultBranchOrderFilters(),
  );

  useEffect(() => {
    setFilters(getDefaultBranchOrderFilters());
  }, [branchId]);

  const { data, isLoading, error, refetch } = useBranchOrderReport(
    branchId,
    filters,
  );

  const customRangeInvalid =
    filters.preset === ReportPreset.CUSTOM &&
    (!filters.startDate || !filters.endDate);

  const hasActiveFilters =
    filters.preset !== ReportPreset.THIS_MONTH ||
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.serviceType ||
    !!filters.shippingScope ||
    !!filters.fulfillmentType ||
    (filters.dateField && filters.dateField !== "createdAt") ||
    (filters.groupBy && filters.groupBy !== "month") ||
    (filters.statuses && filters.statuses.length > 0);

  const handleApplyFilters = () => {
    void refetch();
    setIsFilterOpen(false);
  };
  const branchTitle = data?.branch?.name?.trim() || branchDisplayName;
  const branchCode = data?.branch?.branchId;

  const toggleExpanded = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const safeOrderRow = (order: OrderDetailedReportRow): OrderDetailedReportRow => ({
    ...order,
    id: order.id ?? "",
    trackingCode: order.trackingCode ?? "",
    status: order.status ?? "",
    createdAt: order.createdAt ?? "",
    serviceType: order.serviceType ?? "",
    shippingScope: order.shippingScope ?? "",
    fulfillmentType: order.fulfillmentType ?? "",
    customerName: order.customerName ?? "",
    receiverName: order.receiverName ?? "",
    tariffName: order.tariffName ?? "",
    group_key: order.group_key ?? "",
  });

  if (!branchId?.trim()) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <p className="text-red-600">Missing branch id in the URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Branch order reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {branchTitle}
              {branchCode ? (
                <>
                  <span className="text-gray-400"> · </span>
                  <span className="font-medium text-gray-700">{branchCode}</span>
                </>
              ) : null}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Orders and revenue for this branch in the selected period
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
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  <h3 className="font-semibold text-sm">Branch order filters</h3>

                  <div className="space-y-2">
                    <Label htmlFor="bo-preset" className="text-xs font-medium">
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
                      <SelectTrigger id="bo-preset" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ReportPreset.TODAY}>Today</SelectItem>
                        <SelectItem value={ReportPreset.YESTERDAY}>
                          Yesterday
                        </SelectItem>
                        <SelectItem value={ReportPreset.THIS_WEEK}>
                          This week
                        </SelectItem>
                        <SelectItem value={ReportPreset.LAST_WEEK}>
                          Last week
                        </SelectItem>
                        <SelectItem value={ReportPreset.THIS_MONTH}>
                          This month
                        </SelectItem>
                        <SelectItem value={ReportPreset.LAST_MONTH}>
                          Last month
                        </SelectItem>
                        <SelectItem value={ReportPreset.CUSTOM}>
                          Custom range
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filters.preset === ReportPreset.CUSTOM && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="bo-start" className="text-xs font-medium">
                          From
                        </Label>
                        <Input
                          id="bo-start"
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
                        <Label htmlFor="bo-end" className="text-xs font-medium">
                          To
                        </Label>
                        <Input
                          id="bo-end"
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

                  <div className="space-y-2">
                    <Label htmlFor="bo-dateField" className="text-xs font-medium">
                      Date field
                    </Label>
                    <Select
                      value={filters.dateField ?? "createdAt"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateField: v as BranchOrderReportFilters["dateField"],
                        }))
                      }
                    >
                      <SelectTrigger id="bo-dateField" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created</SelectItem>
                        <SelectItem value="pickupDate">Pickup</SelectItem>
                        <SelectItem value="deliveryDate">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bo-groupBy" className="text-xs font-medium">
                      Group by
                    </Label>
                    <Select
                      value={filters.groupBy ?? "month"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          groupBy: v as BranchOrderReportFilters["groupBy"],
                        }))
                      }
                    >
                      <SelectTrigger id="bo-groupBy" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="bo-shippingScope"
                      className="text-xs font-medium"
                    >
                      Shipping scope
                    </Label>
                    <Select
                      value={filters.shippingScope ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          shippingScope: (v === "all"
                            ? undefined
                            : v) as BranchOrderReportFilters["shippingScope"],
                        }))
                      }
                    >
                      <SelectTrigger
                        id="bo-shippingScope"
                        className="h-9 w-full"
                      >
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="bo-serviceType"
                      className="text-xs font-medium"
                    >
                      Service type
                    </Label>
                    <Select
                      value={filters.serviceType ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          serviceType: (v === "all"
                            ? undefined
                            : v) as BranchOrderReportFilters["serviceType"],
                        }))
                      }
                    >
                      <SelectTrigger id="bo-serviceType" className="h-9 w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="EXPRESS">Express</SelectItem>
                        <SelectItem value="SAME_DAY">Same day</SelectItem>
                        <SelectItem value="OVERNIGHT">Overnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="bo-fulfillment"
                      className="text-xs font-medium"
                    >
                      Fulfillment type
                    </Label>
                    <Select
                      value={filters.fulfillmentType ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          fulfillmentType: (v === "all"
                            ? undefined
                            : v) as BranchOrderReportFilters["fulfillmentType"],
                        }))
                      }
                    >
                      <SelectTrigger id="bo-fulfillment" className="h-9 w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="PICKUP">Pickup</SelectItem>
                        <SelectItem value="DROPOFF">Dropoff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Statuses</Label>
                    <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background px-2 py-2">
                      {ORDER_STATUS_OPTIONS.map((code) => (
                        <div key={code} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`bo-st-${code}`}
                            checked={filters.statuses?.includes(code) ?? false}
                            onCheckedChange={() =>
                              setFilters((prev) => ({
                                ...prev,
                                statuses: toggleStatus(prev.statuses, code),
                              }))
                            }
                          />
                          <Label
                            htmlFor={`bo-st-${code}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            {code}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters(getDefaultBranchOrderFilters())
                      }
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
              onClick={() => void refetch()}
              disabled={isLoading || customRangeInvalid}
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
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

            {filters.dateField && filters.dateField !== "createdAt" && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    dateField: "createdAt",
                  }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-800 shadow-sm hover:bg-gray-100"
              >
                <span>Date field: {filters.dateField}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.groupBy && filters.groupBy !== "month" && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, groupBy: "month" }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-800 shadow-sm hover:bg-gray-100"
              >
                <span>Group by: {filters.groupBy}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}

            {filters.statuses && filters.statuses.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, statuses: [] }))
                }
                className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-800 shadow-sm hover:bg-violet-100"
              >
                <span>Statuses: {filters.statuses.join(", ")}</span>
                <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </button>
            )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => setFilters(getDefaultBranchOrderFilters())}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#EE1E21]" />
          <span className="ml-3 text-gray-600">Loading branch order report…</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">
              Error loading branch order report: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total orders
                </CardTitle>
                <Package className="h-5 w-5 text-[#EE1E21]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.totalOrders.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Gross revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.grossRevenue.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-gray-500">ETB</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-slate-600" />
                Branch details
              </CardTitle>
              {data.branch.branchId ? (
                <p className="text-sm text-gray-500 font-normal">
                  Branch code:{" "}
                  <span className="font-medium text-gray-700">
                    {data.branch.branchId}
                  </span>
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold text-gray-800">Name: </span>
                {data.branch.name || "—"}
              </div>
              {data.branch.location ? (
                <div>
                  <span className="font-semibold text-gray-800">Location: </span>
                  {data.branch.location}
                </div>
              ) : null}
              {data.branch.address?.label ? (
                <div className="text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-800">Address: </span>
                  {data.branch.address.label}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {data.orders.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-gray-500 text-center">
                  No orders found for the selected filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <p className="text-sm text-gray-500 font-normal">
                  {data.orders.length.toLocaleString()} order
                  {data.orders.length === 1 ? "" : "s"} in this period
                </p>
              </CardHeader>
              <CardContent>
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
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.map((raw) => {
                        const order = safeOrderRow(raw);
                        const isExpanded = expandedOrderId === order.id;
                        return (
                          <Fragment key={order.id}>
                            <TableRow>
                              <TableCell className="font-medium">
                                {order.trackingCode || order.id}
                              </TableCell>
                              <TableCell>{order.customerName || "—"}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {order.receiverName || "—"}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs rounded-full bg-[#EE1E21]/5 text-[#EE1E21] px-2 py-0.5">
                                  {order.status || "—"}
                                </span>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {order.serviceType || "—"}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {order.fulfillmentType || "—"}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                {order.shippingScope || "—"}
                              </TableCell>
                              <TableCell
                                className="hidden xl:table-cell max-w-[140px] truncate"
                                title={order.tariffName}
                              >
                                {order.tariffName || "—"}
                              </TableCell>
                              <TableCell>
                                {order.finalPrice != null
                                  ? order.finalPrice.toLocaleString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="hidden md:table-cell whitespace-nowrap">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString()
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleExpanded(order.id)}
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
