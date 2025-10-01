"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function UltraResponsiveCalendar() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date(2025, 9, 4)) // 4 octobre 2025

  return (
    <div className="flex-1 w-full overflow-auto p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="flex flex-col xl:flex-row h-full gap-4 lg:gap-6 w-full">
        {/* Sidebar - Ultra Responsive */}
        <div className="w-full xl:w-80 flex-shrink-0 order-2 xl:order-1">
          <div className="space-y-3 sm:space-y-4">
            {/* Today's Events Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base truncate">
                    {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "Aucune date sélectionnée"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-6">
                <div className="text-center py-3 sm:py-4 text-muted-foreground text-xs sm:text-sm">
                  Aucun événement prévu
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm lg:text-base">
                    Prochains événements (7 jours)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-6">
                <div className="text-center py-3 sm:py-4 text-muted-foreground text-xs sm:text-sm">
                  Aucun événement à venir
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Calendar Area - Ultra Responsive */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0 w-full order-1 xl:order-2">
          <Card className="flex-1 overflow-hidden border shadow-lg w-full">
            <CardContent className="h-full w-full p-2 sm:p-3 md:p-4 lg:p-6">
              <div className="flex h-full w-full items-center justify-center">
                <div className="w-full max-w-5xl">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="w-full rounded-xl sm:rounded-2xl border bg-background p-1 sm:p-2 md:p-4 lg:p-6 shadow-sm"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-2 sm:space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-2 sm:space-y-4",
                      caption: "flex justify-center pt-1 relative items-center min-h-[2rem]",
                      caption_label: "text-xs sm:text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-6 w-6 sm:h-7 sm:w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-0 sm:left-1",
                      nav_button_next: "absolute right-0 sm:right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-7 sm:w-8 md:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
                      row: "flex w-full mt-1 sm:mt-2",
                      cell: "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-center text-xs sm:text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 font-normal aria-selected:opacity-100 text-xs sm:text-sm",
                      day_range_end: "day-range-end",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    components={{
                      IconLeft: ({ ...props }) => (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 sm:h-4 sm:w-4"
                          {...props}
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      ),
                      IconRight: ({ ...props }) => (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 sm:h-4 sm:w-4"
                          {...props}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      ),
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Display - Ultra Responsive */}
          <Card className="border-dashed w-full">
            <CardContent className="p-3 sm:p-4 text-center">
              <span className="text-xs sm:text-sm md:text-base font-medium break-words">
                Date sélectionnée : {selectedDate ? format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : "Aucune date"}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
