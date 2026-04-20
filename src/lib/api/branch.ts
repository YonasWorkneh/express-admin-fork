import api from "./api";
import type { Branch, BranchListResponse } from "@/types/types";

export interface ListBranchesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filter?: string | Record<string, any>;
  sort?: string;
}

/**
 * Fetch list of branches
 */
export const fetchBranches = async (
  params: ListBranchesParams = {}
): Promise<BranchListResponse> => {
  const response = await api.get<BranchListResponse>("/branch", { params });
  return response.data;
};

/**
 * Fetch a single branch by ID
 */
export const fetchBranchById = async (id: string): Promise<Branch> => {
  const response = await api.get<{ success: boolean; data: Branch }>(
    `/branch/${id}`
  );
  return response.data.data;
};
