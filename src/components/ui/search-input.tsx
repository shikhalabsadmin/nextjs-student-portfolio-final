import { memo } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

// Reusable search input component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = memo(({
  value,
  onChange,
  placeholder,
  className,
}: SearchInputProps) => {
  return (
    <div className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 size-5" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search..."}
        className={`bg-white pl-[42px] border border-slate-400 focus:border-slate-200 focus:ring-0 h-10 rounded-[6px] pr-2.5 w-full ${className}`}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export { SearchInput }; 