import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Command as CommandPrimitive } from "cmdk";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  disabled?: boolean;
  maxDisplayItems?: number;
  className?: string;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select...",
  nested = false,
  disabled = false,
  maxDisplayItems = 3,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const safeValue = Array.isArray(value) ? value : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

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
  const displaySelected = selected.slice(0, maxDisplayItems);
  const remainingCount = selected.length - maxDisplayItems;

  const handleUnselect = (label: string) => {
    const optionValue = safeValue.find(v => getOptionLabel(v) === label);
    if (optionValue) {
      const newValue = safeValue.filter(v => v !== optionValue);
      onChange(newValue);
    }
  };

  const filteredOptions = options.filter(option => {
    const matchesSearch = option.label.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check children if this option doesn't match
    if (!matchesSearch && option.children) {
      return option.children.some(child => 
        child.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return matchesSearch;
  });

  const renderOptions = (options: Option[], parentLabel?: string) => {
    return options.map((option) => {
      const optionValue = String(option.value);
      const isSelected = safeValue.includes(optionValue);
      const fullLabel = parentLabel ? `${parentLabel} - ${option.label}` : option.label;

      return (
        <React.Fragment key={optionValue}>
          <motion.button
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            type="button"
            className={cn(
              "flex w-full items-center px-3 py-2 text-sm cursor-pointer",
              "transition-colors duration-150 rounded-md",
              isSelected 
                ? "bg-primary/10 text-primary font-medium" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => {
              const newValue = isSelected
                ? safeValue.filter(v => v !== optionValue)
                : [...safeValue, optionValue];
              onChange(newValue);
              if (!isSelected) {
                inputRef.current?.focus();
              }
            }}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            disabled={disabled}
            aria-selected={isSelected}
            role="option"
          >
            <div className="flex items-center justify-center mr-2 w-4 h-4">
              <Check
                className={cn(
                  "h-4 w-4 flex-shrink-0 text-primary transition-opacity duration-150",
                  isSelected ? "opacity-100" : "opacity-0"
                )}
              />
            </div>
            <span className="flex-grow text-left">{option.label}</span>
          </motion.button>
          
          {nested && option.children && option.children.length > 0 && (
            <div className="pl-6 border-l-2 border-muted ml-2 mt-1 mb-1">
              {renderOptions(option.children, option.label)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-disabled={disabled}
            className={cn(
              "w-full h-10 justify-between transition-all duration-200",
              "text-left rounded-md border border-input bg-background px-3 py-2",
              "hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
            onClick={() => !disabled && setOpen(!open)}
          >
            <div className="flex flex-wrap gap-1.5 items-center">
              {selected.length ? (
                <>
                  <AnimatePresence>
                    {displaySelected.map((label) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Badge
                          className={cn(
                            "px-2.5 py-0.5 gap-1.5 flex items-center rounded-full",
                            "bg-slate-800 hover:bg-slate-800 text-white border-none"
                          )}
                        >
                          <span className="text-xs font-medium truncate max-w-[150px]">{label}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!disabled) handleUnselect(label);
                            }}
                            className={cn(
                              "rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-white",
                              "text-white hover:text-white transition-colors ml-0.5"
                            )}
                            aria-label={`Remove ${label}`}
                            disabled={disabled}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {remainingCount > 0 && (
                    <Badge 
                      variant="outline" 
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                    >
                      +{remainingCount} more
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 transition-transform duration-200" 
                           style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 shadow-md border border-border"
          align="start"
          side="bottom"
          sideOffset={5}
          style={{ width: triggerRef.current ? `${triggerRef.current.offsetWidth}px` : '100%' }}
        >
          <CommandPrimitive 
            ref={commandRef}
            className="w-full max-h-[300px] overflow-hidden flex flex-col"
            shouldFilter={false}
          >
            <div className="flex items-center border-b px-3 py-2 sticky top-0 bg-background z-10">
              <Search className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search options..."
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                aria-label="Search options"
              />
            </div>
            <div className="overflow-y-auto p-1 space-y-0.5 max-h-[260px]">
              {filteredOptions.length > 0 ? (
                renderOptions(filteredOptions)
              ) : (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  No options found
                </div>
              )}
            </div>
            {selected.length > 0 && (
              <div className="border-t p-2 flex justify-between items-center bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  {selected.length} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange([]);
                    setSearchQuery("");
                  }}
                  className="h-7 text-xs px-2 hover:bg-accent"
                  disabled={disabled}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
    </div>
  );
} 