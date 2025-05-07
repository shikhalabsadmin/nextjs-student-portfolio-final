import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentPortfolio from "@/pages/StudentPortfolio";
import { usePortfolioPreview } from "@/contexts/PortfolioPreviewContext";
import { memo } from "react";

export const PortfolioFullScreenView = memo(function PortfolioFullScreenView() {
  const { closePreview, studentId } = usePortfolioPreview();

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50">
      {/* Close button - absolute positioning instead of sticky */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={closePreview}
          className="h-10 w-10 rounded-full shadow-md bg-white/90 backdrop-blur-sm hover:bg-white"
          aria-label="Close full screen preview"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Portfolio content */}
      <StudentPortfolio previewMode={true} />
    </div>
  );
}); 