/**
 * Optional API hint; zonal tariff UI uses user-selected pricing mode per category
 * (`UNIT_PRICE` | `UNIT_PRICE_WEIGHT_RANGE` | `VOLUME_OVERRIDE` | `WEIGHT_RANGE` — see
 * `src/config/orderItemCategoryPricingTypes.json`).
 */
export interface OrderItemCategory {
  id: string;
  name: string;
  description?: string | null;
  /** e.g. WEIGHT_BRACKET | FLAT | PER_KM — matches config JSON keys */
  type?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrderItemCategoryInput {
  name: string;
  description?: string;
}
