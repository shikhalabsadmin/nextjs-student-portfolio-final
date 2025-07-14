import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CharacterLimitedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  suggestedLength?: number;
  currentLength?: number;
}

export const CharacterLimitedTextarea = forwardRef<HTMLTextAreaElement, CharacterLimitedTextareaProps>(
  ({ maxLength = 2000, suggestedLength = 1500, currentLength = 0, className, ...props }, ref) => {
    const isExceeded = currentLength > suggestedLength;
    
    return (
      <div className="space-y-1">
        <Textarea
          ref={ref}
          className={cn("min-h-[100px]", className)}
          maxLength={maxLength}
          {...props}
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

CharacterLimitedTextarea.displayName = "CharacterLimitedTextarea"; 