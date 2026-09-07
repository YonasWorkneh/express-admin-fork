import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCoupons } from "@/lib/api/payment";

export const COUPONS_QUERY_KEY = ["paymentCoupons"] as const;

export function useCoupons() {
  return useQuery({
    queryKey: COUPONS_QUERY_KEY,
    queryFn: fetchCoupons,
    staleTime: 30 * 1000,
  });
}

export function useInvalidateCoupons() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: COUPONS_QUERY_KEY });
  };
}
