import { X, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewField } from "./PreviewField";
import { ArtifactPreview } from "./ArtifactPreview";
import { YoutubeLinksPreview } from "./YoutubeLinksPreview";
import { ExternalLinksPreview } from "./ExternalLinksPreview";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { useEffect, useMemo, useCallback, useState, memo } from "react";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FilePreview } from "@/components/ui/file-preview";
import { AssignmentFile } from "@/types/file";
import { getUrlType } from "@/lib/utils/url-utils";

// Format date from ISO string to "12 Jan 2024" format
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface AssignmentPreviewProps {
  values: AssignmentFormValues;
  selectedSkills: string[];
  mainImage: string | null;
  isFullScreen: boolean;
  onClose: () => void;
}

const AssignmentPreview = memo(
  ({
    values,
    selectedSkills = [],
    mainImage = null,
    isFullScreen = false,
    onClose,
  }: AssignmentPreviewProps) => {
    // State for image loading and error handling
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Memoize derived values to prevent recalculations on re-renders
    const hasFiles = useMemo(() => values?.files?.length > 0, [values?.files]);

    // Check for external links (new format)
    const hasExternalLinks = useMemo(
      () => values?.externalLinks?.some((link) => link?.url),
      [values?.externalLinks]
    );

    // Check for YouTube links (legacy format)
    const hasYoutubeLinks = useMemo(
      () => values?.youtubelinks?.some((link) => link?.url),
      [values?.youtubelinks]
    );

    // Combined external links - convert YouTube links to the external links format if needed
    const externalLinks = useMemo(() => {
      // Filter out any empty/invalid links from external links
      const validExternalLinks = values?.externalLinks?.filter(link => link?.url && link.url.trim()) || [];
      const validYoutubeLinks = values?.youtubelinks?.filter(link => link?.url && link.url.trim()) || [];
      
      
      
      // Use external links if available
      if (validExternalLinks.length > 0) {
        return validExternalLinks;
      }
      
      // Otherwise, convert YouTube links to the external format
      if (validYoutubeLinks.length > 0) {
        return validYoutubeLinks.map(link => ({
          url: link.url,
          title: link.title,
          type: 'youtube'
        }));
      }
      
      return [];
    }, [values?.externalLinks, values?.youtubelinks]);

    // Get process documentation images
    const processImages = useMemo(
      () =>
        values?.files?.filter(
          (file) => file && file.is_process_documentation === true
        ) || [],
      [values?.files]
    );

    const hasProcessImages = useMemo(
      () => processImages.length > 0,
      [processImages]
    );

    // Memoize conditional rendering checks
    const hasTeamContribution = useMemo(
      () => values?.is_team_work && values?.team_contribution,
      [values?.is_team_work, values?.team_contribution]
    );

    const hasOriginalityExplanation = useMemo(
      () =>
        values?.is_original_work && values?.originality_explanation
          ? values?.originality_explanation
          : "",
      [values?.is_original_work, values?.originality_explanation]
    );

    const hasAcknowledgments = useMemo(
      () => Boolean(values?.acknowledgments),
      [values?.acknowledgments]
    );

    // Prevent body scrolling when modal is open
    useEffect(() => {
      if (isFullScreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [isFullScreen]);

    // Memoize container classes
    const containerClasses = useMemo(
      () =>
        isFullScreen
          ? "fixed inset-0 z-50 bg-white overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8"
          : "relative w-full",
      [isFullScreen]
    );

    // Handle image loading
    const handleImageLoad = useCallback(() => {
      setImageLoaded(true);
    }, []);

    // Handle image loading error
    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    return (
      <div
        className={cn(
          isFullScreen
            ? ""
            : "border border-slate-200 rounded-md sm:rounded-xl md:rounded-2xl bg-slate-100",
          containerClasses
        )}
      >
        {isFullScreen && (
          <div className="sticky top-0 right-0 z-10 flex justify-end mb-2 md:mb-4 p-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 md:h-10 md:w-10 rounded-full shadow-md bg-white/90 backdrop-blur-sm hover:bg-white"
              aria-label="Close full screen preview"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        )}

        {mainImage ? (
          <div className="w-full aspect-video overflow-hidden shadow-sm sm:shadow-md relative bg-slate-100">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div
                className="absolute inset-0 bg-slate-200 animate-pulse"
                aria-hidden="true"
              />
            )}

            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-200 text-slate-500">
                <ImageOff className="h-8 w-8 sm:h-10 sm:w-10 mb-2 opacity-70" />
                <span className="text-xs sm:text-sm font-medium">
                  Image not available
                </span>
              </div>
            )}

            {/* Main image - hidden when error occurs */}
            {!imageError && (
              <img
                src={mainImage}
                alt={values?.title || "Assignment"}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  !imageLoaded && "opacity-0"
                )}
                loading="eager"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}
          </div>
        ) : null}

        <div className="w-full max-w-full sm:max-w-[90%] md:max-w-[85%] lg:max-w-3xl mx-auto space-y-5 sm:space-y-6 md:space-y-8 pt-4 px-4 sm:pt-6 sm:px-6 md:pt-8 md:px-8 lg:pt-[32px] lg:px-[36px] pb-6 lg:pb-[42px]">
          {/* Assignment Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-semibold text-slate-900 break-words leading-tight">
            {values?.title || "Untitled Assignment"}
          </h1>

          {/* Basic Information */}
          <PreviewField
            label="Type of work"
            value={`This artifact is a ${
              values?.subject || "unspecified"
            } project`}
          />

          <PreviewField
            label="Completion Date"
            value={formatDate(values?.created_at)}
          />

          <PreviewField
            label="Artifact Type"
            value={values?.artifact_type || "Not specified"}
          />

          {/* Artifact Files */}
          {(hasFiles || hasExternalLinks || hasYoutubeLinks) && (
            <div className="flex flex-col gap-2 sm:gap-3 md:gap-[18px]">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-slate-900">
                Attached article
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Files */}
                {hasFiles &&
                  values?.files
                    ?.filter(
                      (file) => file && file.is_process_documentation !== true
                    )
                    .map((file, index) => (
                      <div
                        key={`file-${file.id || index}`}
                        className="relative"
                      >
                        <FilePreview
                          file={
                            {
                              ...file,
                              file_url: file.file_url || "",
                              file_name: file.file_name || "",
                              file_type: file.file_type || "",
                              file_size: file.file_size || 0,
                            } as AssignmentFile
                          }
                        />
                      </div>
                    ))}

                {/* Display External Links */}
                {externalLinks.length > 0 &&
                  externalLinks
                    .filter((link) => link?.url)
                    .map((link, index) => (
                      <div key={`link-${index}`} className="relative">
                        <FilePreview file={link} />
                      </div>
                    ))}
              </div>
              
              {/* Display External Links Preview (embedded iframes) */}
              <ExternalLinksPreview links={externalLinks} />
            </div>
          )}

          {/* Collaboration and Originality */}
          <PreviewField
            label="Is this a team project?"
            value={values?.is_team_work}
          />

          {hasTeamContribution && (
            <PreviewField
              label="Describe your role and experience"
              value={values?.team_contribution}
            />
          )}
          <PreviewField
            label="Did you create something new or original?"
            value={values?.is_original_work}
          />
          {hasOriginalityExplanation && (
            <PreviewField
              label="Explain what was new"
              value={values?.originality_explanation}
            />
          )}

          {/* Skills and Pride */}
          <PreviewField
            label="What skills did you practice?"
            value={selectedSkills}
          />
          <PreviewField
            label="Justify the selected skills"
            value={values?.skills_justification || ""}
          />
          <PreviewField
            label="Why are you proud of this artifact?"
            value={values?.pride_reason || ""}
          />

          {/* Process, Learning, and Reflection */}
          <PreviewField
            label="Describe the process you used to create it"
            value={values?.creation_process || ""}
          />

          {/* Process Documentation Images Carousel */}
          {hasProcessImages && (
            <div className="mt-4 mb-6">
              <h3 className="text-base font-medium text-slate-800 mb-3">
                Process Documentation
              </h3>
              <Carousel
                className="w-full"
                opts={{ loop: processImages.length > 1 }}
              >
                <CarouselContent>
                  {processImages.map((image, index) => (
                    <CarouselItem key={image.id || index}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-gray-200">
                        {image.file_url ? (
                          <img
                            src={image.file_url}
                            alt={image.file_name || "Process image"}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTZweCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgbWlzc2luZzwvdGV4dD48L3N2Zz4=";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">Image missing</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs mt-2 truncate text-center text-gray-600">
                        {image.file_name || "Unnamed image"}
                      </p>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {processImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-1 sm:left-2" />
                    <CarouselNext className="right-1 sm:right-2" />
                  </>
                )}
              </Carousel>
            </div>
          )}

          <PreviewField
            label="Your learnings and future applications"
            value={values?.learnings || ""}
          />
          <PreviewField
            label="Your challenges"
            value={values?.challenges || ""}
          />
          <PreviewField
            label="Your improvements"
            value={values?.improvements || ""}
          />
          {hasAcknowledgments && (
            <PreviewField label="Your gratitude" value={values?.acknowledgments} />
          )}
        </div>
      </div>
    );
  }
);

// Add display name for debugging
AssignmentPreview.displayName = "AssignmentPreview";

export { AssignmentPreview };
