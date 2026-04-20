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

/** Match zonal: store short name in the form; full API name uses display prefix on submit. */
function hydrateTownTabNameFromTariff(
  tab: TownServiceConfig,
  tariffName: unknown,
) {
  if (typeof tariffName === "string" && tariffName.trim()) {
    const n = tariffName.trim();
    const prefix = `${TARIFF_DISPLAY_NAME} - `;
    tab.name = n.startsWith(prefix) ? n.slice(prefix.length) : n;
  }
}

export type TownServiceConfig = {
  name: string;
  remark: string;
  basePrice: number;
  profitMargin: number;
};

export type TownFormValues = {
  serviceConfigs: Record<string, TownServiceConfig>;
};

function buildEmptyServiceConfigs(
  serviceTypes: ServiceType[],
): Record<string, TownServiceConfig> {
  return Object.fromEntries(
    serviceTypes.map((st) => [
      st.id,
      { name: "", remark: "Standard", basePrice: 0, profitMargin: 0 },
    ]),
  );
}

function hydrateFromParsedPrice(
  parsed: Record<string, unknown> | null,
  serviceTypes: ServiceType[],
): Record<string, TownServiceConfig> {
  const base = buildEmptyServiceConfigs(serviceTypes);
  if (!parsed) return base;

  let hasRowOrTownPricingProfit = false;

  const tpRoot = parsed.townPricing;
  const rootServiceTypeId =
    typeof parsed.serviceTypeId === "string" && parsed.serviceTypeId.trim()
      ? parsed.serviceTypeId.trim()
      : null;
  if (
    tpRoot &&
    typeof tpRoot === "object" &&
    !Array.isArray(tpRoot) &&
    rootServiceTypeId &&
    serviceTypes.some((s) => s.id === rootServiceTypeId)
  ) {
    const tp = tpRoot as Record<string, unknown>;
    const fee =
      typeof tp.baseFee === "number" && !Number.isNaN(tp.baseFee)
        ? tp.baseFee
        : undefined;
    const pct =
      typeof tp.profitPct === "number" && !Number.isNaN(tp.profitPct)
        ? tp.profitPct
        : typeof tp.profitMargin === "number" && !Number.isNaN(tp.profitMargin)
          ? tp.profitMargin
          : undefined;
    if (typeof fee === "number") {
      base[rootServiceTypeId].basePrice = fee;
    }
    if (typeof pct === "number") {
      base[rootServiceTypeId].profitMargin = pct;
      hasRowOrTownPricingProfit = true;
    }
    hydrateTownTabNameFromTariff(base[rootServiceTypeId], parsed.name);
  }

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

      if (typeof row.name === "string" && row.name.trim()) {
        hydrateTownTabNameFromTariff(base[st.id], row.name);
      }

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

  if (sawPerRowProfit) hasRowOrTownPricingProfit = true;

  const sidForName =
    typeof parsed.serviceTypeId === "string" && parsed.serviceTypeId.trim()
      ? parsed.serviceTypeId.trim()
      : null;
  if (
    sidForName &&
    serviceTypes.some((s) => s.id === sidForName) &&
    typeof parsed.name === "string" &&
    !base[sidForName].name?.trim()
  ) {
    hydrateTownTabNameFromTariff(base[sidForName], parsed.name);
  }

  const globalProfit =
    (parsed.profitMargin as { percentage?: number } | undefined)?.percentage ??
    (typeof parsed.profit === "number" ? parsed.profit : undefined);

  if (!hasRowOrTownPricingProfit && typeof globalProfit === "number") {
    for (const st of serviceTypes) {
      base[st.id].profitMargin = globalProfit;
    }
  }

  const globalRemark =
    typeof parsed.remark === "string" && parsed.remark.trim()
      ? (parsed.remark as string)
      : "Standard";
  if (
    tpRoot &&
    typeof tpRoot === "object" &&
    !Array.isArray(tpRoot) &&
    rootServiceTypeId &&
    serviceTypes.some((s) => s.id === rootServiceTypeId)
  ) {
    base[rootServiceTypeId].remark = globalRemark;
    for (const st of serviceTypes) {
      if (st.id !== rootServiceTypeId) {
        base[st.id].remark = "Standard";
      }
    }
  } else {
    for (const st of serviceTypes) {
      base[st.id].remark = globalRemark;
    }
  }

  return base;
}

function validateValues(
  values: TownFormValues,
  serviceTypes: ServiceType[],
  /** When set, only validate this service tab (matches single-tariff submit). */
  activeServiceTypeId: string | null,
): FormikErrors<TownFormValues> {
  const errors: FormikErrors<TownFormValues> = {};
  const typesToValidate = activeServiceTypeId
    ? serviceTypes.filter((st) => st.id === activeServiceTypeId)
    : serviceTypes;

  const scErrors: FormikErrors<TownFormValues["serviceConfigs"]> = {};
  for (const st of typesToValidate) {
    const cfg = values.serviceConfigs[st.id];
    if (!cfg) continue;
    const one: FormikErrors<TownServiceConfig> = {};
    if (!cfg.remark?.trim()) one.remark = "Remark type is required";
    if (cfg.basePrice < 0) one.basePrice = "Must be ≥ 0";
    if (cfg.profitMargin < 0 || cfg.profitMargin > 100) {
      one.profitMargin = "Must be between 0 and 100";
    }
    if (Object.keys(one).length) scErrors[st.id] = one;
  }
  if (Object.keys(scErrors).length) errors.serviceConfigs = scErrors;
  return errors;
}

/** One POST/PATCH body for the active service type tab (backend `townPricing` shape). */
function buildPayloadForServiceType(
  values: TownFormValues,
  st: ServiceType,
): {
  name: string;
  scope: "TOWN";
  remark: string;
  serviceTypeId: string;
  townPricing: {
    baseFee: number;
    profitPct: number;
  };
} {
  const cfg = values.serviceConfigs[st.id];
  const shortName = cfg?.name?.trim() || st.name;
  const prefix = `${TARIFF_DISPLAY_NAME} - `;
  const name = shortName.startsWith(prefix)
    ? shortName
    : `${prefix}${shortName}`;
  return {
    name,
    scope: "TOWN",
    remark: (cfg?.remark ?? "").trim() || "Standard",
    serviceTypeId: st.id,
    townPricing: {
      baseFee: cfg?.basePrice ?? 0,
      profitPct: cfg?.profitMargin ?? 0,
    },
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

  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  useEffect(() => {
    if (serviceTypes.length && !activeTabId) {
      setActiveTabId(serviceTypes[0].id);
    }
  }, [serviceTypes, activeTabId]);

  /** PATCH submits the active tab’s service type; align tab with API when editing. */
  useEffect(() => {
    if (!isEditing || !parsedPrice || !serviceTypes.length) return;
    const sid = parsedPrice.serviceTypeId;
    if (typeof sid === "string" && serviceTypes.some((s) => s.id === sid)) {
      setActiveTabId(sid);
    }
  }, [isEditing, parsedPrice, serviceTypes]);

  const initialValues: TownFormValues = useMemo(() => {
    if (isEditing && parsedPrice) {
      return {
        serviceConfigs: hydrateFromParsedPrice(parsedPrice, serviceTypes),
      };
    }
    return {
      serviceConfigs: buildEmptyServiceConfigs(serviceTypes),
    };
  }, [isEditing, parsedPrice, serviceTypes]);

  const handleSubmit = async (values: TownFormValues) => {
    const submitServiceTypeId = activeTabId ?? serviceTypes[0]?.id;
    if (!submitServiceTypeId) {
      toast.error("Select a service type before saving.");
      return;
    }
    const st = serviceTypes.find((s) => s.id === submitServiceTypeId);
    if (!st) {
      toast.error("Select a service type before saving.");
      return;
    }
    try {
      setLoading(true);
      const payload = buildPayloadForServiceType(values, st);

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
          validate={(v) =>
            validateValues(
              v,
              serviceTypes,
              activeTabId ?? serviceTypes[0]?.id ?? null,
            )
          }
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

              <div className="mb-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Service types
                </h3>
                <div className="flex flex-wrap gap-2 pb-1">
                  {serviceTypes.map((st) => {
                    const active = activeTabId === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer border ${
                          active
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setActiveTabId(st.id)}
                      >
                        {st.name}
                      </button>
                    );
                  })}
                </div>
                <div
                  className="mt-3 mb-4 flex gap-2.5 rounded-lg border border-blue-200/80 bg-blue-50/90 px-3 py-2.5 text-sm text-blue-900"
                  role="status"
                >
                  <Info
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden
                  />
                  <p className="leading-snug">
                    One save sends one request for the selected service type
                    only—same pattern as regional/international pricing. Add
                    another town tariff by switching tabs and saving again.
                  </p>
                </div>
              </div>

              {serviceTypes.map((st) => {
                if (st.id !== activeTabId) return null;
                const cfg = values.serviceConfigs[st.id];
                if (!cfg) return null;
                const scErr = errors.serviceConfigs?.[st.id];
                const scTouch = touched.serviceConfigs?.[st.id];
                return (
                  <div
                    key={st.id}
                    className="space-y-6 border border-gray-100 rounded-lg p-4 bg-gray-50/50 mb-8"
                  >
                    <div>
                      <Label className="mb-1">Name</Label>
                      <Field
                        as={Input}
                        name={`serviceConfigs.${st.id}.name`}
                        placeholder={`e.g. ${st.name}`}
                        className="py-2 max-w-md"
                      />
                      {scErr?.name && scTouch?.name && (
                        <p className="text-red-500 text-sm mt-1">{scErr.name}</p>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Remark type
                      </h3>
                      <PricingShadcnSelect
                        id={`remark-${st.id}`}
                        label="Select remark type"
                        placeholder="Select remark type"
                        value={cfg.remark}
                        onValueChange={(v) =>
                          setFieldValue(`serviceConfigs.${st.id}.remark`, v)
                        }
                        onClose={() =>
                          setFieldTouched(`serviceConfigs.${st.id}.remark`, true)
                        }
                        options={[...remarkOptions]}
                        error={scErr?.remark}
                        touched={scTouch?.remark}
                      />
                    </div>

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

              <ActionButtons isEditing={isEditing} loading={loading} />
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}
