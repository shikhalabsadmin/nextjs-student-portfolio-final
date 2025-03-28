import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Reusable checkbox group component
interface CheckboxGroupProps {
  title: string;
  subtitle?: string;
  items: string[];
  selectedItems: Record<string, boolean>;
  onItemChange: (item: string) => void;
}

const CheckboxGroup = memo(({
  title,
  subtitle,
  items,
  selectedItems,
  onItemChange,
}: CheckboxGroupProps) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-slate-800">
        {title}
        {subtitle && <span className="text-slate-500 ml-1.5 text-sm">({subtitle})</span>}
      </h3>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
        {items.map((item) => {
          const itemKey = item.toLowerCase().replace(/\s+/g, "");
          return (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`${title.toLowerCase()}-${item}`}
                checked={selectedItems[itemKey]}
                onCheckedChange={() => onItemChange(item)}
                className="data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800"
              />
              <Label 
                htmlFor={`${title.toLowerCase()}-${item}`}
                className="text-sm text-slate-700"
              >
                {item}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
});

CheckboxGroup.displayName = 'CheckboxGroup';

export { CheckboxGroup }; 