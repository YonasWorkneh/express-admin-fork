import { useQuery } from "@tanstack/react-query";
import { getUser, pickUserFromGetUserResponse, type UserRecord } from "@/lib/api/users";

/**
 * Load a user by id (e.g. officer / staff id on a batch) via GET /users?filter=id:{id}
 */
export function useUser(id: string | null | undefined) {
  return useQuery<UserRecord | null, Error>({
    queryKey: ["user", "filter", id],
    queryFn: async () => {
      const body = await getUser(id!);
      return pickUserFromGetUserResponse(body);
    },
    enabled: Boolean(id?.trim()),
    staleTime: 5 * 60 * 1000,
  });
}
