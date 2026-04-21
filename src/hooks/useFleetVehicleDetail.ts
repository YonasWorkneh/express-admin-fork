import { useQuery } from "@tanstack/react-query";
import { fetchFleetVehicleById } from "@/lib/api/fleet";
import type { FleetVehicleDetailApi } from "@/types/types";

export function useFleetVehicleDetail(id: string | undefined) {
  return useQuery<FleetVehicleDetailApi, Error>({
    queryKey: ["fleet", "vehicle", "detail", id],
    queryFn: () => fetchFleetVehicleById(id!),
    enabled: Boolean(id?.trim()),
    staleTime: 5 * 60 * 1000,
  });
}
