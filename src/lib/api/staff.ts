import api from "./api";
import type { StaffDetailApi, StaffDetailResponse } from "@/types/types";

/** GET /staff/:id */
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
  return staff;
}
