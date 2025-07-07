import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface CharacterLimitedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  currentLength?: number;
}

export const CharacterLimitedTextarea = forwardRef<HTMLTextAreaElement, CharacterLimitedTextareaProps>(
  ({ maxLength = 2000, currentLength = 0, className, ...props }, ref) => {
    const isExceeded = currentLength > maxLength;
    
    return (
      <div className="space-y-1">
        <Textarea
          ref={ref}
          className={cn("min-h-[100px]", className)}
          maxLength={maxLength}
          {...props}
        />
        <div className="flex justify-end">
          {isExceeded ? (
            <span className="text-base text-red-500">
              {currentLength}/{maxLength} suggested words
            </span>
          ) : null}
        </div>
      </div>
    );
  }
);

CharacterLimitedTextarea.displayName = "CharacterLimitedTextarea"; 