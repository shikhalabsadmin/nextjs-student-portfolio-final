import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface StyledTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const StyledTextarea = ({ className, ...props }: StyledTextareaProps) => {
  return (
    <Textarea
      className={cn(
        "min-h-[100px] px-4 py-3 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none",
        className
      )}
      {...props}
    />
  );
}; 