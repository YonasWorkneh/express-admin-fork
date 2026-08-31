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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type {
  Staff,
  StaffListResponse,
  AssignRoleToUserRequest,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";

interface AssignUserRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleId: string;
  roleName: string;
  onSuccess?: () => void;
}

export default function AssignUserRoleModal({
  isOpen,
  onClose,
  roleId,
  roleName,
  onSuccess,
}: AssignUserRoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [users, setUsers] = useState<Staff[]>([]);
  const [usersError, setUsersError] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null);

  useEffect(() => {
    if (isOpen && userSearch) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [isOpen, userSearch]);

  const fetchUsers = async () => {
    try {
      setFetching(true);
      setUsersError(false);
      const response = await api.get<StaffListResponse>(
        `/staff?search=${encodeURIComponent(userSearch)}&page=1&pageSize=20`
      );
      setUsers(response.data.data);
      setFetching(false);
    } catch (error: any) {
      setFetching(false);
      setUsersError(true);
      console.error("Failed to fetch users:", error);
      toast.error("Could not load users. Please try again.");
    }
  };

  const selectUser = (user: Staff) => {
    setSelectedUser(user);
    setUserSearch(`${user.name} (${user.email})`);
    setShowUserDropdown(false);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setUserSearch("");
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      toast.error("Please select a user");
      return;
    }

    try {
      setLoading(true);
      const payload: AssignRoleToUserRequest = {
        userId: selectedUser.id,
        roleId,
      };

      await api.patch("/access-control/assign-user-role", payload);
      toast.success("Role assigned to user successfully");
      onSuccess?.();
      onClose();
      clearUser();
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Role to User</DialogTitle>
          <DialogDescription>
            Assign the role "{roleName}" to a user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 relative">
            <Label htmlFor="user">User *</Label>
            <div className="relative">
              <Input
                id="user"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setShowUserDropdown(true);
                  if (!e.target.value) {
                    clearUser();
                  }
                }}
                onFocus={() => setShowUserDropdown(true)}
                onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                className="py-6"
              />
              {selectedUser && (
                <button
                  type="button"
                  onClick={clearUser}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {showUserDropdown && userSearch && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {fetching ? (
                  <div className="flex justify-center items-center py-4">
                    <Spinner className="h-5 w-5 text-[#EE1E21]" />
                  </div>
                ) : usersError ? (
                  <div className="px-4 py-3 text-sm text-red-500">
                    Could not load users.
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No users found
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="p-3 bg-[#EE1E21]/5 border border-[#EE1E21]/20 rounded-lg">
              <div className="text-sm font-medium text-gray-900">
                Selected User: {selectedUser.name}
              </div>
              <div className="text-xs text-gray-600">{selectedUser.email}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedUser}
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B]"
          >
            {loading ? (
              <span className="flex items-center">
                <Spinner className="h-4 w-4 text-[#FADF4B] mr-2" />
                Assigning...
              </span>
            ) : (
              "Assign Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
