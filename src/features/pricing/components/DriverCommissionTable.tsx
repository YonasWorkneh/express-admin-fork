import { Field, type FieldProps } from "formik";
import Button from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/utils/spinner";
import type { DriverCommissionRow } from "@/types/driverCommission";

interface DriverCommissionTableProps {
  driverCommission: DriverCommissionRow[];
  /** From initial merged API data; unchanged while the user edits the form. */
  hasExistingCommission: boolean;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
}

function parseCommissionInput(raw: string): number | undefined {
  if (raw === "" || raw === "-") return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

interface ExclusiveCommissionHandlers {
  base: string;
  form: FieldProps["form"];
}

function applyExclusiveDriverCost(
  { base, form }: ExclusiveCommissionHandlers,
  raw: string,
) {
  const num = parseCommissionInput(raw);
  if (num !== undefined && num !== 0) {
    form.setFieldValue(`${base}.driverCost`, num);
    form.setFieldValue(`${base}.fixedCost`, 0);
    form.setFieldValue(`${base}.percentage`, 0);
  } else {
    form.setFieldValue(
      `${base}.driverCost`,
      num === 0 ? 0 : undefined,
    );
  }
}

function applyExclusiveFixedCost(
  { base, form }: ExclusiveCommissionHandlers,
  raw: string,
) {
  const num = parseCommissionInput(raw);
  if (num !== undefined && num !== 0) {
    form.setFieldValue(`${base}.fixedCost`, num);
    form.setFieldValue(`${base}.driverCost`, 0);
    form.setFieldValue(`${base}.percentage`, 0);
  } else {
    form.setFieldValue(
      `${base}.fixedCost`,
      num === 0 ? 0 : undefined,
    );
  }
}

function applyExclusivePercentage(
  { base, form }: ExclusiveCommissionHandlers,
  raw: string,
) {
  const num = parseCommissionInput(raw);
  if (num !== undefined && num !== 0) {
    form.setFieldValue(`${base}.percentage`, num);
    form.setFieldValue(`${base}.driverCost`, 0);
    form.setFieldValue(`${base}.fixedCost`, 0);
  } else {
    form.setFieldValue(
      `${base}.percentage`,
      num === 0 ? 0 : undefined,
    );
  }
}

export default function DriverCommissionTable({
  driverCommission,
  hasExistingCommission,
  submitDisabled = false,
  isSubmitting = false,
  onCancel,
}: DriverCommissionTableProps) {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-800 mb-1">
        Driver commission
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Only one of cost per km, fixed cost, or percentage can be set per vehicle;
        choosing a value clears the other two.
      </p>
      <div className="border rounded-lg overflow-hidden">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-gray-600 font-medium border border-gray-200 py-2 px-2">
                Vehicle Category
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200 py-2 px-2">
                Cost per km
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200 py-2 px-2">
                Fixed Cost
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200 py-2 px-2">
                Cost in percentage
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverCommission.map((commission, index) => {
              const base = `driverCommission.${index}`;
              return (
              <TableRow key={index} className="!h-8"> {/* Reduce row height */}
                <TableCell className="font-medium capitalize border border-gray-200 py-1 px-2">
                  {commission.name}
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field name={`${base}.driverCost`}>
                    {({ field, form }: FieldProps) => (
                        <Input
                          type="number"
                          step="0.01"
                          name={field.name}
                          placeholder="Cost per km"
                          value={field.value ?? ""}
                          onBlur={field.onBlur}
                          onChange={(e) =>
                            applyExclusiveDriverCost(
                              { base, form },
                              e.target.value,
                            )
                          }
                          className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                        />
                    )}
                  </Field>
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field name={`${base}.fixedCost`}>
                    {({ field, form }: FieldProps) => (
                      <Input
                        type="number"
                        step="0.01"
                        name={field.name}
                        placeholder="Fixed cost"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          applyExclusiveFixedCost(
                            { base, form },
                            e.target.value,
                          )
                        }
                        className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                      />
                    )}
                  </Field>
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field name={`${base}.percentage`}>
                    {({ field, form }: FieldProps) => (
                      <Input
                        type="number"
                        step="0.01"
                        name={field.name}
                        placeholder="Percentage"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          applyExclusivePercentage(
                            { base, form },
                            e.target.value,
                          )
                        }
                        className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                      />
                    )}
                  </Field>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
        <h3 className="text-lg font-medium text-gray-800">
          Complete configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            type="submit"
            className="cursor-pointer hover:bg-blue-700"
            disabled={submitDisabled || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="h-4 w-4" />
                {hasExistingCommission ? "Updating…" : "Saving…"}
              </span>
            ) : hasExistingCommission ? (
              "Edit driver commission"
            ) : (
              "Save driver commission"
            )}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 cursor-pointer !text-black border border-gray-300 !w-full"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
