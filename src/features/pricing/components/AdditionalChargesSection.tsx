import { Field } from "formik";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdditionalChargesSectionProps {
  profitMarginError?: string;
  profitMarginTouched?: boolean;
}

export default function AdditionalChargesSection({
  profitMarginError,
  profitMarginTouched,
}: AdditionalChargesSectionProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg space-y-4 mb-6">
      <h2 className="text-lg font-medium mb-4">Additional Charges</h2>
      {/* Cost per km / airport fee UI was removed; restore fields and pass error props from parent if needed. */}

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
