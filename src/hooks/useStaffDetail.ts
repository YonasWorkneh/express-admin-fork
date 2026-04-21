import { useQuery } from "@tanstack/react-query";
import { fetchStaffById } from "@/lib/api/staff";
import type { StaffDetailApi } from "@/types/types";

export function useStaffDetail(id: string | undefined) {
  return useQuery<StaffDetailApi, Error>({
    queryKey: ["staff", "detail", id],
    queryFn: () => fetchStaffById(id!),
    enabled: Boolean(id?.trim()),
    staleTime: 5 * 60 * 1000,
  });
}
