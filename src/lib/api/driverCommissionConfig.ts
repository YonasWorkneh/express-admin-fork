import api from "./api";
import type {
  DriverCommissionRow,
  PricingServiceType,
} from "@/types/driverCommission";

/** API shape for one commission line (matches tariff payloads). */
export interface ApiDriverCommissionLine {
  vehicleTypeId: string;
  fixed?: number;
  perKm?: number;
  percentage?: number;
}

function extractCommissionList(data: unknown): ApiDriverCommissionLine[] {
  if (Array.isArray(data)) {
    return data as ApiDriverCommissionLine[];
  }
  if (!data || typeof data !== "object") {
    return [];
  }
  const root = data as Record<string, unknown>;
  const nested = root.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const d = nested as Record<string, unknown>;
    const fromNested =
      d.driverCommissions ?? d.commissions ?? d.items ?? d.rows;
    if (Array.isArray(fromNested)) {
      return fromNested as ApiDriverCommissionLine[];
    }
  }
  const top = root.driverCommissions ?? root.commissions ?? root.items;
  if (Array.isArray(top)) {
    return top as ApiDriverCommissionLine[];
  }
  return [];
}

function axiosMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    (error as { response?: { data?: { message?: unknown } } }).response?.data
      ?.message != null
  ) {
    const m = (error as { response: { data: { message: unknown } } }).response
      .data.message;
    return typeof m === "string" && m.trim() ? m : null;
  }
  return null;
}

/**
 * GET /pricing/driver-commission-config?serviceType=STANDARD
 * Adjust `driverCommissionConfig` path or query param if the backend differs.
 */
export async function fetchDriverCommissionConfig(
  serviceType: PricingServiceType,
): Promise<ApiDriverCommissionLine[]> {
  try {
    const response = await api.get<unknown>("/pricing/driver-commission-config", {
      params: { serviceType },
    });
    return extractCommissionList(response.data);
  } catch (error: unknown) {
    const msg = axiosMessage(error);
    if (msg) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to load driver commission config");
  }
}

export function driverCommissionRowsToApiPayload(
  rows: DriverCommissionRow[],
): ApiDriverCommissionLine[] {
  return rows
    .filter((c) => {
      const hasFixed =
        c.fixedCost !== undefined &&
        c.fixedCost !== null &&
        c.fixedCost !== 0;
      const hasPerKm =
        c.driverCost !== undefined &&
        c.driverCost !== null &&
        c.driverCost !== 0;
      const hasPercentage =
        c.percentage !== undefined &&
        c.percentage !== null &&
        c.percentage !== 0;
      return hasFixed || hasPerKm || hasPercentage;
    })
    .map((c) => {
      const commission: ApiDriverCommissionLine = {
        vehicleTypeId: c.category,
      };
      if (
        c.fixedCost !== undefined &&
        c.fixedCost !== null &&
        c.fixedCost !== 0
      ) {
        commission.fixed = c.fixedCost;
      }
      if (
        c.driverCost !== undefined &&
        c.driverCost !== null &&
        c.driverCost !== 0
      ) {
        commission.perKm = c.driverCost;
      }
      if (
        c.percentage !== undefined &&
        c.percentage !== null &&
        c.percentage !== 0
      ) {
        commission.percentage = c.percentage;
      }
      return commission;
    });
}

/**
 * POST /pricing/driver-commission-config
 * Body: { serviceType, driverCommissions }
 */
export async function saveDriverCommissionConfig(
  serviceType: PricingServiceType,
  rows: DriverCommissionRow[],
): Promise<void> {
  const driverCommissions = driverCommissionRowsToApiPayload(rows);
  try {
    await api.post("/pricing/driver-commission-config", {
      serviceType,
      driverCommissions,
    });
  } catch (error: unknown) {
    const msg = axiosMessage(error);
    if (msg) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to save driver commission config");
  }
}

export function mergeVehicleTypesWithCommissionConfig(
  vehicleTypes: { id: string; name: string }[],
  apiLines: ApiDriverCommissionLine[],
): DriverCommissionRow[] {
  return vehicleTypes.map((v) => {
    const matched = apiLines.find((d) => d.vehicleTypeId === v.id);
    return {
      category: v.id,
      name: v.name,
      fixedCost: matched?.fixed,
      driverCost: matched?.perKm,
      percentage: matched?.percentage,
    };
  });
}
