"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Package,
  TrendingUp,
  TrendingDown,
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
import { IoEye, IoCheckmarkCircle } from "react-icons/io5";
import { getOfficerBatches, acceptBatch } from "@/lib/api/batch";
import type { Batch, Pagination } from "@/types/types";
import toast from "react-hot-toast";
import { Skeleton } from "antd";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useAuthState } from "@/hooks/useAuthState";

interface Metric {
  title: string;
  value: number | string;
  change?: string;
  trend?: "up" | "down";
  color: "blue" | "green" | "purple" | "orange";
}

function getServiceTypeLabel(
  serviceType: Batch["serviceType"] | null | undefined,
): string {
  if (serviceType == null) return "N/A";
  if (typeof serviceType === "string" || typeof serviceType === "number") {
    const t = String(serviceType).trim();
    return t || "N/A";
  }
  if (typeof serviceType === "object") {
    const o = serviceType as { name?: string; label?: string; id?: string };
    const text = o.name ?? o.label ?? o.id;
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "N/A";
}

function OfficerBatchesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();
  const { user } = useAuthState();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);

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
      const response = await getOfficerBatches({
        page,
        pageSize: limit,
        search: searchText || undefined,
      });
      setBatches(response.data);
      setPagination(response.pagination);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBatches(currentPage, pageSize);
  }, [searchText, currentPage, pageSize]);

  // Calculate metrics from batches
  useEffect(() => {
    if (batches.length > 0) {
      const totalBatches = batches.length;
      const pendingBatches = batches.filter((b) => b.status === "PENDING").length;
      const acceptedBatches = batches.filter((b) => b.status === "ACCEPTED").length;
      const inTransitBatches = batches.filter((b) => b.status === "IN_TRANSIT").length;

      setMetrics([
        {
          title: "My Batches",
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

  const handleAcceptBatch = async () => {
    if (!selectedBatch) return;

    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      setAccepting(true);
      const response = await acceptBatch({
        batchId: [selectedBatch.id],
        officerId: user.id,
      });
      
      toast.success(response.message || "Batch accepted successfully");
      setIsAcceptModalOpen(false);
      setSelectedBatch(null);
      fetchBatches(currentPage, pageSize);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to accept batch";
      toast.error(message);
    } finally {
      setAccepting(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Batches
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Batches assigned to you
          </p>
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
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : batches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No batches assigned to you
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.batchCode}
                        </TableCell>
                        <TableCell>
                          <Badge className={getScopeColor(batch.scope)}>
                            {batch.scope}
                          </Badge>
                        </TableCell>
                        <TableCell>{getServiceTypeLabel(batch.serviceType)}</TableCell>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/batch/details/${batch.id}`)
                              }
                              className="flex items-center gap-1"
                            >
                              <IoEye className="h-4 w-4" />
                              View
                            </Button>
                            {batch.status === "PENDING" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setIsAcceptModalOpen(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <IoCheckmarkCircle className="h-4 w-4" />
                                Accept
                              </Button>
                            )}
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

      {/* Accept Batch Modal */}
      <ConfirmationModal
        isOpen={isAcceptModalOpen}
        onClose={() => {
          setIsAcceptModalOpen(false);
          setSelectedBatch(null);
        }}
        onConfirm={handleAcceptBatch}
        title="Accept Batch"
        description={`Are you sure you want to accept batch ${selectedBatch?.batchCode}?`}
        confirmText="Accept"
        cancelText="Cancel"
        variant="info"
        isLoading={accepting}
      >
        {selectedBatch && (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-medium">Orders:</span>{" "}
              {selectedBatch.orders?.length || 0}
            </p>
            <p>
              <span className="font-medium">Scope:</span> {selectedBatch.scope}
            </p>
            <p>
              <span className="font-medium">Service Type:</span>{" "}
              {getServiceTypeLabel(selectedBatch.serviceType)}
            </p>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
}

export default OfficerBatchesPage;
