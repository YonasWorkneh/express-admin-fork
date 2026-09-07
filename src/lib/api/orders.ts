import api from "./api";
import axios from "axios";
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

async function parseBlobErrorMessage(blob: Blob): Promise<string | undefined> {
  try {
    const text = await blob.text();
    const body = JSON.parse(text) as { message?: string };
    return body.message;
  } catch {
    return undefined;
  }
}

/** GET /order/:id/waybill/pdf — fetches the waybill PDF and opens it. */
export async function printOrderWaybill(
  orderId: string,
  withPromotion: boolean,
): Promise<void> {
  const clean = orderId.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid order id");
  }

  try {
    const response = await api.get(
      `/order/${encodeURIComponent(clean)}/waybill/pdf`,
      {
        responseType: "blob",
        params: { withPromotion },
      },
    );
    const blob = response.data as Blob;
    const ct = String(response.headers["content-type"] ?? "").toLowerCase();
    if (ct.includes("application/json")) {
      const msg = await parseBlobErrorMessage(blob);
      throw new Error(msg ?? "Failed to fetch waybill PDF");
    }

    const pdfBlob =
      blob.type === "application/pdf"
        ? blob
        : new Blob([blob], { type: "application/pdf" });
    const url = URL.createObjectURL(pdfBlob);
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      const a = document.createElement("a");
      a.href = url;
      a.download = `waybill-${clean}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const msg = await parseBlobErrorMessage(error.response.data);
      throw new Error(msg ?? "Failed to fetch waybill PDF");
    }
    throw error;
  }
}
