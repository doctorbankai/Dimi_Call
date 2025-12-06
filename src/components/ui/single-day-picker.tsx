import { format } from "date-fns";

import { useDisclosure } from "../../hooks/use-disclosure";

import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

import { cn } from "../../lib/utils";

import type { ButtonHTMLAttributes } from "react";

// ================================== //

type TProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect" | "value"> & {
  onSelect: (value: Date | undefined) => void;
  value?: Date | undefined;
  placeholder: string;
  labelVariant?: "P" | "PP" | "PPP";
  container?: HTMLElement | null;
  zIndex?: number;
};

function SingleDayPicker({ id, onSelect, className, placeholder, labelVariant = "PPP", value, container, zIndex = 50, ...props }: TProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    onClose();
  };

  return (
    <Popover open={isOpen} onOpenChange={onToggle} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "group relative h-9 w-full justify-start whitespace-nowrap px-3 py-2 font-normal",
            "bg-white text-foreground border-slate-300 dark:bg-slate-900/60 dark:border-slate-600",
            "focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none",
            "hover:bg-white dark:hover:bg-slate-900/60",
            className
          )}
          {...props}
        >
          {value && <span>{format(value, labelVariant)}</span>}
          {!value && <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        align="center" 
        className={cn("w-fit p-0", `z-[${zIndex}]`)} 
        container={container}
        style={{ zIndex }}
      >
        <Calendar mode="single" selected={value} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}

// ================================== //

export { SingleDayPicker };
