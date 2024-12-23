import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function EnhancedTooltip({ 
  content, 
  children, 
  showIcon = true,
  className 
}: EnhancedTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger className={cn("cursor-help inline-flex items-center gap-1", className)}>
          {children}
          {showIcon && <InfoIcon className="h-4 w-4 text-gray-500" />}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}