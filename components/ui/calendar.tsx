"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarVariant = "default" | "bookedDates"

function Calendar({
  className,
  classNames,
  showOutsideDays = false,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  variant?: CalendarVariant
}) {
  const variantClassNames =
    variant === "bookedDates"
      ? {
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground ring-2 ring-primary/30",
          day_today: "bg-accent text-accent-foreground",
        }
      : {
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-muted text-foreground",
        }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        caption: "flex items-center justify-center pt-1 relative",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "size-8 rounded-full bg-transparent p-0 opacity-80 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-full p-0 font-normal aria-selected:opacity-100"
        ),
        ...variantClassNames,
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("size-4", className)} {...iconProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
