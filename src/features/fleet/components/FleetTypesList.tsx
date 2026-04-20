"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  deleteVehicleType,
  type FleetVehicleTypeListItem,
} from "@/lib/api/fleet";
import { VehicleTypeThumbnail } from "@/lib/vehicleTypeVisual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/utils/spinner";
import { useFleetVehicleTypesQuery } from "@/hooks/useDriverCommissionConfig";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/DeleteModal";

const DESCRIPTION_PREVIEW_LENGTH = 20;

function VehicleTypeDescriptionCell({
  text,
}: {
  text: string | null | undefined;
}) {
  const [expanded, setExpanded] = useState(false);
  const trimmed = text?.trim() ?? "";

  if (!trimmed) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  if (trimmed.length <= DESCRIPTION_PREVIEW_LENGTH) {
    return <span className="text-sm text-gray-600">{trimmed}</span>;
  }

  const preview = `${trimmed.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;

  if (expanded) {
    return (
      <span className="text-sm text-gray-600 max-w-md inline-block align-top text-left">
        {trimmed}{" "}
        <button
          type="button"
          className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium whitespace-nowrap align-baseline cursor-pointer"
          onClick={() => setExpanded(false)}
        >
          less
        </button>
      </span>
    );
  }

  return (
    <span className="text-sm text-gray-600 max-w-md inline-block">
      {preview}{" "}
      <button
        type="button"
        className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium whitespace-nowrap align-baseline cursor-pointer"
        onClick={() => setExpanded(true)}
      >
        more
      </button>
    </span>
  );
}

export default function FleetTypesList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typePendingDelete, setTypePendingDelete] =
    useState<FleetVehicleTypeListItem | null>(null);

  const {
    data: types = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useFleetVehicleTypesQuery();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicleType(id),
    onSuccess: async () => {
      toast.success("Vehicle type deleted.");
      await queryClient.invalidateQueries({ queryKey: ["fleetVehicleTypes"] });
      await queryClient.invalidateQueries({
        queryKey: ["fleetPublicVehicleTypes"],
      });
      setDeleteDialogOpen(false);
      setTypePendingDelete(null);
    },
    onError: () => {
      toast.error(
        "Unable to delete this vehicle type. It may still be in use.",
      );
    },
  });

  const openDeleteDialog = (vt: FleetVehicleTypeListItem) => {
    setTypePendingDelete(vt);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!typePendingDelete?.id) return;
    deleteMutation.mutate(typePendingDelete.id);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) setTypePendingDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16 text-gray-600">
        <Spinner className="h-8 w-8 text-blue-600 mr-2" />
        Loading fleet types…
      </div>
    );
  }

  if (isError) {
    const msg =
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as Error).message === "string"
        ? (error as Error).message
        : "Request failed";
    return (
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="py-8 text-center text-red-700">
          <p className="mb-2">Could not load fleet types ({msg}).</p>
          <p className="text-sm text-red-600/90 mb-3">
            Authenticated list{" "}
            <span className="font-mono">GET /fleet/type</span>
          </p>
          <button
            type="button"
            className="underline font-medium cursor-pointer"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (types.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          No fleet types returned.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Vehicle types available for use in the system.
      </p>
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[90px]">Preview</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[140px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((vt: FleetVehicleTypeListItem) => (
              <TableRow key={vt.id}>
                <TableCell>
                  <VehicleTypeThumbnail vt={vt} />
                </TableCell>
                <TableCell className="font-medium text-gray-900">
                  {vt.name}
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-md">
                  <VehicleTypeDescriptionCell text={vt.description} />
                </TableCell>
                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                  {vt.createdAt
                    ? new Date(vt.createdAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                  {vt.updatedAt
                    ? new Date(vt.updatedAt).toLocaleString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100"
                      aria-label={`Edit ${vt.name}`}
                      onClick={() =>
                        navigate(
                          `/fleet/type/edit/${encodeURIComponent(vt.id)}?tab=types`,
                        )
                      }
                    >
                      <Pencil className="h-4 w-4 text-blue-600" aria-hidden />
            
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100"
                      aria-label={`Delete ${vt.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => openDeleteDialog(vt)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                     
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        setIsOpen={handleDeleteDialogOpenChange}
        title="Confirm Delete"
        description={
          typePendingDelete
            ? `This will permanently remove “${typePendingDelete.name}”. If any vehicle in the fleet is already assigned to this type, the delete cannot be performed.`
            : ""
        }
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
