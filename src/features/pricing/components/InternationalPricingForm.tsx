"use client";

import ZonalTariffPricingForm from "./ZonalTariffPricingForm";

export default function InternationalPricingForm() {
  return (
    <ZonalTariffPricingForm
      shippingScope="INTERNATIONAL"
      tariffDisplayName="International Delivery Tariff"
      headerTitle={{
        create: "International Pricing Configuration",
        edit: "Edit International Pricing Configuration",
      }}
    />
  );
}
