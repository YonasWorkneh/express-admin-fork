"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
  FileText,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import { IoAdd, IoEye, IoPersonAdd } from "react-icons/io5";
import { getBatches, assignOfficerToBatch } from "@/lib/api/batch";
import type { Batch, Pagination } from "@/types/types";
import toast from "react-hot-toast";
import { Skeleton } from "antd";
import { exportToExcel } from "@/utils/exportToExcel";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/lib/api/api";
import { Spinner } from "@/utils/spinner";

interface Metric {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down";
  color: "blue" | "green" | "purple" | "orange";
}

interface BranchOfficer {
  id: string;
  name?: string;
  email?: string;
  user?: {
    name?: string;
    email?: string;
  };
}

const getServiceTypeLabel = (serviceType: unknown): string => {
  if (typeof serviceType === "string" || typeof serviceType === "number") {
    const text = String(serviceType).trim();
    return text || "N/A";
  }
  if (serviceType && typeof serviceType === "object") {
    const obj = serviceType as Record<string, unknown>;
    const candidate = obj.name ?? obj.label ?? obj.title ?? obj.value ?? obj.id;
    if (typeof candidate === "string" || typeof candidate === "number") {
      const text = String(candidate).trim();
      return text || "N/A";
    }
  }
  return "N/A";
};

function BatchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [cargoOfficers, setCargoOfficers] = useState<BranchOfficer[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<BranchOfficer | null>(
    null,
  );
  const [officerSearch, setOfficerSearch] = useState("");
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [officersError, setOfficersError] = useState(false);
  const [isAssignCargoOfficerModal, setisAssignCargoOfficerModal] =
    useState(false);
  const [selectedBatchForOfficer, setSelectedBatchForOfficer] =
    useState<Batch | null>(null);
  const [isAssignCargoOfficerLoading, setIsAssignCargoOfficerLoading] =
    useState(false);
  const [selectedCargoOfficer, setSelectedCargoOfficer] =
    useState<BranchOfficer | null>(null);
  const [loadingCargoOfficer, setLoadingCargoOfficer] = useState(false);
  const [cargoOfficerError, setCargoOfficerError] = useState(false);
  const [cargoOfficerNoBranch, setCargoOfficerNoBranch] = useState(false);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveReason, setApproveReason] = useState("");

  // 1. Helper: Download manifest by ID
  const downloadManifest = async (
    manifestId: string | null | undefined,
    type: "sending" | "receiving",
  ) => {
    if (!manifestId) {
      toast.error(
        `No ${type === "sending" ? "sending" : "receiving"} manifestId`,
      );
      return;
    }
    try {
      const response = await api.get(
        `/order/manifest/download/pdf/${manifestId}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}-manifest-${manifestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Manifest downloaded.");
    } catch (err) {
      toast.error("Failed to download manifest.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  const fetchBatches = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await getBatches({
        page,
        pageSize: limit,
        search: searchText || undefined,
      });

      //console.log("Batches API Response:", response);

      // Backend shape can vary; normalize both nested and flat forms.
      const normalized = response as unknown as {
        data?: { batches?: Batch[]; pagination?: Pagination | null };
        batches?: Batch[];
        pagination?: Pagination | null;
      };
      const batchesData: Batch[] =
        normalized.data?.batches ?? normalized.batches ?? [];
      const paginationData: Pagination | null =
        normalized.data?.pagination ?? normalized.pagination ?? null;

      setBatches(batchesData);
      setPagination(paginationData);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      setBatches([]);
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error("Error fetching batches:", error);
    }
  };

  useEffect(() => {
    fetchBatches(currentPage, pageSize);
    // eslint-disable-next-line
  }, [searchText, currentPage, pageSize]);

  // Calculate metrics from batches
  useEffect(() => {
    if (Array.isArray(batches) && batches.length > 0) {
      const totalBatches = batches.length;
      const pendingBatches = batches.filter(
        (b) => b.status === "PENDING",
      ).length;
      const acceptedBatches = batches.filter(
        (b) => b.status === "ACCEPTED",
      ).length;
      const inTransitBatches = batches.filter(
        (b) => b.status === "IN_TRANSIT",
      ).length;

      setMetrics([
        {
          title: "Total Batches",
          value: totalBatches,
          change: `${pagination?.total || 0} total`,
          trend: "up",
          color: "blue",
        },
        {
          title: "Pending",
          value: pendingBatches,
          change: `${Math.round((pendingBatches / totalBatches) * 100)}% of total`,
          trend: pendingBatches > 0 ? "up" : "down",
          color: "orange",
        },
        {
          title: "Accepted",
          value: acceptedBatches,
          change: `${Math.round((acceptedBatches / totalBatches) * 100)}% of total`,
          trend: "up",
          color: "green",
        },
        {
          title: "In Transit",
          value: inTransitBatches,
          change: `${Math.round((inTransitBatches / totalBatches) * 100)}% of total`,
          trend: "up",
          color: "purple",
        },
      ]);
    }
  }, [batches, pagination]);

  const handleExport = () => {
    if (!Array.isArray(batches)) {
      toast.error("No batches to export");
      return;
    }
    exportToExcel("batches", batches, (b) => ({
      "Batch Code": b.batchCode ?? "",
      Scope: b.scope ?? "",
      "Service Type": getServiceTypeLabel(b.serviceType),
      Status: b.status ?? "",
      "Order Count": b.orders?.length ?? 0,
      Weight: b.weight ?? "N/A",
      "Created At": b.createdAt
        ? new Date(b.createdAt).toLocaleDateString()
        : "",
    }));
  };

  // Task 2: Only allow selection if status==="PENDING"
  const isBatchSelectable = (batch: Batch) => batch.status === "PENDING";

  // When toggling, only allow toggle if selectable
  const handleBatchToggle = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (!batch || !isBatchSelectable(batch)) return;

    setSelectedBatches((prev) =>
      prev.includes(batchId)
        ? prev.filter((id) => id !== batchId)
        : [...prev, batchId],
    );
  };

  // Handle select all only those that are selectable (i.e. status===PENDING)
  const handleSelectAll = () => {
    if (Array.isArray(batches)) {
      setSelectedBatches(
        batches.filter((b) => isBatchSelectable(b)).map((b) => b.id),
      );
    }
  };

  const handleDeselectAll = () => {
    setSelectedBatches([]);
  };

  const fetchCargoOfficers = async () => {
    try {
      setLoadingOfficers(true);
      setOfficersError(false);
      const response = await api.get<{
        data?: { cargoOfficers?: BranchOfficer[] };
      }>(`/users/cargo-officer?search=all:${officerSearch}&page=1&pageSize=20`);
      setCargoOfficers(response.data.data?.cargoOfficers || []);
      setLoadingOfficers(false);
    } catch (error: any) {
      setLoadingOfficers(false);
      setOfficersError(true);
      console.error(error);
      toast.error("Failed to load cargo officers");
    }
  };

  const getBranchIdForOfficerLookup = () =>
    (
      selectedBatchForOfficer as Batch & {
        originBranchId?: string | null;
        destinationBranchId?: string | null;
        originId?: string | null;
        destinationId?: string | null;
      }
    )?.originBranchId ||
    (
      selectedBatchForOfficer as Batch & {
        originBranchId?: string | null;
        destinationBranchId?: string | null;
        originId?: string | null;
        destinationId?: string | null;
      }
    )?.destinationBranchId ||
    (
      selectedBatchForOfficer as Batch & {
        originBranchId?: string | null;
        destinationBranchId?: string | null;
        originId?: string | null;
        destinationId?: string | null;
      }
    )?.originId ||
    (
      selectedBatchForOfficer as Batch & {
        originBranchId?: string | null;
        destinationBranchId?: string | null;
        originId?: string | null;
        destinationId?: string | null;
      }
    )?.destinationId ||
    "";

  const featchCargoOfficer = async (page = 1, limit = 10) => {
    const branchId = getBranchIdForOfficerLookup();
    setCargoOfficerError(false);
    if (!branchId) {
      setCargoOfficers([]);
      setCargoOfficerNoBranch(true);
      return;
    }
    setCargoOfficerNoBranch(false);
    try {
      setLoadingCargoOfficer(true);
      const response = await api.get<{
        success?: boolean;
        message?: string;
        data?:
          | BranchOfficer[]
          | {
              staff?: BranchOfficer[];
              cargoOfficers?: BranchOfficer[];
              officers?: BranchOfficer[];
              rows?: BranchOfficer[];
            };
        pagination?: Pagination;
      }>(
        `/staff/branch/${encodeURIComponent(
          branchId,
        )}/officers?page=${page}&pageSize=${limit}`,
      );
      const payload = response.data?.data;
      const payloadObject =
        payload && !Array.isArray(payload) ? payload : undefined;
      const list =
        (Array.isArray(payload) ? payload : undefined) ??
        payloadObject?.staff ??
        payloadObject?.cargoOfficers ??
        payloadObject?.officers ??
        payloadObject?.rows ??
        [];
      setCargoOfficers(list);
      setLoadingCargoOfficer(false);
    } catch (error: any) {
      setLoadingCargoOfficer(false);
      setCargoOfficerError(true);
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAssignModalOpen) {
      fetchCargoOfficers();
    }
    // eslint-disable-next-line
  }, [isAssignModalOpen, officerSearch]);

  useEffect(() => {
    if (isAssignCargoOfficerModal) {
      featchCargoOfficer();
    }
    // eslint-disable-next-line
  }, [isAssignCargoOfficerModal, selectedBatchForOfficer]);

  const handleAssignOfficer = async () => {
    if (selectedBatches.length === 0) {
      toast.error("Please select at least one batch");
      return;
    }

    if (!selectedOfficer) {
      toast.error("Please select an officer");
      return;
    }

    try {
      setAssigning(true);
      const response = await assignOfficerToBatch({
        batchId: selectedBatches,
        officerId: selectedOfficer.id,
      });
      toast.success(response.message || "Officer assigned successfully");
      setIsAssignModalOpen(false);
      setSelectedBatches([]);
      setSelectedOfficer(null);
      setOfficerSearch("");
      fetchBatches(currentPage, pageSize);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to assign officer";
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignCargoOfficer = async () => {
    if (!selectedBatchForOfficer) {
      toast.error("No batch selected");
      return;
    }

    if (!selectedCargoOfficer) {
      toast.error("Please select a cargo officer");
      return;
    }

    try {
      setIsAssignCargoOfficerLoading(true);
      const response = await api.post("/dispatch/batch/assign-officer", {
        batchId: [selectedBatchForOfficer.id],
        officerId: selectedCargoOfficer.id,
      });
      toast.success(
        response.data.message || "Cargo officer assigned successfully",
      );
      setisAssignCargoOfficerModal(false);
      setSelectedBatchForOfficer(null);
      setSelectedCargoOfficer(null);
      fetchBatches(currentPage, pageSize);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to assign cargo officer";
      toast.error(message);
    } finally {
      setIsAssignCargoOfficerLoading(false);
    }
  };

  // 2: Approve batches endpoint
  const handleApproveBatches = async () => {
    if (!selectedBatches.length) {
      toast.error("No batch selected");
      return;
    }
    if (!approveReason.trim()) {
      toast.error("Please enter a reason for approval.");
      return;
    }
    setApproveLoading(true);
    try {
      const response = await api.post("/order/approve/batches", {
        batchIds: selectedBatches,
        reason: approveReason,
      });
      toast.success(response.data?.message || "Batch(es) approved!");
      setIsApproveModalOpen(false);
      setSelectedBatches([]);
      setApproveReason("");
      fetchBatches(currentPage, pageSize);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Error approving selected batches",
      );
    } finally {
      setApproveLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-700";
      case "DISPATCHED":
        return "bg-purple-100 text-purple-700";
      case "IN_TRANSIT":
        return "bg-indigo-100 text-indigo-700";
      case "DELIVERED":
        return "bg-green-100 text-green-700";
      case "COMPLETED":
        return "bg-teal-100 text-teal-700";
      case "CLOSED":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case "IN_TOWN":
        return "bg-blue-100 text-blue-700";
      case "REGIONAL":
        return "bg-green-100 text-green-700";
      case "INTERNATIONAL":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and track batch dispatches
          </p>
        </div>
        <div className="flex gap-3">
          {/* Approve button (if at least 1 batch is selected) */}
          {selectedBatches.length > 0 && (
            <>
              {/* <Button
                variant="outline"
                onClick={() => setIsAssignModalOpen(true)}
                className="text-gray-600 bg-white border-gray-300 flex items-center gap-2"
              >
                <IoPersonAdd className="h-4 w-4" />
                Assign Officer ({selectedBatches.length})
              </Button> */}
              {/* Approve action */}
              <Button
                variant="default"
                onClick={() => setIsApproveModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                Approve
              </Button>
            </>
          )}
          <Button
            onClick={() => navigate("/batch/create")}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] flex items-center gap-2"
          >
            <IoAdd className="h-5 w-5" />
            Create Batch
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.change && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    {metric.change}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search batches by code, status..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 pr-3 w-full py-6"
              />
            </div>
            <div className="flex gap-3">
              {batches.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-gray-600 bg-white border-gray-300"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="text-gray-600 bg-white border-gray-300"
                  >
                    Deselect All
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={handleExport}
                className="text-gray-600 bg-white border-gray-300 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : !Array.isArray(batches) || batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No batches found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            Array.isArray(batches) &&
                            batches.filter((b) => isBatchSelectable(b)).length >
                              0 &&
                            selectedBatches.length ===
                              batches.filter((b) => isBatchSelectable(b)).length
                          }
                          // Checkbox component does not accept 'indeterminate' directly.
                          // If you want to show indeterminate state visually, you need a ref and set the 'indeterminate' property on the HTMLInputElement.
                          // For now, we omit the indeterminate prop and only use checked/onCheckedChange.
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Batch Code</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(batches) &&
                      batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedBatches.includes(batch.id)}
                              onCheckedChange={() =>
                                handleBatchToggle(batch.id)
                              }
                              disabled={!isBatchSelectable(batch)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {batch.batchCode}
                          </TableCell>
                          <TableCell>
                            <Badge className={getScopeColor(batch.scope)}>
                              {batch.scope}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getServiceTypeLabel(batch.serviceType)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(batch.status)}>
                              {batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{batch.orders?.length || 0}</TableCell>
                          <TableCell>
                            {batch.weight ? `${batch.weight} kg` : "N/A"}
                          </TableCell>
                          <TableCell>
                            {batch.createdAt
                              ? new Date(batch.createdAt).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-row flex-wrap items-center justify-end gap-1 sm:gap-2">
                              {/* Two manifest download buttons */}
                              {batch.sendingManifestId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Download Sending Manifest"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadManifest(
                                      batch.sendingManifestId,
                                      "sending",
                                    );
                                  }}
                                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                >
                                  <FileText className="h-4 w-4" />
                                  Manifest Out
                                </Button>
                              )}
                              {batch.receivingManifestId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Download Receiving Manifest"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadManifest(
                                      batch.receivingManifestId,
                                      "receiving",
                                    );
                                  }}
                                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                >
                                  <FileDown className="h-4 w-4" />
                                  Manifest In
                                </Button>
                              )}
                              {/* Assign Officer (only if officerId is not set) */}
                              {batch.status == "APPROVED" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBatchForOfficer(batch);
                                    setisAssignCargoOfficerModal(true);
                                  }}
                                  className="flex items-center gap-1 text-[#EE1E21] hover:text-[#cc1a1c] hover:bg-[#EE1E21]/5"
                                >
                                  <IoPersonAdd className="h-4 w-4" />
                                  Assign Officer
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/batch/details/${batch.id}`, {
                                    state: { batch },
                                  });
                                }}
                                className="flex items-center gap-1"
                              >
                                <IoEye className="h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && (
                <TablePagination
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  pageSize={pageSize}
                  totalItems={pagination.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setApproveReason("");
        }}
        onConfirm={handleApproveBatches}
        title="Approve Selected Batches"
        description={`You are about to approve ${selectedBatches.length} batch(es).`}
        confirmText="Approve"
        cancelText="Cancel"
        variant="info"
        isLoading={approveLoading}
      >
        <div className="space-y-3 py-3">
          <label className="block text-sm font-medium">
            Approval Reason
            <Input
              value={approveReason}
              onChange={(e) => setApproveReason(e.target.value)}
              placeholder="Enter a reason for approving..."
              className="mt-1"
            />
          </label>
        </div>
      </ConfirmationModal>

      {/* Assign Officer Modal */}
      <ConfirmationModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedOfficer(null);
          setOfficerSearch("");
        }}
        onConfirm={handleAssignOfficer}
        title="Assign Officer to Batches"
        description={`Assign an officer to ${selectedBatches.length} selected batch(es)`}
        confirmText="Assign"
        cancelText="Cancel"
        variant="info"
        isLoading={assigning}
      >
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Search Officer
            </label>
            <Input
              value={officerSearch}
              onChange={(e) => setOfficerSearch(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>

          {loadingOfficers ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : officersError ? (
            <p className="text-center text-red-500 py-4">
              Could not load cargo officers.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {cargoOfficers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No officers found
                </p>
              ) : (
                cargoOfficers.map((officer) => (
                  <div
                    key={officer.id}
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedOfficer?.id === officer.id
                        ? "border-[#EE1E21] bg-[#EE1E21]/5"
                        : ""
                    }`}
                    onClick={() => setSelectedOfficer(officer)}
                  >
                    <p className="font-medium">
                      {officer.user?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {officer.user?.email || ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedOfficer && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium">Selected Officer:</p>
              <p className="text-sm text-gray-600">
                {selectedOfficer.user?.name} ({selectedOfficer.user?.email})
              </p>
            </div>
          )}
        </div>
      </ConfirmationModal>

      {/* Assign Cargo Officer Modal */}
      <ConfirmationModal
        isOpen={isAssignCargoOfficerModal}
        onClose={() => {
          setisAssignCargoOfficerModal(false);
          setSelectedBatchForOfficer(null);
          setSelectedCargoOfficer(null);
        }}
        title="Assign Cargo Officer"
        description={`${selectedBatchForOfficer?.batchCode || ""}`}
        onConfirm={handleAssignCargoOfficer}
        variant="info"
        confirmText="Assign"
        cancelText="Cancel"
        isLoading={isAssignCargoOfficerLoading}
      >
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Cargo Officer
            </label>
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              {loadingCargoOfficer ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                  <span className="text-gray-600">Loading...</span>
                </div>
              ) : cargoOfficerNoBranch ? (
                <div className="px-4 py-3 text-gray-500 text-center">
                  Select a batch with a branch assigned to look up cargo
                  officers.
                </div>
              ) : cargoOfficerError ? (
                <div className="px-4 py-3 text-red-500 text-center">
                  Could not load cargo officers.
                </div>
              ) : cargoOfficers.length > 0 ? (
                cargoOfficers.map((officer) => (
                  <label
                    key={officer.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      selectedCargoOfficer?.id === officer.id
                        ? "bg-[#EE1E21]/5"
                        : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedCargoOfficer?.id === officer.id}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCargoOfficer(officer);
                        } else if (selectedCargoOfficer?.id === officer.id) {
                          setSelectedCargoOfficer(null);
                        }
                      }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {officer.user?.name || officer.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {officer.user?.email || officer.email || ""}
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No cargo officers found for this branch
                </div>
              )}
            </div>
          </div>

          {selectedCargoOfficer && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium">Selected Cargo Officer:</p>
              <p className="text-sm text-gray-600">
                {selectedCargoOfficer?.user?.name || selectedCargoOfficer?.name}{" "}
                (
                {selectedCargoOfficer?.user?.email ||
                  selectedCargoOfficer?.email}
                )
              </p>
            </div>
          )}
        </div>
      </ConfirmationModal>
    </div>
  );
}

export default BatchPage;
