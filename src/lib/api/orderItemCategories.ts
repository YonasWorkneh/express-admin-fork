import api from "./api";
import type {
  CreateOrderItemCategoryInput,
  OrderItemCategory,
} from "@/types/orderCategories";

function normalizeCategoryList(payload: unknown): OrderItemCategory[] {
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
    return root as OrderItemCategory[];
  }
  if (root && typeof root === "object") {
    const o = root as Record<string, unknown>;
    const keys = ["categories", "itemCategories", "items", "rows"] as const;
    for (const k of keys) {
      const arr = o[k];
      if (Array.isArray(arr)) return arr as OrderItemCategory[];
    }
  }
  return [];
}

function normalizeCategory(payload: unknown): OrderItemCategory | null {
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
    return o as unknown as OrderItemCategory;
  }
  return null;
}

export const fetchOrderItemCategories = async (): Promise<OrderItemCategory[]> => {
  try {
    const response = await api.get<unknown>("/order/item-categories");
    return normalizeCategoryList(response.data);
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
    throw error instanceof Error ? error : new Error("Failed to load categories");
  }
};

export const createOrderItemCategory = async (
  input: CreateOrderItemCategoryInput,
): Promise<OrderItemCategory> => {
  const body = {
    name: input.name.trim(),
    ...(input.description?.trim()
      ? { description: input.description.trim() }
      : {}),
  };
  try {
    const response = await api.post<unknown>("/order/item-categories", body);
    const created = normalizeCategory(response.data);
    if (created) return created;
    return {
      id: "",
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
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
      : new Error("Failed to create category");
  }
};
