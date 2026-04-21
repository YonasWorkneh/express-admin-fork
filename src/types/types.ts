// src/types.ts

/** ───── Base API Response ───── */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

/** ───── Enums as Type Unions ───── */
export type DriverStatus =
  | "OFFLINE"
  | "ONLINE"
  | "AVAILABLE"
  | "BUSY"
  | "INTAKE"
  | "ENROUTE"
  | "BREAK";

export type DriverType = "INTERNAL" | "EXTERNAL";

export type AddressPurpose =
  | "USER_HOME"
  | "USER_WORK"
  | "ORDER_PICKUP"
  | "ORDER_DELIVERY"
  | "BRANCH_LOCATION";

export type CongestionLevel = "FREE" | "LIGHT" | "MEDIUM" | "HEAVY";

export type OptimizationType = "SINGLE_ROUTE" | "MULTI_STOP";

export type OptimizationStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type FeeType = "PERCENTAGE" | "FLAT" | "PER_KG" | "PER_KM";

export type OrderStatus =
  | "CREATED"
  | "COLLECTED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "VALIDATED"
  | "SUCCESS"
  | "ASSIGNED"
  | "READY_FOR_PICKUP"
  | "PICKUP_ATTEMPTED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DROPOFF_ATTEMPTED"
  | "DROPPED_OFF"
  | "DISPATCHED"
  | "PENDING"
  | "DELIVERED"
  | "FAILED"
  | "EXCEPTION"
  | "CANCELED";

export type ServiceType = "STANDARD" | "EXPRESS" | "SAME_DAY" | "OVERNIGHT";

export type PaymentMethod = "TELEBIRR" | "WALLET" | "BANK" | "CASH_ON_DELIVERY";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

export type FulfillmentType = "PICKUP" | "DROPOFF";

export type ParcelCategory =
  | "DOCUMENT"
  | "ELECTRONICS"
  | "FOOD"
  | "FRAGILE_ITEM"
  | "CHEMICAL"
  | "OTHER";

export type ShipmentType = "PARCEL" | "CARRIER";

export type ShippingScope = "REGIONAL" | "TOWN" | "INTERNATIONAL" | "IN_TOWN";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";

export type DispatchStatus =
  | "PENDING"
  | "READY"
  | "ASSIGNED"
  | "COLLECTED"
  | "DISPATCHED"
  | "PICKEDUP"
  | "DELIVERED_TO_AIRPORT"
  | "IN_TRANSIT"
  | "ARRIVED_AT_DESTINATION"
  | "OUT_FOR_BRANCH_TRANSFER"
  | "AT_BRANCH"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "ACCEPTED"
  | "CLOSED"|"APPROVED";

/** ───── Core Models ───── */
export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  location?: string;
  manager?: any | null;
  orders?: Order[];
  staff: Staff[];
  createdAt?: string;
  updatedAt?: string;
  address: any;
  totalOrders: number;
  activeOrders: number;
  interbranchActive: number;
  staffCount: number;
  revenue: number;
  efficiency: number;
  customId: string;
}

/** GET /branch/:id — detail payload */
export interface BranchManagerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface BranchStaffSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface BranchAddressDetail {
  id: string;
  label: string;
  state: string;
  city: string;
  country: string;
}

export interface BranchOrderSummary {
  id: string;
  trackingCode: string;
}

export interface BranchDetailApi {
  id: string;
  name: string;
  branchId: string;
  location: string;
  createdAt: string;
  createdBy: string;
  manager: BranchManagerSummary | null;
  staff: BranchStaffSummary[];
  address?: BranchAddressDetail | null;
  orders?: BranchOrderSummary[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  manager: any;
  emailVerified: boolean;
  role: Role;
  branch: Branch;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

/** GET /staff/:id — full payload (may include driver, vehicles, etc.) */
export interface StaffDetailBranch {
  id: string;
  name: string;
  branchId?: string;
}

export interface StaffDetailVehicle {
  id: string;
  model: string;
  maxLoad: number;
  vehicleType?: {
    id: string;
    name: string;
    description?: string;
    iconPublicId?: string;
    iconUrl?: string;
  };
  plateNumber: string;
  type: string;
  status: string;
}

export interface StaffDetailDriver {
  id: string;
  availablityStatus: string;
  licenseExpiry: string | null;
  licenseIssue: string | null;
  licenseNumber: string | null;
  type: string;
  status: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  isApproved?: boolean;
  vehicles?: StaffDetailVehicle[];
}

export interface StaffDetailApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  customId?: string;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emailVerified: boolean;
  isActive: boolean;
  driver?: StaffDetailDriver | null;
  faydaFAN?: string | null;
  profilePictures?: ProfilePicture[];
  isStaff: boolean;
  role: Role;
  branch: StaffDetailBranch;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FleetDriver {
  id: string;
  userId: string;
  vehicleId: string;
  status: string;
  availablityStatus: string;
  type: string;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  licenseIssue: string | null;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  verifiedByOCR: boolean;
  currentLat: number;
  currentLon: number;
  updatedAt: string;
  createdBy: string | null;
  user: any;
}

export interface FleetVehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: string;
  model: string;
  driverId: string;
  maxLoad: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  driver: FleetDriver;
  vehicleTypeId: any;
  vehicleType: any;
}

/** ───── Vehicle ───── */
export interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  status: VehicleStatus;
  model?: string;
  driverId?: string;
  createdAt: string;
  updatedAt: string;
  user: any;
}

/** ───── Order ───── */
export interface CustomerAddress {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  lat: string;
  long: string;
  purpose: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  branchId: string | null;
  createdBy: string | null;
}

export interface CustomerRole {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface CustomerCorporateInfo {}

export interface CustomerPreferences {}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  type: "Individual" | "Corporate";
  status: "Active" | "Inactive" | "Suspended";
  registrationDate: string;
  lastOrderDate: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  address: string;
  city: string;
  notes: string;
  companyName?: string;
  contactPerson?: string;
  contractNumber?: string;
  creditLimit?: number;
  paymentTerms?: string;
  preferredLanguage: string;
  communicationPreference: "Email" | "SMS" | "Phone";
  marketingOptIn: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  branch: string | null;
  addresses: CustomerAddress[];
  customerType: string;
  role: CustomerRole;
  corporateInfo: CustomerCorporateInfo | null;
  preferences: CustomerPreferences | null;
}

export interface Receiver {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Order {
  id: string;
  trackingCode: string;
  serviceType: ServiceType | string;
  fulfillmentType: FulfillmentType | string;
  pickupDriverId: string | null;
  deliveryDriverId: string | null;
  status: OrderStatus | string;
  weight: number;
  length: number;
  width: number;
  height: number;
  category: ParcelCategory[];
  isFragile: boolean;
  shipmentType: ShipmentType | string;
  shippingScope: ShippingScope | string;
  isUnusual: boolean;
  unusualReason: string | null;
  pickupAddressId: string;
  pickupDate: string;
  deliveryAddressId: string;
  deliveryAddress: any;
  pickupAddress: any;
  deliveryDate: string;
  distance: number;
  validatedBy: string | null;
  validatedNotes: string | null;
  estimatedDeliveryAt: string | null;
  actualDeliveryAt: string | null;
  batchId: string | null;
  finalPrice: number;
  currency: string;
  customer: Customer;
  receiver: Receiver;
  branch: any | null;
  payment: any | null;
  createdAt: string;
}

/** ───── Driver ───── */
export interface Driver {
  id: string;
  userId: string;
  vehicleId?: string;
  status: DriverStatus;
  type: DriverType;
  currentLat?: number;
  currentLon?: number;
  updatedAt?: string;
  createdBy?: string;
}

/** ───── Other Supporting Models ───── */
export interface ProfilePicture {
  id: string;
  userId: string;
  url: string;
  publicId?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt: string;
}

export interface PodImage {
  id: string;
  driverId: string;
  orderId: string;
  url: string;
  publicId?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt: string;
}

/** ───── Role Permission Models ───── */
export interface Permission {
  id: string;
  resource: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createAction: boolean;
  readAction: boolean;
  updateAction: boolean;
  deleteAction: boolean;
  scope: string[];
  createdBy?: string | null;
  permission: Permission;
}

/** ───── Extended Role with Permissions ───── */
export interface RoleWithPermissions {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  rolePermissions: RolePermission[];
}

/** ───── Response Types ───── */
export type RoleWithPermissionsResponse = ApiResponse<RoleWithPermissions>;
export type RoleWithPermissionsListResponse =
  PaginatedResponse<RoleWithPermissions>;

export type StaffDetailResponse = ApiResponse<StaffDetailApi>;
export type StaffListResponse = PaginatedResponse<Staff>;

export type VehicleDetailResponse = ApiResponse<Vehicle>;
export type VehicleListResponse = PaginatedResponse<Vehicle>;

export type OrderDetailResponse = ApiResponse<Order>;
export type OrderListResponse = PaginatedResponse<Order>;

export type DriverDetailResponse = ApiResponse<Driver>;
export type DriverListResponse = PaginatedResponse<Driver>;

export type BranchDetailResponse = ApiResponse<BranchDetailApi>;
export type BranchListResponse = PaginatedResponse<Branch>;

export type CustomerDetailResponse = ApiResponse<Customer>;
export type CustomerListResponse = PaginatedResponse<Customer>;

export type FleetDetailResponse = ApiResponse<FleetVehicle>;
export type FleetListResponse = PaginatedResponse<FleetVehicle>;

export interface GenericResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  payload?: Record<string, any>;
  createdAt: string;
  createdBy: string | null;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    pagination: Pagination;
  };
}

export interface NotificationMarkReadResponse {
  success: boolean;
  message: string;
  data: {
    message: string;
  };
}

// Legacy NotificationItem (for backward compatibility)
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

// Role Management Types (Access Control module re-exports)
export type RoleListResponse = PaginatedResponse<Role>;
export type RoleDetailResponse = ApiResponse<RoleWithPermissions>;
export type RoleResponse = ApiResponse<Role>;

// Permission Management Types (Access Control - separate from Role Permission models)
export interface AccessControlPermission {
  id: string;
  resource: string;
  description?: string;
  createdAt: string;
}

export type AccessControlPermissionListResponse =
  PaginatedResponse<AccessControlPermission>;
export type AccessControlPermissionResponse =
  ApiResponse<AccessControlPermission>;

// Role-Permission Assignment Types
export interface AssignPermissionRequest {
  permissionId: string;
  createAction: boolean;
  readAction: boolean;
  updateAction: boolean;
  deleteAction: boolean;
  scopes: string[];
}

export interface AssignPermissionsToRoleRequest {
  roleId: string;
  permissions: AssignPermissionRequest[];
}

export interface UpdatePermissionActionRequest {
  permissionId: string;
  createAction: boolean;
  readAction: boolean;
  updateAction: boolean;
  deleteAction: boolean;
  scopes: string[];
}

export interface RemovePermissionRequest {
  permissionId: string;
}

export interface AssignRoleToUserRequest {
  userId: string;
  roleId: string;
}

/** ───── Batch Management Types ───── */
export interface BatchOrder {
  id: string;
  trackingCode: string;
}

export interface Batch {
  id: string;
  batchCode: string;
  scope: "IN_TOWN" | "REGIONAL" | "INTERNATIONAL";
  serviceType: ServiceType;
  category: string[];
  isFragile: boolean;
  status: DispatchStatus;
  originId: string;
  destinationId: string;
  notes?: string;
  driverId?: string;
  vehicleId?: string;
  awbNumber?: string;
  weight?: number;
  orders: BatchOrder[];
  officerId?: string;
  createdAt: string;
  updatedAt?: string;
  sendingManifestId?:string
  receivingManifestId?:string
}

export interface CreateBatchRequest {
  // Backend currently expects "TOWN" for in-town scope,
  // but we keep "IN_TOWN" for internal usage as well.
  scope: "IN_TOWN" | "REGIONAL" | "INTERNATIONAL" | "TOWN";
  serviceType: ServiceType;
  // Can be a single category or multiple
  category?: string | string[];
  isFragile?: boolean;
  originId: string;
  destinationId: string;
  notes?: string;
  weight?: number;
  orders: string[];
  shipmentDate: string;
}

export interface AddOrdersToBatchRequest {
  orders: string[];
}

export interface AssignOfficerRequest {
  batchId: string[];
  officerId: string;
}

export interface AcceptBatchRequest {
  batchId: string[];
  officerId: string;
}

// export interface CategorizedOrdersResponse {
//   grouped: {
//     IN_TOWN?: {
//       SAME_DAY: Order[];
//       EXPRESS: Order[];
//       STANDARD: Order[];
//       OVERNIGHT: Order[];
//     };
//     TOWN?: {
//       SAME_DAY: Order[];
//       EXPRESS: Order[];
//       STANDARD: Order[];
//       OVERNIGHT: Order[];
//     };
//     REGIONAL: {
//       SAME_DAY: Order[];
//       EXPRESS: Order[];
//       STANDARD: Order[];
//       OVERNIGHT: Order[];
//     };
//     INTERNATIONAL: {
//       SAME_DAY: Order[];
//       EXPRESS: Order[];
//       STANDARD: Order[];
//       OVERNIGHT: Order[];
//     };
//   };
//   pagination: Pagination;
// }

export type ServiceType2 =
  | "SAME_DAY"
  | "EXPRESS"
  | "STANDARD"
  | "OVERNIGHT";

export type ShippingScope2 =
  | "TOWN"
  | "IN_TOWN"
  | "REGIONAL"
  | "INTERNATIONAL";

/**
 * Example dynamic key:
 * "Unknown → Unknown"
 * "Addis Ababa → Dire Dawa"
 */
export type RouteKey = string;

export interface CategorizedOrdersResponse {
  grouped: Partial<
    Record<
      ShippingScope2,
      Record<
        RouteKey,
        Partial<Record<ServiceType2, Order[]>>
      >
    >
  >;
  pagination: Pagination;
}

export interface BranchSortOrdersResponse {
  unbatchedOrders: Order[];
  inboundBatchOrders: Order[];
  totalOrders: number;
  categorized: {
    IN_TOWN?: {
      SAME_DAY: Order[];
      EXPRESS: Order[];
      STANDARD: Order[];
      OVERNIGHT: Order[];
    };
    TOWN?: {
      SAME_DAY: Order[];
      EXPRESS: Order[];
      STANDARD: Order[];
      OVERNIGHT: Order[];
    };
    REGIONAL: {
      SAME_DAY: Order[];
      EXPRESS: Order[];
      STANDARD: Order[];
      OVERNIGHT: Order[];
    };
    INTERNATIONAL: {
      SAME_DAY: Order[];
      EXPRESS: Order[];
      STANDARD: Order[];
      OVERNIGHT: Order[];
    };
  };
}

export type BatchDetailResponse = ApiResponse<Batch>;
export type BatchListResponse = PaginatedResponse<Batch>;
export type CategorizedOrdersApiResponse =
  ApiResponse<CategorizedOrdersResponse>;
export type BranchSortOrdersApiResponse = ApiResponse<BranchSortOrdersResponse>;
