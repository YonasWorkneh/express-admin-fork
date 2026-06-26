import { Field } from "formik";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface WeightRange {
  from: string;
  to: string;
  price: number;
}

interface WeightRangesTableProps {
  weightRanges: WeightRange[];
  selectedRows: Set<number>;
  onSelectionChange: (selectedRows: Set<number>) => void;
  onAddRange: () => void;
  onDeleteSelected: () => void;
  fieldPrefix: string;
  incrementValue?: number;
}

export default function WeightRangesTable({
  weightRanges,
  selectedRows,
  onSelectionChange,
  onAddRange,
  onDeleteSelected,
  fieldPrefix,
}: WeightRangesTableProps) {
  const allSelected =
    selectedRows.size === weightRanges.length && weightRanges.length > 0;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium">Weight Ranges</h3>
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-sm">Delete Selected</span>
            </button>
          )}
         
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table className="border-separate border-spacing-0">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 border border-gray-200">
                <Checkbox
                  className="data-[state=checked]:bg-[#EE1E21] data-[state=checked]:border-[#EE1E21]"
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange(new Set(weightRanges.map((_, i) => i)));
                    } else {
                      onSelectionChange(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200">
                From (kg)
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200">
                To (kg)
              </TableHead>
              <TableHead className="text-gray-600 font-medium border border-gray-200">
                Airport fee
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weightRanges.map((_, index) => (
              <TableRow key={index}>
                <TableCell className="border border-gray-200">
                  <Checkbox
                    className="data-[state=checked]:bg-[#EE1E21] data-[state=checked]:border-[#EE1E21]"
                    checked={selectedRows.has(index)}
                    onCheckedChange={(checked) => {
                      const newSelected = new Set(selectedRows);
                      if (checked) {
                        newSelected.add(index);
                      } else {
                        newSelected.delete(index);
                      }
                      onSelectionChange(newSelected);
                    }}
                  />
                </TableCell>
                <TableCell className="border border-gray-200 py-0 px-2">
                  <Field
                    as={Input}
                    type="number"
                    name={`${fieldPrefix}.${index}.from`}
                    placeholder="From weight"
                    className="py-2 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
                  />
                </TableCell>
                <TableCell className="border border-gray-200 py-0 px-2">
                  <Field
                    as={Input}
                    type="number"
                    name={`${fieldPrefix}.${index}.to`}
                    placeholder="To weight"
                    className="py-2 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
                  />
                </TableCell>
                <TableCell className="border border-gray-200 py-0 px-2">
                  <Field
                    as={Input}
                    type="number"
                    step="0.01"
                    name={`${fieldPrefix}.${index}.price`}
                    placeholder="Airport fee"
                    className="py-2 border-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus:outline-none focus:ring-0"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    <div className="pt-4">
    <button
            type="button"
            className="bg-[#EE1E21] hover:bg-[#cc1a1c] text-[#FADF4B] rounded-full p-2 cursor-pointer transition-colors flex items-center justify-center"
            onClick={onAddRange}
          >
            <Plus className="h-4 w-4" />
          </button>
    </div>
    </div>
  );
}
