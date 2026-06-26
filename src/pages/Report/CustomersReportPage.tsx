import { useState, useEffect, useMemo, Fragment } from "react";
import { format } from "date-fns";
import { useDashboardCustomers } from "@/hooks/useDashboardCustomers";
import {
  ReportPreset,
  type DashboardCustomersReportFilters,
  type DashboardCustomerReportRow,
} from "@/lib/api/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  Users,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  UserCircle,
  ShoppingBag,
  DollarSign,
} from "lucide-react";

const STATUS_OPTIONS = [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
] as const;

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

function formatCustomerGroupLabel(
  groupKey: string,
  groupBy: DashboardCustomersReportFilters["groupBy"],
): string {
  if (!groupKey) return "—";
  const d = new Date(groupKey);
  if (Number.isNaN(d.getTime())) return groupKey;
  if (groupBy === "day") return format(d, "MMM d, yyyy");
  if (groupBy === "week") return `Week of ${format(d, "MMM d, yyyy")}`;
  return format(d, "MMMM yyyy");
}

function getDefaultDashboardCustomersFilters(): DashboardCustomersReportFilters {
  return {
    preset: ReportPreset.THIS_MONTH,
    dateField: "createdAt",
    groupBy: "month",
    export: false,
    customer: undefined,
    statuses: [],
    customerId: undefined,
    limit: 0,
    isAllReport: false,
  };
}

function toggleStatus(
  statuses: string[] | undefined,
  code: string,
): string[] {
  const list = statuses ?? [];
  if (list.includes(code)) {
    return list.filter((s) => s !== code);
  }
  return [...list, code];
}

export default function CustomersReportPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null,
  );
  const [filters, setFilters] = useState<DashboardCustomersReportFilters>(() =>
    getDefaultDashboardCustomersFilters(),
  );

  const { data, isLoading, error, refetch } = useDashboardCustomers(filters);

  const hasApiData = !isLoading && !error && data != null;

  const customRangeInvalid =
    filters.preset === ReportPreset.CUSTOM &&
    (!filters.startDate || !filters.endDate);

  const hasActiveFilters =
    filters.preset !== ReportPreset.THIS_MONTH ||
    !!filters.startDate ||
    !!filters.endDate ||
    (filters.dateField && filters.dateField !== "createdAt") ||
    (filters.groupBy && filters.groupBy !== "month") ||
    !!filters.customer ||
    (filters.statuses && filters.statuses.length > 0) ||
    !!filters.customerId?.trim() ||
    (filters.limit != null && filters.limit !== 0) ||
    !!filters.isAllReport ||
    !!filters.export;

  const groups = data?.summary?.data ?? [];
  const pagination = data?.pagination;

  const { customerRowCount, totalOrdersSum, totalAmountSum } = useMemo(() => {
    let rows = 0;
    let orders = 0;
    let amount = 0;
    for (const g of groups) {
      const list = g.customers ?? [];
      rows += list.length;
      for (const c of list) {
        orders += c.totalOrders ?? 0;
        amount += c.totalAmount ?? 0;
      }
    }
    return {
      customerRowCount: rows,
      totalOrdersSum: orders,
      totalAmountSum: amount,
    };
  }, [groups]);

  useEffect(() => {
    console.log("Dashboard Customers Report — normalized data:", data);
  }, [data]);

  const handleApplyFilters = () => {
    refetch();
    setIsFilterOpen(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Customer Reports
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Customers grouped by period with order totals
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
              <PopoverContent
                className="w-96 max-h-[min(85vh,720px)] overflow-y-auto"
                align="end"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Customer Filters</h3>
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

                  <div className="space-y-2">
                    <Label htmlFor="dateField" className="text-xs font-medium">
                      Date field
                    </Label>
                    <Select
                      value={filters.dateField ?? "createdAt"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({ ...prev, dateField: v }))
                      }
                    >
                      <SelectTrigger id="dateField" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Created at</SelectItem>
                        <SelectItem value="updatedAt">Updated at</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
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
                      <SelectTrigger id="groupBy" className="h-9 w-full">
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
                      htmlFor="customer-type"
                      className="text-xs font-medium"
                    >
                      Customer type
                    </Label>
                    <Select
                      value={filters.customer ?? "all"}
                      onValueChange={(v) =>
                        setFilters((prev) => ({
                          ...prev,
                          customer:
                            v === "all"
                              ? undefined
                              : (v as DashboardCustomersReportFilters["customer"]),
                        }))
                      }
                    >
                      <SelectTrigger id="customer-type" className="h-9 w-full">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="CORPORATE">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Statuses</Label>
                    <div className="flex flex-wrap gap-2 rounded-md border border-input bg-background px-2 py-2">
                      {STATUS_OPTIONS.map((code) => (
                        <div key={code} className="flex items-center gap-1.5">
                          <Checkbox
                            id={`st-${code}`}
                            checked={filters.statuses?.includes(code) ?? false}
                            onCheckedChange={() =>
                              setFilters((prev) => ({
                                ...prev,
                                statuses: toggleStatus(prev.statuses, code),
                              }))
                            }
                          />
                          <Label
                            htmlFor={`st-${code}`}
                            className="text-xs font-normal cursor-pointer"
                          >
                            {code}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerId" className="text-xs font-medium">
                      Customer ID
                    </Label>
                    <Input
                      id="customerId"
                      placeholder="Optional"
                      value={filters.customerId ?? ""}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          customerId: e.target.value || undefined,
                        }))
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit" className="text-xs font-medium">
                      Limit
                    </Label>
                    <Input
                      id="limit"
                      type="number"
                      min={0}
                      value={filters.limit ?? 0}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          limit:
                            e.target.value === "" ? 0 : Number(e.target.value),
                        }))
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="isAllReport"
                        checked={!!filters.isAllReport}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            isAllReport: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="isAllReport" className="text-xs font-medium">
                        Full report (isAllReport)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="export-flag"
                        checked={!!filters.export}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({
                            ...prev,
                            export: checked === true,
                          }))
                        }
                      />
                      <Label htmlFor="export-flag" className="text-xs font-medium">
                        Export flag
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters(getDefaultDashboardCustomersFilters())
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
              onClick={handleApplyFilters}
              disabled={isLoading || customRangeInvalid}
              className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh Data
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

              {filters.customer && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, customer: undefined }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-800 shadow-sm hover:bg-emerald-100"
                >
                  <span>Customer type: {filters.customer}</span>
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

              {filters.customerId?.trim() && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, customerId: undefined }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 shadow-sm hover:bg-orange-100"
                >
                  <span>Customer ID: {filters.customerId}</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </button>
              )}

              {filters.limit != null && filters.limit !== 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, limit: 0 }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-800 shadow-sm hover:bg-teal-100"
                >
                  <span>Limit: {filters.limit}</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </button>
              )}

              {filters.isAllReport && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, isAllReport: false }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-800 shadow-sm hover:bg-indigo-100"
                >
                  <span>All report</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </button>
              )}

              {filters.export && (
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, export: false }))
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-800 shadow-sm hover:bg-slate-200"
                >
                  <span>Export: on</span>
                  <X className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100"
              onClick={() => setFilters(getDefaultDashboardCustomersFilters())}
            >
              Clear all
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-[#EE1E21]" />
          <span className="ml-3 text-gray-600">Loading customers report…</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">
              Error loading customers report: {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {hasApiData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Customers (rows)
                </CardTitle>
                <UserCircle className="h-5 w-5 text-[#EE1E21]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {customerRowCount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Period groups
                </CardTitle>
                <Users className="h-5 w-5 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {groups.length.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total orders
                </CardTitle>
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalOrdersSum.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total amount
                </CardTitle>
                <DollarSign className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {totalAmountSum.toLocaleString()}{" "}
                  <span className="text-sm font-medium text-gray-500">ETB</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {pagination && (
            <p className="mb-4 text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} group(s) · {pagination.pageSize} per page
            </p>
          )}

          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-gray-500">
                No customers in this report for the selected filters.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <Card key={group.groupKey}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {formatCustomerGroupLabel(
                        group.groupKey,
                        filters.groupBy,
                      )}
                    </CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      {(group.customers?.length ?? 0).toLocaleString()} customer
                      {(group.customers?.length ?? 0) === 1 ? "" : "s"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">
                              Custom ID
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                              Email
                            </TableHead>
                            <TableHead className="hidden lg:table-cell">
                              Phone
                            </TableHead>
                            <TableHead className="hidden xl:table-cell">
                              Branch
                            </TableHead>
                            <TableHead className="text-right">Orders</TableHead>
                            <TableHead className="text-right">
                              Amount (ETB)
                            </TableHead>
                            <TableHead className="text-right hidden sm:table-cell">
                              Received
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Verified
                            </TableHead>
                            <TableHead className="text-right w-[100px]">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(group.customers ?? []).map(
                            (row: DashboardCustomerReportRow) => {
                              const isOpen =
                                expandedCustomerId === row.customerId;
                              return (
                                <Fragment key={row.customerId}>
                                  <TableRow>
                                    <TableCell className="font-medium">
                                      {row.name ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      {row.customId ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                                      {row.email ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell whitespace-nowrap">
                                      {row.phone ?? "—"}
                                    </TableCell>
                                    <TableCell className="hidden xl:table-cell">
                                      {row.branchName ?? "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(row.totalOrders ?? 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {(row.totalAmount ?? 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right hidden sm:table-cell">
                                      {(
                                        row.receivedOrders ?? 0
                                      ).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      <Badge
                                        variant="outline"
                                        className={
                                          row.emailVerified
                                            ? "border-green-200 bg-green-50 text-green-800"
                                            : "border-amber-200 bg-amber-50 text-amber-800"
                                        }
                                      >
                                        {row.emailVerified ? "Yes" : "No"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleExpanded(row.customerId)
                                        }
                                        className="gap-1"
                                      >
                                        {isOpen ? (
                                          <>
                                            <ChevronUp className="h-3 w-3" />
                                            Hide
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="h-3 w-3" />
                                            Details
                                          </>
                                        )}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {isOpen && (
                                    <TableRow>
                                      <TableCell
                                        colSpan={10}
                                        className="bg-gray-50"
                                      >
                                        <CustomerRowDetails row={row} />
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            },
                          )}
                        </TableBody>
                      </Table>
                    </div>
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

function CustomerRowDetails({ row }: { row: DashboardCustomerReportRow }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-gray-700 py-1">
      <div>
        <span className="font-semibold">Customer ID:</span> {row.customerId}
      </div>
      <div>
        <span className="font-semibold">Fayda FAN:</span>{" "}
        {row.faydaFAN ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Email:</span> {row.email ?? "—"}
      </div>
      <div>
        <span className="font-semibold">Phone:</span> {row.phone ?? "—"}
      </div>
      <div className="sm:col-span-2">
        <span className="font-semibold">Emergency contact:</span>{" "}
        {row.emergencyContactName ?? "—"}{" "}
        {row.emergencyContactPhone
          ? `· ${row.emergencyContactPhone}`
          : ""}
      </div>
      <div>
        <span className="font-semibold">Branch:</span>{" "}
        {row.branchName ?? "—"}
      </div>
    </div>
  );
}
