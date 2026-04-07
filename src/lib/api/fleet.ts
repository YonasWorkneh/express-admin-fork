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

export interface FleetVehicleTypeListItem {
  id: string;
  name: string;
}

/** Paginated fleet types list (used by pricing and commission UIs). */
export async function fetchFleetVehicleTypes(): Promise<
  FleetVehicleTypeListItem[]
> {
  const response = await api.get<{
    data?: { vehicleTypes?: FleetVehicleTypeListItem[] };
  }>("/fleet/type?search=&page=1&limit=1000");
  return response.data.data?.vehicleTypes ?? [];
}
