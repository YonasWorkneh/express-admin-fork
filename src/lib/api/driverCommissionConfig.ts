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

/** Result of GET /pricing/vehicle-commission — lines plus optional resource id for PATCH. */
export interface DriverCommissionConfigResult {
  lines: ApiDriverCommissionLine[];
  /** When set, update with PATCH `/pricing/vehicle-commission/:id`. */
  resourceId: string | null;
}

/**
 * Vehicle line inside {@link ServiceTypeVehicleCommissionGroup.vehicles}
 * (order + driver-commission save payloads).
 */
export interface ServiceTypeVehicleCommissionVehicle {
  vehicleTypeId: string;
  fixed: number;
  perKm: number;
  percentage: number;
}

/**
 * One block in `serviceTypeVehicleCommissions` (POST create only).
 * PATCH uses {@link VehicleCommissionPatchBody} instead.
 */
export interface ServiceTypeVehicleCommissionGroup {
  serviceTypeId?: string;
  vehicles: ServiceTypeVehicleCommissionVehicle[];
}

/**
 * Body for driver / vehicle commission APIs.
 *
 * @example POST (create)
 * ```json
 * {
 *   "serviceTypeVehicleCommissions": [
 *     {
 *       "serviceTypeId": "service_type_001",
 *       "vehicles": [
 *         { "vehicleTypeId": "vehicle_type_001", "fixed": 0, "perKm": 0, "percentage": 0 }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example PATCH (update) — id is `/pricing/vehicle-commission/:id`; body is a flat `vehicles` array only
 * ```json
 * {
 *   "vehicles": [
 *     { "vehicleTypeId": "vehicle_type_001", "fixed": 0, "perKm": 0, "percentage": 0 }
 *   ]
 * }
 * ```
 */
export interface ServiceTypeVehicleCommissionsJson {
  serviceTypeVehicleCommissions: ServiceTypeVehicleCommissionGroup[];
}

/** Body for PATCH `/pricing/vehicle-commission/:id`. */
export interface VehicleCommissionPatchBody {
  vehicles: ServiceTypeVehicleCommissionVehicle[];
}

function optionalNumber(v: unknown): number | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return undefined;
}

/** Map API row (incl. nested vehicleType) to our line shape; ignores extras. */
function normalizeCommissionRow(raw: unknown): ApiDriverCommissionLine | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const vehicleTypeId = r.vehicleTypeId;
  if (typeof vehicleTypeId !== "string" || !vehicleTypeId.trim()) return null;

  const line: ApiDriverCommissionLine = { vehicleTypeId };
  const fixed = optionalNumber(r.fixed);
  const perKm = optionalNumber(r.perKm);
  const percentage = optionalNumber(r.percentage);
  if (fixed !== undefined) line.fixed = fixed;
  if (perKm !== undefined) line.perKm = perKm;
  if (percentage !== undefined) line.percentage = percentage;
  return line;
}

function unwrapCommissionRowsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;

  /** { success, message, data: { data: [...], pagination } } */
  const envelope = root.data;
  if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
    const inner = envelope as Record<string, unknown>;
    if (Array.isArray(inner.data)) {
      return inner.data;
    }
    const fromInner =
      inner.driverCommissions ?? inner.commissions ?? inner.items ?? inner.rows;
    if (Array.isArray(fromInner)) return fromInner;
  }

  const top = root.driverCommissions ?? root.commissions ?? root.items;
  if (Array.isArray(top)) return top;
  return [];
}

function extractCommissionList(data: unknown): ApiDriverCommissionLine[] {
  return unwrapCommissionRowsArray(data)
    .map(normalizeCommissionRow)
    .filter((row): row is ApiDriverCommissionLine => row != null);
}

/** Parse GET responses that nest lines under `serviceTypeVehicleCommissions[0].vehicles`. */
function extractCommissionListFromServiceTypeVehicleCommissions(
  data: unknown,
): ApiDriverCommissionLine[] {
  const visit = (node: unknown): ApiDriverCommissionLine[] | null => {
    if (!node || typeof node !== "object") return null;
    const o = node as Record<string, unknown>;
    if (Array.isArray(o.serviceTypeVehicleCommissions)) {
      const groups = o.serviceTypeVehicleCommissions;
      if (groups.length === 0) return [];
      const first = groups[0];
      if (!first || typeof first !== "object") return [];
      const vehicles = (first as Record<string, unknown>).vehicles;
      if (!Array.isArray(vehicles)) return [];
      return vehicles
        .map((v) => normalizeCommissionRow(v))
        .filter((row): row is ApiDriverCommissionLine => row != null);
    }
    for (const key of ["data", "result", "payload"]) {
      if (key in o && o[key] != null) {
        const inner = visit(o[key]);
        if (inner !== null) return inner;
      }
    }
    return null;
  };
  return visit(data) ?? [];
}

function idFromRecord(o: Record<string, unknown>): string | null {
  const id = o.id;
  if (typeof id === "string" && id.trim()) return id.trim();
  if (typeof id === "number" && !Number.isNaN(id)) return String(id);
  return null;
}

/** Find vehicle-commission record id in GET response envelopes. */
export function extractVehicleCommissionResourceId(
  data: unknown,
): string | null {
  const visit = (node: unknown): string | null => {
    if (!node || typeof node !== "object") return null;
    const o = node as Record<string, unknown>;
    const direct = idFromRecord(o);
    if (direct) return direct;

    if (Array.isArray(o.serviceTypeVehicleCommissions)) {
      for (const g of o.serviceTypeVehicleCommissions) {
        if (g && typeof g === "object") {
          const gid = idFromRecord(g as Record<string, unknown>);
          if (gid) return gid;
        }
      }
    }

    for (const key of ["data", "result", "payload"]) {
      if (key in o && o[key] != null) {
        const inner = visit(o[key]);
        if (inner) return inner;
      }
    }
    return null;
  };
  return visit(data);
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

/** Query value for GET `filter` param, e.g. `serviceTypeId:cmnprqm7m02k2mm06x1nlszpk`. */
export function buildVehicleCommissionServiceTypeFilter(
  serviceTypeId: string,
): string {
  const id = serviceTypeId.trim();
  if (!id) return "";
  return `serviceTypeId:${id}`;
}

/** GET /pricing/vehicle-commission?filter=serviceTypeId:<id> */
export async function fetchDriverCommissionConfig(
  serviceTypeId: string,
): Promise<DriverCommissionConfigResult> {
  const filter = buildVehicleCommissionServiceTypeFilter(serviceTypeId);
  try {
    const response = await api.get<unknown>("/pricing/vehicle-commission", {
      params: filter ? { filter } : undefined,
    });
    const resourceId = extractVehicleCommissionResourceId(response.data);
    const flat = extractCommissionList(response.data);
    const lines =
      flat.length > 0
        ? flat
        : extractCommissionListFromServiceTypeVehicleCommissions(
            response.data,
          );
    return { lines, resourceId: resourceId ?? null };
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

/**
 * At most one of per-km, fixed, or percentage may be non-zero. If multiple are set,
 * priority is: per km → fixed → percentage.
 */
function rowToExclusiveVehicleCommission(
  c: DriverCommissionRow,
): ServiceTypeVehicleCommissionVehicle {
  const rawPerKm =
    c.driverCost !== undefined && c.driverCost !== null
      ? Number(c.driverCost)
      : 0;
  const rawFixed =
    c.fixedCost !== undefined && c.fixedCost !== null ? Number(c.fixedCost) : 0;
  const rawPct =
    c.percentage !== undefined && c.percentage !== null
      ? Number(c.percentage)
      : 0;

  const perKm = Number.isFinite(rawPerKm) && rawPerKm !== 0 ? rawPerKm : 0;
  const fixed = Number.isFinite(rawFixed) && rawFixed !== 0 ? rawFixed : 0;
  const percentage = Number.isFinite(rawPct) && rawPct !== 0 ? rawPct : 0;

  const n =
    (perKm !== 0 ? 1 : 0) + (fixed !== 0 ? 1 : 0) + (percentage !== 0 ? 1 : 0);
  if (n <= 1) {
    return {
      vehicleTypeId: c.category,
      fixed,
      perKm,
      percentage,
    };
  }
  if (perKm !== 0) {
    return {
      vehicleTypeId: c.category,
      fixed: 0,
      perKm,
      percentage: 0,
    };
  }
  if (fixed !== 0) {
    return {
      vehicleTypeId: c.category,
      fixed,
      perKm: 0,
      percentage: 0,
    };
  }
  return {
    vehicleTypeId: c.category,
    fixed: 0,
    perKm: 0,
    percentage,
  };
}

function driverCommissionRowsToVehicles(
  rows: DriverCommissionRow[],
): ServiceTypeVehicleCommissionVehicle[] {
  return rows.map(rowToExclusiveVehicleCommission);
}

/** Build POST body `{ serviceTypeVehicleCommissions: [...] }` from form rows (one non-zero commission mode per vehicle). */
export function driverCommissionRowsToServiceTypeVehicleCommissionsJson(
  serviceTypeId: string,
  rows: DriverCommissionRow[],
): ServiceTypeVehicleCommissionsJson {
  const vehicles = driverCommissionRowsToVehicles(rows);
  const sid = serviceTypeId.trim();
  return {
    serviceTypeVehicleCommissions: sid
      ? [{ serviceTypeId: sid, vehicles }]
      : [],
  };
}

/**
 * POST /pricing/vehicle-commission (create) or PATCH /pricing/vehicle-commission/:id (update).
 */
export async function saveDriverCommissionConfig(
  serviceType: PricingServiceType,
  rows: DriverCommissionRow[],
  existingResourceId?: string | null,
): Promise<void> {
  const id = existingResourceId?.trim();
  try {
    if (id) {
      const body: VehicleCommissionPatchBody = {
        vehicles: driverCommissionRowsToVehicles(rows),
      };
      await api.patch(
        `/pricing/vehicle-commission/${encodeURIComponent(id)}`,
        body,
      );
    } else {
      const body = driverCommissionRowsToServiceTypeVehicleCommissionsJson(
        serviceType,
        rows,
      );
      await api.post("/pricing/vehicle-commission", body);
    }
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

/** True if any row has a non-zero cost per km, fixed, or percentage (same rule as the configure UI). */
export function driverCommissionRowsHaveConfiguredRates(
  rows: DriverCommissionRow[],
): boolean {
  if (!rows.length) return false;
  return rows.some(
    (r) =>
      Boolean(r.fixedCost) ||
      Boolean(r.driverCost) ||
      Boolean(r.percentage),
  );
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
