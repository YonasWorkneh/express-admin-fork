import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  Clock,
  Car,
  FileText,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Spinner } from "@/utils/spinner";
import { useStaffDetail } from "@/hooks/useStaffDetail";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function StaffDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: staff, isPending, isError, error, refetch } = useStaffDetail(id);

  const getRoleBadgeClass = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r.includes("MANAGER")) return "bg-purple-100 text-purple-700";
    if (r.includes("DRIVER")) return "bg-blue-100 text-blue-700";
    if (r.includes("DISPATCH")) return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-700";
  };

  if (isPending) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Spinner className="h-10 w-10 text-blue-600" />
      </div>
    );
  }

  if (isError || !staff) {
    return (
      <div className="min-h-screen p-6 max-w-7xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to staff
        </Button>
        <p className="mt-6 text-red-600">
          {error?.message ?? "Could not load staff details."}
        </p>
        <Button className="mt-4" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const displayId = staff.customId ?? staff.id;
  const driver = staff.driver;
  const vehicles = driver?.vehicles ?? [];
  const emergencyLine =
    staff.emergencyContactName || staff.emergencyContactPhone
      ? [staff.emergencyContactName, staff.emergencyContactPhone]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="min-h-screen p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/staff")}
            className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Staff — {displayId}
            </h1>
            <p className="text-gray-500 text-sm">{staff.name}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-blue-600 border-blue-200"
          onClick={() => navigate(`/staff/edit/${staff.id}`)}
        >
          Edit staff
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Staff information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Name
                  </Label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {staff.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    ID: {staff.id}
                  </p>
                  {staff.customId ? (
                    <p className="text-sm text-gray-600 mt-1">
                      Staff code:{" "}
                      <span className="font-medium">{staff.customId}</span>
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">
                    Role &amp; status
                  </Label>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      className={getRoleBadgeClass(staff.role?.name ?? "")}
                    >
                      {staff.role?.name ?? "—"}
                    </Badge>
                    <Badge
                      className={
                        staff.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {staff.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        staff.emailVerified
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }
                    >
                      Email {staff.emailVerified ? "verified" : "not verified"}
                    </Badge>
                    {staff.isStaff ? (
                      <Badge variant="outline" className="text-gray-700">
                        Staff account
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                Branch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-gray-900 font-medium">{staff.branch?.name}</p>
              {staff.branch?.branchId ? (
                <p className="text-sm text-gray-600">
                  Branch code: {staff.branch.branchId}
                </p>
              ) : null}
              <p className="text-xs text-gray-500 font-mono">
                ID: {staff.branch?.id}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Car className="h-5 w-5 mr-2 text-blue-600" />
                Driver profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver ? (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-gray-600">Availability</Label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {driver.availablityStatus}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {driver.status}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Type</Label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {driver.type}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Approved</Label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {driver.isApproved === true
                          ? "Yes"
                          : driver.isApproved === false
                            ? "No"
                            : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">License number</Label>
                      <p className="font-medium text-gray-900 mt-0.5">
                        {driver.licenseNumber ?? "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600">License expiry</Label>
                      <p className="font-medium text-gray-900 mt-0.5 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(driver.licenseExpiry)}
                      </p>
                    </div>
                  </div>
                  {(driver.frontImageUrl || driver.backImageUrl) && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t">
                      {driver.frontImageUrl ? (
                        <a
                          href={driver.frontImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          License (front)
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                      {driver.backImageUrl ? (
                        <a
                          href={driver.backImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          License (back)
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  )}

                  {vehicles.length > 0 ? (
                    <div className="pt-2 border-t space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Vehicles
                      </Label>
                      {vehicles.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-lg border border-gray-200 p-3 bg-gray-50/80"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-medium text-gray-900">
                              {v.plateNumber}
                            </span>
                            <Badge variant="secondary">{v.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {v.vehicleType?.name ?? "Vehicle"} · {v.model} · max{" "}
                            {v.maxLoad} kg
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Type: {v.type}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No driver profile linked to this staff member.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <Label className="text-sm font-medium text-gray-600 shrink-0">
                  Phone
                </Label>
                <div className="flex items-center gap-1 text-right">
                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-900 break-all">
                    {staff.phone}
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <Label className="text-sm font-medium text-gray-600 shrink-0">
                  Email
                </Label>
                <div className="flex items-center gap-1 text-right">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-900 break-all">
                    {staff.email}
                  </span>
                </div>
              </div>
              {emergencyLine ? (
                <div className="flex items-start justify-between gap-4 pt-2 border-t">
                  <Label className="text-sm font-medium text-gray-600 shrink-0">
                    Emergency contact
                  </Label>
                  <span className="text-sm text-gray-900 text-right">
                    {emergencyLine}
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Fayda FAN
                </Label>
                <p className="text-sm text-gray-900 mt-1">
                  {staff.faydaFAN ?? "—"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  Profile pictures
                </Label>
                <p className="text-sm text-gray-700 mt-1">
                  {staff.profilePictures && staff.profilePictures.length > 0
                    ? `${staff.profilePictures.length} file(s) on record`
                    : "None on record"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg font-semibold">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Created</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(staff.createdAt)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Last updated</Label>
                  <div className="flex items-center gap-1 mt-1 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatDate(staff.updatedAt)}
                  </div>
                </div>
                {staff.createdBy ? (
                  <div className="sm:col-span-2">
                    <Label className="text-gray-600">Created by</Label>
                    <p className="text-gray-900 mt-1 font-mono text-xs">
                      {staff.createdBy}
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
