import { useMemo, type ChangeEvent } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({ date, onDateChange, placeholder = "Pick a date" }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "w-full cursor-pointer justify-start text-left font-normal disabled:cursor-not-allowed",
            !date && "text-gray-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

function parseLocalDatetimeString(s: string): Date | undefined {
  const t = String(s ?? "").trim()
  if (!t) return undefined
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export interface DateTimePickerProps {
  /** Value in `datetime-local` form (`yyyy-MM-dd'T'HH:mm`) for compatibility with `new Date(...).toISOString()`. */
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
  error?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  onBlur,
  placeholder = "Pick date and time",
  className,
  id,
  disabled,
  error,
}: DateTimePickerProps) {
  const selected = useMemo(() => parseLocalDatetimeString(value), [value])
  const timeInput = useMemo(() => {
    if (!selected) return "12:00"
    return format(selected, "HH:mm")
  }, [selected])

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return
    const base = selected ? new Date(selected) : new Date()
    base.setFullYear(d.getFullYear(), d.getMonth(), d.getDate())
    if (!selected) {
      base.setHours(12, 0, 0, 0)
    }
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"))
  }

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value
    const [hh, mm] = t.split(":").map((x) => parseInt(x, 10))
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return
    const base = selected ? new Date(selected) : new Date()
    base.setHours(hh, mm, 0, 0)
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"))
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full min-h-[56px] h-auto cursor-pointer justify-start py-7 px-3 text-left font-normal rounded-md border shadow-xs disabled:cursor-not-allowed",
            !selected && "text-gray-500",
            error && "border-red-500",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">
            {selected ? format(selected, "PPP 'at' p") : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t border-gray-200 p-3 space-y-2">
          <Label htmlFor={id ? `${id}-time` : undefined} className="text-xs text-gray-600">
            Time
          </Label>
          <Input
            id={id ? `${id}-time` : undefined}
            type="time"
            step={60}
            value={timeInput}
            onChange={handleTimeChange}
            disabled={disabled}
            className="h-10"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
