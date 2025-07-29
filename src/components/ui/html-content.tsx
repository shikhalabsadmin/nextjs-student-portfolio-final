import { memo } from "react";
import { cn } from "@/lib/utils";

interface HtmlContentProps {
  html: string;
  className?: string;
}

/**
 * Component for safely rendering HTML content from rich text editors
 */
const HtmlContent = memo(({ html, className }: HtmlContentProps) => {
  if (!html) return null;
  
  return (
    <div 
      className={cn("prose max-w-none", className)} 
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

HtmlContent.displayName = "HtmlContent";

export { HtmlContent }; 