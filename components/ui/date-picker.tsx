"use client"

import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const parseDateValue = (value?: string) => {
  if (!value) {
    return undefined
  }

  const normalizedValue = value.includes("T") ? value.slice(0, 10) : value
  const [year, month, day] = normalizedValue.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  const date = new Date(year, month - 1, day)

  return Number.isNaN(date.getTime()) ? undefined : date
}

const formatDateValue = (date?: Date) => {
  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

type DatePickerProps = {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const selectedDate = parseDateValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!selectedDate}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(formatDateValue(date))}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
