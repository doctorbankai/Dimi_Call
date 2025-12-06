import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-none transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Dark mode fixes for date/time picker icons
        type === "date" && "[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)] [&::-webkit-calendar-picker-indicator]:dark:opacity-80",
        type === "time" && "[&::-webkit-calendar-picker-indicator]:dark:filter-[invert(1)_brightness(0.8)] [&::-webkit-calendar-picker-indicator]:dark:opacity-80",
        className
      )}
      {...props}
    />
  )
}

export { Input }
