/**
 * Value sent to vehicle commission APIs as `serviceType` — use the service
 * type id from GET /orders/service-types (see `useServiceTypes`).
 */
export type PricingServiceType = string;

/** Form row: category = vehicle type id */
export interface DriverCommissionRow {
  category: string;
  name: string;
  baseFee?: number;
  fixedCost?: number;
  driverCost?: number;
  percentage?: number;
}
