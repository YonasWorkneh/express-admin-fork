import api from "./api";
import type { OrderDetailApi } from "@/types/orderDetail";

function unwrapOrderPayload(payload: unknown): OrderDetailApi | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  let data: unknown = o;
  if ("data" in o && o.data && typeof o.data === "object") {
    data = o.data;
  }
  const row = data as Record<string, unknown>;
  if (typeof row.id === "string" && typeof row.trackingCode === "string") {
    return data as OrderDetailApi;
  }
  return null;
}

/** GET /order/:id */
export async function fetchOrderById(id: string): Promise<OrderDetailApi> {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid order id");
  }
  const response = await api.get<unknown>(
    `/order/${encodeURIComponent(clean)}`,
  );
  const order = unwrapOrderPayload(response.data);
  if (!order) {
    throw new Error("Order not found");
  }
  return order;
}
