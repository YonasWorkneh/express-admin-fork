"use client";

import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { format, isValid, parse } from "date-fns";

export function remarkRequiresDateRange(remark: string): boolean {
  const r = remark.trim().toLowerCase();
  return r === "holiday" || r === "event";
}

export function ymdStringToDate(s: string): Date | undefined {
  if (!String(s ?? "").trim()) return undefined;
  const d = parse(String(s).trim(), "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

export function dateToYmdString(d: Date | undefined): string {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

/** Parse API date string to `yyyy-MM-dd` for the form. */
export function hydrateYmdFromApi(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "";
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "yyyy-MM-dd");
}

export function hydrateTabRemarkDates(
  tab: { startDate: string; endDate: string },
  t: Record<string, unknown>,
) {
  if (typeof t.startDate === "string" && t.startDate.trim()) {
    tab.startDate = hydrateYmdFromApi(t.startDate);
  }
  if (typeof t.endDate === "string" && t.endDate.trim()) {
    tab.endDate = hydrateYmdFromApi(t.endDate);
  }
}

/** UTC midnight ISO string for the picked calendar day (API `startDate`). */
export function ymdToApiIso(ymd: string): string | undefined {
  const d = ymdStringToDate(String(ymd ?? "").trim());
  if (!d) return undefined;
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  ).toISOString();
}

/** End of that calendar day UTC (`23:59:59.000Z`) — API `endDate` for remark windows. */
export function ymdToApiEndOfDayIso(ymd: string): string | undefined {
  const d = ymdStringToDate(String(ymd ?? "").trim());
  if (!d) return undefined;
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23,
      59,
      59,
      0,
    ),
  ).toISOString();
}

type PricingRemarkDateFieldsProps = {
  startField: string;
  endField: string;
  startValue: string;
  endValue: string;
  startError?: string;
  endError?: string;
  startTouched?: boolean;
  endTouched?: boolean;
  setFieldValue: (field: string, value: unknown) => void;
  setFieldTouched: (field: string, touched?: boolean) => void;
};

export function PricingRemarkDateFields({
  startField,
  endField,
  startValue,
  endValue,
  startError,
  endError,
  startTouched,
  endTouched,
  setFieldValue,
  setFieldTouched,
}: PricingRemarkDateFieldsProps) {
  return (
    <div className="rounded-lg border border-[#EE1E21]/10 bg-[#EE1E21]/5 px-4 py-4 space-y-4">
      <p className="text-sm text-gray-700">
        Holiday and event tariffs apply only within the window you set below.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Start date</Label>
          <DatePicker
            date={ymdStringToDate(startValue)}
            onDateChange={(d) => {
              setFieldValue(startField, dateToYmdString(d));
              setFieldTouched(startField, true);
            }}
            placeholder="Select start date"
          />
          {startError && startTouched && (
            <p className="text-red-500 text-sm">{startError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">End date</Label>
          <DatePicker
            date={ymdStringToDate(endValue)}
            onDateChange={(d) => {
              setFieldValue(endField, dateToYmdString(d));
              setFieldTouched(endField, true);
            }}
            placeholder="Select end date"
          />
          {endError && endTouched && (
            <p className="text-red-500 text-sm">{endError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
