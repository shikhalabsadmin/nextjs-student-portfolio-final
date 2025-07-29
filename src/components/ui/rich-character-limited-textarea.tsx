import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";

interface RichCharacterLimitedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  suggestedLength?: number;
  currentLength?: number;
  placeholder?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

export const RichCharacterLimitedTextarea = forwardRef<HTMLDivElement, RichCharacterLimitedTextareaProps>(
  ({ maxLength = 2000, suggestedLength = 1500, currentLength = 0, className, value, onChange, placeholder, ...props }, ref) => {
    const isExceeded = currentLength > suggestedLength;
    
    return (
      <div className={cn("space-y-1", className)} ref={ref}>
        <RichTextEditor
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
        />
        <div className="flex justify-end">
          <span className={`text-base ${isExceeded ? "text-red-500" : "text-gray-500"}`}>
            {currentLength}/{suggestedLength} suggested words
          </span>
        </div>
      </div>
    );
  }
);

RichCharacterLimitedTextarea.displayName = "RichCharacterLimitedTextarea"; 