"use client";

import ZonalTariffPricingForm from "./ZonalTariffPricingForm";

export default function RegionalPricingForm() {
  return (
    <ZonalTariffPricingForm
      shippingScope="REGIONAL"
      tariffDisplayName="Regional Delivery Tariff"
      headerTitle={{
        create: "Regional Pricing Configuration",
        edit: "Edit Regional Pricing Configuration",
      }}
    />
  );
}
