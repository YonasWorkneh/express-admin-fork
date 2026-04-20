import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrderItemCategories,
  createOrderItemCategory,
  updateOrderItemCategory,
  deleteOrderItemCategory,
} from "@/lib/api/orderItemCategories";
import type { CreateOrderItemCategoryInput } from "@/types/orderCategories";

const QUERY_KEY = ["orderItemCategories"] as const;

export function useOrderItemCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchOrderItemCategories,
    staleTime: 60 * 1000,
  });
}

export function useCreateOrderItemCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrderItemCategoryInput) =>
      createOrderItemCategory(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateOrderItemCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateOrderItemCategoryInput;
    }) => updateOrderItemCategory(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteOrderItemCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrderItemCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
