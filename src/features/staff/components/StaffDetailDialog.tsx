import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/utils/spinner";
import { useMemo } from "react";
import { useStaffDetail } from "@/hooks/useStaffDetail";
import { StaffDetailView } from "./StaffDetailView";
import { resolveStaffAssetUrl } from "@/lib/api/staff";
import type { StaffDetailApi } from "@/types/types";

function mergeStaffWithLicenseFallback(
  staff: StaffDetailApi,
  fallback?: {
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  } | null,
): StaffDetailApi {
  if (!fallback || !staff.driver) return staff;
  const fResolved = resolveStaffAssetUrl(fallback.frontImageUrl);
  const bResolved = resolveStaffAssetUrl(fallback.backImageUrl);
  if (!fResolved?.trim() && !bResolved?.trim()) return staff;

  const frontImageUrl =
    staff.driver.frontImageUrl?.trim() ||
    fResolved ||
    staff.driver.frontImageUrl;
  const backImageUrl =
    staff.driver.backImageUrl?.trim() ||
    bResolved ||
    staff.driver.backImageUrl;

  if (
    frontImageUrl === staff.driver.frontImageUrl &&
    backImageUrl === staff.driver.backImageUrl
  ) {
    return staff;
  }

  return {
    ...staff,
    driver: {
      ...staff.driver,
      frontImageUrl,
      backImageUrl,
    },
  };
}

type StaffDetailDialogProps = {
  staffId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licenseUrlFallback?: {
    frontImageUrl?: string | null;
    backImageUrl?: string | null;
  } | null;
};

export function StaffDetailDialog({
  staffId,
  open,
  onOpenChange,
  licenseUrlFallback,
}: StaffDetailDialogProps) {
  const idForQuery = open && staffId?.trim() ? staffId : undefined;
  const { data: staff, isPending, isError, error, refetch } =
    useStaffDetail(idForQuery);

  const displayStaff = useMemo(() => {
    if (!staff) return null;
    return mergeStaffWithLicenseFallback(staff, licenseUrlFallback ?? null);
  }, [staff, licenseUrlFallback]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto gap-4 p-4 sm:p-6"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Staff profile</DialogTitle>
          <DialogDescription>
            {isPending
              ? "Loading…"
              : staff
                ? staff.name
                : staffId
                  ? "Could not load this profile."
                  : "Select a driver with a linked staff account."}
          </DialogDescription>
        </DialogHeader>

        {isPending ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-10 w-10 text-blue-600" />
          </div>
        ) : null}

        {isError || (!isPending && !staff && staffId) ? (
          <div className="space-y-3 py-4">
            <p className="text-sm text-red-600">
              {error?.message ?? "Could not load staff details."}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {displayStaff ? <StaffDetailView staff={displayStaff} /> : null}
      </DialogContent>
    </Dialog>
  );
}
