// Role-based access control configuration

export const RoleName = {
  SUPER_ADMIN: "SUPER_ADMIN",
  OPERATIONAL_MANAGER: "OPERATIONAL_MANAGER",
  HR_MANAGER: "HR_MANAGER",
  CUSTOMER_MANAGER: "CUSTOMER_MANAGER",
  FINANCE_MANAGER: "FINANCE_MANAGER",
} as const;

export type RoleName = (typeof RoleName)[keyof typeof RoleName];

// Define all available routes/permissions
export const Permission = {
  DASHBOARD: "dashboard",
  ORDERS: "orders",
  FLEET: "fleet",
  STAFF: "staff",
  BRANCH: "branch",
  CUSTOMER: "customer",
  DISPATCH: "dispatch",
  PRICING: "pricing",
  REPORT: "report",
  ROLE: "role",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// Map roles to their permissions
export const rolePermissions: Record<string, Permission[]> = {
  [RoleName.SUPER_ADMIN]: [
    Permission.DASHBOARD,
    Permission.ORDERS,
    Permission.FLEET,
    Permission.STAFF,
    Permission.BRANCH,
    Permission.CUSTOMER,
    Permission.DISPATCH,
    Permission.PRICING,
    Permission.REPORT,
    Permission.ROLE,
  ],
  [RoleName.HR_MANAGER]: [
    Permission.DASHBOARD,
    Permission.ORDERS,
    Permission.STAFF,
    Permission.BRANCH,
    Permission.CUSTOMER,
    Permission.PRICING,
    Permission.REPORT,
  ],
  [RoleName.OPERATIONAL_MANAGER]: [
    Permission.DASHBOARD,
    Permission.ORDERS,
    Permission.FLEET,
    Permission.DISPATCH,
    Permission.REPORT,
  ],
  [RoleName.CUSTOMER_MANAGER]: [
    Permission.DASHBOARD,
    Permission.ORDERS,
    Permission.CUSTOMER,
    Permission.REPORT,
  ],
  [RoleName.FINANCE_MANAGER]: [
    Permission.DASHBOARD,
    Permission.ORDERS,
    Permission.REPORT,
  ],
};

// Check if a role has a specific permission
export const hasPermission = (
  roleName: string | null | undefined,
  permission: Permission
): boolean => {
  if (!roleName) return false;

  const permissions = rolePermissions[roleName];
  if (!permissions) return false;

  return permissions.includes(permission);
};

// Check if a role has access to any of the given permissions
export const hasAnyPermission = (
  roleName: string | null | undefined,
  permissions: Permission[]
): boolean => {
  if (!roleName) return false;

  return permissions.some((permission) => hasPermission(roleName, permission));
};

// Get all permissions for a role
export const getRolePermissions = (
  roleName: string | null | undefined
): Permission[] => {
  if (!roleName) return [];
  return rolePermissions[roleName] || [];
};
