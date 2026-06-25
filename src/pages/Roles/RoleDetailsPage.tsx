import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import Button from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import api from "@/lib/api/api";
import toast from "react-hot-toast";
import type {
  RoleWithPermissions,
  RoleDetailResponse,
} from "@/types/types";
import { Spinner } from "@/utils/spinner";

const RoleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<RoleWithPermissions | null>(null);

  useEffect(() => {
    if (id) {
      fetchRole(id);
    }
  }, [id]);

  const fetchRole = async (roleId: string) => {
    try {
      setLoading(true);
      const response = await api.get<RoleDetailResponse>(
        `/access-control/roles/${roleId}`
      );
      setRole(response.data.data);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const message =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8 text-[#EE1E21]" />
      </div>
    );
  }

  if (!role) {
    return <div>Role not found</div>;
  }

  const getActionBadges = (rp: typeof role.rolePermissions[0]) => {
    const actions = [];
    if (rp.createAction) actions.push("Create");
    if (rp.readAction) actions.push("Read");
    if (rp.updateAction) actions.push("Update");
    if (rp.deleteAction) actions.push("Delete");
    return actions;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => navigate("/roles")}
            className="p-2 hover:bg-gray-100"
          >
            <IoArrowBack className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {role.description || "View role details and permissions"}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => navigate(`/roles/edit/${id}`)}
          className="text-gray-600 bg-white border-gray-300 border"
        >
          <MdEdit className="h-4 w-4 mr-2" />
          Edit Role
        </Button>
      </div>

      {/* Role Info Card */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">Role ID</Label>
              <p className="font-medium text-gray-900">{role.id}</p>
            </div>
            <div>
              <Label className="text-gray-600">Name</Label>
              <p className="font-medium text-gray-900">{role.name}</p>
            </div>
            {role.description && (
              <div className="col-span-2">
                <Label className="text-gray-600">Description</Label>
                <p className="text-gray-900">{role.description}</p>
              </div>
            )}
            <div>
              <Label className="text-gray-600">Created At</Label>
              <p className="text-gray-900">
                {new Date(role.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Updated At</Label>
              <p className="text-gray-900">
                {new Date(role.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      {role.rolePermissions && role.rolePermissions.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Assigned Permissions</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Permissions assigned to this role
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {role.rolePermissions.map((rp) => (
                <div
                  key={rp.id}
                  className="border rounded-lg p-4 border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {rp.permission.resource}
                        </h3>
                      </div>
                      {rp.permission.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {rp.permission.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {getActionBadges(rp).map((action) => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="bg-[#EE1E21]/10 text-[#EE1E21]"
                          >
                            {action}
                          </Badge>
                        ))}
                        {rp.scope && rp.scope.length > 0 && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Scopes: {rp.scope.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!role.rolePermissions || role.rolePermissions.length === 0) && (
        <Card className="bg-white">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <p>No permissions assigned to this role</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoleDetailsPage;
