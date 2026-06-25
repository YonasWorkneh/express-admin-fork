import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Car,
  User,
  FileText,
  Calendar,
  Clock,
  Package,
  Wrench,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useFleetVehicleDetail } from "@/hooks/useFleetVehicleDetail";
import { Spinner } from "@/utils/spinner";
import type { FleetVehicleDetailApi } from "@/types/types";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "bg-green-100 text-green-700";
  if (s === "maintenance") return "bg-orange-100 text-orange-700";
  if (s === "inactive") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function ownershipLabel(type: string) {
  const t = type.toUpperCase().replace(/[\s-]+/g, "_");
  if (t === "EXTERNAL") return "External";
  if (t === "INTERNAL" || t === "INHOUSE" || t === "IN_HOUSE") return "Internal";
  return type;
}

export default function VehicleDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const fleetVehicleQuery = useFleetVehicleDetail(id);

  if (fleetVehicleQuery.isPending) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Spinner className="h-10 w-10 text-[#EE1E21]" />
      </div>
    );
  }

  if (fleetVehicleQuery.isError || !fleetVehicleQuery.data) {
    return (
      <div className="min-h-screen p-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/fleet")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to fleet
        </Button>
        <p className="mt-6 text-red-600">
          {fleetVehicleQuery.error?.message ??
            "Could not load vehicle details."}
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => fleetVehicleQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const v: FleetVehicleDetailApi = fleetVehicleQuery.data;
  const d = v.driver;
  const vt = v.vehicleType;
  const logs = v.fleetLogs ?? [];

  const driverUser = d?.user as { name?: string; phone?: string } | undefined;
  const driverName =
    driverUser?.name ??
    (d?.userId ? `User ${d.userId.slice(0, 8)}…` : null);

  return (
    <div className="min-h-screen p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/fleet")}
            className="p-2 rounded-full bg-[#EE1E21]/10 hover:bg-[#EE1E21]/20"
          >
            <ArrowLeft className="h-4 w-4 text-[#EE1E21]" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {v.plateNumber}
            </h1>
            <p className="text-gray-500 text-sm">{v.model}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-[#EE1E21] border-[#EE1E21]/20"
          onClick={() => navigate(`/fleet/edit/${v.id}`)}
        >
          Edit vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Car className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusBadgeClass(v.status)}>{v.status}</Badge>
                <Badge variant="secondary">{ownershipLabel(v.type)}</Badge>
              </div>
              <div>
                <Label className="text-gray-600">Max load</Label>
                <p className="font-medium text-gray-900 mt-0.5">
                  {v.maxLoad} kg
                </p>
              </div>
              {/* <div>
                <Label className="text-gray-600">Internal ID</Label>
                <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">
                  {v.id}
                </p>
              </div> */}
              <div>
                <Label className="text-gray-600">Vehicle type ID</Label>
                <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">
                  {v.vehicleTypeId}
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Driver ID</Label>
                <p className="font-mono text-xs text-gray-600 mt-0.5 break-all">
                  {v.driverId}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Package className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Vehicle type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {vt ? (
                <>
                  <p className="font-medium text-gray-900">{vt.name}</p>
                  {vt.description ? (
                    <p className="text-gray-600 leading-relaxed">
                      {vt.description}
                    </p>
                  ) : null}
                  <p className="font-mono text-xs text-gray-500 mt-1">{vt.id}</p>
                </>
              ) : (
                <p className="text-gray-500">No vehicle type on record.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <User className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="link"
                  className="h-auto p-0 text-[#EE1E21]"
                  onClick={() => navigate(`/staff/${v.driverId}`)}
                >
                  Open staff profile
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
              {d ? (
                <>
                  <div>
                    <Label className="text-gray-600">Display name</Label>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {driverName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Driver record ID</Label>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {d.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">User ID</Label>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {d.userId}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Label className="text-gray-600">Availability</Label>
                      <p className="text-gray-900 mt-0.5">
                        {d.availablityStatus}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p className="text-gray-900 mt-0.5">{d.status}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Type</Label>
                      <p className="text-gray-900 mt-0.5">{d.type}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Approved</Label>
                      <p className="text-gray-900 mt-0.5">
                        {d.isApproved === true
                          ? "Yes"
                          : d.isApproved === false
                            ? "No"
                            : "—"}
                      </p>
                    </div>
                  </div>
                  {d.approvedAt ? (
                    <div>
                      <Label className="text-gray-600">Approved at</Label>
                      <p className="text-gray-900 mt-0.5 text-xs">
                        {formatDate(d.approvedAt)}
                      </p>
                    </div>
                  ) : null}
                  {d.approvedBy ? (
                    <div>
                      <Label className="text-gray-600">Approved by</Label>
                      <p className="font-mono text-xs text-gray-600 break-all">
                        {d.approvedBy}
                      </p>
                    </div>
                  ) : null}
                  <div>
                    <Label className="text-gray-600">License number</Label>
                    <p className="font-medium text-gray-900 mt-0.5">
                      {d.licenseNumber ?? "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">License expiry</Label>
                    <p className="text-gray-900 mt-0.5">
                      {formatDate(d.licenseExpiry)}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No driver object in response.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Wrench className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Fleet logs ({logs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No fleet logs yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
                  {logs.map((l, i) => (
                    <li key={i} className="px-3 py-2 font-mono text-xs">
                      {typeof l === "object" && l !== null
                        ? JSON.stringify(l)
                        : String(l)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <MapPin className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Map position
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              {d?.currentLat != null && d?.currentLon != null ? (
                <p className="font-mono">
                  {d.currentLat}, {d.currentLon}
                </p>
              ) : (
                <p className="text-gray-500">No coordinates.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <FileText className="h-5 w-5 mr-2 text-[#EE1E21]" />
                Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Created</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(v.createdAt)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Updated</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatDate(v.updatedAt)}
                  </div>
                </div>
                {/* <div className="sm:col-span-2">
                  <Label className="text-gray-600">Created by</Label>
                  <p className="font-mono text-xs text-gray-900 mt-1 break-all">
                    {v.createdBy ?? "—"}
                  </p>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
