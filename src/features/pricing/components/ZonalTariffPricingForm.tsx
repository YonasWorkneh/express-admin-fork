"use client";

import {
  Formik,
  Form,
  Field,
  type FormikErrors,
  type FormikTouched,
} from "formik";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import SuccessModal from "@/components/common/SuccessModal";
import PricingFormHeader from "./PricingFormHeader";
import PricingShadcnSelect from "./PricingShadcnSelect";
import ActionButtons from "./ActionButtons";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import { Spinner } from "@/utils/spinner";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useOrderItemCategories } from "@/hooks/useOrderItemCategories";
import type { OrderItemCategory } from "@/types/orderCategories";
import type { ServiceType } from "@/types/serviceTypes";
import { Info, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getPricingCategoryTypeConfig,
  hasField,
  normalizeCategoryPricingMode,
  type CategoryPricingMode,
} from "@/config/orderItemCategoryPricingTypes";

/** One weight bracket row for UNIT_PRICE_WITH_BRACKET */
export type WeightBracketRow = {
  min: number;
  max: number;
  additional: number;
};

export type CategoryPricingValues = {
  pricingType: CategoryPricingMode;
  basePrice: number;
  /** UNIT_PRICE_WITH_BRACKET — one or more min / max / additional rows */
  brackets: WeightBracketRow[];
  /** VOLUME_OVERRIDE: volume divisor (must be greater than 0) */
  divisor: number;
  /** VOLUME_OVERRIDE: rate per kg */
  ratePerKg: number;
};

export type ServiceTabValues = {
  name: string;
  remark: string;
  additionalCost: number;
  profitMargin: number;
  categories: Record<string, CategoryPricingValues>;
};

export type ZonalTariffFormValues = {
  serviceConfigs: Record<string, ServiceTabValues>;
};

const remarkOptions = [
  { value: "Standard", label: "Standard" },
  { value: "Weekend", label: "Weekend" },
  { value: "Holiday", label: "Holiday" },
  { value: "Event", label: "Event" },
];

const pricingTypeOptions: { value: CategoryPricingMode; label: string }[] = [
  { value: "UNIT_PRICE", label: "Unit price" },
  { value: "UNIT_PRICE_WITH_BRACKET", label: "Unit price with bracket" },
  { value: "VOLUME_OVERRIDE", label: "Volume override" },
];

function emptyCategoryValues(): CategoryPricingValues {
  return {
    pricingType: "UNIT_PRICE",
    basePrice: 0,
    brackets: [{ min: 0, max: 0, additional: 0 }],
    divisor: 1,
    ratePerKg: 0,
  };
}

function buildEmptyServiceConfigs(
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
): Record<string, ServiceTabValues> {
  const out: Record<string, ServiceTabValues> = {};
  for (const st of serviceTypes) {
    const cats: Record<string, CategoryPricingValues> = {};
    for (const cat of categories) {
      cats[cat.id] = emptyCategoryValues();
    }
    out[st.id] = {
      name: "",
      remark: "Standard",
      additionalCost: 0,
      profitMargin: 0,
      categories: cats,
    };
  }
  return out;
}

const LEGACY_SERVICE_TYPE_KEYS = ["STANDARD", "EXPRESS", "OVERNIGHT"] as const;

/** Legacy API may send minKg/maxKg/rate or min/max/add */
function mapLegacyBracketsFull(brackets: unknown): WeightBracketRow[] | null {
  if (!Array.isArray(brackets) || brackets.length === 0) return null;
  return brackets.map((raw) => {
    const b = raw as {
      minKg?: number;
      maxKg?: number;
      rate?: number;
      min?: number;
      max?: number;
      add?: number;
      additional?: number;
    };
    return {
      min: b.minKg ?? b.min ?? 0,
      max: b.maxKg ?? b.max ?? 0,
      additional: b.rate ?? b.add ?? b.additional ?? 0,
    };
  });
}

function hydrateOneTariffTab(
  tab: ServiceTabValues,
  t: Record<string, unknown>,
  tariffDisplayName: string,
) {
  if (typeof t.name === "string" && t.name.trim()) {
    const n = t.name.trim();
    const prefix = `${tariffDisplayName} - `;
    tab.name = n.startsWith(prefix) ? n.slice(prefix.length) : n;
  }
  if (typeof t.remark === "string" && t.remark.trim()) {
    tab.remark = t.remark;
  }
  if (typeof t.additionalCost === "number") {
    tab.additionalCost = t.additionalCost;
  }
  if (typeof t.profitMargin === "number") {
    tab.profitMargin = t.profitMargin;
  }

  const cp = t.categoryPricing as Array<Record<string, unknown>> | undefined;
  if (!cp?.length) return;

  let inferredProfit: number | undefined;
  let inferredAirport: number | undefined;

  for (const item of cp) {
    const cid = item.categoryId as string | undefined;
    if (!cid || !tab.categories[cid]) continue;
    const cv = tab.categories[cid];
    const type = normalizeCategoryPricingMode(item.type as string | undefined);
    cv.pricingType = type;
    const config = (item.config || {}) as Record<string, unknown>;
    if (type === "UNIT_PRICE") {
      cv.basePrice =
        typeof config.unitPrice === "number" ? config.unitPrice : 0;
    } else if (type === "UNIT_PRICE_WITH_BRACKET") {
      cv.basePrice =
        typeof config.unitPrice === "number" ? config.unitPrice : 0;
      const rawBrackets = config.brackets as
        | Array<{
            min?: number;
            max?: number;
            add?: number;
            additional?: number;
          }>
        | undefined;
      if (rawBrackets?.length) {
        cv.brackets = rawBrackets.map((b) => ({
          min: b.min ?? 0,
          max: b.max ?? 0,
          additional:
            typeof b.add === "number" ? b.add : (b.additional ?? 0),
        }));
      }
    } else if (type === "VOLUME_OVERRIDE") {
      cv.divisor = typeof config.divisor === "number" ? config.divisor : 1;
      cv.ratePerKg =
        typeof config.ratePerKg === "number" ? config.ratePerKg : 0;
    }

    if (
      typeof item.profitPerc === "number" &&
      inferredProfit === undefined
    ) {
      inferredProfit = item.profitPerc;
    }
    if (
      typeof item.airportFeePerKg === "number" &&
      inferredAirport === undefined
    ) {
      inferredAirport = item.airportFeePerKg;
    }
  }

  if (typeof t.profitMargin !== "number" && inferredProfit !== undefined) {
    tab.profitMargin = inferredProfit;
  }
  if (typeof t.additionalCost !== "number" && inferredAirport !== undefined) {
    tab.additionalCost = inferredAirport;
  }
}

function hydrateFromParsedPrice(
  parsed: Record<string, unknown> | null,
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
  tariffDisplayName: string,
): Record<string, ServiceTabValues> {
  const base = buildEmptyServiceConfigs(serviceTypes, categories);
  if (!parsed) return base;

  /** GET /pricing/tariff/:id — rows in categoryPricing carry serviceTypeId; junction serviceTypes[] optional */
  if (Array.isArray(parsed.categoryPricing) && parsed.categoryPricing.length) {
    const cp = parsed.categoryPricing as Record<string, unknown>[];
    const sidFromRow =
      typeof cp[0]?.serviceTypeId === "string"
        ? (cp[0].serviceTypeId as string)
        : undefined;
    const junction = parsed.serviceTypes as Record<string, unknown>[] | undefined;
    const sidFromJunction =
      Array.isArray(junction) &&
      junction[0] &&
      typeof junction[0].serviceTypeId === "string"
        ? (junction[0].serviceTypeId as string)
        : undefined;
    const derivedServiceTypeId = sidFromRow ?? sidFromJunction;
    if (typeof derivedServiceTypeId === "string" && derivedServiceTypeId.trim()) {
      const enriched: Record<string, unknown> = {
        ...parsed,
        serviceTypeId: derivedServiceTypeId,
      };
      const st = serviceTypes.find((s) => s.id === derivedServiceTypeId);
      if (st) {
        hydrateOneTariffTab(base[st.id], enriched, tariffDisplayName);
      }
      return base;
    }
  }

  if (
    typeof parsed.serviceTypeId === "string" &&
    parsed.serviceTypeId.trim() &&
    Array.isArray(parsed.categoryPricing)
  ) {
    const st = serviceTypes.find((s) => s.id === parsed.serviceTypeId);
    if (st) {
      hydrateOneTariffTab(base[st.id], parsed, tariffDisplayName);
    }
    return base;
  }

  const tariffsRaw = parsed.tariffs;
  if (Array.isArray(tariffsRaw) && tariffsRaw.length > 0) {
    for (const raw of tariffsRaw) {
      const t = raw as Record<string, unknown>;
      const stKey = (t.serviceType as string) || "STANDARD";
      const idx = LEGACY_SERVICE_TYPE_KEYS.indexOf(
        stKey as (typeof LEGACY_SERVICE_TYPE_KEYS)[number],
      );
      const st =
        idx >= 0 && serviceTypes[idx]
          ? serviceTypes[idx]
          : serviceTypes[0];
      if (!st) continue;
      hydrateOneTariffTab(base[st.id], t, tariffDisplayName);
    }
    return base;
  }

  if (
    parsed.categoryPricing &&
    Array.isArray(parsed.categoryPricing) &&
    typeof parsed.serviceTypeId !== "string"
  ) {
    const stKey = (parsed.serviceType as string) || "STANDARD";
    const idx = LEGACY_SERVICE_TYPE_KEYS.indexOf(
      stKey as (typeof LEGACY_SERVICE_TYPE_KEYS)[number],
    );
    const st =
      idx >= 0 && serviceTypes[idx]
        ? serviceTypes[idx]
        : serviceTypes[0];
    if (st) {
      hydrateOneTariffTab(base[st.id], parsed, tariffDisplayName);
    }
    return base;
  }

  const legacyOrder = ["STANDARD", "EXPRESS", "OVERNIGHT"] as const;
  const savedList = (parsed.serviceTypes as Record<string, unknown>[]) || [];

  serviceTypes.forEach((st, index) => {
    const legacyType = legacyOrder[index];
    const byId = savedList.find(
      (s) =>
        s?.serviceTypeId === st.id ||
        s?.id === st.id ||
        (typeof s?.serviceTypeId === "string" && s.serviceTypeId === st.id),
    );
    const byLegacy =
      !byId && legacyType
        ? savedList.find((s) => s?.serviceType === legacyType)
        : null;
    const stData = (byId || byLegacy) as Record<string, unknown> | undefined;
    if (!stData) return;

    const tab = base[st.id];
    if (typeof stData.name === "string" && stData.name.trim()) {
      tab.name = stData.name;
    }
    if (typeof stData.remark === "string" && stData.remark.trim()) {
      tab.remark = stData.remark;
    }
    const profit =
      (stData.profitMargin as { percentage?: number } | undefined)?.percentage ??
      (typeof stData.profit === "number" ? stData.profit : undefined) ??
      (typeof parsed.profit === "number" ? parsed.profit : undefined) ??
      (parsed.profitMargin as { percentage?: number } | undefined)?.percentage;
    if (typeof profit === "number") tab.profitMargin = profit;
    if (typeof stData.additionalCost === "number") {
      tab.additionalCost = stData.additionalCost;
    }

    const itemCats = stData.itemCategories as
      | Array<Record<string, unknown>>
      | undefined;
    if (itemCats?.length) {
      for (const row of itemCats) {
        const cid = row.categoryId as string | undefined;
        if (!cid || !tab.categories[cid]) continue;
        const cv = tab.categories[cid];
        const pt = normalizeCategoryPricingMode(
          (row.pricingType ?? row.categoryType) as string | undefined,
        );
        cv.pricingType = pt;
        if (typeof row.basePrice === "number") cv.basePrice = row.basePrice;
        else if (typeof row.baseFee === "number") {
          cv.basePrice = row.baseFee;
        }
        if (typeof row.divisor === "number") cv.divisor = row.divisor;
        if (typeof row.ratePerKg === "number") cv.ratePerKg = row.ratePerKg;
        if (
          pt === "VOLUME_OVERRIDE" &&
          typeof row.volumeOverride === "number" &&
          typeof row.ratePerKg !== "number"
        ) {
          cv.ratePerKg = row.volumeOverride;
        }
        const wb = row.weightBrackets ?? row.brackets;
        const fromWb = mapLegacyBracketsFull(wb);
        if (pt === "UNIT_PRICE_WITH_BRACKET") {
          if (fromWb?.length) {
            cv.brackets = fromWb;
          } else if (
            typeof row.min === "number" ||
            typeof row.max === "number" ||
            typeof row.additional === "number"
          ) {
            cv.brackets = [
              {
                min: typeof row.min === "number" ? row.min : 0,
                max: typeof row.max === "number" ? row.max : 0,
                additional:
                  typeof row.additional === "number" ? row.additional : 0,
              },
            ];
          }
        }
      }
    } else {
      const baseFee = typeof stData.baseFee === "number" ? stData.baseFee : 0;
      const af = stData.airportFee as { brackets?: unknown } | undefined;
      const legacyRows = mapLegacyBracketsFull(af?.brackets);
      const firstCat = categories[0];
      if (firstCat && tab.categories[firstCat.id]) {
        tab.categories[firstCat.id].basePrice = baseFee;
        if (legacyRows?.length) {
          tab.categories[firstCat.id].pricingType = "UNIT_PRICE_WITH_BRACKET";
          tab.categories[firstCat.id].brackets = legacyRows;
        }
      }
    }
  });

  return base;
}

function validateValues(
  values: ZonalTariffFormValues,
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
  /** When set, only validate this service tab (matches single-tariff submit). */
  activeServiceTypeId: string | null,
): FormikErrors<ZonalTariffFormValues> {
  const errors: FormikErrors<ZonalTariffFormValues> = {};
  const scErrors: FormikErrors<ZonalTariffFormValues["serviceConfigs"]> = {};

  const typesToValidate = activeServiceTypeId
    ? serviceTypes.filter((st) => st.id === activeServiceTypeId)
    : serviceTypes;

  for (const st of typesToValidate) {
    const cfg = values.serviceConfigs[st.id];
    if (!cfg) continue;
    const one: FormikErrors<ServiceTabValues> = {};
    if (!cfg.remark?.trim()) one.remark = "Remark type is required";
    if (cfg.additionalCost < 0) one.additionalCost = "Must be ≥ 0";
    if (cfg.profitMargin < 0 || cfg.profitMargin > 100) {
      one.profitMargin = "Must be between 0 and 100";
    }

    const catErrs: FormikErrors<ServiceTabValues["categories"]> = {};
    for (const cat of categories) {
      const cv = cfg.categories[cat.id];
      if (!cv) continue;
      const mode = normalizeCategoryPricingMode(cv.pricingType);
      const typeCfg = getPricingCategoryTypeConfig(mode);
      const ce: FormikErrors<CategoryPricingValues> = {};

      if (hasField(typeCfg, "basePrice") && cv.basePrice < 0) {
        ce.basePrice = "Must be ≥ 0";
      }
      if (mode === "UNIT_PRICE_WITH_BRACKET") {
        const rows = cv.brackets?.length
          ? cv.brackets
          : [{ min: 0, max: 0, additional: 0 }];
        const bracketFieldErrs: FormikErrors<WeightBracketRow>[] = [];
        rows.forEach((b, idx) => {
          const be: FormikErrors<WeightBracketRow> = {};
          if (b.min < 0) be.min = "Must be ≥ 0";
          if (b.max < 0) be.max = "Must be ≥ 0";
          if (b.additional < 0) be.additional = "Must be ≥ 0";
          if (b.max < b.min && b.max !== 0 && b.min !== 0) {
            be.max = "Must be ≥ min";
          }
          if (Object.keys(be).length) bracketFieldErrs[idx] = be;
        });
        if (bracketFieldErrs.some((e) => e && Object.keys(e).length > 0)) {
          ce.brackets = bracketFieldErrs;
        }
      }
      if (hasField(typeCfg, "divisor")) {
        if (cv.divisor <= 0) ce.divisor = "Must be greater than 0";
      }
      if (hasField(typeCfg, "ratePerKg") && cv.ratePerKg < 0) {
        ce.ratePerKg = "Must be ≥ 0";
      }

      if (Object.keys(ce).length) catErrs[cat.id] = ce;
    }
    if (Object.keys(catErrs).length) one.categories = catErrs;
    if (Object.keys(one).length) scErrors[st.id] = one;
  }
  if (Object.keys(scErrors).length) errors.serviceConfigs = scErrors;
  return errors;
}

function buildCategoryPricingEntry(
  cat: OrderItemCategory,
  cv: CategoryPricingValues,
): { categoryId: string; type: CategoryPricingMode; config: Record<string, unknown> } {
  const mode = normalizeCategoryPricingMode(cv.pricingType);

  if (mode === "UNIT_PRICE") {
    return {
      categoryId: cat.id,
      type: "UNIT_PRICE",
      config: { unitPrice: cv.basePrice },
    };
  }

  if (mode === "UNIT_PRICE_WITH_BRACKET") {
    const rows = cv.brackets?.length
      ? cv.brackets
      : [{ min: 0, max: 0, additional: 0 }];
    return {
      categoryId: cat.id,
      type: "UNIT_PRICE_WITH_BRACKET",
      config: {
        unitPrice: cv.basePrice,
        brackets: rows.map((b) => ({
          min: b.min,
          max: b.max,
          add: b.additional,
        })),
      },
    };
  }

  return {
    categoryId: cat.id,
    type: "VOLUME_OVERRIDE",
    config: {
      divisor: cv.divisor,
      ratePerKg: cv.ratePerKg,
    },
  };
}

/** Backend tariff payload: scope, serviceTypeId, name, categoryPricing[], … */
function buildTariffPayloadForServiceType(
  st: ServiceType,
  cfg: ServiceTabValues,
  categories: OrderItemCategory[],
  shippingScope: "INTERNATIONAL" | "REGIONAL",
  tariffDisplayName: string,
): {
  scope: "INTERNATIONAL" | "REGIONAL";
  serviceTypeId: string;
  name: string;
  categoryPricing: ReturnType<typeof buildCategoryPricingEntry>[];
  remark: string;
  additionalCost: number;
  profitMargin: number;
} {
  const categoryPricing = categories.map((cat) =>
    buildCategoryPricingEntry(cat, cfg.categories[cat.id]),
  );

  const shortName = cfg.name?.trim() || st.name;
  const prefix = `${tariffDisplayName} - `;
  const name = shortName.startsWith(prefix)
    ? shortName
    : `${prefix}${shortName}`;

  return {
    scope: shippingScope,
    serviceTypeId: st.id,
    name,
    categoryPricing,
    remark: cfg.remark,
    additionalCost: cfg.additionalCost,
    profitMargin: cfg.profitMargin,
  };
}

function buildPayload(
  values: ZonalTariffFormValues,
  shippingScope: "INTERNATIONAL" | "REGIONAL",
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
  serviceTypeId: string,
  tariffDisplayName: string,
): ReturnType<typeof buildTariffPayloadForServiceType> {
  const st = serviceTypes.find((s) => s.id === serviceTypeId);
  const cfg = st ? values.serviceConfigs[st.id] : undefined;
  if (!st || !cfg) {
    throw new Error("Missing service type configuration for payload");
  }
  return buildTariffPayloadForServiceType(
    st,
    cfg,
    categories,
    shippingScope,
    tariffDisplayName,
  );
}

type ZonalTariffPricingFormProps = {
  shippingScope: "INTERNATIONAL" | "REGIONAL";
  tariffDisplayName: string;
  headerTitle: { create: string; edit: string };
  prefetchedTariff?: Record<string, unknown> | null;
  enableTariffListProbe?: boolean;
};

export default function ZonalTariffPricingForm({
  shippingScope,
  tariffDisplayName,
  headerTitle,
  prefetchedTariff = null,
  enableTariffListProbe = true,
}: ZonalTariffPricingFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [parsedPrice, setParsedPrice] = useState<Record<string, unknown> | null>(
    null,
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeCategoryByService, setActiveCategoryByService] = useState<
    Record<string, string>
  >({});

  const { data: serviceTypes = [], isLoading: loadingST, isError: errST } =
    useServiceTypes();
  const { data: categories = [], isLoading: loadingCat, isError: errCat } =
    useOrderItemCategories();

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
            `[ZonalTariffPricingForm][${shippingScope}] GET /pricing/tariff response:`,
            res.data,
          );
        }
      } catch (e) {
        if (!cancelled) {
          console.log(
            `[ZonalTariffPricingForm][${shippingScope}] GET /pricing/tariff error:`,
            e,
          );
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [shippingScope, enableTariffListProbe]);

  const isEditing = Boolean(parsedPrice && parsedPrice.id);

  useEffect(() => {
    if (serviceTypes.length && !activeTabId) {
      setActiveTabId(serviceTypes[0].id);
    }
  }, [serviceTypes, activeTabId]);

  /** PATCH submits the active tab’s service type; align tab with API when editing one ST. */
  useEffect(() => {
    if (!isEditing || !parsedPrice || !serviceTypes.length) return;
    const sid = parsedPrice.serviceTypeId;
    if (typeof sid === "string" && serviceTypes.some((s) => s.id === sid)) {
      setActiveTabId(sid);
    }
  }, [isEditing, parsedPrice, serviceTypes]);

  useEffect(() => {
    if (!categories.length || !serviceTypes.length) return;
    setActiveCategoryByService((prev) => {
      const next = { ...prev };
      for (const st of serviceTypes) {
        if (!next[st.id]) next[st.id] = categories[0].id;
      }
      return next;
    });
  }, [serviceTypes, categories]);

  const initialValues: ZonalTariffFormValues = useMemo(() => {
    const empty = buildEmptyServiceConfigs(serviceTypes, categories);
    if (isEditing && parsedPrice) {
      return {
        serviceConfigs: hydrateFromParsedPrice(
          parsedPrice,
          serviceTypes,
          categories,
          tariffDisplayName,
        ),
      };
    }
    return { serviceConfigs: empty };
  }, [isEditing, parsedPrice, serviceTypes, categories, tariffDisplayName]);



  const handleSubmit = async (values: ZonalTariffFormValues) => {
    const submitServiceTypeId = activeTabId ?? serviceTypes[0]?.id;
    if (!submitServiceTypeId) {
      toast.error("Select a service type before saving.");
      return;
    }
    try {
      setLoading(true);
      const payload = buildPayload(
        values,
        shippingScope,
        serviceTypes,
        categories,
        submitServiceTypeId,
        tariffDisplayName,
      );

      if (isEditing && parsedPrice?.id) {
        await api.patch(`/pricing/tariff/${parsedPrice.id as string}`, payload);
        toast.success(
          shippingScope === "INTERNATIONAL"
            ? "International pricing updated successfully!"
            : "Regional pricing updated successfully!",
        );
      } else {
        await api.post("/pricing/tariff", payload);
        toast.success(
          shippingScope === "INTERNATIONAL"
            ? "International pricing saved successfully!"
            : "Regional pricing saved successfully!",
        );
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

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    navigate("/pricing");
  };

  const dataReady =
    !loadingST &&
    !loadingCat &&
    !errST &&
    !errCat &&
    serviceTypes.length > 0;

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

      {(loadingST || loadingCat) && (
        <div className="flex items-center justify-center py-20 text-gray-600">
          <Spinner className="h-8 w-8 text-blue-600 mr-2" />
          Loading service types and categories…
        </div>
      )}

      {(errST || errCat) && (
        <p className="text-red-600 text-sm py-8">
          Could not load service types or item categories. Please refresh.
        </p>
      )}

      {!loadingST && !loadingCat && serviceTypes.length === 0 && (
        <p className="text-amber-700 text-sm py-8">
          No service types found. Add service types under Service Type Management
          first.
        </p>
      )}

      {categories.length === 0 && !loadingCat && !errCat && (
        <p className="text-amber-700 text-sm py-4">
          No order item categories found. Add categories under Orders → Item
          categories.
        </p>
      )}

      {dataReady && (
        <Formik<ZonalTariffFormValues>
          enableReinitialize
          initialValues={initialValues}
          validate={(v) =>
            validateValues(
              v,
              serviceTypes,
              categories,
              activeTabId ?? serviceTypes[0]?.id ?? null,
            )
          }
          onSubmit={handleSubmit}
        >
          {({
          values,
          setFieldValue,
          setFieldTouched,
          errors,
          touched,
        }) => (
            <Form className={loading ? "pointer-events-none opacity-50" : ""}>
              <PricingFormHeader
                title={isEditing ? headerTitle.edit : headerTitle.create}
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
              </div>

              {serviceTypes.map((st) => {
                if (st.id !== activeTabId) return null;
                const cfg = values.serviceConfigs[st.id];
                if (!cfg) return null;
                const scErr = errors.serviceConfigs?.[st.id];
                const scTouch = touched.serviceConfigs?.[st.id];
                const activeCatId =
                  activeCategoryByService[st.id] ?? categories[0]?.id;
                const activeCat = categories.find((c) => c.id === activeCatId);

                return (
                  <div
                    key={st.id}
                    className="space-y-6 border border-gray-100 rounded-lg p-4 bg-gray-50/50"
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
                        options={remarkOptions}
                        error={scErr?.remark}
                        touched={scTouch?.remark}
                      />
                    </div>

                    {categories.length > 0 && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-2">
                            Item categories
                          </h3>
                          <div
                            className="mb-3 flex gap-2.5 rounded-lg border border-blue-200/80 bg-blue-50/90 px-3 py-2.5 text-sm text-blue-900"
                            role="status"
                          >
                            <Info
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden
                            />
                            <p className="leading-snug">
                              Remember to specify price configuration for each
                              category.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                              const active = activeCatId === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                                    active
                                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                      : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50/60"
                                  }`}
                                  onClick={() =>
                                    setActiveCategoryByService((prev) => ({
                                      ...prev,
                                      [st.id]: cat.id,
                                    }))
                                  }
                                >
                                  {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {activeCat && (
                          <CategoryPricingPanel
                            cat={activeCat}
                            prefix={`serviceConfigs.${st.id}.categories.${activeCat.id}`}
                            values={cfg.categories[activeCat.id]}
                            catErr={scErr?.categories?.[activeCat.id]}
                            catTouch={
                              touched.serviceConfigs?.[st.id]?.categories?.[
                                activeCat.id
                              ]
                            }
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                          />
                        )}
                      </>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 border-t border-gray-200 pt-4">
                      <div>
                        <Label className="mb-1">Additional cost ($)</Label>
                        <Field
                          as={Input}
                          type="number"
                          step="0.01"
                          name={`serviceConfigs.${st.id}.additionalCost`}
                          className="py-2"
                        />
                        {scErr?.additionalCost && scTouch?.additionalCost && (
                          <p className="text-red-500 text-sm mt-1">
                            {scErr.additionalCost}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="mb-1">Profit margin (%)</Label>
                        <Field
                          as={Input}
                          type="number"
                          step="0.01"
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

                    <ActionButtons
                      isEditing={isEditing}
                      loading={loading}
                      embedded
                    />
                  </div>
                );
              })}
            </Form>
          )}
        </Formik>
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={successMessage}
      />
    </div>
  );
}

type CategoryPricingPanelProps = {
  cat: OrderItemCategory;
  prefix: string;
  values: CategoryPricingValues;
  catErr?: FormikErrors<CategoryPricingValues>;
  catTouch?: FormikTouched<CategoryPricingValues>;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
};

function CategoryPricingPanel({
  prefix,
  values,
  catErr,
  catTouch,
  setFieldValue,
  setFieldTouched,
  cat,
}: CategoryPricingPanelProps) {
  const mode = normalizeCategoryPricingMode(values?.pricingType);
  const typeCfg = getPricingCategoryTypeConfig(mode);
  const bracketFieldErrors = catErr?.brackets as
    | FormikErrors<WeightBracketRow>[]
    | undefined;
  const bracketFieldTouched = catTouch?.brackets as
    | FormikTouched<WeightBracketRow>[]
    | undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h4 className="text-base font-semibold text-gray-900">{cat.name}</h4>
        <span className="text-xs text-gray-500">{typeCfg.label}</span>
      </div>

      <div>
        <Label className="mb-1">Pricing type</Label>
        <PricingShadcnSelect
          id={`pricing-type-${cat.id}`}
          label=""
          placeholder="Select pricing type"
          value={values.pricingType}
          onValueChange={(v) => {
            setFieldValue(`${prefix}.pricingType`, v);
            if (v === "UNIT_PRICE_WITH_BRACKET") {
              const cur = values.brackets;
              if (!cur?.length) {
                setFieldValue(`${prefix}.brackets`, [
                  { min: 0, max: 0, additional: 0 },
                ]);
              }
            }
            setFieldTouched(`${prefix}.pricingType`, true);
          }}
          onClose={() => setFieldTouched(`${prefix}.pricingType`, true)}
          options={pricingTypeOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          error={catErr?.pricingType as string | undefined}
          touched={Boolean(catTouch?.pricingType)}
        />
      </div>

      {hasField(typeCfg, "basePrice") && (
        <div>
          <Label className="mb-1">Base price ($)</Label>
          <Field
            as={Input}
            type="number"
            step="0.01"
            name={`${prefix}.basePrice`}
            className="py-2 max-w-xs"
          />
          {catErr?.basePrice && catTouch?.basePrice && (
            <p className="text-red-500 text-sm mt-1">{catErr.basePrice}</p>
          )}
        </div>
      )}

      {mode === "UNIT_PRICE_WITH_BRACKET" && hasField(typeCfg, "min") && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-800">
            Brackets
          </Label>
          {(values.brackets ?? []).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Bracket {i + 1}
                </span>
                {(values.brackets ?? []).length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                    onClick={() => {
                      const next = [...(values.brackets ?? [])];
                      next.splice(i, 1);
                      setFieldValue(`${prefix}.brackets`, next);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1">Min</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.brackets.${i}.min`}
                    className="py-2 w-full"
                  />
                  {bracketFieldErrors?.[i]?.min &&
                    bracketFieldTouched?.[i]?.min && (
                      <p className="text-red-500 text-sm mt-1">
                        {bracketFieldErrors[i]?.min}
                      </p>
                    )}
                </div>
                <div>
                  <Label className="mb-1">Max</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.brackets.${i}.max`}
                    className="py-2 w-full"
                  />
                  {bracketFieldErrors?.[i]?.max &&
                    bracketFieldTouched?.[i]?.max && (
                      <p className="text-red-500 text-sm mt-1">
                        {bracketFieldErrors[i]?.max}
                      </p>
                    )}
                </div>
                <div>
                  <Label className="mb-1">Additional ($)</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.brackets.${i}.additional`}
                    className="py-2 w-full"
                  />
                  {bracketFieldErrors?.[i]?.additional &&
                    bracketFieldTouched?.[i]?.additional && (
                      <p className="text-red-500 text-sm mt-1">
                        {bracketFieldErrors[i]?.additional}
                      </p>
                    )}
                </div>
              </div>
            </div>
          ))}
          <div className="pt-1">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 cursor-pointer w-full sm:w-auto"
              onClick={() => {
                setFieldValue(`${prefix}.brackets`, [
                  ...(values.brackets ?? []),
                  { min: 0, max: 0, additional: 0 },
                ]);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Add bracket
            </button>
          </div>
        </div>
      )}

      {hasField(typeCfg, "divisor") && (
        <div>
          <Label className="mb-1">Divisor</Label>
          <Field
            as={Input}
            type="number"
            step="0.01"
            name={`${prefix}.divisor`}
            className="py-2 max-w-xs"
          />
          <p className="text-xs text-gray-500 mt-1">
            Volume divisor (must be greater than zero).
          </p>
          {catErr?.divisor && catTouch?.divisor && (
            <p className="text-red-500 text-sm mt-1">{catErr.divisor}</p>
          )}
        </div>
      )}

      {hasField(typeCfg, "ratePerKg") && (
        <div>
          <Label className="mb-1">Rate per kg ($)</Label>
          <Field
            as={Input}
            type="number"
            step="0.01"
            name={`${prefix}.ratePerKg`}
            className="py-2 max-w-xs"
          />
          {catErr?.ratePerKg && catTouch?.ratePerKg && (
            <p className="text-red-500 text-sm mt-1">{catErr.ratePerKg}</p>
          )}
        </div>
      )}
    </div>
  );
}
