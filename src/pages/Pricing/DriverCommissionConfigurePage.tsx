"use client";

import { Formik, Form } from "formik";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Button from "@/components/common/Button";
import PricingFormHeader from "@/features/pricing/components/PricingFormHeader";
import PricingShadcnSelect from "@/features/pricing/components/PricingShadcnSelect";
import DriverCommissionTable from "@/features/pricing/components/DriverCommissionTable";
import { mergeVehicleTypesWithCommissionConfig } from "@/lib/api/driverCommissionConfig";
import {
  useDriverCommissionConfigQuery,
  useFleetVehicleTypesQuery,
  useSaveDriverCommissionConfig,
} from "@/hooks/useDriverCommissionConfig";
import {
  PRICING_SERVICE_TYPE_OPTIONS,
  type PricingServiceType,
} from "@/types/driverCommission";
import { Spinner } from "@/utils/spinner";

type FormValues = {
  driverCommission: ReturnType<typeof mergeVehicleTypesWithCommissionConfig>;
};

export default function DriverCommissionConfigurePage() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] =
    useState<PricingServiceType>("STANDARD");

  const fleetQuery = useFleetVehicleTypesQuery();
  const configQuery = useDriverCommissionConfigQuery(
    serviceType,
    Boolean(fleetQuery.data?.length),
  );
  const saveMutation = useSaveDriverCommissionConfig();

  const mergedRows = useMemo(() => {
    const vehicles = fleetQuery.data ?? [];
    const lines = configQuery.data ?? [];
    return mergeVehicleTypesWithCommissionConfig(vehicles, lines);
  }, [fleetQuery.data, configQuery.data]);

  const pageLoading =
    fleetQuery.isLoading ||
    (Boolean(fleetQuery.data?.length) && configQuery.isFetching);

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
            options={PRICING_SERVICE_TYPE_OPTIONS}
          />
        </div>
      </div>

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
            await saveMutation.mutateAsync({
              serviceType,
              rows: values.driverCommission,
            });
            toast.success("Driver commission saved");
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
              />
            </div>

            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                Complete configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  type="submit"
                  className="cursor-pointer hover:bg-blue-700"
                  disabled={
                    saveMutation.isPending ||
                    pageLoading ||
                    (fleetQuery.data?.length ?? 0) === 0
                  }
                >
                  {saveMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Saving…
                    </span>
                  ) : (
                    "Save driver commission"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate("/pricing")}
                  className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full"
                  disabled={saveMutation.isPending || pageLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
