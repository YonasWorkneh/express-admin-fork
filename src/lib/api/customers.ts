import api from "./api";
import type { Customer, CustomerListResponse } from "@/types/types";

/**
 * GET /users/customers?filter=id:{id}
 * Returns the first matching customer, or null.
 */
export async function getCustomerById(id: string): Promise<Customer | null> {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) return null;

  const response = await api.get<CustomerListResponse>(
    `/users/customers?search=all:&page=1&pageSize=1&filter=${encodeURIComponent(`id:${clean}`)}`,
  );
  const rows = response.data?.data;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0] ?? null;
}

export function customerDisplayName(customer: Customer | null | undefined): string {
  if (!customer) return "";
  const company = customer.companyName?.trim();
  if (company) return company;
  return customer.name?.trim() || "";
}
