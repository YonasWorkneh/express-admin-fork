import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  customerDisplayName,
  getCustomerById,
} from "@/lib/api/customers";

/**
 * Resolve customer display names for a set of customer ids
 * via GET /users/customers?filter=id:{id}.
 */
export function useCustomerNamesByIds(ids: Array<string | null | undefined>) {
  const uniqueIds = useMemo(() => {
    const set = new Set<string>();
    for (const id of ids) {
      const clean = id?.replace(/^#/, "").trim();
      if (clean) set.add(clean);
    }
    return [...set];
  }, [ids]);

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["customer", "filter", "id", id] as const,
      queryFn: () => getCustomerById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const dataSignature = queries
    .map((q) => `${q.status}:${q.dataUpdatedAt}`)
    .join("|");

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    uniqueIds.forEach((id, index) => {
      const name = customerDisplayName(queries[index]?.data);
      if (name) map[id] = name;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by dataSignature
  }, [uniqueIds, dataSignature]);

  const loading = queries.some((q) => q.isLoading);

  return { nameById, loading };
}
