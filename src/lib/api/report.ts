import axios from "axios";
import api from "./api";
import { getUserFacingApiError } from "@/utils/apiErrorMessage";
import {
  ReportPreset,
  type ReportFilters,
  type DashboardMetrics,
  type DashboardCustomersReportFilters,
  type DashboardCustomersReportResponse,
  type DashboardCustomersReportPagination,
  type DashboardCustomersReportAppliedFilter,
  type DashboardCustomerReportGroup,
  type OrderReportFilters,
  type OrderReportResponse,
  type RevenueReportFilters,
  type RevenueReportResponse,
  type BranchOrderReportFilters,
  type BranchOrderReportResponse,
  type BranchOrderReportSummary,
  type BranchOrderReportBranch,
  type BranchOrderReportAppliedFilter,
  type BranchOrderReportAddress,
  type OrderDetailedReportRow,
} from "@/types/report";

export { ReportPreset };
export type {
  ReportFilters,
  DashboardMetrics,
  DashboardCustomersReportFilters,
  DashboardCustomersReportResponse,
  DashboardCustomerReportRow,
  DashboardCustomerReportGroup,
  DashboardCustomersReportSummary,
  DashboardCustomersReportAppliedFilter,
  DashboardCustomersReportPagination,
  OrderDetailedReportRow,
  OrderReportFilters,
  OrderReportGroup,
  OrderReportResponse,
  RevenueReportFilters,
  RevenueReportResponse,
  BranchOrderReportFilters,
  BranchOrderReportResponse,
  BranchOrderReportSummary,
  BranchOrderReportBranch,
  BranchOrderReportAppliedFilter,
  BranchOrderReportAddress,
} from "@/types/report";

function buildDashboardCustomersPayload(
  filters: DashboardCustomersReportFilters,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    preset: filters.preset ?? ReportPreset.THIS_MONTH,
    dateField: filters.dateField ?? "createdAt",
    groupBy: filters.groupBy ?? "month",
    export: filters.export ?? false,
    isAllReport: filters.isAllReport ?? false,
    limit: filters.limit ?? 0,
    statuses: filters.statuses?.length ? filters.statuses : [],
  };
  if (filters.startDate) {
    body.startDate = new Date(filters.startDate).toISOString();
  }
  if (filters.endDate) {
    body.endDate = new Date(filters.endDate).toISOString();
  }
  if (filters.customer) {
    body.customer = filters.customer;
  }
  if (filters.customerId?.trim()) {
    body.customerId = filters.customerId.trim();
  }
  return body;
}

function emptyCustomersReport(): DashboardCustomersReportResponse {
  return {
    summary: { data: [] },
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  };
}

function normalizeDashboardCustomersResponse(
  payload: unknown,
): DashboardCustomersReportResponse {
  const empty = emptyCustomersReport();
  if (!payload || typeof payload !== "object") return empty;

  let root = payload as Record<string, unknown>;
  if (
    root.data &&
    typeof root.data === "object" &&
    root.data !== null &&
    "summary" in (root.data as object)
  ) {
    root = root.data as Record<string, unknown>;
  }

  const summaryObj = root.summary;
  if (!summaryObj || typeof summaryObj !== "object") return empty;

  const dataRaw = (summaryObj as { data?: unknown }).data;
  const dataArr = Array.isArray(dataRaw)
    ? (dataRaw as DashboardCustomerReportGroup[])
    : [];

  let pagination: DashboardCustomersReportPagination = empty.pagination;
  const p = root.pagination;
  if (p && typeof p === "object") {
    const pe = p as Record<string, unknown>;
    pagination = {
      total: Number(pe.total) || 0,
      page: Number(pe.page) || 1,
      pageSize: Number(pe.pageSize) || 10,
      totalPages: Number(pe.totalPages) || 0,
    };
  }

  const filterRaw = root.filter;
  const filter =
    filterRaw && typeof filterRaw === "object"
      ? (filterRaw as DashboardCustomersReportAppliedFilter)
      : undefined;

  return {
    summary: { data: dataArr },
    filter,
    pagination,
  };
}

export const fetchDashboardCustomers = async (
  filters: DashboardCustomersReportFilters,
): Promise<DashboardCustomersReportResponse> => {
  try {
    const payload = buildDashboardCustomersPayload(filters);
    console.log(
      "Dashboard Customers Report — request payload:",
      JSON.stringify(payload, null, 2),
    );
    const response = await api.post("/report/dashboard/customers", payload);
    console.log(
      "Dashboard Customers Report — full HTTP response body:",
      JSON.stringify(response.data, null, 2),
    );
    const raw = response.data?.data ?? response.data;
    return normalizeDashboardCustomersResponse(raw);
  } catch (error: unknown) {
    console.error("Dashboard Customers Report Error:", error);
    if (error && typeof error === "object" && "response" in error) {
      const ax = error as { response?: { data?: { message?: string } } };
      throw new Error(
        ax.response?.data?.message ?? "Failed to fetch customers report",
      );
    }
    throw error;
  }
};

function buildOrderReportPayload(filters: OrderReportFilters): OrderReportFilters {
  const { page, limit, ...rest } = filters;
  void page;
  void limit;
  return {
    ...rest,
    startDate: filters.startDate
      ? new Date(filters.startDate).toISOString()
      : undefined,
    endDate: filters.endDate
      ? new Date(filters.endDate).toISOString()
      : undefined,
  };
}

function buildBranchOrderReportPayload(
  branchId: string,
  filters: BranchOrderReportFilters,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    preset: filters.preset ?? ReportPreset.THIS_MONTH,
    dateField: filters.dateField ?? "createdAt",
    groupBy: filters.groupBy ?? "month",
    branchId,
    statuses:
      filters.statuses && filters.statuses.length > 0 ? filters.statuses : [],
  };
  if (filters.startDate) {
    body.startDate = new Date(filters.startDate).toISOString();
  }
  if (filters.endDate) {
    body.endDate = new Date(filters.endDate).toISOString();
  }
  if (filters.serviceType) {
    body.serviceType = filters.serviceType;
  }
  if (filters.fulfillmentType) {
    body.fulfillmentType = filters.fulfillmentType;
  }
  if (filters.shippingScope) {
    body.shippingScope = filters.shippingScope;
  }
  return body;
}

function buildRevenueReportPayload(
  filters: RevenueReportFilters,
): RevenueReportFilters {
  const { page, limit, ...rest } = filters;
  void page;
  void limit;
  return {
    ...rest,
    startDate: filters.startDate
      ? new Date(filters.startDate).toISOString()
      : undefined,
    endDate: filters.endDate
      ? new Date(filters.endDate).toISOString()
      : undefined,
  };
}

function triggerPdfDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function parseBlobErrorMessage(blob: Blob): Promise<string | undefined> {
  try {
    const text = await blob.text();
    const body = JSON.parse(text) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}

export const exportOrderReportPdf = async (
  filters: OrderReportFilters,
): Promise<void> => {
  const payload = buildOrderReportPayload(filters);
  try {
    const response = await api.post("/report/orders/detailed/pdf", payload, {
      responseType: "blob",
    });
    const blob = response.data as Blob;
    const ct = (response.headers["content-type"] ?? "").toLowerCase();
    if (ct.includes("application/json")) {
      const msg = await parseBlobErrorMessage(blob);
      throw new Error(msg ?? "Failed to export order report");
    }
    triggerPdfDownload(
      blob,
      `order-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const msg = await parseBlobErrorMessage(error.response.data);
      throw new Error(msg ?? "Failed to export order report");
    }
    throw error;
  }
};

export const exportRevenueReportPdf = async (
  filters: RevenueReportFilters,
): Promise<void> => {
  const payload = buildRevenueReportPayload(filters);
  try {
    const response = await api.post("/report/revenue/detailed/pdf", payload, {
      responseType: "blob",
    });
    const blob = response.data as Blob;
    const ct = (response.headers["content-type"] ?? "").toLowerCase();
    if (ct.includes("application/json")) {
      const msg = await parseBlobErrorMessage(blob);
      throw new Error(msg ?? "Failed to export revenue report");
    }
    triggerPdfDownload(
      blob,
      `revenue-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const msg = await parseBlobErrorMessage(error.response.data);
      throw new Error(msg ?? "Failed to export revenue report");
    }
    throw error;
  }
};

export const fetchDashboardMetrics = async (
  filters: ReportFilters,
): Promise<DashboardMetrics> => {
  try {
    const response = await api.post("/report/dashboard/metrics", filters);

    console.log(
      "Dashboard Metrics Full Response:",
      JSON.stringify(response.data, null, 2),
    );
    console.log("Dashboard Metrics Data:", response.data);
    console.log("Dashboard Metrics Data.data:", response.data.data);

    return response.data.data || response.data;
  } catch (error: unknown) {
    throw new Error(getUserFacingApiError(error, "Failed to load dashboard metrics"));
  }
};

export const fetchOrderReportDetailed = async (
  filters: OrderReportFilters,
): Promise<OrderReportResponse> => {
  try {
    const payload = buildOrderReportPayload(filters);

    const response = await api.post("/report/orders/detailed", payload);

    console.log(
      "Order Detailed Report Full Response:",
      JSON.stringify(response.data, null, 2),
    );

    const raw = response.data.data ?? response.data;
    if (Array.isArray(raw)) {
      return raw as OrderReportResponse;
    }
    return [];
  } catch (error: unknown) {
    console.error("Order Detailed Report Error:", error);
    if (error && typeof error === "object" && "response" in error) {
      const ax = error as { response?: { data?: { message?: string } } };
      throw new Error(ax.response?.data?.message ?? "Failed to fetch order report");
    }
    throw error;
  }
};

function normalizeBranchOrderReportResponse(
  payload: unknown,
): BranchOrderReportResponse {
  const empty: BranchOrderReportResponse = {
    summary: { totalOrders: 0, grossRevenue: 0 },
    orders: [],
    branch: { id: "", name: "" },
  };
  if (!payload || typeof payload !== "object") return empty;

  let root = payload as Record<string, unknown>;
  if (
    root.data &&
    typeof root.data === "object" &&
    root.data !== null &&
    ("summary" in (root.data as object) || "orders" in (root.data as object))
  ) {
    root = root.data as Record<string, unknown>;
  }

  const summary: BranchOrderReportSummary = { totalOrders: 0, grossRevenue: 0 };
  const summaryObj = root.summary;
  if (summaryObj && typeof summaryObj === "object") {
    const s = summaryObj as Record<string, unknown>;
    summary.totalOrders = Number(s.totalOrders) || 0;
    summary.grossRevenue = Number(s.grossRevenue) || 0;
  }

  const ordersRaw = root.orders;
  const orders = Array.isArray(ordersRaw)
    ? (ordersRaw as OrderDetailedReportRow[])
    : [];

  let branch: BranchOrderReportBranch = { id: "", name: "" };
  const branchObj = root.branch;
  if (branchObj && typeof branchObj === "object") {
    const b = branchObj as Record<string, unknown>;
    const addr = b.address;
    branch = {
      id: String(b.id ?? ""),
      name: String(b.name ?? ""),
      location: b.location != null ? String(b.location) : undefined,
      managerId: (b.managerId as string | null) ?? undefined,
      createdAt: b.createdAt != null ? String(b.createdAt) : undefined,
      updatedAt: b.updatedAt != null ? String(b.updatedAt) : undefined,
      createdBy: b.createdBy != null ? String(b.createdBy) : undefined,
      branchId: b.branchId != null ? String(b.branchId) : undefined,
      address:
        addr && typeof addr === "object"
          ? (addr as BranchOrderReportAddress)
          : undefined,
    };
  }

  const filterRaw = root.filter;
  const filter =
    filterRaw && typeof filterRaw === "object"
      ? (filterRaw as BranchOrderReportAppliedFilter)
      : undefined;

  return { summary, orders, branch, filter };
}

export const fetchBranchOrderReportDetailed = async (
  branchId: string,
  filters: BranchOrderReportFilters,
): Promise<BranchOrderReportResponse> => {
  try {
    const payload = buildBranchOrderReportPayload(branchId, filters);
    console.log(
      "Branch Order Detailed Report — request payload:",
      JSON.stringify(payload, null, 2),
    );
    const response = await api.post(
      "/report/branch/order/detailed",
      payload,
    );
    console.log(
      "Branch Order Detailed Report — full HTTP response body:",
      JSON.stringify(response.data, null, 2),
    );
    const raw = response.data?.data ?? response.data;
    return normalizeBranchOrderReportResponse(raw);
  } catch (error: unknown) {
    console.error("Branch Order Detailed Report Error:", error);
    if (error && typeof error === "object" && "response" in error) {
      const ax = error as { response?: { data?: { message?: string } } };
      throw new Error(
        ax.response?.data?.message ?? "Failed to fetch branch order report",
      );
    }
    throw error;
  }
};

export const fetchRevenueReport = async (
  filters: RevenueReportFilters,
): Promise<RevenueReportResponse> => {
  try {
    const payload = buildRevenueReportPayload(filters);

    const response = await api.post("/report/revenue/detailed", payload);

    console.log(
      "Revenue Report Full Response:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data.data ?? response.data;
  } catch (error: unknown) {
    console.error("Revenue Report Error:", error);
    if (error && typeof error === "object" && "response" in error) {
      const ax = error as { response?: { data?: { message?: string } } };
      throw new Error(ax.response?.data?.message ?? "Failed to fetch revenue report");
    }
    throw error;
  }
};
