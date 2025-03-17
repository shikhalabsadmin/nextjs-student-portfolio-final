import { YoutubeLink } from "@/lib/types/preview";

interface YoutubeLinksPreviewProps {
  links: YoutubeLink[];
}

export function YoutubeLinksPreview({ links }: YoutubeLinksPreviewProps) {
  // Filter out empty links
  const validLinks = links?.filter(link => link.url) || [];
  if (validLinks.length === 0) return null;

  // Function to extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <div className="grid gap-4 mt-4">
      {validLinks.length > 0 && <h4 className="text-sm font-medium text-gray-700">YouTube Links</h4>}
      {validLinks.map((link, index) => {
        const videoId = getYoutubeVideoId(link.url || '');
        
        if (!videoId) return null;
        
        return (
          <div key={index} className="aspect-video w-full rounded-md overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={link.title || 'YouTube Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        );
      })}
    </div>
  );
} 