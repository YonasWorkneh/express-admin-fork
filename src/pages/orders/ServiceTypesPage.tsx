"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TablePagination from "@/components/common/TablePagination";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import {
  useServiceTypes,
  useCreateServiceType,
  useUpdateServiceType,
  useDeleteServiceType,
} from "@/hooks/useServiceTypes";
import type { ServiceType } from "@/types/serviceTypes";
import toast from "react-hot-toast";
import { Skeleton } from "antd";

function apiToastError(err: unknown, fallback: string) {
  const msg =
    err &&
    typeof err === "object" &&
    "response" in err &&
    (err as { response?: { data?: { message?: unknown } } }).response?.data
      ?.message;
  toast.error(
    typeof msg === "string" && msg.trim() ? msg : fallback,
  );
}

export default function ServiceTypesPage() {
  const {
    data: rows = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useServiceTypes();
  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();
  const deleteMutation = useDeleteServiceType();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceType | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (row: ServiceType) => {
    setSelected(row);
    setName(row.name);
    setDescription(row.description?.trim() ?? "");
    setEditOpen(true);
  };

  const openDelete = (row: ServiceType) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: trimmedName,
        description: description.trim(),
      });
      toast.success("Service type created.");
      resetForm();
      setCreateOpen(false);
    } catch (err: unknown) {
      apiToastError(err, "Could not create service type.");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: selected.id,
        input: {
          name: trimmedName,
          description: description.trim(),
        },
      });
      toast.success("Service type updated.");
      resetForm();
      setEditOpen(false);
      setSelected(null);
    } catch (err: unknown) {
      apiToastError(err, "Could not update service type.");
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      toast.success("Service type deleted.");
      setDeleteOpen(false);
      setSelected(null);
    } catch (err: unknown) {
      apiToastError(err, "Could not delete service type.");
    }
  };

  return (
    <div className="min-h-screen">
      <main>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Service types
            </h1>
            <p className="mt-1 text-sm text-gray-600 max-w-xl">
              Configure delivery service options (name and description) for use
              across orders and pricing.
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white !cursor-pointer shrink-0"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create service type
          </Button>
        </div>

        <Card className="bg-white">
          <CardHeader className="border-b border-gray-100 py-4">
            <CardTitle className="text-base font-semibold text-gray-800">
              All service types
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} active title paragraph={{ rows: 1 }} />
                ))}
              </div>
            ) : isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-red-600">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load service types."}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => void refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <LayoutGrid className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm font-medium text-slate-700">
                  No service types yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create a service type with a name and description.
                </p>
                <Button
                  className="mt-6 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={openCreate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create service type
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-600 font-medium min-w-[160px]">
                          Name
                        </TableHead>
                        <TableHead className="text-gray-600 font-medium">
                          Description
                        </TableHead>
                        <TableHead className="text-gray-600 font-medium hidden md:table-cell whitespace-nowrap">
                          Created
                        </TableHead>
                        <TableHead className="text-gray-600 font-medium w-[140px] text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((row, index) => (
                        <TableRow
                          key={row.id || `${row.name}-${index}`}
                          className="border-gray-100"
                        >
                          <TableCell className="font-medium text-gray-900">
                            {row.name}
                          </TableCell>
                          <TableCell className="max-w-md text-gray-600">
                            {row.description?.trim() ? (
                              <span className="line-clamp-2">
                                {row.description}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-gray-500 whitespace-nowrap">
                            {row.createdAt
                              ? new Date(row.createdAt).toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                aria-label="Edit service type"
                                onClick={() => openEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                aria-label="Delete service type"
                                onClick={() => openDelete(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {totalItems > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <TablePagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Create service type</DialogTitle>
              <DialogDescription>
                Add a name and description to instantly create a new service type. 
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="st-create-name">Name *</Label>
                <Input
                  id="st-create-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Express Delivery"
                  autoComplete="off"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="st-create-desc">Description *</Label>
                <Textarea
                  id="st-create-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Delivery within 24 hours"
                  rows={3}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setCreateOpen(false);
                }}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            resetForm();
            setSelected(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Edit service type</DialogTitle>
              <DialogDescription>
                Update the name and description for this service type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="st-edit-name">Name *</Label>
                <Input
                  id="st-edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Express Delivery"
                  autoComplete="off"
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="st-edit-desc">Description *</Label>
                <Textarea
                  id="st-edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Delivery within 24 hours"
                  rows={3}
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setEditOpen(false);
                  setSelected(null);
                }}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={deleteOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteOpen(false);
            setSelected(null);
          }
        }}
        onConfirm={handleDelete}
        title="Delete service type"
        description={
          selected
            ? `Are you sure you want to delete “${selected.name}”? This cannot be undone.`
            : "Are you sure you want to delete this service type?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      >
        <span className="sr-only">Confirm delete</span>
      </ConfirmationModal>
    </div>
  );
}
