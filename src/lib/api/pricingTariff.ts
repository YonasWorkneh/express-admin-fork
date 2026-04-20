import api from "./api";

/** GET /pricing/tariff/:id — unwraps `{ success, data }` or bare object. */
export async function fetchTariffById(
  id: string,
): Promise<Record<string, unknown>> {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid tariff id");
  }
  const res = await api.get<unknown>(
    `/pricing/tariff/${encodeURIComponent(clean)}`,
  );
  const body = res.data;
  if (body == null || typeof body !== "object") {
    throw new Error("Empty response");
  }
  const o = body as Record<string, unknown>;
  let data: unknown = o;
  if ("data" in o && o.data != null && typeof o.data === "object") {
    data = o.data;
  }
  if (data == null || typeof data !== "object") {
    throw new Error("Invalid tariff payload");
  }
  const row = data as Record<string, unknown>;
  if (
    "tariff" in row &&
    row.tariff != null &&
    typeof row.tariff === "object"
  ) {
    return row.tariff as Record<string, unknown>;
  }
  return row;
}
