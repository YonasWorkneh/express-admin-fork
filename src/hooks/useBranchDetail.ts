import { useQuery } from "@tanstack/react-query";
import { fetchBranchById } from "@/lib/api/branch";
import type { BranchDetailApi } from "@/types/types";

export function useBranchDetail(id: string | undefined) {
  return useQuery<BranchDetailApi, Error>({
    queryKey: ["branch", "detail", id],
    queryFn: () => fetchBranchById(id!),
    enabled: Boolean(id?.trim()),
    staleTime: 5 * 60 * 1000,
  });
}
