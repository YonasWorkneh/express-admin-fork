"use client";

import { Formik, Form } from "formik";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PricingFormHeader from "@/features/pricing/components/PricingFormHeader";
import PricingShadcnSelect from "@/features/pricing/components/PricingShadcnSelect";
import DriverCommissionTable from "@/features/pricing/components/DriverCommissionTable";
import {
  driverCommissionRowsHaveConfiguredRates,
  mergeVehicleTypesWithCommissionConfig,
} from "@/lib/api/driverCommissionConfig";
import {
  useDriverCommissionConfigQuery,
  useFleetVehicleTypesQuery,
  useSaveDriverCommissionConfig,
} from "@/hooks/useDriverCommissionConfig";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import type { PricingServiceType } from "@/types/driverCommission";
import { Spinner } from "@/utils/spinner";

type FormValues = {
  driverCommission: ReturnType<typeof mergeVehicleTypesWithCommissionConfig>;
};

export default function DriverCommissionConfigurePage() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<PricingServiceType>("");

  const serviceTypesQuery = useServiceTypes();
  const serviceTypeOptions = useMemo(
    () =>
      (serviceTypesQuery.data ?? []).map((st) => ({
        value: st.id,
        label: st.name,
      })),
    [serviceTypesQuery.data],
  );

  useEffect(() => {
    if (serviceType || !serviceTypesQuery.data?.length) return;
    setServiceType(serviceTypesQuery.data[0].id);
  }, [serviceTypesQuery.data, serviceType]);

  const fleetQuery = useFleetVehicleTypesQuery();
  const configQuery = useDriverCommissionConfigQuery(
    serviceType,
    Boolean(fleetQuery.data?.length),
  );
  const saveMutation = useSaveDriverCommissionConfig();

  const commissionResourceId = configQuery.data?.resourceId ?? null;

  const mergedRows = useMemo(() => {
    const vehicles = fleetQuery.data ?? [];
    const lines = configQuery.data?.lines ?? [];
    return mergeVehicleTypesWithCommissionConfig(vehicles, lines);
  }, [fleetQuery.data, configQuery.data]);

  /**
   * Edit vs save for this service type, fixed when server data loads (merged rows + resource id).
   * Does not change when the user edits form fields.
   */
  const persistedCommissionLooksExisting = useMemo(() => {
    const id = (configQuery.data?.resourceId ?? "").trim();
    return (
      driverCommissionRowsHaveConfiguredRates(mergedRows) || Boolean(id)
    );
  }, [mergedRows, configQuery.data?.resourceId]);

  const pageLoading =
    serviceTypesQuery.isLoading ||
    fleetQuery.isLoading ||
    (Boolean(fleetQuery.data?.length) &&
      Boolean(serviceType.trim()) &&
      configQuery.isFetching);

  const initialValues: FormValues = useMemo(
    () => ({ driverCommission: mergedRows }),
    [mergedRows],
  );

  return (
    <div className="max-w-4xl p-6 bg-white relative">
      {pageLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-8 w-8 text-blue-600" />
            <p className="text-gray-600 font-medium">Loading…</p>
          </div>
        </div>
      )}

      <PricingFormHeader title="Driver Commission Configure" />

      <p className="text-center text-sm text-gray-500 mb-8 max-w-2xl mx-auto">
        Pick a service type, then set cost per km, fixed cost, and percentage by
        vehicle category. This is stored separately from town, regional, and
        international tariffs.
      </p>

      <div className="mb-8">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Service type
          </h3>
          <PricingShadcnSelect
            id="service-type"
            label="Select service type"
            placeholder="Select service type"
            value={serviceType}
            onValueChange={(v) => setServiceType(v)}
            options={serviceTypeOptions}
          />
        </div>
      </div>

      {serviceTypesQuery.isError && (
        <p className="text-red-600 text-sm mb-4">
          Could not load service types. Refresh the page or try again later.
        </p>
      )}

      {!serviceTypesQuery.isLoading &&
        (serviceTypesQuery.data?.length ?? 0) === 0 && (
          <p className="text-amber-700 text-sm mb-4">
            No service types found. Add service types under Service Type
            Management first.
          </p>
        )}

      {fleetQuery.isError && (
        <p className="text-red-600 text-sm mb-4">
          Could not load vehicle types. Refresh the page or try again later.
        </p>
      )}

      {configQuery.isError && configQuery.error instanceof Error && (
        <p className="text-sm mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
          {configQuery.error.message} — showing empty values; you can still
          enter commissions and save.
        </p>
      )}

      {!fleetQuery.isLoading && (fleetQuery.data?.length ?? 0) === 0 && (
        <p className="text-gray-600 text-sm mb-4">
          No vehicle types found. Add vehicle types under Fleet before
          configuring driver commission.
        </p>
      )}

      <Formik<FormValues>
        key={serviceType}
        enableReinitialize
        initialValues={initialValues}
        onSubmit={async (values) => {
          try {
            const patchId =
              (commissionResourceId?.trim() || serviceType.trim()) || null;
            await saveMutation.mutateAsync({
              serviceType,
              rows: values.driverCommission,
              resourceId: persistedCommissionLooksExisting ? patchId : null,
            });
            toast.success(
              persistedCommissionLooksExisting
                ? "Driver commission updated"
                : "Driver commission saved",
            );
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Failed to save driver commission";
            toast.error(msg);
          }
        }}
      >
        {({ values }) => (
          <Form
            className={
              pageLoading || saveMutation.isPending
                ? "pointer-events-none opacity-60"
                : ""
            }
          >
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              <DriverCommissionTable
                driverCommission={values.driverCommission}
                hasExistingCommission={persistedCommissionLooksExisting}
                submitDisabled={
                  pageLoading ||
                  !serviceType.trim() ||
                  (fleetQuery.data?.length ?? 0) === 0 ||
                  (serviceTypesQuery.data?.length ?? 0) === 0
                }
                isSubmitting={saveMutation.isPending}
                onCancel={() => navigate("/pricing")}
              />
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
