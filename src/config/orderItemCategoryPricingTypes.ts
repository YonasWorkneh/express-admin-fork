import pricingTypesJson from "./orderItemCategoryPricingTypes.json";

export type CategoryPricingMode =
  | "UNIT_PRICE"
  | "UNIT_PRICE_WITH_BRACKET"
  | "VOLUME_OVERRIDE";

export type PricingCategoryFieldKey =
  | "basePrice"
  | "min"
  | "max"
  | "additional"
  | "divisor"
  | "ratePerKg";

export type OrderItemCategoryPricingTypeConfig = {
  label: string;
  fields: PricingCategoryFieldKey[];
};

const types = pricingTypesJson as Record<
  string,
  OrderItemCategoryPricingTypeConfig
>;

export function normalizeCategoryPricingMode(
  raw?: string | null,
): CategoryPricingMode {
  if (raw == null || String(raw).trim() === "") return "UNIT_PRICE";
  const u = String(raw).trim().toUpperCase().replace(/-/g, "_");
  if (u in types) return u as CategoryPricingMode;
  return "UNIT_PRICE";
}

export function getPricingCategoryTypeConfig(
  raw?: string | null,
): OrderItemCategoryPricingTypeConfig {
  const key = normalizeCategoryPricingMode(raw);
  return types[key] ?? types.UNIT_PRICE;
}

export function hasField(
  cfg: OrderItemCategoryPricingTypeConfig,
  field: PricingCategoryFieldKey,
): boolean {
  return cfg.fields.includes(field);
}

/** @deprecated use normalizeCategoryPricingMode */
export function normalizePricingCategoryType(raw?: string | null): string {
  return normalizeCategoryPricingMode(raw);
}
