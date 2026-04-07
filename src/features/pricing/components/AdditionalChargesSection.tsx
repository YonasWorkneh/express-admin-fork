import { Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdditionalChargesSectionProps {
  costPerKmError?: string;
  costPerKmTouched?: boolean;
  airportFeeError?: string;
  airportFeeTouched?: boolean;
  profitMarginError?: string;
  profitMarginTouched?: boolean;
}

export default function AdditionalChargesSection({
  costPerKmError,
  costPerKmTouched,
  airportFeeError,
  airportFeeTouched,
  profitMarginError,
  profitMarginTouched,
}: AdditionalChargesSectionProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
      <h2 className="text-lg font-medium mb-4">Additional Charges</h2>
{/* 
      <div>
        <Label className="mb-1">Cost Per Km ($)</Label>
        <Field
          as={Input}
          type="number"
          step="0.01"
          name="costPerKm"
          placeholder="Enter cost per km"
          className={`py-2 !w-1/2 ${
            costPerKmError && costPerKmTouched ? "border-red-500" : ""
          }`}
        />
        {costPerKmError && costPerKmTouched && (
          <p className="text-red-500 text-sm mt-1">{costPerKmError}</p>
        )}
      </div> */}

      {/* {showAirportFee && (
        <div>
          <Label className="mb-1">Airport Fee ($)</Label>
          <Field
            as={Input}
            type="number"
            step="0.01"
            name="airportFee"
            placeholder="Enter airport fee"
            className={`py-2 !w-1/2 ${
              airportFeeError && airportFeeTouched ? "border-red-500" : ""
            }`}
          />
          {airportFeeError && airportFeeTouched && (
            <p className="text-red-500 text-sm mt-1">{airportFeeError}</p>
          )}
        </div>
      )} */}

      <div>
        <Label className="mb-1">Profit Margin (%)</Label>
        <Field
          as={Input}
          type="number"
          step="0.01"
          name="profitMargin"
          placeholder="Enter profit margin percentage"
          className={`py-2 !w-1/2 ${
            profitMarginError && profitMarginTouched ? "border-red-500" : ""
          }`}
        />
        {profitMarginError && profitMarginTouched && (
          <p className="text-red-500 text-sm mt-1">{profitMarginError}</p>
        )}
      </div>
    </div>
  );
}
