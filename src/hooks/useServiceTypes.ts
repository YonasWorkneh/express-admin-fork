import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
} from "@/lib/api/serviceTypes";
import type {
  CreateServiceTypeInput,
  UpdateServiceTypeInput,
} from "@/types/serviceTypes";

const QUERY_KEY = ["serviceTypes"] as const;

export function useServiceTypes() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchServiceTypes,
    staleTime: 60 * 1000,
  });
}

export function useCreateServiceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceTypeInput) => createServiceType(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateServiceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateServiceTypeInput;
    }) => updateServiceType(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteServiceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServiceType(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
