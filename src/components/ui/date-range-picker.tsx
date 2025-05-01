"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
    className?: string
    value?: DateRange
    onChange?: (date: DateRange | undefined) => void
}

export function DateRangePicker({
    className,
    value,
    onChange,
}: DateRangePickerProps) {
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value?.from ? (
                            value.to ? (
                                <>
                                    {format(value.from, "LLL dd, y")} -{" "}
                                    {format(value.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(value.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0 bg-white shadow-lg z-50 border rounded-md"
                    align="start"
                >
                    <div className="enhanced-calendar">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={value?.from}
                            selected={value}
                            onSelect={onChange}
                            numberOfMonths={2}
                            className="bg-white rounded-md"
                        />
                    </div>
                    <style jsx global>{`
                        /* Make calendar layout more consistent */
                        .enhanced-calendar .rdp-months {
                            padding: 16px;
                            justify-content: space-between;
                            display: flex;
                            gap: 16px;
                        }
                        
                        /* Improve day alignment and size */
                        .enhanced-calendar .rdp-day {
                            margin: 0;
                            width: 36px;
                            height: 36px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        /* Make blue highlight much more subtle */
                        .enhanced-calendar .rdp-day_selected:not(.rdp-day_disabled):not(.rdp-day_outside) {
                            background-color: rgba(59, 130, 246, 0.04);
                            color: rgb(37, 99, 235);
                            font-weight: 500;
                        }
                        
                        /* Better sized buttons for days */
                        .enhanced-calendar .rdp-button {
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        
                        /* Fix day of week header alignment */
                        .enhanced-calendar .rdp-head_cell {
                            font-weight: 500;
                            color: #777;
                            padding: 10px 0;
                            text-align: center;
                            width: 36px;
                        }
                        
                        /* Better hover state */
                        .enhanced-calendar .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                            background-color: rgba(0, 0, 0, 0.02);
                        }
                        
                        /* Much subtler today highlight */
                        .enhanced-calendar .rdp-day_today {
                            background-color: rgba(0, 0, 0, 0.01);
                            font-weight: 500;
                        }
                        
                        /* Improve range endpoints */
                        .enhanced-calendar .rdp-day_range_start:not(.rdp-day_range_end),
                        .enhanced-calendar .rdp-day_range_end:not(.rdp-day_range_start) {
                            background-color: rgba(37, 99, 235, 0.5) !important;
                            color: white !important;
                        }
                        
                        /* Very subtle range middle */
                        .enhanced-calendar .rdp-day_range_middle {
                            background-color: rgba(59, 130, 246, 0.03);
                        }
                        
                        /* Table cell alignment */
                        .enhanced-calendar .rdp-cell {
                            padding: 0;
                            text-align: center;
                            width: 36px;
                            height: 36px;
                        }
                        
                        /* Improve overall table layout */
                        .enhanced-calendar .rdp-table {
                            margin: 0 auto;
                            border-collapse: separate;
                            border-spacing: 0;
                        }
                        
                        /* Month navigation and caption styling */
                        .enhanced-calendar .rdp-caption {
                            padding: 0 8px 16px 8px;
                        }
                        
                        .enhanced-calendar .rdp-month {
                            margin: 0;
                        }
                        
                        /* Make month name bolder */
                        .enhanced-calendar .rdp-caption_label {
                            font-weight: 600;
                            color: #333;
                        }
                        
                        /* Fix navigation buttons */
                        .enhanced-calendar .rdp-nav_button {
                            color: #666;
                            border-radius: 4px;
                            padding: 4px;
                        }
                        
                        .enhanced-calendar .rdp-nav_button:hover {
                            background-color: rgba(0, 0, 0, 0.03);
                        }
                    `}</style>
                </PopoverContent>
            </Popover>
        </div>
    )
}