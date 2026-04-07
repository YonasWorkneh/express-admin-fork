import { Field } from "formik";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DriverCommissionRow } from "@/types/driverCommission";

interface DriverCommissionTableProps {
  driverCommission: DriverCommissionRow[];
}

export default function DriverCommissionTable({
  driverCommission,
}: DriverCommissionTableProps) {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        Driver commission
      </h2>
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
            {driverCommission.map((commission, index) => (
              <TableRow key={index} className="!h-8"> {/* Reduce row height */}
                <TableCell className="font-medium capitalize border border-gray-200 py-1 px-2">
                  {commission.name}
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`driverCommission.${index}.driverCost`}
                    placeholder="Cost per km"
                    className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                  />
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`driverCommission.${index}.fixedCost`}
                    placeholder="Fixed cost"
                    className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                  />
                </TableCell>
                <TableCell className="border border-gray-200 py-1 px-2">
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`driverCommission.${index}.percentage`}
                    placeholder="Percentage"
                    className="py-1 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0 h-7"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
