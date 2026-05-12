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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Plus } from "lucide-react";
import {
  getPricingCategoryTypeConfig,
  hasField,
  normalizeCategoryPricingMode,
  type CategoryPricingMode,
} from "@/config/orderItemCategoryPricingTypes";
import {
  hydrateTabRemarkDates,
  PricingRemarkDateFields,
  remarkRequiresDateRange,
  ymdToApiEndOfDayIso,
  ymdToApiIso,
} from "./PricingRemarkDateFields";

const TARIFF_DISPLAY_NAME = "Town Delivery Tariff";

const LEGACY_SERVICE_TYPE_KEYS = ["STANDARD", "EXPRESS", "OVERNIGHT"] as const;

/** UI select values → API `remarkType` (ALL_CAPS, multi-word SNAKE_CASE). */
export function remarkTypeToApi(uiRemark: string): string {
  const t = uiRemark.trim();
  if (!t) return "STANDARD";
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase())
    .join("_");
}

/** API `remarkType` → Title Case for UI selects. */
export function remarkTypeFromApi(api: string | undefined): string {
  if (!api?.trim()) return "Standard";
  const parts = api.trim().toLowerCase().split(/_+/).filter(Boolean);
  if (!parts.length) return "Standard";
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function hydrateTownTabNameFromTariff(
  tab: TownServiceTabValues,
  tariffName: unknown,
) {
  if (typeof tariffName === "string" && tariffName.trim()) {
    const n = tariffName.trim();
    const prefix = `${TARIFF_DISPLAY_NAME} - `;
    tab.name = n.startsWith(prefix) ? n.slice(prefix.length) : n;
  }
}

export type TownWeightRangeRow = {
  min: number;
  max: number;
  perkg: number;
};

export type TownBracketRow = {
  min: number;
  max: number;
  additional: number;
};

export type TownCategoryPricingValues = {
  pricingType: CategoryPricingMode;
  basePrice: number;
  additionalCost: number;
  /** Decimal e.g. 0.25 — API `profitMargin` on each category config */
  profitMargin: number;
  weightRanges: TownWeightRangeRow[];
  brackets: TownBracketRow[];
  divisor: number;
  ratePerKg: number;
};

/** @deprecated Use `TownServiceTabValues` — kept for any external imports */
export type TownServiceConfig = TownServiceTabValues;

export type TownServiceTabValues = {
  name: string;
  remark: string;
  /** `yyyy-MM-dd` when remark is Holiday / Event */
  startDate: string;
  endDate: string;
  categories: Record<string, TownCategoryPricingValues>;
};

export type TownFormValues = {
  serviceConfigs: Record<string, TownServiceTabValues>;
};

function emptyTownCategoryValues(): TownCategoryPricingValues {
  return {
    pricingType: "UNIT_PRICE",
    basePrice: 0,
    additionalCost: 0,
    profitMargin: 0,
    weightRanges: [{ min: 0, max: 0, perkg: 0 }],
    brackets: [{ min: 0, max: 0, additional: 0 }],
    divisor: 1,
    ratePerKg: 0,
  };
}

function buildEmptyServiceConfigs(
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
): Record<string, TownServiceTabValues> {
  const out: Record<string, TownServiceTabValues> = {};
  for (const st of serviceTypes) {
    const cats: Record<string, TownCategoryPricingValues> = {};
    for (const cat of categories) {
      cats[cat.id] = emptyTownCategoryValues();
    }
    out[st.id] = {
      name: "",
      remark: "Standard",
      startDate: "",
      endDate: "",
      categories: cats,
    };
  }
  return out;
}

const remarkOptions = [
  { value: "Standard", label: "Standard" },
  { value: "Weekend", label: "Weekend" },
  { value: "Holiday", label: "Holiday" },
  { value: "Event", label: "Event" },
] as const;

const townPricingTypeOptions: { value: CategoryPricingMode; label: string }[] =
  [
    { value: "UNIT_PRICE", label: "Unit price" },
    {
      value: "UNIT_PRICE_WEIGHT_RANGE",
      label: "Unit price + weight brackets",
    },
    { value: "VOLUME_OVERRIDE", label: "Volume override" },
    { value: "WEIGHT_RANGE", label: "Weight range" },
  ];

const TOWN_CATEGORY_MODES: CategoryPricingMode[] = [
  "UNIT_PRICE",
  "UNIT_PRICE_WEIGHT_RANGE",
  "VOLUME_OVERRIDE",
  "WEIGHT_RANGE",
];

function normalizeTownCategoryMode(
  raw: string | undefined,
): CategoryPricingMode {
  const m = normalizeCategoryPricingMode(raw);
  return TOWN_CATEGORY_MODES.includes(m) ? m : "UNIT_PRICE";
}

/** Omit UNIT_PRICE API rows when unit price, add-on fee, and margin are all left at zero. */
function hasSpecifiedTownUnitPricing(cv: TownCategoryPricingValues): boolean {
  return (
    cv.basePrice !== 0 ||
    cv.additionalCost !== 0 ||
    cv.profitMargin !== 0
  );
}

function hydrateOneTownTab(
  tab: TownServiceTabValues,
  t: Record<string, unknown>,
  tariffDisplayName: string,
) {
  if (typeof t.name === "string" && t.name.trim()) {
    const n = t.name.trim();
    const prefix = `${tariffDisplayName} - `;
    tab.name = n.startsWith(prefix) ? n.slice(prefix.length) : n;
  }
  const remarkRaw =
    typeof t.remarkType === "string" && t.remarkType.trim()
      ? remarkTypeFromApi(t.remarkType as string)
      : typeof t.remark === "string" && t.remark.trim()
        ? (t.remark as string)
        : null;
  if (remarkRaw) tab.remark = remarkRaw;
  hydrateTabRemarkDates(tab, t);

  const cp = t.categoryPricing as Array<Record<string, unknown>> | undefined;
  if (!cp?.length) return;

  for (const item of cp) {
    const cid = item.categoryId as string | undefined;
    if (!cid || !tab.categories[cid]) continue;
    const cv = tab.categories[cid];
    let type = normalizeTownCategoryMode(item.type as string | undefined);
    cv.pricingType = type;
    const config = (item.config || {}) as Record<string, unknown>;
    if (typeof config.additionalCost === "number")
      cv.additionalCost = config.additionalCost;
    if (typeof config.profitMargin === "number")
      cv.profitMargin = config.profitMargin;

    if (type === "UNIT_PRICE") {
      cv.basePrice =
        typeof config.unitPrice === "number" ? config.unitPrice : 0;
    } else if (type === "VOLUME_OVERRIDE") {
      cv.divisor = typeof config.divisor === "number" ? config.divisor : 1;
      cv.ratePerKg =
        typeof config.ratePerKg === "number" ? config.ratePerKg : 0;
    } else if (type === "WEIGHT_RANGE") {
      if (typeof config.unitPrice === "number") {
        cv.basePrice = config.unitPrice;
      }
      const rawRanges =
        (config.ranges as
          | Array<{
              min?: number;
              max?: number;
              perKg?: number;
              perkg?: number;
            }>
          | undefined) ??
        (config.range as
          | Array<{
              min?: number;
              max?: number;
              perKg?: number;
              perkg?: number;
            }>
          | undefined);
      if (rawRanges?.length) {
        cv.weightRanges = rawRanges.map((r) => ({
          min: r.min ?? 0,
          max: r.max ?? 0,
          perkg:
            typeof r.perKg === "number"
              ? r.perKg
              : typeof r.perkg === "number"
                ? r.perkg
                : 0,
        }));
      }
    } else if (type === "UNIT_PRICE_WEIGHT_RANGE") {
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
          additional: typeof b.add === "number" ? b.add : (b.additional ?? 0),
        }));
      }
    }
  }
}

function hydrateFromParsedPrice(
  parsed: Record<string, unknown> | null,
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
): Record<string, TownServiceTabValues> {
  const base = buildEmptyServiceConfigs(serviceTypes, categories);
  if (!parsed) return base;

  const globalRemark =
    typeof parsed.remarkType === "string" && parsed.remarkType.trim()
      ? remarkTypeFromApi(parsed.remarkType as string)
      : typeof parsed.remark === "string" && parsed.remark.trim()
        ? (parsed.remark as string)
        : "Standard";

  if (Array.isArray(parsed.categoryPricing) && parsed.categoryPricing.length) {
    const cp = parsed.categoryPricing as Record<string, unknown>[];
    const sidFromRow =
      typeof cp[0]?.serviceTypeId === "string"
        ? (cp[0].serviceTypeId as string)
        : undefined;
    const junction = parsed.serviceTypes as
      | Record<string, unknown>[]
      | undefined;
    const sidFromJunction =
      Array.isArray(junction) &&
      junction[0] &&
      typeof junction[0].serviceTypeId === "string"
        ? (junction[0].serviceTypeId as string)
        : undefined;
    const derivedServiceTypeId = sidFromRow ?? sidFromJunction;
    if (
      typeof derivedServiceTypeId === "string" &&
      derivedServiceTypeId.trim()
    ) {
      const enriched: Record<string, unknown> = {
        ...parsed,
        serviceTypeId: derivedServiceTypeId,
      };
      const st = serviceTypes.find((s) => s.id === derivedServiceTypeId);
      if (st) {
        for (const s of serviceTypes) {
          base[s.id].remark = globalRemark;
        }
        hydrateOneTownTab(base[st.id], enriched, TARIFF_DISPLAY_NAME);
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
    for (const s of serviceTypes) {
      base[s.id].remark = globalRemark;
    }
    if (st) {
      hydrateOneTownTab(base[st.id], parsed, TARIFF_DISPLAY_NAME);
    }
    return base;
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
      return hydrateFromParsedPrice(merged, serviceTypes, categories);
    }
  }

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
    hydrateTownTabNameFromTariff(base[rootServiceTypeId], parsed.name);
    base[rootServiceTypeId].remark = globalRemark;
    hydrateTabRemarkDates(
      base[rootServiceTypeId],
      parsed as Record<string, unknown>,
    );
    const firstCat = categories[0];
    if (
      typeof fee === "number" &&
      firstCat &&
      base[rootServiceTypeId].categories[firstCat.id]
    ) {
      base[rootServiceTypeId].categories[firstCat.id].basePrice = fee;
    }
  }

  for (const st of serviceTypes) {
    if (!base[st.id].remark?.trim() || base[st.id].remark === "Standard") {
      base[st.id].remark = globalRemark;
    }
  }

  const rows = parsed.serviceTypes as
    | Array<Record<string, unknown>>
    | undefined;
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
      hydrateOneTownTab(base[st.id], row, TARIFF_DISPLAY_NAME);
      if (typeof row.name === "string" && row.name.trim()) {
        hydrateTownTabNameFromTariff(base[st.id], row.name);
      }
    }
  }

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

  return base;
}

function validateValues(
  values: TownFormValues,
  serviceTypes: ServiceType[],
  categories: OrderItemCategory[],
  activeServiceTypeId: string | null,
): FormikErrors<TownFormValues> {
  const errors: FormikErrors<TownFormValues> = {};
  const scErrors: FormikErrors<TownFormValues["serviceConfigs"]> = {};

  const typesToValidate = activeServiceTypeId
    ? serviceTypes.filter((st) => st.id === activeServiceTypeId)
    : serviceTypes;

  for (const st of typesToValidate) {
    const cfg = values.serviceConfigs[st.id];
    if (!cfg) continue;
    const one: FormikErrors<TownServiceTabValues> = {};
    if (!cfg.remark?.trim()) one.remark = "Remark type is required";
    if (remarkRequiresDateRange(cfg.remark)) {
      if (!cfg.startDate?.trim()) {
        one.startDate = "Start date is required for holiday / event pricing";
      }
      if (!cfg.endDate?.trim()) {
        one.endDate = "End date is required for holiday / event pricing";
      }
      if (
        cfg.startDate?.trim() &&
        cfg.endDate?.trim() &&
        cfg.startDate > cfg.endDate
      ) {
        one.endDate = "Must be on or after start date";
      }
    }

    const catErrs: FormikErrors<TownServiceTabValues["categories"]> = {};
    for (const cat of categories) {
      const cv = cfg.categories[cat.id];
      if (!cv) continue;
      const mode = normalizeTownCategoryMode(cv.pricingType);
      const typeCfg = getPricingCategoryTypeConfig(mode);
      const ce: FormikErrors<TownCategoryPricingValues> = {};

      if (cv.additionalCost < 0) ce.additionalCost = "Must be ≥ 0";
      if (
        cv.profitMargin < 0 ||
        cv.profitMargin > 1 ||
        Number.isNaN(cv.profitMargin)
      ) {
        ce.profitMargin = "Use a decimal between 0 and 1 (e.g. 0.25)";
      }

      if (
        mode !== "WEIGHT_RANGE" &&
        hasField(typeCfg, "basePrice") &&
        cv.basePrice < 0
      ) {
        ce.basePrice = "Must be ≥ 0";
      }
      if (mode === "WEIGHT_RANGE") {
        const rows = cv.weightRanges?.length
          ? cv.weightRanges
          : [{ min: 0, max: 0, perkg: 0 }];
        const rangeFieldErrs: FormikErrors<TownWeightRangeRow>[] = [];
        rows.forEach((b, idx) => {
          const be: FormikErrors<TownWeightRangeRow> = {};
          if (b.min < 0) be.min = "Must be ≥ 0";
          if (b.max < 0) be.max = "Must be ≥ 0";
          if (b.perkg < 0) be.perkg = "Must be ≥ 0";
          if (b.max < b.min && b.max !== 0 && b.min !== 0) {
            be.max = "Must be ≥ min";
          }
          if (Object.keys(be).length) rangeFieldErrs[idx] = be;
        });
        if (rangeFieldErrs.some((e) => e && Object.keys(e).length > 0)) {
          ce.weightRanges = rangeFieldErrs;
        }
      }
      if (mode === "UNIT_PRICE_WEIGHT_RANGE") {
        const rows = cv.brackets?.length
          ? cv.brackets
          : [{ min: 0, max: 0, additional: 0 }];
        const bracketFieldErrs: FormikErrors<TownBracketRow>[] = [];
        rows.forEach((b, idx) => {
          const be: FormikErrors<TownBracketRow> = {};
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

function buildTownCategoryPricingEntry(
  cat: OrderItemCategory,
  cv: TownCategoryPricingValues,
):
  | {
      categoryId: string;
      type: CategoryPricingMode;
      direction: "NONE";
      config: Record<string, unknown>;
    }
  | null {
  const mode = normalizeTownCategoryMode(cv.pricingType);
  const fees = { additionalCost: cv.additionalCost };
  const margin = { profitMargin: cv.profitMargin };

  if (mode === "UNIT_PRICE") {
    if (!hasSpecifiedTownUnitPricing(cv)) return null;
    return {
      categoryId: cat.id,
      type: "UNIT_PRICE",
      direction: "NONE",
      config: { unitPrice: cv.basePrice, ...fees, ...margin },
    };
  }

  if (mode === "VOLUME_OVERRIDE") {
    return {
      categoryId: cat.id,
      type: "VOLUME_OVERRIDE",
      direction: "NONE",
      config: {
        divisor: cv.divisor,
        ratePerKg: cv.ratePerKg,
        ...fees,
        ...margin,
      },
    };
  }

  if (mode === "WEIGHT_RANGE") {
    const ranges = (
      cv.weightRanges?.length ? cv.weightRanges : [{ min: 0, max: 0, perkg: 0 }]
    ).map((r) => ({
      min: r.min,
      max: r.max,
      perKg: r.perkg,
    }));
    const config: Record<string, unknown> = {
      ranges,
      ...fees,
      ...margin,
    };
    if (typeof cv.basePrice === "number" && cv.basePrice > 0) {
      config.unitPrice = cv.basePrice;
    }
    return {
      categoryId: cat.id,
      type: "WEIGHT_RANGE",
      direction: "NONE",
      config,
    };
  }

  if (mode === "UNIT_PRICE_WEIGHT_RANGE") {
    const rows = cv.brackets?.length
      ? cv.brackets
      : [{ min: 0, max: 0, additional: 0 }];
    return {
      categoryId: cat.id,
      type: "UNIT_PRICE_WEIGHT_RANGE",
      direction: "NONE",
      config: {
        unitPrice: cv.basePrice,
        brackets: rows.map((b) => ({
          min: b.min,
          max: b.max,
          add: b.additional,
        })),
        ...fees,
        ...margin,
      },
    };
  }

  if (!hasSpecifiedTownUnitPricing(cv)) return null;
  return {
    categoryId: cat.id,
    type: "UNIT_PRICE",
    direction: "NONE",
    config: { unitPrice: cv.basePrice, ...fees, ...margin },
  };
}

function buildPayloadForServiceType(
  values: TownFormValues,
  st: ServiceType,
  categories: OrderItemCategory[],
): {
  name: string;
  scope: "TOWN";
  remarkType: string;
  serviceTypeId: string;
  categoryPricing: NonNullable<ReturnType<typeof buildTownCategoryPricingEntry>>[];
  startDate?: string;
  endDate?: string;
} {
  type TownPricingRow = NonNullable<ReturnType<typeof buildTownCategoryPricingEntry>>;
  const cfg = values.serviceConfigs[st.id];
  const shortName = cfg?.name?.trim() || st.name;
  const prefix = `${TARIFF_DISPLAY_NAME} - `;
  const name = shortName.startsWith(prefix)
    ? shortName
    : `${prefix}${shortName}`;
  const categoryPricing: TownPricingRow[] = categories.flatMap((cat) => {
    const row = buildTownCategoryPricingEntry(cat, cfg.categories[cat.id]);
    return row ? [row] : [];
  });

  const payload: {
    name: string;
    scope: "TOWN";
    remarkType: string;
    serviceTypeId: string;
    categoryPricing: TownPricingRow[];
    startDate?: string;
    endDate?: string;
  } = {
    name,
    scope: "TOWN",
    remarkType: remarkTypeToApi(cfg?.remark ?? ""),
    serviceTypeId: st.id,
    categoryPricing,
  };
  if (remarkRequiresDateRange(cfg?.remark ?? "")) {
    const sd = ymdToApiIso(cfg?.startDate ?? "");
    const ed = ymdToApiEndOfDayIso(cfg?.endDate ?? "");
    if (sd) payload.startDate = sd;
    if (ed) payload.endDate = ed;
  }
  return payload;
}

export type TownPricingFormProps = {
  prefetchedTariff?: Record<string, unknown> | null;
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
  const {
    data: categories = [],
    isLoading: loadingCat,
    isError: errCat,
  } = useOrderItemCategories();

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
  const [activeCategoryByService, setActiveCategoryByService] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (serviceTypes.length && !activeTabId) {
      setActiveTabId(serviceTypes[0].id);
    }
  }, [serviceTypes, activeTabId]);

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

  const initialValues: TownFormValues = useMemo(() => {
    if (isEditing && parsedPrice) {
      return {
        serviceConfigs: hydrateFromParsedPrice(
          parsedPrice,
          serviceTypes,
          categories,
        ),
      };
    }
    return {
      serviceConfigs: buildEmptyServiceConfigs(serviceTypes, categories),
    };
  }, [isEditing, parsedPrice, serviceTypes, categories]);

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
      const payload = buildPayloadForServiceType(values, st, categories);

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

  const dataReady =
    !loadingST && !loadingCat && !errST && !errCat && serviceTypes.length > 0;

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
          No service types found. Add service types under Service Type
          Management first.
        </p>
      )}

      {categories.length === 0 && !loadingCat && !errCat && (
        <p className="text-amber-700 text-sm py-4">
          No order item categories found. Add categories under Orders → Item
          categories.
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
              categories,
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
                    Add another town tariff by switching service types and
                    saving again.
                  </p>
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
                        <p className="text-red-500 text-sm mt-1">
                          {scErr.name}
                        </p>
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
                        onValueChange={(v) => {
                          setFieldValue(`serviceConfigs.${st.id}.remark`, v);
                          if (!remarkRequiresDateRange(v)) {
                            setFieldValue(
                              `serviceConfigs.${st.id}.startDate`,
                              "",
                            );
                            setFieldValue(
                              `serviceConfigs.${st.id}.endDate`,
                              "",
                            );
                          }
                        }}
                        onClose={() =>
                          setFieldTouched(
                            `serviceConfigs.${st.id}.remark`,
                            true,
                          )
                        }
                        options={[...remarkOptions]}
                        error={scErr?.remark}
                        touched={scTouch?.remark}
                      />
                      {remarkRequiresDateRange(cfg.remark) && (
                        <div className="mt-4">
                          <PricingRemarkDateFields
                            startField={`serviceConfigs.${st.id}.startDate`}
                            endField={`serviceConfigs.${st.id}.endDate`}
                            startValue={cfg.startDate}
                            endValue={cfg.endDate}
                            startError={scErr?.startDate}
                            endError={scErr?.endDate}
                            startTouched={scTouch?.startDate}
                            endTouched={scTouch?.endDate}
                            setFieldValue={setFieldValue}
                            setFieldTouched={setFieldTouched}
                          />
                        </div>
                      )}
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
                              Specify pricing type, unit or volume fields, and
                              additional cost for each category.
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
                          <TownCategoryPricingPanel
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

                    <ActionButtons isEditing={isEditing} loading={loading} />
                  </div>
                );
              })}
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
}

type TownCategoryPricingPanelProps = {
  cat: OrderItemCategory;
  prefix: string;
  values: TownCategoryPricingValues;
  catErr?: FormikErrors<TownCategoryPricingValues>;
  catTouch?: FormikTouched<TownCategoryPricingValues>;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
};

function TownCategoryPricingPanel({
  prefix,
  values,
  catErr,
  catTouch,
  setFieldValue,
  setFieldTouched,
  cat,
}: TownCategoryPricingPanelProps) {
  const mode = normalizeTownCategoryMode(values?.pricingType);
  const typeCfg = getPricingCategoryTypeConfig(mode);
  const rangeFieldErrors = catErr?.weightRanges as
    | FormikErrors<TownWeightRangeRow>[]
    | undefined;
  const rangeFieldTouched = catTouch?.weightRanges as
    | FormikTouched<TownWeightRangeRow>[]
    | undefined;
  const bracketFieldErrors = catErr?.brackets as
    | FormikErrors<TownBracketRow>[]
    | undefined;
  const bracketFieldTouched = catTouch?.brackets as
    | FormikTouched<TownBracketRow>[]
    | undefined;

  const showUnitPrice =
    mode !== "WEIGHT_RANGE" && hasField(typeCfg, "basePrice");
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <h4 className="text-base font-semibold text-gray-900">{cat.name}</h4>
        <span className="text-xs text-gray-500">{typeCfg.label}</span>
      </div>

      <div>
        <Label className="mb-1">Pricing type</Label>
        <PricingShadcnSelect
          id={`town-pricing-type-${cat.id}`}
          label=""
          placeholder="Select pricing type"
          value={values.pricingType}
          onValueChange={(v) => {
            setFieldValue(`${prefix}.pricingType`, v);
            if (v === "WEIGHT_RANGE") {
              const cur = values.weightRanges;
              if (!cur?.length) {
                setFieldValue(`${prefix}.weightRanges`, [
                  { min: 0, max: 0, perkg: 0 },
                ]);
              }
            }
            if (v === "UNIT_PRICE_WEIGHT_RANGE") {
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
          options={townPricingTypeOptions.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          error={catErr?.pricingType as string | undefined}
          touched={Boolean(catTouch?.pricingType)}
        />
      </div>

      <div>
        <Label className="mb-1">Additional cost (ETB)</Label>
        <Field
          as={Input}
          type="number"
          step="0.01"
          min={0}
          name={`${prefix}.additionalCost`}
          className="py-2 max-w-xs"
        />
        {catErr?.additionalCost && catTouch?.additionalCost && (
          <p className="text-red-500 text-sm mt-1">{catErr.additionalCost}</p>
        )}
      </div>

      <div>
        <Label className="mb-1">Profit margin</Label>
        <Field
          as={Input}
          type="number"
          step="0.01"
          min={0}
          max={1}
          name={`${prefix}.profitMargin`}
          placeholder="Enter profit margin percentage"
          className="py-2 max-w-xs"
        />

        {catErr?.profitMargin && catTouch?.profitMargin && (
          <p className="text-red-500 text-sm mt-1">{catErr.profitMargin}</p>
        )}
      </div>

      {showUnitPrice && (
        <div>
          <Label className="mb-1">Unit price (ETB)</Label>
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

      {mode === "WEIGHT_RANGE" && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-800">
            Weight ranges (per kg)
          </Label>
          {(values.weightRanges ?? []).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-500">
                  Range {i + 1}
                </span>
                {(values.weightRanges ?? []).length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                    onClick={() => {
                      const next = [...(values.weightRanges ?? [])];
                      next.splice(i, 1);
                      setFieldValue(`${prefix}.weightRanges`, next);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1">Min (kg)</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.weightRanges.${i}.min`}
                    className="py-2 w-full"
                  />
                  {rangeFieldErrors?.[i]?.min &&
                    rangeFieldTouched?.[i]?.min && (
                      <p className="text-red-500 text-sm mt-1">
                        {rangeFieldErrors[i]?.min}
                      </p>
                    )}
                </div>
                <div>
                  <Label className="mb-1">Max (kg)</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.weightRanges.${i}.max`}
                    className="py-2 w-full"
                  />
                  {rangeFieldErrors?.[i]?.max &&
                    rangeFieldTouched?.[i]?.max && (
                      <p className="text-red-500 text-sm mt-1">
                        {rangeFieldErrors[i]?.max}
                      </p>
                    )}
                </div>
                <div>
                  <Label className="mb-1">Per kg (ETB)</Label>
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${prefix}.weightRanges.${i}.perkg`}
                    className="py-2 w-full"
                  />
                  {rangeFieldErrors?.[i]?.perkg &&
                    rangeFieldTouched?.[i]?.perkg && (
                      <p className="text-red-500 text-sm mt-1">
                        {rangeFieldErrors[i]?.perkg}
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
                setFieldValue(`${prefix}.weightRanges`, [
                  ...(values.weightRanges ?? []),
                  { min: 0, max: 0, perkg: 0 },
                ]);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Add range
            </button>
          </div>
        </div>
      )}

      {mode === "UNIT_PRICE_WEIGHT_RANGE" && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-800">
            Weight brackets (add-on amount)
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
                  <Label className="mb-1">Min (kg)</Label>
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
                  <Label className="mb-1">Max (kg)</Label>
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
                  <Label className="mb-1">Add (ETB)</Label>
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
          <Label className="mb-1">Rate per kg (ETB)</Label>
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
