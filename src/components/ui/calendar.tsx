import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  hideWeekdays = false,
  formatters: formattersProp,
  components: userComponents,
  captionLayout = "label",
  navLayout = "around",
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      {...props}
      captionLayout={captionLayout}
      navLayout={navLayout}
      showOutsideDays={showOutsideDays}
      hideWeekdays={hideWeekdays}
      className={cn("p-3", className)}
      formatters={{
        formatWeekdayName: (weekday, _options, dateLib) =>
          dateLib?.format(weekday, "EEE").slice(0, 2) ?? "",
        ...formattersProp,
      }}
      classNames={{
        months: cn(
          "flex flex-col gap-4 sm:flex-row sm:space-x-4 sm:space-y-0",
          defaultClassNames.months,
        ),
        month: cn("space-y-4", defaultClassNames.month),
        month_caption: cn(
          "relative flex justify-center pt-1",
          defaultClassNames.month_caption,
        ),
        caption_label: cn(
          "text-sm font-medium text-gray-900",
          defaultClassNames.caption_label,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-1 top-0 z-10 h-7 w-7 shrink-0 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-1 top-0 z-10 h-7 w-7 shrink-0 bg-transparent p-0 opacity-50 hover:opacity-100 cursor-pointer disabled:pointer-events-none disabled:cursor-not-allowed",
          defaultClassNames.button_next,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("table-row", defaultClassNames.weekdays),
        weekday: cn(
          "w-9 p-0 text-center align-middle font-sans text-xs font-normal capitalize text-gray-500",
          defaultClassNames.weekday,
        ),
        week: cn("table-row", defaultClassNames.week),
        day: cn(
          "relative h-9 w-9 p-0 text-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          defaultClassNames.day_button,
        ),
        range_end: cn("day-range-end", defaultClassNames.range_end),
        selected: cn(
          "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
          defaultClassNames.selected,
        ),
        today: cn("bg-gray-100 text-gray-900", defaultClassNames.today),
        outside: cn(
          "day-outside text-gray-500 opacity-50 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 aria-selected:opacity-30",
          defaultClassNames.outside,
        ),
        disabled: cn("text-gray-500 opacity-50", defaultClassNames.disabled),
        range_middle: cn(
          "aria-selected:bg-gray-100 aria-selected:text-gray-900",
          defaultClassNames.range_middle,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
        ...userComponents,
      }}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
