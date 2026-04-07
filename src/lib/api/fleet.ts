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
