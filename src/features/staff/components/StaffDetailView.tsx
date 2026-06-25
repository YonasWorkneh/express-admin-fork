import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
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
  ZoomIn,
  X,
} from "lucide-react";
import type { StaffDetailApi } from "@/types/types";
import { resolveStaffAssetUrl } from "@/lib/api/staff";
import { useAuthedImageDisplay } from "@/hooks/useAuthedImageSrc";

export function formatStaffDetailDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function getRoleBadgeClass(roleName: string) {
  const r = roleName.toUpperCase();
  if (r.includes("MANAGER")) return "bg-purple-100 text-purple-700";
  if (r.includes("DRIVER")) return "bg-blue-100 text-blue-700";
  if (r.includes("DISPATCH")) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

type StaffDetailViewProps = {
  staff: StaffDetailApi;
};

/** Normalize license image URLs from API (camelCase or snake_case). */
function licenseImageUrlsFromDriver(
  driver: NonNullable<StaffDetailApi["driver"]>
) {
  const d = driver as typeof driver & {
    front_image_url?: string | null;
    back_image_url?: string | null;
  };
  const front = [d.frontImageUrl, d.front_image_url]
    .find((v) => typeof v === "string" && v.trim().length > 0)
    ?.trim();
  const back = [d.backImageUrl, d.back_image_url]
    .find((v) => typeof v === "string" && v.trim().length > 0)
    ?.trim();
  return {
    front: resolveStaffAssetUrl(front) ?? undefined,
    back: resolveStaffAssetUrl(back) ?? undefined,
  };
}

function DriverLicenseImages({
  frontUrl,
  backUrl,
}: {
  frontUrl: string | null | undefined;
  backUrl: string | null | undefined;
}) {
  const [lightbox, setLightbox] = useState<{ url: string; title: string } | null>(
    null
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox]);

  const front = frontUrl?.trim() || undefined;
  const back = backUrl?.trim() || undefined;

  return (
    <>
      <div className="pt-2 border-t space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          License — front &amp; back
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {front ? (
            <LicenseImageTile
              url={front}
              label="Front"
              onExpand={() =>
                setLightbox({ url: front, title: "License — front" })
              }
            />
          ) : (
            <EmptyLicenseSlot label="Front" />
          )}
          {back ? (
            <LicenseImageTile
              url={back}
              label="Back"
              onExpand={() =>
                setLightbox({ url: back, title: "License — back" })
              }
            />
          ) : (
            <EmptyLicenseSlot label="Back" />
          )}
        </div>
      </div>

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-5xl flex-col gap-3 rounded-lg border bg-background p-3 shadow-lg sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <p className="text-sm font-semibold text-foreground pr-8">
                {lightbox.title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Close preview"
                onClick={() => setLightbox(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center overflow-auto rounded-md border bg-muted/30 p-2">
              <LightboxAuthedImg
                url={lightbox.url}
                alt={lightbox.title}
                className="max-h-[min(75vh,880px)] w-full max-w-full object-contain"
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={lightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  Open in new tab
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function EmptyLicenseSlot({ label }: { label: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 text-center text-sm text-gray-500">
        No image on file
      </div>
    </div>
  );
}

function LightboxAuthedImg({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string;
}) {
  const { displaySrc, onImgError, failed } = useAuthedImageDisplay(url);
  if (failed) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center text-sm text-gray-500 ${className ?? ""}`}
      >
        Could not load image
      </div>
    );
  }
  return (
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      onError={onImgError}
    />
  );
}

function LicenseImageTile({
  url,
  label,
  onExpand,
}: {
  url: string;
  label: string;
  onExpand: () => void;
}) {
  const { displaySrc, onImgError, failed } = useAuthedImageDisplay(url);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      {failed ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
          Could not load image.
          <div className="mt-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#EE1E21] hover:underline inline-flex items-center gap-1"
            >
              Open URL
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onExpand}
          className="group relative w-full rounded-lg border border-gray-200 bg-gray-50/80 overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EE1E21] focus-visible:ring-offset-2"
        >
          <img
            src={displaySrc}
            alt={`Driver license ${label.toLowerCase()}`}
            className="w-full h-40 object-contain bg-white"
            onError={onImgError}
          />
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-3.5 w-3.5" />
            Enlarge
          </span>
        </button>
      )}
    </div>
  );
}

export function StaffDetailView({ staff }: StaffDetailViewProps) {
  const driver = staff.driver;
  const driverLicenseUrls = driver
    ? licenseImageUrlsFromDriver(driver)
    : null;
  const vehicles = driver?.vehicles ?? [];
  const emergencyLine =
    staff.emergencyContactName || staff.emergencyContactPhone
      ? [staff.emergencyContactName, staff.emergencyContactPhone]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold">
              <User className="h-5 w-5 mr-2 text-[#EE1E21]" />
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
              <Building2 className="h-5 w-5 mr-2 text-[#EE1E21]" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg font-semibold">
              <Car className="h-5 w-5 mr-2 text-[#EE1E21]" />
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
                      {formatStaffDetailDate(driver.licenseExpiry)}
                    </p>
                  </div>
                </div>
                {driverLicenseUrls ? (
                  <DriverLicenseImages
                    frontUrl={driverLicenseUrls.front}
                    backUrl={driverLicenseUrls.back}
                  />
                ) : null}

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
              <Phone className="h-5 w-5 mr-2 text-[#EE1E21]" />
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
              <Shield className="h-5 w-5 mr-2 text-[#EE1E21]" />
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
                  {formatStaffDetailDate(staff.createdAt)}
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Last updated</Label>
                <div className="flex items-center gap-1 mt-1 text-gray-900">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {formatStaffDetailDate(staff.updatedAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
