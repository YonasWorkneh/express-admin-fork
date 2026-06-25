"use client";

import { useEffect, useState } from "react";
import { Search, Download, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import TablePagination from "@/components/common/TablePagination";
import { IoAdd } from "react-icons/io5";
import { MdEdit, MdDelete } from "react-icons/md";
import api from "@/lib/api/api";
import type {
  Pagination,
  AccessControlPermission,
  AccessControlPermissionListResponse,
} from "@/types/types";
import toast from "react-hot-toast";
import { exportToExcel } from "@/utils/exportToExcel";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Spinner } from "@/utils/spinner";

function PermissionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState<AccessControlPermission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [selectedPermission, setSelectedPermission] =
    useState<AccessControlPermission | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPermissions = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const searchQuery = searchText ? `search=${encodeURIComponent(searchText)}&` : "";
      const response = await api.get<AccessControlPermissionListResponse>(
        `/access-control/permissions?${searchQuery}page=${page}&pageSize=${limit}`
      );
      setPermissions(response.data.data);
      setPagination(response.data.pagination);
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
    fetchPermissions(currentPage, pageSize);
  }, [currentPage, pageSize, searchText]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/access-control/permissions/${selectedPermission.id}`);
      toast.success("Permission deleted successfully");
      setIsDialogOpen(false);
      setSelectedPermission(null);
      fetchPermissions(currentPage, pageSize);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get<AccessControlPermissionListResponse>(
        `/access-control/permissions?page=1&pageSize=1000`
      );
      const data = response.data.data.map((permission) => ({
        "Permission ID": permission.id,
        Resource: permission.resource,
        Description: permission.description || "",
        "Created At": new Date(permission.createdAt).toLocaleDateString(),
      }));
      exportToExcel("permissions", data);
      toast.success("Permissions exported successfully");
    } catch (error: any) {
      toast.error("Failed to export permissions");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Permission Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage system permissions and resources
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="text-gray-600 bg-white border-gray-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => navigate("/permissions/create")}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
          >
            <IoAdd className="h-5 w-5 mr-2" />
            Create Permission
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search permissions..."
          className="pl-10 pr-3 w-full py-6"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Permissions Table */}
      <Card className="bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Permission ID
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Resource
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Description
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Created At
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex justify-center items-center py-8">
                      <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      <span className="text-gray-600 font-medium">
                        Loading permissions...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : permissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex justify-center items-center py-8">
                      <span className="text-gray-600 font-medium">
                        No permissions found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((permission) => (
                  <TableRow
                    key={permission.id}
                    className="border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-[#EE1E21]">
                      {permission.id}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {permission.resource}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {permission.description || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                          onClick={() =>
                            navigate(`/permissions/edit/${permission.id}`)
                          }
                        >
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPermission(permission);
                            setIsDialogOpen(true);
                          }}
                          className="p-2 text-red-400 bg-red-50 cursor-pointer opacity-60 hover:bg-red-100 hover:text-red-700"
                        >
                          <MdDelete className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          currentPage={currentPage}
          totalPages={pagination?.totalPages || 1}
          pageSize={pagination?.pageSize || 10}
          totalItems={pagination?.total || 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </Card>

      <ConfirmDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        title="Delete Permission"
        description={`Are you sure you want to delete the permission "${selectedPermission?.resource}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}

export default PermissionsPage;
