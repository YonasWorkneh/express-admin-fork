import api from "./api";
import type {
  CreateServiceTypeInput,
  ServiceType,
  UpdateServiceTypeInput,
} from "@/types/serviceTypes";

/** Backend route: GET/POST /orders/service-types, PATCH/DELETE /orders/service-types/:id */
const BASE = "/order/service-types";

function normalizeList(payload: unknown): ServiceType[] {
  if (!payload) return [];
  let root: unknown = payload;
  if (
    root &&
    typeof root === "object" &&
    "data" in root &&
    (root as { data: unknown }).data !== undefined
  ) {
    root = (root as { data: unknown }).data;
  }
  if (Array.isArray(root)) {
    return root as ServiceType[];
  }
  if (root && typeof root === "object") {
    const o = root as Record<string, unknown>;
    const keys = ["serviceTypes", "types", "items", "rows"] as const;
    for (const k of keys) {
      const arr = o[k];
      if (Array.isArray(arr)) return arr as ServiceType[];
    }
  }
  return [];
}

function normalizeOne(payload: unknown): ServiceType | null {
  if (!payload || typeof payload !== "object") return null;
  let root: unknown = payload;
  if (
    "data" in (root as object) &&
    (root as { data: unknown }).data !== undefined &&
    typeof (root as { data: unknown }).data === "object"
  ) {
    root = (root as { data: unknown }).data;
  }
  const o = root as Record<string, unknown>;
  if (typeof o.id === "string" && typeof o.name === "string") {
    return o as unknown as ServiceType;
  }
  return null;
}

export const fetchServiceTypes = async (): Promise<ServiceType[]> => {
  try {
    const response = await api.get<unknown>(BASE);
    return normalizeList(response.data);
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message;
    if (typeof msg === "string" && msg.trim()) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to load service types");
  }
};

export const createServiceType = async (
  input: CreateServiceTypeInput,
): Promise<ServiceType> => {
  const body = {
    name: input.name.trim(),
    description: input.description.trim(),
  };
  try {
    const response = await api.post<unknown>(BASE, body);
    const created = normalizeOne(response.data);
    if (created) return created;
    return {
      id: "",
      name: body.name,
      description: body.description,
    };
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message;
    if (typeof msg === "string" && msg.trim()) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to create service type");
  }
};

export const updateServiceType = async (
  id: string,
  input: UpdateServiceTypeInput,
): Promise<ServiceType> => {
  const body = {
    name: input.name.trim(),
    description: input.description.trim(),
  };
  try {
    const response = await api.patch<unknown>(`${BASE}/${id}`, body);
    const updated = normalizeOne(response.data);
    if (updated) return updated;
    return {
      id,
      name: body.name,
      description: body.description,
    };
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message;
    if (typeof msg === "string" && msg.trim()) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to update service type");
  }
};

export const deleteServiceType = async (id: string): Promise<void> => {
  try {
    await api.delete(`${BASE}/${id}`);
  } catch (error: unknown) {
    const msg =
      error &&
      typeof error === "object" &&
      "response" in error &&
      (error as { response?: { data?: { message?: unknown } } }).response?.data
        ?.message;
    if (typeof msg === "string" && msg.trim()) {
      throw new Error(msg);
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to delete service type");
  }
};
