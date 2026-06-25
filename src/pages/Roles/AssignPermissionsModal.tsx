import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type {
  AccessControlPermission,
  AccessControlPermissionListResponse,
  RoleDetailResponse,
  AssignPermissionsToRoleRequest,
  AssignPermissionRequest,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";

interface AssignPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleName: string;
  onSuccess?: () => void;
}

export default function AssignPermissionsModal({
  isOpen,
  onClose,
  roleId,
  roleName,
  onSuccess,
}: AssignPermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [allPermissions, setAllPermissions] = useState<AccessControlPermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Map<string, AssignPermissionRequest>
  >(new Map());

  useEffect(() => {
    if (isOpen && roleId) {
      fetchAllPermissions();
      fetchRole();
    }
  }, [isOpen, roleId]);

  const fetchAllPermissions = async () => {
    try {
      setFetching(true);
      const response = await api.get<AccessControlPermissionListResponse>(
        `/access-control/permissions?page=1&pageSize=1000`
      );
      setAllPermissions(response.data.data);
      setFetching(false);
    } catch (error: any) {
      setFetching(false);
      console.error("Failed to fetch permissions:", error);
    }
  };

  const fetchRole = async () => {
    try {
      const response = await api.get<RoleDetailResponse>(
        `/access-control/roles/${roleId}`
      );
      // Initialize selected permissions from existing role permissions
      const initialPermissions = new Map<string, AssignPermissionRequest>();
      if (response.data.data.rolePermissions) {
        response.data.data.rolePermissions.forEach((rp) => {
          const permissionId = rp.permission?.id || rp.permissionId || "";
          if (permissionId) {
            initialPermissions.set(permissionId, {
              permissionId,
              createAction: rp.createAction,
              readAction: rp.readAction,
              updateAction: rp.updateAction,
              deleteAction: rp.deleteAction,
              scopes: rp.scope || [],
            });
          }
        });
      }
      setSelectedPermissions(initialPermissions);
    } catch (error: any) {
      console.error("Failed to fetch role:", error);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newSelected = new Map(selectedPermissions);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.set(permissionId, {
        permissionId,
        createAction: false,
        readAction: true,
        updateAction: false,
        deleteAction: false,
        scopes: [],
      });
    }
    setSelectedPermissions(newSelected);
  };

  const updatePermissionAction = (
    permissionId: string,
    action: "createAction" | "readAction" | "updateAction" | "deleteAction",
    value: boolean
  ) => {
    const newSelected = new Map(selectedPermissions);
    const current = newSelected.get(permissionId);
    if (current) {
      newSelected.set(permissionId, {
        ...current,
        [action]: value,
      });
      setSelectedPermissions(newSelected);
    }
  };

  const updatePermissionScopes = (permissionId: string, scopes: string) => {
    const newSelected = new Map(selectedPermissions);
    const current = newSelected.get(permissionId);
    if (current) {
      newSelected.set(permissionId, {
        ...current,
        scopes: scopes.split(",").map((s) => s.trim()).filter((s) => s.length > 0),
      });
      setSelectedPermissions(newSelected);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const permissions: AssignPermissionRequest[] = Array.from(
        selectedPermissions.values()
      );

      const payload: AssignPermissionsToRoleRequest = {
        roleId,
        permissions,
      };

      await api.post("/access-control/roles/permissions/assign", payload);
      toast.success("Permissions assigned successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Permissions to Role: {roleName}</DialogTitle>
          <DialogDescription>
            Select permissions and configure actions for this role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {fetching ? (
            <div className="flex justify-center items-center py-8">
              <Spinner className="h-6 w-6 text-[#EE1E21]" />
            </div>
          ) : allPermissions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No permissions available
            </div>
          ) : (
            allPermissions.map((permission) => {
              const isSelected = selectedPermissions.has(permission.id);
              const permissionData = selectedPermissions.get(permission.id);

              return (
                <div
                  key={permission.id}
                  className={`border mx-2 rounded-lg p-4 ${
                    isSelected
                      ? "border-[#EE1E21] bg-[#EE1E21]/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePermission(permission.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {permission.resource}
                          </h3>
                          {isSelected && (
                            <Badge variant="secondary" className="bg-[#EE1E21]/10 text-[#EE1E21]">
                              Selected
                            </Badge>
                          )}
                        </div>
                        {permission.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {permission.description}
                          </p>
                        )}

                        {isSelected && permissionData && (
                          <div className="mt-4 space-y-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                                Actions
                              </Label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={permissionData.createAction}
                                    onCheckedChange={(checked) =>
                                      updatePermissionAction(
                                        permission.id,
                                        "createAction",
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <span className="text-sm text-gray-700">Create</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={permissionData.readAction}
                                    onCheckedChange={(checked) =>
                                      updatePermissionAction(
                                        permission.id,
                                        "readAction",
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <span className="text-sm text-gray-700">Read</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={permissionData.updateAction}
                                    onCheckedChange={(checked) =>
                                      updatePermissionAction(
                                        permission.id,
                                        "updateAction",
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <span className="text-sm text-gray-700">Update</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={permissionData.deleteAction}
                                    onCheckedChange={(checked) =>
                                      updatePermissionAction(
                                        permission.id,
                                        "deleteAction",
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <span className="text-sm text-gray-700">Delete</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor={`scopes-${permission.id}`} className="text-sm font-medium text-gray-700 mb-2 block">
                                Scopes (comma-separated)
                              </Label>
                              <Input
                                id={`scopes-${permission.id}`}
                                value={permissionData.scopes.join(", ")}
                                onChange={(e) =>
                                  updatePermissionScopes(permission.id, e.target.value)
                                }
                                placeholder="e.g., branch-1, branch-2"
                                className="max-w-md"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Leave empty for global access
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
          >
            {loading ? (
              <span className="flex items-center">
                <Spinner className="h-4 w-4 text-[#FADF4B] mr-2" />
                Assigning...
              </span>
            ) : (
              "Assign Permissions"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
