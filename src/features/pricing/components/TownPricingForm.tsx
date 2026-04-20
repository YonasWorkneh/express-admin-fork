"use client";

import { Formik, Form, Field, type FormikErrors } from "formik";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import PricingFormHeader from "./PricingFormHeader";
import PricingShadcnSelect from "./PricingShadcnSelect";
import ActionButtons from "./ActionButtons";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import { Spinner } from "@/utils/spinner";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import type { ServiceType } from "@/types/serviceTypes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

const TARIFF_DISPLAY_NAME = "Town Delivery Tariff";

const LEGACY_SERVICE_TYPE_KEYS = ["STANDARD", "EXPRESS", "OVERNIGHT"] as const;

export type TownServiceConfig = {
  basePrice: number;
  profitMargin: number;
};

export type TownFormValues = {
  remark: string;
  serviceConfigs: Record<string, TownServiceConfig>;
};

function buildEmptyServiceConfigs(
  serviceTypes: ServiceType[],
): Record<string, TownServiceConfig> {
  return Object.fromEntries(
    serviceTypes.map((st) => [st.id, { basePrice: 0, profitMargin: 0 }]),
  );
}

function hydrateFromParsedPrice(
  parsed: Record<string, unknown> | null,
  serviceTypes: ServiceType[],
): Record<string, TownServiceConfig> {
  const base = buildEmptyServiceConfigs(serviceTypes);
  if (!parsed) return base;

  const townConfig = parsed.townConfig;
  if (townConfig != null && typeof townConfig === "object") {
    const tc = townConfig as Record<string, unknown>;
    const innerRows = tc.serviceTypes as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(innerRows) && innerRows.length > 0) {
      const merged: Record<string, unknown> = {
        ...parsed,
        serviceTypes: innerRows,
        townConfig: null,
      };
      if (typeof tc.remark === "string" && tc.remark.trim()) {
        merged.remark = tc.remark;
      }
      return hydrateFromParsedPrice(merged, serviceTypes);
    }
  }

  const rows = parsed.serviceTypes as
    | Array<Record<string, unknown>>
    | undefined;
  let sawPerRowProfit = false;

  if (Array.isArray(rows)) {
    for (const row of rows) {
      const id = row.serviceTypeId as string | undefined;
      const legacyKey = (row.serviceType as string) || "STANDARD";
      const idx = LEGACY_SERVICE_TYPE_KEYS.indexOf(
        legacyKey as (typeof LEGACY_SERVICE_TYPE_KEYS)[number],
      );
      const st = id
        ? serviceTypes.find((s) => s.id === id)
        : idx >= 0 && serviceTypes[idx]
          ? serviceTypes[idx]
          : null;
      if (!st) continue;

      const fee =
        typeof row.baseFee === "number"
          ? row.baseFee
          : typeof row.basePrice === "number"
            ? row.basePrice
            : undefined;
      if (typeof fee === "number") base[st.id].basePrice = fee;

      const rowProfit =
        typeof row.profitMargin === "number"
          ? row.profitMargin
          : typeof row.profitPerc === "number"
            ? row.profitPerc
            : typeof row.profit === "number"
              ? row.profit
              : undefined;
      if (typeof rowProfit === "number") {
        base[st.id].profitMargin = rowProfit;
        sawPerRowProfit = true;
      }
    }
  }

  const globalProfit =
    (parsed.profitMargin as { percentage?: number } | undefined)?.percentage ??
    (typeof parsed.profit === "number" ? parsed.profit : undefined);

  if (!sawPerRowProfit && typeof globalProfit === "number") {
    for (const st of serviceTypes) {
      base[st.id].profitMargin = globalProfit;
    }
  }

  return base;
}

function validateValues(
  values: TownFormValues,
  serviceTypes: ServiceType[],
): FormikErrors<TownFormValues> {
  const errors: FormikErrors<TownFormValues> = {};
  if (!values.remark?.trim()) errors.remark = "Remark type is required";

  const scErrors: FormikErrors<TownFormValues["serviceConfigs"]> = {};
  for (const st of serviceTypes) {
    const cfg = values.serviceConfigs[st.id];
    if (!cfg) continue;
    const one: FormikErrors<TownServiceConfig> = {};
    if (cfg.basePrice < 0) one.basePrice = "Must be ≥ 0";
    if (cfg.profitMargin < 0 || cfg.profitMargin > 100) {
      one.profitMargin = "Must be between 0 and 100";
    }
    if (Object.keys(one).length) scErrors[st.id] = one;
  }
  if (Object.keys(scErrors).length) errors.serviceConfigs = scErrors;
  return errors;
}

function buildPayload(
  values: TownFormValues,
  serviceTypes: ServiceType[],
): {
  name: string;
  shippingScope: "TOWN";
  currency: string;
  remark: string;
  serviceTypes: {
    serviceTypeId: string;
    baseFee: number;
    profitMargin: number;
  }[];
} {
  return {
    name: TARIFF_DISPLAY_NAME,
    shippingScope: "TOWN",
    currency: "ETB",
    remark: values.remark.trim(),
    serviceTypes: serviceTypes.map((st) => {
      const cfg = values.serviceConfigs[st.id];
      return {
        serviceTypeId: st.id,
        baseFee: cfg?.basePrice ?? 0,
        profitMargin: cfg?.profitMargin ?? 0,
      };
    }),
  };
}

const remarkOptions = [
  { value: "Standard", label: "Standard" },
  { value: "Weekend", label: "Weekend" },
  { value: "Holiday", label: "Holiday" },
  { value: "Event", label: "Event" },
] as const;

export type TownPricingFormProps = {
  /** When set (e.g. tariff detail page), prefill and PATCH this tariff instead of URL `price`. */
  prefetchedTariff?: Record<string, unknown> | null;
  /** Log full tariff list to console for debugging (create flow only). */
  enableTariffListProbe?: boolean;
};

export default function TownPricingForm({
  prefetchedTariff = null,
  enableTariffListProbe = true,
}: TownPricingFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [parsedPrice, setParsedPrice] = useState<Record<
    string,
    unknown
  > | null>(null);

  const {
    data: serviceTypes = [],
    isLoading: loadingST,
    isError: errST,
  } = useServiceTypes();

  useEffect(() => {
    if (prefetchedTariff && Object.keys(prefetchedTariff).length > 0) {
      setParsedPrice(prefetchedTariff);
      return;
    }
    const raw = searchParams.get("price");
    if (!raw) {
      setParsedPrice(null);
      return;
    }
    try {
      const decoded = decodeURIComponent(raw);
      setParsedPrice(JSON.parse(decoded) as Record<string, unknown>);
    } catch {
      setParsedPrice(null);
    }
  }, [prefetchedTariff, searchParams]);

  /** Probe existing tariffs: same path as POST `/pricing/tariff`, GET (for upcoming prefill). */
  useEffect(() => {
    if (!enableTariffListProbe) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get<unknown>("/pricing/tariff", {
          params: { page: 1, pageSize: 100 },
        });
        if (!cancelled) {
          console.log(
            "[TownPricingForm] GET /pricing/tariff response:",
            res.data,
          );
        }
      } catch (e) {
        if (!cancelled) {
          console.log("[TownPricingForm] GET /pricing/tariff error:", e);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [enableTariffListProbe]);

  const isEditing = Boolean(parsedPrice && parsedPrice.id);
  const initialValues: TownFormValues = useMemo(() => {
    const empty: TownFormValues = {
      remark: "",
      serviceConfigs: buildEmptyServiceConfigs(serviceTypes),
    };
    if (isEditing && parsedPrice) {
      return {
        remark:
          typeof parsedPrice.remark === "string" && parsedPrice.remark.trim()
            ? (parsedPrice.remark as string)
            : "Standard",
        serviceConfigs: hydrateFromParsedPrice(parsedPrice, serviceTypes),
      };
    }
    return {
      ...empty,
      remark: "Standard",
    };
  }, [isEditing, parsedPrice, serviceTypes]);

  const handleSubmit = async (values: TownFormValues) => {
    try {
      setLoading(true);
      const payload = buildPayload(values, serviceTypes);

      if (isEditing && parsedPrice?.id) {
        await api.patch(`/pricing/tariff/${parsedPrice.id as string}`, payload);
        toast.success("Town pricing updated successfully!");
      } else {
        await api.post("/pricing/tariff", payload);
        toast.success("Town pricing saved successfully!");
      }

      navigate("/pricing");
    } catch (error: unknown) {
      console.error(error);
      const message =
        error &&
        typeof error === "object" &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      toast.error(
        typeof message === "string" && message.trim()
          ? message
          : "Failed to save tariff",
      );
    } finally {
      setLoading(false);
    }
  };

  const dataReady = !loadingST && !errST && serviceTypes.length > 0;

  return (
    <div className="max-w-4xl p-6 bg-white relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="h-8 w-8 text-blue-600" />
            <p className="text-gray-600 font-medium">
              {isEditing ? "Updating pricing..." : "Saving pricing..."}
            </p>
          </div>
        </div>
      )}

      {loadingST && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          <Spinner className="h-8 w-8 text-blue-600 mr-2" />
          Loading service types…
        </div>
      )}

      {errST && (
        <p className="text-red-600 text-sm py-8">
          Could not load service types. Please refresh.
        </p>
      )}

      {!loadingST && !errST && serviceTypes.length === 0 && (
        <p className="text-amber-700 text-sm py-8">
          No service types found. Add service types under Service Type
          Management first.
        </p>
      )}

      {dataReady && (
        <Formik<TownFormValues>
          enableReinitialize
          initialValues={initialValues}
          validate={(v) => validateValues(v, serviceTypes)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, setFieldTouched }) => (
            <Form className={loading ? "pointer-events-none opacity-50" : ""}>
              <PricingFormHeader
                title={
                  isEditing
                    ? "Edit Town Pricing Configuration"
                    : "Town Pricing Configuration"
                }
              />

              <div className="mb-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Remark type
                  </h3>
                  <PricingShadcnSelect
                    id="remark"
                    label="Select remark type"
                    placeholder="Select remark type"
                    value={values.remark}
                    onValueChange={(v) => setFieldValue("remark", v)}
                    onClose={() => setFieldTouched("remark", true)}
                    options={[...remarkOptions]}
                    error={errors.remark}
                    touched={touched.remark}
                  />
                </div>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Service types
                </h3>
                <div
                  className="mb-4 flex gap-2.5 rounded-lg border border-blue-200/80 bg-blue-50/90 px-3 py-2.5 text-sm text-blue-900"
                  role="status"
                >
                  <Info
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden
                  />
                  <p className="leading-snug">
                    Set base price and profit margin for each service type.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {serviceTypes.map((st) => {
                  const scErr = errors.serviceConfigs?.[st.id];
                  const scTouch = touched.serviceConfigs?.[st.id];
                  return (
                    <div
                      key={st.id}
                      className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 space-y-4"
                    >
                      <h4 className="text-base font-semibold text-gray-900">
                        {st.name}
                      </h4>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1">Base price (ETB)</Label>
                          <Field
                            as={Input}
                            type="number"
                            step="0.01"
                            min={0}
                            name={`serviceConfigs.${st.id}.basePrice`}
                            className="py-2"
                          />
                          {scErr?.basePrice && scTouch?.basePrice && (
                            <p className="text-red-500 text-sm mt-1">
                              {scErr.basePrice}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="mb-1">Profit margin (%)</Label>
                          <Field
                            as={Input}
                            type="number"
                            step="0.01"
                            min={0}
                            max={100}
                            name={`serviceConfigs.${st.id}.profitMargin`}
                            className="py-2"
                          />
                          {scErr?.profitMargin && scTouch?.profitMargin && (
                            <p className="text-red-500 text-sm mt-1">
                              {scErr.profitMargin}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <ActionButtons isEditing={isEditing} loading={loading} />
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}
