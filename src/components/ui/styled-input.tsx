import { Input } from "./input";
import { cn } from "@/lib/utils";

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const StyledInput = ({ className, ...props }: StyledInputProps) => {
  return (
    <Input
      className={cn(
        "h-[50px] px-4 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  );
}; 