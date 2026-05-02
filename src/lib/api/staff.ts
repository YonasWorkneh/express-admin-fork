import api, { API_BASE_URL } from "./api";
import type {
  StaffDetailApi,
  StaffDetailDriver,
  StaffDetailResponse,
} from "@/types/types";

function firstNonEmptyString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

/** Turn relative API paths into absolute URLs so <img src> works. */
export function resolveStaffAssetUrl(maybe: string | null | undefined): string | null {
  const u = firstNonEmptyString(maybe);
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_BASE_URL.replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/${u}`;
}

/** Map alternate API shapes into `StaffDetailApi.driver` license fields (same payload as EditStaffPage GET). */
export function normalizeStaffDetailApi(staff: StaffDetailApi): StaffDetailApi {
  const rawDriver = staff.driver as
    | (StaffDetailDriver & Record<string, unknown>)
    | null
    | undefined;
  if (!rawDriver) return staff;

  const license = rawDriver.license as Record<string, unknown> | undefined;

  const frontMerged = firstNonEmptyString(
    rawDriver.frontImageUrl,
    rawDriver.front_image_url,
    rawDriver.licenseFrontImageUrl,
    rawDriver.license_front_image_url,
    license?.frontUrl,
    license?.frontImageUrl,
    license?.front_image_url,
  );
  const backMerged = firstNonEmptyString(
    rawDriver.backImageUrl,
    rawDriver.back_image_url,
    rawDriver.licenseBackImageUrl,
    rawDriver.license_back_image_url,
    license?.backUrl,
    license?.backImageUrl,
    license?.back_image_url,
  );

  const frontImageUrl = resolveStaffAssetUrl(frontMerged);
  const backImageUrl = resolveStaffAssetUrl(backMerged);

  return {
    ...staff,
    driver: {
      ...(staff.driver as StaffDetailDriver),
      frontImageUrl,
      backImageUrl,
    },
  };
}

/** GET /staff/:id — same request as `EditStaffPage` / `useStaffDetail` / `StaffDetailsPage`. */
export async function fetchStaffById(id: string): Promise<StaffDetailApi> {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid staff id");
  }
  const response = await api.get<StaffDetailResponse>(
    `/staff/${encodeURIComponent(clean)}`,
  );

  const staff = response.data.data;
  if (!staff) {
    throw new Error("Staff not found");
  }
  return normalizeStaffDetailApi(staff);
}
