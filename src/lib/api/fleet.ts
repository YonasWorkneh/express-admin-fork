import api from "./api";
import type { ApiResponse } from "@/types/types";
import type { VehicleType } from "@/features/fleet/types";

export interface CreateVehicleTypeInput {
  name: string;
  description: string;
  icon: File;
}

/**
 * POST multipart/form-data: fields `name`, `description`, `icon`
 */
export const createVehicleType = async (
  input: CreateVehicleTypeInput,
): Promise<ApiResponse<VehicleType>> => {
  const formData = new FormData();
  formData.append("name", input.name.trim());
  formData.append("description", input.description.trim());
  formData.append("icon", input.icon);

  const response = await api.post<ApiResponse<VehicleType>>(
    "/fleet/type",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export interface UpdateVehicleTypeInput {
  name: string;
  description: string;
  /** Omit to keep existing icon */
  icon?: File;
}

/**
 * PATCH multipart/form-data: `name`, `description`, optional `icon`
 */
export const updateVehicleType = async (
  id: string,
  input: UpdateVehicleTypeInput,
): Promise<ApiResponse<VehicleType>> => {
  const formData = new FormData();
  formData.append("name", input.name.trim());
  formData.append("description", input.description.trim());
  if (input.icon) {
    formData.append("icon", input.icon);
  }

  const response = await api.patch<ApiResponse<VehicleType>>(
    `/fleet/type/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const deleteVehicleType = async (id: string): Promise<void> => {
  await api.delete(`/fleet/type/${id}`);
};

/** Pagination block nested under `data` (or top-level) from GET /fleet/type */
export interface FleetTypePagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API envelope for fleet type list endpoints, e.g.
 * `{ success, message, data: { vehicleTypes, pagination }, pagination }`
 */
export interface FleetVehicleTypesListResponse {
  success?: boolean;
  message?: string;
  data?: {
    vehicleTypes?: unknown[];
    pagination?: FleetTypePagination | null;
  };
  pagination?: FleetTypePagination | null;
}

/**
 * Normalized row — maps API `iconUrl` / `iconPublicId` and legacy `icon` / `imageUrl`.
 */
export interface FleetVehicleTypeListItem {
  id: string;
  name: string;
  description?: string | null;
  /** API field */
  iconUrl?: string | null;
  iconPublicId?: string | null;
  /** Best URL to use for &lt;img src&gt; (iconUrl or legacy imageUrl / http icon) */
  imageUrl?: string | null;
  /** Legacy string field */
  icon?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

function normalizeFleetVehicleTypeItem(
  raw: unknown,
): FleetVehicleTypeListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = r.id != null ? String(r.id) : "";
  const name = typeof r.name === "string" ? r.name : "";
  if (!id || !name.trim()) return null;

  const description =
    typeof r.description === "string" && r.description.trim()
      ? r.description.trim()
      : null;

  const iconUrl =
    typeof r.iconUrl === "string" && r.iconUrl.trim()
      ? r.iconUrl.trim()
      : null;

  const iconPublicId =
    r.iconPublicId != null && String(r.iconPublicId).trim()
      ? String(r.iconPublicId).trim()
      : null;

  const legacyImageUrl =
    typeof r.imageUrl === "string" && r.imageUrl.trim()
      ? r.imageUrl.trim()
      : null;

  let icon: string | null = null;
  if (typeof r.icon === "string" && r.icon.trim()) {
    icon = r.icon.trim();
  }

  const imageUrl =
    iconUrl ||
    legacyImageUrl ||
    (icon && /^https?:\/\//i.test(icon) ? icon : null) ||
    null;

  const createdAt =
    typeof r.createdAt === "string" && r.createdAt.trim()
      ? r.createdAt.trim()
      : null;
  const updatedAt =
    typeof r.updatedAt === "string" && r.updatedAt.trim()
      ? r.updatedAt.trim()
      : null;

  return {
    id,
    name,
    description,
    iconUrl,
    iconPublicId,
    imageUrl,
    icon,
    createdAt,
    updatedAt,
  };
}

function extractVehicleTypesFromEnvelope(responseData: unknown): unknown[] {
  if (responseData == null) return [];
  if (Array.isArray(responseData)) return responseData;
  if (typeof responseData !== "object") return [];
  const root = responseData as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.vehicleTypes)) return d.vehicleTypes;
  }
  if (Array.isArray(root.vehicleTypes)) return root.vehicleTypes;
  return [];
}

function mapVehicleTypeList(rawList: unknown[]): FleetVehicleTypeListItem[] {
  return rawList
    .map(normalizeFleetVehicleTypeItem)
    .filter((x): x is FleetVehicleTypeListItem => x != null);
}

/** Paginated fleet types list (pricing, commission, authenticated). */
export async function fetchFleetVehicleTypes(): Promise<
  FleetVehicleTypeListItem[]
> {
  const response = await api.get<FleetVehicleTypesListResponse>(
    "/fleet/type/",
  );
  const list = extractVehicleTypesFromEnvelope(response.data);
  return mapVehicleTypeList(list);
}

/**
 * Public catalog (e.g. order creation). GET /fleet/type/public
 */
export async function fetchFleetPublicVehicleTypes(): Promise<
  FleetVehicleTypeListItem[]
> {
  const response = await api.get<FleetVehicleTypesListResponse>(
    "/fleet/type/public",
  );
  const list = extractVehicleTypesFromEnvelope(response.data);
  return mapVehicleTypeList(list);
}
