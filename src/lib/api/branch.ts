import api from "./api";
import type {
  BranchDetailApi,
  BranchDetailResponse,
  BranchListResponse,
} from "@/types/types";

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
export const fetchBranchById = async (id: string): Promise<BranchDetailApi> => {
  const clean = id.replace(/^#/, "").trim();
  if (!clean) {
    throw new Error("Invalid branch id");
  }
  const response = await api.get<BranchDetailResponse>(
    `/branch/${encodeURIComponent(clean)}`,
  );
  const branch = response.data.data;
  if (!branch) {
    throw new Error("Branch not found");
  }
  return branch;
};
