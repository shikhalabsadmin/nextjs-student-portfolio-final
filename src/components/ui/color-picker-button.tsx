import React from "react";
import { PaintRoller } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Create a forwardRef wrapper for the color picker button with tooltip
export const ColorPickerButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className="hover:bg-gray-100"
        {...props}
      >
        <PaintRoller className="h-5 w-5" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Customize Colors</p>
    </TooltipContent>
  </Tooltip>
));

ColorPickerButton.displayName = "ColorPickerButton"; 