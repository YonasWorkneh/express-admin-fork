import api from "./api";

/** One row as returned in list/filter responses. */
export type UserRecord = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  customId?: string;
};

type UsersFilterApiBody = {
  success?: boolean;
  message?: string;
  data?:
    | UserRecord
    | UserRecord[]
    | { data?: UserRecord[]; users?: UserRecord[] };
};

/**
 * Fetches a single user by id using the list endpoint filter.
 * GET /users?filter=id:{id}
 */
export async function getUser(id: string): Promise<UsersFilterApiBody> {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid user id");
  }
  const response = await api.get<UsersFilterApiBody>(
    `/users?filter=${encodeURIComponent(`id:${clean}`)}`,
  );
  return response.data;
}

/** Normalize various `data` shapes to a single user, if present. */
export function pickUserFromGetUserResponse(
  body: UsersFilterApiBody | null | undefined,
): UserRecord | null {
  if (!body?.data) return null;
  const d = body.data;
  if (Array.isArray(d)) return d[0] ?? null;
  if (typeof d === "object" && d !== null && "id" in d && "name" in d) {
    return d as UserRecord;
  }
  if (
    typeof d === "object" &&
    d !== null &&
    "data" in d &&
    Array.isArray((d as { data?: UserRecord[] }).data)
  ) {
    return (d as { data: UserRecord[] }).data[0] ?? null;
  }
  if (
    typeof d === "object" &&
    d !== null &&
    "users" in d &&
    Array.isArray((d as { users?: UserRecord[] }).users)
  ) {
    return (d as { users: UserRecord[] }).users[0] ?? null;
  }
  return null;
}
