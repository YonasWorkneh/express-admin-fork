import type { OrderCategoryEntry } from "@/types/orderDetail";

export const ReportPreset = {
  TODAY: "TODAY",
  YESTERDAY: "YESTERDAY",
  THIS_WEEK: "THIS_WEEK",
  LAST_WEEK: "LAST_WEEK",
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  CUSTOM: "CUSTOM",
} as const;

export type ReportPreset = (typeof ReportPreset)[keyof typeof ReportPreset];

export interface ReportFilters {
  preset: ReportPreset;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  serviceType?: "STANDARD" | "EXPRESS" | "SAME_DAY" | "OVERNIGHT";
  shippingScope?: "REGIONAL" | "TOWN" | "INTERNATIONAL";
  fulfillmentType?: "PICKUP" | "DROPOFF";
  status?: "CREATED" | "APPROVED" | "DISPATCHED" | "IN_TRANSIT" | "DELIVERED" | "COMPLETED";
  topLimit?: number;
  recentLimit?: number;
  revenueGroupBy?: "day" | "week" | "month";
}

export interface OrderReportFilters {
  startDate?: string;
  endDate?: string;
  dateField?: "createdAt" | "pickupDate" | "deliveryDate";
  page?: number;
  limit?: number;
  search?: string;
  groupBy?: "day" | "week" | "month";
  status?: string;
  statuses?: string[];
  serviceType?: "STANDARD" | "EXPRESS" | "SAME_DAY" | "OVERNIGHT";
  shippingScope?: "REGIONAL" | "TOWN" | "INTERNATIONAL";
  fulfillmentType?: "PICKUP" | "DROPOFF";
  shipmentType?: "PARCEL" | "CARRIER";
  branchId?: string;
  customerId?: string;
  receiverId?: string;
  pickupDriverId?: string;
  deliveryDriverId?: string;
  tariffId?: string;
  batchId?: string;
  export?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  minPrice?: number;
  maxPrice?: number;
  minWeight?: number;
  maxWeight?: number;
  isFragile?: boolean;
  isUnusual?: boolean;
  pickupConfirmed?: boolean;
  dropoffConfirmed?: boolean;
  originCityId?: string;
  destinationCityId?: string;
  lateDeliveryOnly?: boolean;
  preset?: ReportPreset;
}

/** Request body for POST /report/branch/order/detailed (no export / roleId). branchId is sent separately. */
export interface BranchOrderReportFilters {
  preset?: ReportPreset;
  startDate?: string;
  endDate?: string;
  dateField?: "createdAt" | "pickupDate" | "deliveryDate";
  groupBy?: "day" | "week" | "month";
  serviceType?: "STANDARD" | "EXPRESS" | "SAME_DAY" | "OVERNIGHT";
  fulfillmentType?: "PICKUP" | "DROPOFF";
  shippingScope?: "REGIONAL" | "TOWN" | "INTERNATIONAL";
  statuses?: string[];
}

/** Response from POST /report/branch/order/detailed */
export interface BranchOrderReportSummary {
  totalOrders: number;
  grossRevenue: number;
}

export interface BranchOrderReportAddress {
  id?: string;
  label?: string | null;
  landMark?: string | null;
  postalCode?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  purpose?: string;
}

export interface BranchOrderReportBranch {
  id: string;
  name: string;
  location?: string | null;
  managerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  branchId?: string;
  address?: BranchOrderReportAddress | null;
}

export interface BranchOrderReportAppliedFilter {
  preset?: string;
  dateField?: string;
  groupBy?: string;
  branchId?: string;
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  serviceType?: string;
  fulfillmentType?: string;
  shippingScope?: string;
}

/** Single order row inside a grouped order detailed report. */
export interface OrderDetailedReportRow {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  serviceType: string;
  shippingScope: string;
  fulfillmentType: string;
  branchName: string | null;
  customerName: string;
  receiverName: string;
  pickupDriverName: string | null;
  deliveryDriverName: string | null;
  tariffName: string;
  batchCode: string | null;
  finalPrice: number | null;
  group_key: string;
}

export interface BranchOrderReportResponse {
  summary: BranchOrderReportSummary;
  orders: OrderDetailedReportRow[];
  branch: BranchOrderReportBranch;
  filter?: BranchOrderReportAppliedFilter;
}

/** One time bucket from POST /report/orders/detailed (grouped like revenue). */
export interface OrderReportGroup {
  group_key: string;
  total_orders: number;
  total_revenue: number;
  orders: OrderDetailedReportRow[];
}

export type OrderReportResponse = OrderReportGroup[];

export interface DashboardSummary {
  totalOrders: number;
  totalRevenue: number;
  totalDelivered: number;
  activeDrivers: number;
}

export interface TopBranch {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
}

export interface ServiceTypeDistribution {
  serviceType: string;
  orderCount: number;
  revenue: number;
  percentage: number;
}

export interface RevenueTrend {
  period: string;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  trackingCode: string;
  customerId: string;
  receiverId: string;
  branchId: string | null;
  pickupDriverId: string | null;
  deliveryDriverId: string | null;
  status: string;
  serviceType: string;
  fulfillmentType: string;
  weight: number;
  length: number | null;
  width: number | null;
  height: number | null;
  categories?: OrderCategoryEntry[];
  /** @deprecated Prefer `categories`. */
  category?: string | string[];
  isFragile: boolean;
  shipmentType: string;
  shippingScope: string;
  isUnusual: boolean;
  unusualReason: string | null;
  pickupAddressId: string | null;
  pickupDate: string;
  deliveryAddressId: string;
  deliveryDate: string;
  pickupConfirmed: boolean;
  dropoffConfirmed: boolean;
  actualPickupDate: string | null;
  actualDropoffDate: string | null;
  notes: string | null;
  cost: number;
  distance: number;
  validatedBy: string | null;
  validatedAt: string | null;
  validatedNotes: string | null;
  quantity: number;
  originCityId: string | null;
  destinationCityId: string | null;
  originCityRaw: string;
  destinationCityRaw: string;
  pickupAssignedBy: string | null;
  pickupAssignedAt: string | null;
  deliveryAssignedBy: string | null;
  deliveryAssignedAt: string | null;
  estimatedDeliveryAt: string | null;
  actualDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  batchId: string | null;
  tariffId: string;
  finalPrice: number | null;
  currency: string;
  optimizationJobId: string | null;
  customer: {
    name: string;
  };
}

export interface DashboardMetrics {
  summary: DashboardSummary;
  topBranches: TopBranch[];
  topCustomers: TopCustomer[];
  orderStatusDistribution: OrderStatusDistribution[];
  serviceTypeDistribution?: ServiceTypeDistribution[];
  revenueTrend: RevenueTrend[];
  recentOrders: RecentOrder[];
}

/** Request body for POST /report/dashboard/customers */
export interface DashboardCustomersReportFilters {
  preset?: ReportPreset;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  groupBy?: "day" | "week" | "month";
  export?: boolean;
  customer?: "INDIVIDUAL" | "CORPORATE";
  statuses?: string[];
  customerId?: string;
  limit?: number;
  isAllReport?: boolean;
}

export interface DashboardCustomerReportRow {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  customId: string;
  faydaFAN: string | null;
  emailVerified: boolean;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  branchName: string | null;
  totalOrders: number;
  totalAmount: number;
  receivedOrders: number;
}

export interface DashboardCustomerReportGroup {
  groupKey: string;
  customers: DashboardCustomerReportRow[];
}

export interface DashboardCustomersReportSummary {
  data: DashboardCustomerReportGroup[];
}

export interface DashboardCustomersReportAppliedFilter {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}

export interface DashboardCustomersReportPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardCustomersReportResponse {
  summary: DashboardCustomersReportSummary;
  filter?: DashboardCustomersReportAppliedFilter;
  pagination: DashboardCustomersReportPagination;
}

export interface RevenueReportFilters {
  startDate?: string;
  endDate?: string;
  preset?: ReportPreset;
  page?: number;
  limit?: number;
  search?: string;
  groupBy?: "day" | "week" | "month";
  export?: boolean;
  revenueType?: "gross" | "net";
  currency?: string;
  branchId?: string;
  serviceType?: "STANDARD" | "EXPRESS" | "SAME_DAY" | "OVERNIGHT";
  fulfillmentType?: "PICKUP" | "DROPOFF";
  shippingScope?: "REGIONAL" | "TOWN" | "INTERNATIONAL";
  driverId?: string;
  customerId?: string;
  tariffId?: string;
  deliveredOnly?: boolean;
  lateOnly?: boolean;
  onTimeOnly?: boolean;
}

export interface RevenueReportOrderItem {
  orderId: string;
  trackingCode: string;
  customer: string | null;
  receiver: string | null;
  gross: number | null;
  net: number | null;
  revenue: number | null;
  group_key: string;
  driverEarnings: number | null;
}

export interface RevenueReportGroup {
  group_key: string;
  total_revenue: number;
  total_orders: number;
  total_driver_earnings: number;
  orders: RevenueReportOrderItem[];
}

export type RevenueReportResponse = RevenueReportGroup[];
