"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PricingShadcnSelectOption<V extends string = string> {
  value: V;
  label: string;
}

interface PricingShadcnSelectProps<V extends string = string> {
  label: string;
  placeholder?: string;
  value: V;
  onValueChange: (value: V) => void;
  /** Called when the dropdown closes (e.g. mark Formik field touched). */
  onClose?: () => void;
  options: PricingShadcnSelectOption<V>[];
  error?: string | string[];
  touched?: boolean;
  id?: string;
  triggerClassName?: string;
}

export default function PricingShadcnSelect<V extends string = string>({
  label,
  placeholder = "Select…",
  value,
  onValueChange,
  onClose,
  options,
  error,
  touched,
  id = "pricing-shadcn-select",
  triggerClassName,
}: PricingShadcnSelectProps<V>) {
  const errorText = Array.isArray(error) ? error[0] : error;
  const showError = Boolean(errorText && touched);

  return (
    <div className="max-w-xs w-full space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onValueChange(v as V)}
        onOpenChange={(open) => {
          if (!open) {
            onClose?.();
          }
        }}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "w-full max-w-xs bg-white",
            showError && "border-red-500 aria-invalid:border-red-500",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showError && errorText && (
        <p className="text-sm text-red-600">{errorText}</p>
      )}
    </div>
  );
}
