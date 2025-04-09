import React, { useEffect, useState } from "react";
import { Pencil, Share2, Plus, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { HexColorPicker } from "react-colorful";
import { ColorConfig, ColorType } from "@/types/color-picker";
import { getInitialColors, updateCssVariable } from "@/utils/color-utils";
import { ColorPickerButton } from "@/components/ui/color-picker-button";
import { ROUTES } from "@/config/routes";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { EnhancedUser } from "@/hooks/useAuthState";

interface StickyCornerProps {
  user: EnhancedUser | null;
}

export function StickyCorner({ user }: StickyCornerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [colors, setColors] = React.useState(() => getInitialColors());
  const [activeColor, setActiveColor] = React.useState<ColorType>("primary");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleColorChange = (color: string) => {
    const newColors = { ...colors, [activeColor]: color };
    setColors(newColors);
    updateCssVariable(activeColor, color);
  };

  const portfolioUrl = user?.id 
    ? `${window.location.origin}/${user.id}`
    : '';

  const handleCopyLink = async () => {
    if (!portfolioUrl) return;
    
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Portfolio link copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!portfolioUrl) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Student Portfolio",
          text: "Check out my student portfolio!",
          url: portfolioUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Your portfolio has been shared",
        });
      } catch (err) {
        // User canceled or share failed
        console.log("Share failed", err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      setIsShareDialogOpen(true);
    }
  };

  return (
    <div className="fixed top-28 right-2.5 z-50 bg-background p-5 rounded-md">
      <div className="flex flex-col items-center gap-3">
        <TooltipProvider>
          {/* Edit Profile Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100"
                onClick={() => navigate(ROUTES.STUDENT.PROFILE)}
              >
                <Pencil className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Profile</p>
            </TooltipContent>
          </Tooltip>

            {/* Color Picker Button */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <ColorPickerButton />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Customize Your Colors</DialogTitle>
                <DialogDescription>
                  Choose your preferred colors for primary, secondary, and
                  background elements of your portfolio.
                </DialogDescription>
              </DialogHeader>
              <Tabs
                defaultValue="primary"
                className="w-full"
                onValueChange={(value) => setActiveColor(value as ColorType)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="primary">Primary</TabsTrigger>
                  <TabsTrigger value="secondary">Secondary</TabsTrigger>
                  <TabsTrigger value="background">Background</TabsTrigger>
                </TabsList>
                <div className="py-6">
                  <div className="flex flex-col items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full border-2"
                      style={{ backgroundColor: colors[activeColor] }}
                    />
                    <HexColorPicker
                      color={colors[activeColor]}
                      onChange={handleColorChange}
                      className="w-full max-w-[300px]"
                    />
                    <div className="text-sm text-muted-foreground">
                      Selected color: {colors[activeColor].toUpperCase()}
                    </div>
                  </div>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>


          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-100"
                onClick={handleShare}
                disabled={!user?.id}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Portfolio</p>
            </TooltipContent>
          </Tooltip>

          {/* Share Dialog for browsers without Web Share API */}
          <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share your portfolio</DialogTitle>
                <DialogDescription>
                  Copy this link to share your portfolio with others
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2 mt-4">
                <Input 
                  value={portfolioUrl} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  className="shrink-0" 
                  size="icon" 
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter className="mt-4">
                <Button 
                  onClick={() => setIsShareDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        
          {/* Create Artefact Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg shadow-md"
                onClick={() => navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create New Artefact</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
