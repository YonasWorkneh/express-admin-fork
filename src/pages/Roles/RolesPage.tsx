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
import { MdEdit, MdDelete, MdPersonAdd, MdLock } from "react-icons/md";
import api from "@/lib/api/api";
import AssignPermissionsModal from "./AssignPermissionsModal";
import AssignUserRoleModal from "./AssignUserRoleModal";
import type {
  Pagination,
  Role,
  RoleListResponse,
} from "@/types/types";
import toast from "react-hot-toast";
import { exportToExcel } from "@/utils/exportToExcel";
import ConfirmDialog from "@/components/common/DeleteModal";
import { Spinner } from "@/utils/spinner";

function RolesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  const [roles, setRoles] = useState<Role[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignPermissionsModalOpen, setIsAssignPermissionsModalOpen] = useState(false);
  const [isAssignUserRoleModalOpen, setIsAssignUserRoleModalOpen] = useState(false);
  const [roleForAction, setRoleForAction] = useState<Role | null>(null);

  const fetchRoles = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const searchQuery = searchText ? `search=${encodeURIComponent(searchText)}&` : "";
      const response = await api.get<RoleListResponse>(
        `/access-control/roles?${searchQuery}page=${page}&pageSize=${limit}`
      );
      setRoles(response.data.data);
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
    fetchRoles(currentPage, pageSize);
  }, [currentPage, pageSize, searchText]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      setDeleteLoading(true);
      await api.delete(`/access-control/roles/${selectedRole.id}`);
      toast.success("Role deleted successfully");
      setIsDialogOpen(false);
      setSelectedRole(null);
      fetchRoles(currentPage, pageSize);
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
      const response = await api.get<RoleListResponse>(
        `/access-control/roles?page=1&pageSize=1000`
      );
      const data = response.data.data.map((role) => ({
        "Role ID": role.id,
        Name: role.name,
        Description: role.description || "",
        "Created At": role.createdAt
          ? new Date(role.createdAt).toLocaleDateString()
          : "",
        "Updated At": role.updatedAt
          ? new Date(role.updatedAt).toLocaleDateString()
          : "",
      }));
      exportToExcel("roles", data);
      toast.success("Roles exported successfully");
    } catch (error: any) {
      toast.error("Failed to export roles");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage roles and their permissions
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
            onClick={() => navigate("/roles/create")}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
          >
            <IoAdd className="h-5 w-5 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-4 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search roles..."
          className="pl-10 pr-3 w-full py-6"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Roles Table */}
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
                    Role ID
                    <ArrowUpDown className="h-3 w-3 ml-1" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  <div className="flex items-center">
                    Name
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
                  Updated At
                </TableHead>
                <TableHead className="text-gray-600 font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex justify-center items-center py-8">
                      <Spinner className="h-6 w-6 text-[#EE1E21] mr-2" />
                      <span className="text-gray-600 font-medium">
                        Loading roles...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <div className="flex justify-center items-center py-8">
                      <span className="text-gray-600 font-medium">
                        No roles found
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow
                    key={role.id}
                    className="border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/roles/details/${role.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium text-[#EE1E21]">
                      {role.id}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {role.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {role.description || "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {role.createdAt
                        ? new Date(role.createdAt).toLocaleDateString()
                        : ""}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {role.updatedAt
                        ? new Date(role.updatedAt).toLocaleDateString()
                        : ""}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-[#EE1E21] bg-[#EE1E21]/5 hover:bg-[#EE1E21]/10 hover:text-[#cc1a1c] cursor-pointer"
                          onClick={() => navigate(`/roles/edit/${role.id}`)}
                          title="Edit Role"
                        >
                          <MdEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleForAction(role);
                            setIsAssignPermissionsModalOpen(true);
                          }}
                          title="Assign Permissions"
                        >
                          <MdLock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleForAction(role);
                            setIsAssignUserRoleModalOpen(true);
                          }}
                          title="Assign to User"
                        >
                          <MdPersonAdd className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRole(role);
                            setIsDialogOpen(true);
                          }}
                          className="p-2 text-red-400 bg-red-50 cursor-pointer opacity-60 hover:bg-red-100 hover:text-red-700"
                          title="Delete Role"
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
        title="Delete Role"
        description={`Are you sure you want to delete the role "${selectedRole?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <AssignPermissionsModal
        isOpen={isAssignPermissionsModalOpen}
        onClose={() => {
          setIsAssignPermissionsModalOpen(false);
          setRoleForAction(null);
        }}
        roleId={roleForAction?.id || ""}
        roleName={roleForAction?.name || ""}
        onSuccess={() => {
          fetchRoles(currentPage, pageSize);
        }}
      />

      <AssignUserRoleModal
        isOpen={isAssignUserRoleModalOpen}
        onClose={() => {
          setIsAssignUserRoleModalOpen(false);
          setRoleForAction(null);
        }}
        roleId={roleForAction?.id || ""}
        roleName={roleForAction?.name || ""}
        onSuccess={() => {
          fetchRoles(currentPage, pageSize);
        }}
      />
    </div>
  );
}

export default RolesPage;
