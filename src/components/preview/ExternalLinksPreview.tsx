import { ExternalLink } from "@/lib/types/preview";
import { getUrlType, getYouTubeVideoId, getGDriveFileId, URL_TYPES } from "@/lib/utils/url-utils";

interface ExternalLinksPreviewProps {
  links: ExternalLink[];
}

export function ExternalLinksPreview({ links }: ExternalLinksPreviewProps) {
  // Filter out empty links
  const validLinks = links?.filter((link) => link.url) || [];
  if (validLinks.length === 0) return null;

  return (
    <div className="grid gap-6 mt-6">
      {validLinks.map((link, index) => {
        const urlType = link.type || getUrlType(link.url || "");
        
        // YouTube Preview
        if (urlType === URL_TYPES.YOUTUBE) {
          const videoId = getYouTubeVideoId(link.url || "");
          if (!videoId) return null;
          
          return (
            <div
              key={index}
              className="aspect-video w-full rounded-md overflow-hidden border border-gray-100 shadow-sm"
            >
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={link.title || "YouTube Video"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          );
        }
        
        // Google Drive Preview
        if (urlType === URL_TYPES.GDRIVE) {
          const fileId = getGDriveFileId(link.url || "");
          if (!fileId) return null;
          
          return (
            <div
              key={index}
              className="aspect-video w-full rounded-md overflow-hidden border border-gray-100 shadow-sm"
            >
              <iframe
                src={`https://drive.google.com/file/d/${fileId}/preview`}
                title={link.title || "Google Drive Document"}
                frameBorder="0"
                allow="autoplay"
                className="w-full h-full"
              ></iframe>
            </div>
          );
        }
        
        // For other link types, render a simple link card
        return (
          <div
            key={index}
            className="w-full rounded-md border border-gray-100 shadow-sm p-4"
          >
            <h4 className="text-lg font-medium mb-2">{link.title || "External Link"}</h4>
            <a 
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {link.url}
            </a>
          </div>
        );
      })}
    </div>
  );
} 