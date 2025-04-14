"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(value)
  
  // Update internal state when value prop changes
  React.useEffect(() => {
    setDate(value)
  }, [value])
  
  // Handle date selection
  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) {
      onChange(selectedDate)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal mt-2",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM d, yyyy") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  )
}
