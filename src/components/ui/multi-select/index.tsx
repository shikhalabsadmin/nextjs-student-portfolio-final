import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Command as CommandPrimitive } from "cmdk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export type Option = {
  label: string;
  value: string | number;
  children?: Option[];  // For nested options
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  nested?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  nested = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = useState(false);
  const safeValue = Array.isArray(value) ? value : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const getOptionLabel = (optionValue: string): string => {
    for (const option of options) {
      if (String(option.value) === optionValue) return option.label;
      if (option.children) {
        for (const child of option.children) {
          if (String(child.value) === optionValue) return `${option.label} - ${child.label}`;
        }
      }
    }
    return optionValue;
  };

  const selected = safeValue.map(getOptionLabel);

  const handleUnselect = (label: string) => {
    const optionValue = safeValue.find(v => getOptionLabel(v) === label);
    if (optionValue) {
      const newValue = safeValue.filter(v => v !== optionValue);
      onChange(newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex flex-wrap gap-1 truncate">
            {selected.length ? (
              selected.map((label) => (
                <Badge
                  variant="secondary"
                  key={label}
                  className="mr-1"
                >
                  {label}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(label);
                    }}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </div>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <CommandPrimitive className="w-full border-none bg-popover">
          <div className="max-h-[300px] overflow-y-auto p-2">
            {options.map((option) => {
              const optionValue = String(option.value);
              const isSelected = safeValue.includes(optionValue);
              return (
                <div
                  key={optionValue}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-sm text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => {
                    const newValue = isSelected
                      ? safeValue.filter(v => v !== optionValue)
                      : [...safeValue, optionValue];
                    onChange(newValue);
                    // Don't close popover on selection for multi-select
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              );
            })}
          </div>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
} 