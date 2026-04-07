"use client";

import { Formik, Form } from "formik";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import SuccessModal from "@/components/common/SuccessModal";
import PricingFormHeader from "./PricingFormHeader";
import PricingShadcnSelect from "./PricingShadcnSelect";
import ServiceTypeSection from "./ServiceTypeSection";
import AdditionalChargesSection from "./AdditionalChargesSection";
import ActionButtons from "./ActionButtons";
import toast from "react-hot-toast";
import api from "@/lib/api/api";
import { Spinner } from "@/utils/spinner";

const RegionalPricingSchema = Yup.object().shape({
  standard: Yup.number()
    .min(0, "Price must be positive")
    .required("Standard service price is required"),
  sameDay: Yup.number()
    .min(0, "Price must be positive")
    .required("Same Day service price is required"),
  overnight: Yup.number()
    .min(0, "Price must be positive")
    .required("Overnight service price is required"),
  costPerKm: Yup.number()
    .min(0, "Cost must be positive")
    .required("Cost per km is required"),
  airportFee: Yup.number()
    .min(0, "Airport fee must be positive")
    .required("Airport fee is required"),
  profitMargin: Yup.number()
    .min(0, "Profit margin must be positive")
    .max(100, "Profit margin cannot exceed 100%")
    .required("Profit margin is required"),
    remark: Yup.string().required("Remark type is required"),

});

type WeightRange = { from: string; to: string; price: number };

type InitialValues = {
  zone: string;
  standard: number;
  sameDay: number;
  overnight: number;
  costPerKm: number;
  airportFee: number;
  profitMargin: number;
  standardWeightRanges: WeightRange[];
  sameDayWeightRanges: WeightRange[];
  overnightWeightRanges: WeightRange[];
  remark: string;

};

export default function RegionalPricingForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [parsedPrice, setParsedPrice] = useState<any | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage] = useState("");
  const [expandedSection, setExpandedSection] = useState<
    "standard" | "sameDay" | "overnight" | null
  >("standard");
  const [selectedRows, setSelectedRows] = useState<{
    standard: Set<number>;
    sameDay: Set<number>;
    overnight: Set<number>;
  }>({
    standard: new Set(),
    sameDay: new Set(),
    overnight: new Set(),
  });
  const [loading, setLoading] = useState(false);

  // Default create-mode initial values
  const createInitialValues: InitialValues = {
    zone: "regional",
    standard: 0,
    sameDay: 0,
    overnight: 0,
    costPerKm: 0,
    airportFee: 0,
    profitMargin: 0,
    standardWeightRanges: [{ from: "1", to: "3", price: 0 }],
    sameDayWeightRanges: [{ from: "1", to: "3", price: 0 }],
    overnightWeightRanges: [{ from: "1", to: "3", price: 0 }],
    remark:"Standard"

  };

  const remarkOptions = [
    { value: "Standard", label: "Standard" },
    { value: "Weekend", label: "Weekend" },
    { value: "Holiday", label: "Holiday" },
    { value: "Event", label: "Event" },
  ];
  useEffect(() => {
    const raw = searchParams.get("price");
    if (!raw) return;
    try {
      const decoded = decodeURIComponent(raw);
      const obj = JSON.parse(decoded);
      setParsedPrice(obj);
    } catch {
      setParsedPrice(null);
    }
  }, [searchParams]);

  const isEditing = Boolean(parsedPrice && parsedPrice.id);

  const buildInitialValues = (): InitialValues => {
    const base = { ...createInitialValues };
    if (!isEditing) return base;

    const serviceTypes: any[] = parsedPrice.serviceTypes || [];
    const standardST = serviceTypes.find((s) => s.serviceType === "STANDARD");
    const expressST = serviceTypes.find((s) => s.serviceType === "EXPRESS");
    const overnightST = serviceTypes.find((s) => s.serviceType === "OVERNIGHT");

    base.standard = standardST?.baseFee ?? 0;
    base.sameDay = expressST?.baseFee ?? 0;
    base.overnight = overnightST?.baseFee ?? 0;
    base.profitMargin = parsedPrice.profitMargin?.percentage ?? parsedPrice.profit ?? 0;
    base.remark = parsedPrice.remark || "Standard"; // Get remarkType from parsed data or default to "Standard"

    // Apply airport fees to all services if present
    [standardST, expressST, overnightST].forEach((st, index) => {
      if (st?.airportFee?.brackets?.length) {
        const mapped = st.airportFee.brackets.map((b: any) => ({
          from: String(b.minKg ?? 1),
          to: String(b.maxKg ?? (b.minKg ?? 1) + 1),
          price: b.rate ?? 0,
        }));
        if (index === 0) base.standardWeightRanges = mapped;
        if (index === 1) base.sameDayWeightRanges = mapped;
        if (index === 2) base.overnightWeightRanges = mapped;
      }
    });

    return base;
  };

  const handleSubmit = async (values: InitialValues) => {
    try {
      setLoading(true);
      
      // Map service types to get serviceTypeId when editing
      const serviceTypeMap = new Map();
      if (isEditing && parsedPrice?.serviceTypes) {
        parsedPrice.serviceTypes.forEach((st: any) => {
          serviceTypeMap.set(st.serviceType, st.id);
        });
      }

      const airportFees = [
        {
          ...(isEditing && serviceTypeMap.has("STANDARD") 
            ? { serviceTypeId: serviceTypeMap.get("STANDARD") } 
            : {}),
          serviceType: "STANDARD",
          brackets: values.standardWeightRanges.map((range) => ({
            minKg: Number(range.from),
            maxKg: Number(range.to),
            rate: range.price,
          })),
        },
        {
          ...(isEditing && serviceTypeMap.has("EXPRESS") 
            ? { serviceTypeId: serviceTypeMap.get("EXPRESS") } 
            : {}),
          serviceType: "EXPRESS",
          brackets: values.sameDayWeightRanges.map((range) => ({
            minKg: Number(range.from),
            maxKg: Number(range.to),
            rate: range.price,
          })),
        },
        {
          ...(isEditing && serviceTypeMap.has("OVERNIGHT") 
            ? { serviceTypeId: serviceTypeMap.get("OVERNIGHT") } 
            : {}),
          serviceType: "OVERNIGHT",
          brackets: values.overnightWeightRanges.map((range) => ({
            minKg: Number(range.from),
            maxKg: Number(range.to),
            rate: range.price,
          })),
        },
      ];

      const payload = {
        name: "Regional Delivery Tariff",
        shippingScope: "REGIONAL",
        currency: "ETB",
        remark: values.remark, // Include remarkType in payload

        serviceTypes: [
          { serviceType: "STANDARD", baseFee: values.standard },
          { serviceType: "EXPRESS", baseFee: values.sameDay },
          { serviceType: "OVERNIGHT", baseFee: values.overnight },
        ],
        profit: values.profitMargin,
        airportFees,
      };

      if (isEditing) {
        await api.patch(`/pricing/tariff/${parsedPrice.id}`, payload);
        toast.success("Regional pricing updated successfully!");
      } else {
        await api.post("/pricing/tariff", payload);
        toast.success("Regional pricing saved successfully!");
      }

      navigate("/pricing");
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        "Failed to save tariff";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    navigate("/pricing");
  };

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
      <Formik
        enableReinitialize
        initialValues={buildInitialValues()}
        validationSchema={RegionalPricingSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue, setFieldTouched, errors, touched }) => (
          <Form className={loading ? "pointer-events-none opacity-50" : ""}>
            <PricingFormHeader
              title={
                isEditing
                  ? "Edit Regional Pricing Configuration"
                  : "Regional Pricing Configuration"
              }
            />

<div className="mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Remark Type
                </h3>
                <PricingShadcnSelect
                  id="remark"
                  label="Select remark type"
                  placeholder="Select remark type"
                  value={values.remark}
                  onValueChange={(v) => setFieldValue("remark", v)}
                  onClose={() => setFieldTouched("remark", true)}
                  options={remarkOptions}
                  error={errors.remark}
                  touched={touched.remark}
                />
              </div>
            </div>

            {/* Service Type Sections */}
            <ServiceTypeSection
              serviceName="Standard Service"
              serviceLabel="Standard Service Price"
              fieldName="standard"
              weightRanges={values.standardWeightRanges}
              selectedRows={selectedRows.standard}
              onSelectionChange={(newSelection) =>
                setSelectedRows({ ...selectedRows, standard: newSelection })
              }
              onAddRange={() => {
                const lastRange =
                  values.standardWeightRanges[
                    values.standardWeightRanges.length - 1
                  ];
                setFieldValue("standardWeightRanges", [
                  ...values.standardWeightRanges,
                  {
                    from: lastRange.to,
                    to: String(Number(lastRange.to) + 5),
                    price: 0,
                  },
                ]);
              }}
              onDeleteSelected={() => {
                const newRanges = values.standardWeightRanges.filter(
                  (_, i) => !selectedRows.standard.has(i)
                );
                setFieldValue("standardWeightRanges", newRanges);
                setSelectedRows({ ...selectedRows, standard: new Set() });
              }}
              fieldPrefix="standardWeightRanges"
              error={errors.standard}
              touched={touched.standard}
              incrementValue={5}
              isExpanded={expandedSection === "standard"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "standard" ? null : "standard"
                )
              }
            />

            <ServiceTypeSection
              serviceName="Same Day Service"
              serviceLabel="Same Day Service Price"
              fieldName="sameDay"
              weightRanges={values.sameDayWeightRanges}
              selectedRows={selectedRows.sameDay}
              onSelectionChange={(newSelection) =>
                setSelectedRows({ ...selectedRows, sameDay: newSelection })
              }
              onAddRange={() => {
                const lastRange =
                  values.sameDayWeightRanges[
                    values.sameDayWeightRanges.length - 1
                  ];
                setFieldValue("sameDayWeightRanges", [
                  ...values.sameDayWeightRanges,
                  {
                    from: lastRange.to,
                    to: String(Number(lastRange.to) + 5),
                    price: 0,
                  },
                ]);
              }}
              onDeleteSelected={() => {
                const newRanges = values.sameDayWeightRanges.filter(
                  (_, i) => !selectedRows.sameDay.has(i)
                );
                setFieldValue("sameDayWeightRanges", newRanges);
                setSelectedRows({ ...selectedRows, sameDay: new Set() });
              }}
              fieldPrefix="sameDayWeightRanges"
              error={errors.sameDay}
              touched={touched.sameDay}
              incrementValue={5}
              isExpanded={expandedSection === "sameDay"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "sameDay" ? null : "sameDay"
                )
              }
            />

            <ServiceTypeSection
              serviceName="Overnight Service"
              serviceLabel="Overnight Service Price"
              fieldName="overnight"
              weightRanges={values.overnightWeightRanges}
              selectedRows={selectedRows.overnight}
              onSelectionChange={(newSelection) =>
                setSelectedRows({ ...selectedRows, overnight: newSelection })
              }
              onAddRange={() => {
                const lastRange =
                  values.overnightWeightRanges[
                    values.overnightWeightRanges.length - 1
                  ];
                setFieldValue("overnightWeightRanges", [
                  ...values.overnightWeightRanges,
                  {
                    from: lastRange.to,
                    to: String(Number(lastRange.to) + 5),
                    price: 0,
                  },
                ]);
              }}
              onDeleteSelected={() => {
                const newRanges = values.overnightWeightRanges.filter(
                  (_, i) => !selectedRows.overnight.has(i)
                );
                setFieldValue("overnightWeightRanges", newRanges);
                setSelectedRows({ ...selectedRows, overnight: new Set() });
              }}
              fieldPrefix="overnightWeightRanges"
              error={errors.overnight}
              touched={touched.overnight}
              incrementValue={5}
              isExpanded={expandedSection === "overnight"}
              onToggle={() =>
                setExpandedSection(
                  expandedSection === "overnight" ? null : "overnight"
                )
              }
            />

            <AdditionalChargesSection
              costPerKmError={errors.costPerKm}
              costPerKmTouched={touched.costPerKm}
              airportFeeError={errors.airportFee}
              airportFeeTouched={touched.airportFee}
              profitMarginError={errors.profitMargin}
              profitMarginTouched={touched.profitMargin}
            />

            <ActionButtons isEditing={isEditing} loading={loading} />
          </Form>
        )}
      </Formik>

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        trackingNumber={successMessage}
      />
    </div>
  );
}
