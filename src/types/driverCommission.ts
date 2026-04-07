export type PricingServiceType = "STANDARD" | "EXPRESS" | "OVERNIGHT";

export const PRICING_SERVICE_TYPE_OPTIONS: {
  value: PricingServiceType;
  label: string;
}[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Same day (Express)" },
  { value: "OVERNIGHT", label: "Overnight" },
];

/** Form row: category = vehicle type id */
export interface DriverCommissionRow {
  category: string;
  name: string;
  fixedCost?: number;
  driverCost?: number;
  percentage?: number;
}
