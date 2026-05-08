import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDriverCommissionConfig,
  saveDriverCommissionConfig,
} from "@/lib/api/driverCommissionConfig";
import {
  fetchFleetVehicleTypes,
  fetchFleetPublicVehicleTypes,
  fetchFleetVehicleTypesConfiguredForServiceType,
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

/** Vehicle types allowed for the selected service type (GET /fleet/type/configured/:serviceTypeId). */
export function useFleetVehicleTypesForServiceTypeQuery(serviceTypeId: string) {
  const id = serviceTypeId.trim();
  return useQuery({
    queryKey: ["fleetVehicleTypesConfigured", id] as const,
    queryFn: () => fetchFleetVehicleTypesConfiguredForServiceType(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDriverCommissionConfigQuery(
  serviceTypeId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["driverCommissionConfig", serviceTypeId] as const,
    queryFn: () => fetchDriverCommissionConfig(serviceTypeId),
    enabled: enabled && Boolean(serviceTypeId.trim()),
  });
}

export function useSaveDriverCommissionConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceType,
      rows,
      resourceId,
    }: {
      serviceType: PricingServiceType;
      rows: DriverCommissionRow[];
      resourceId?: string | null;
    }) => saveDriverCommissionConfig(serviceType, rows, resourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["driverCommissionConfig"],
      });
    },
  });
}
