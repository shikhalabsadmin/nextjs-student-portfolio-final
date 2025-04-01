import { memo } from "react";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";

// Reusable filter button component
interface FilterButtonProps {
  onClick: () => void;
  count: number;
}

const FilterButton = memo(({ onClick, count }: FilterButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label="Filter"
      className="h-10 border border-slate-200 bg-white hover:bg-slate-50 flex-shrink-0 relative px-4 py-2 flex items-center gap-2.5 rounded-[6px]"
    >
      <FilterIcon className="h-4 w-4 text-slate-800" />
      <span className="text-slate-800 text-sm font-medium">Filter</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
          {count}
        </span>
      )}
    </Button>
  );
});

FilterButton.displayName = 'FilterButton';

export { FilterButton }; 