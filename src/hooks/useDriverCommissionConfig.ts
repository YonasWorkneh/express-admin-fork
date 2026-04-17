import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDriverCommissionConfig,
  saveDriverCommissionConfig,
} from "@/lib/api/driverCommissionConfig";
import {
  fetchFleetVehicleTypes,
  fetchFleetPublicVehicleTypes,
} from "@/lib/api/fleet";
import type {
  DriverCommissionRow,
  PricingServiceType,
} from "@/types/driverCommission";

export function useFleetVehicleTypesQuery() {
  return useQuery({
    queryKey: ["fleetVehicleTypes"],
    queryFn: fetchFleetVehicleTypes,
    staleTime: 5 * 60 * 1000,
  });
}

/** Public vehicle types for order flow (GET /fleet/type/public). */
export function usePublicFleetVehicleTypesQuery() {
  return useQuery({
    queryKey: ["fleetPublicVehicleTypes"],
    queryFn: fetchFleetPublicVehicleTypes,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDriverCommissionConfigQuery(
  serviceType: PricingServiceType,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["driverCommissionConfig", serviceType],
    queryFn: () => fetchDriverCommissionConfig(serviceType),
    enabled,
  });
}

export function useSaveDriverCommissionConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceType,
      rows,
    }: {
      serviceType: PricingServiceType;
      rows: DriverCommissionRow[];
    }) => saveDriverCommissionConfig(serviceType, rows),
    onSuccess: (_data, { serviceType }) => {
      queryClient.invalidateQueries({
        queryKey: ["driverCommissionConfig", serviceType],
      });
    },
  });
}
