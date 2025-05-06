import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import { UseFormReturn, ControllerRenderProps, FieldValues, Path, PathValue } from "react-hook-form";
import { cn } from "@/lib/utils";

interface ValidatedSelectStyles {
  select?: string;
  formControl?: string;
  selectTrigger?: string;
  selectContent?: string;
  selectItem?: string;  
  emptyItem?: string;
}

interface ValidatedSelectProps<TFieldValues extends FieldValues> {
  field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  form: UseFormReturn<TFieldValues>;
  items: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  onChange?: (value: string) => void;
  styles?: ValidatedSelectStyles;
}

/**
 * A select component that handles validation automatically when a value changes
 */
const ValidatedSelect = <TFieldValues extends FieldValues>({
  field,
  form,
  items,
  placeholder = "Select...",
  disabled,
  emptyMessage = "No items available",
  onChange,
  styles = {},
}: ValidatedSelectProps<TFieldValues>) => {
  // Helper to handle form validation
  const handleValueChange = (value: string) => {
    field.onChange(value);
    
    // Type safety for form setValue
    form.setValue(
      field.name, 
      value as unknown as PathValue<TFieldValues, Path<TFieldValues>>, 
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      }
    );
    
    // Also call the custom onChange handler if provided
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Select
      value={field.value as string}
      defaultValue={field.value as string}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <FormControl className={cn(styles?.formControl ?? "")}>
        <SelectTrigger className={cn(styles?.selectTrigger ?? "")}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent className={cn(styles?.selectContent ?? "")}>
        {items.length > 0 ? (
          items.map((item) => (
            <SelectItem 
              key={item.value} 
              value={item.value}
              className={cn(styles?.selectItem ?? "")}
            >
              {item.label}
            </SelectItem>
          ))
        ) : (
          <SelectItem 
            value="empty" 
            disabled
            className={cn(styles?.emptyItem ?? "")}
          >
            {emptyMessage}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export { ValidatedSelect }; 