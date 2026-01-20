import { GripVerticalIcon } from "lucide-react"
import * as React from "react"
import { Group, Panel, Separator } from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        props.orientation === "vertical" && "flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel(props: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        // Default to vertical separator (for horizontal group)
        "relative flex w-px items-center justify-center bg-border",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Vertical separators (for horizontal groups) are usually standard width.
        // Horizontal separators (for vertical groups) need heigh processing.
        // We can't easily detect parent orientation here without context,
        // so we rely on className overrides from the consumer if needed for vertical splits.
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border/70 z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
