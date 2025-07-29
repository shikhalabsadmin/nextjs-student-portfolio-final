import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { 
  isValidUrl, 
  getUrlType, 
  URL_TYPES,
  getYouTubeVideoId,
  handleUrlAddition
} from "@/lib/utils/url-utils";
import { fetchYouTubeVideoTitle } from "@/lib/utils/youtube";

type ExternalLink = {
  url?: string;
  title?: string;
  type?: string;
};

type ExternalLinksOptions = {
  /**
   * Called before adding a link to get the current links
   */
  getLinks: () => ExternalLink[];
  
  /**
   * Called to update links in the UI/state
   */
  setLinks: (links: ExternalLink[]) => Promise<void>;
  
  /**
   * Optional custom messages for toasts
   */
  successMessage?: string;
  invalidUrlMessage?: string;
  errorMessage?: string;
  
  /**
   * Optional filter to only accept specific URL types
   */
  allowedTypes?: string[];
};

type ExternalLinksHookReturn = {
  handleExternalUrl: (url: string) => Promise<boolean>;
};

/**
 * A reusable hook for managing external links (YouTube, GDrive, Canva, etc.)
 */
export function useExternalLinks(options: ExternalLinksOptions): ExternalLinksHookReturn {
  const { 
    getLinks, 
    setLinks, 
    successMessage, 
    invalidUrlMessage, 
    errorMessage,
    allowedTypes = Object.values(URL_TYPES)
  } = options;
  
  const { toast } = useToast();

  const handleExternalUrl = useCallback(async (url: string) => {
    // Trim the URL to prevent common issues
    const trimmedUrl = url.trim();
    
    // Client-side validation
    if (!isValidUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description: invalidUrlMessage || "Please enter a valid URL.",
        variant: "destructive",
      });
      return false;
    }

    // Determine URL type
    const urlType = getUrlType(trimmedUrl);
    
    // Check if URL type is allowed
    if (!allowedTypes.includes(urlType)) {
      toast({
        title: "Unsupported URL",
        description: `This URL type is not supported. Allowed types: ${allowedTypes.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    
    // Set default title based on URL type
    let defaultTitle = "External Resource";
    if (urlType === URL_TYPES.YOUTUBE) defaultTitle = "YouTube Video";
    else if (urlType === URL_TYPES.GDRIVE) defaultTitle = "Google Drive Document";
    else if (urlType === URL_TYPES.CANVA) defaultTitle = "Canva Design";
    else if (urlType === URL_TYPES.FIGMA) defaultTitle = "Figma Design";
    
    // Set up temporary placeholder and position tracking
    const currentLinks = getLinks();
    const newLinks = [...currentLinks];
    const emptyIndex = newLinks.findIndex(link => !link.url);
    const position = emptyIndex !== -1 ? emptyIndex : newLinks.length;
    
    // Add placeholder for immediate UI update
    if (emptyIndex !== -1) {
      newLinks[position] = { url: trimmedUrl, title: `Loading ${defaultTitle}...`, type: urlType };
    } else {
      newLinks.push({ url: trimmedUrl, title: `Loading ${defaultTitle}...`, type: urlType });
    }
    
    // Update UI immediately
    await setLinks(newLinks);
    
    try {
      let title = defaultTitle;
      
      // For YouTube videos, try to fetch the title
      if (urlType === URL_TYPES.YOUTUBE) {
        const videoId = getYouTubeVideoId(trimmedUrl);
        if (videoId) {
          const fetchedTitle = await fetchYouTubeVideoTitle(videoId);
          if (fetchedTitle) title = fetchedTitle;
        }
      }
      
      // Update with real data
      const updatedLinks = [...newLinks];
      updatedLinks[position] = { url: trimmedUrl, title, type: urlType };
      
      await setLinks(updatedLinks);
      
      toast({
        title: "Success",
        description: successMessage || `${title} added successfully`,
      });
      return true;
    } catch (error) {
      console.error("Error processing URL:", error);
      
      // Rollback on failure
      const rollbackLinks = [...currentLinks];
      
      await setLinks(rollbackLinks);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : (errorMessage || "Could not process URL."),
        variant: "destructive",
      });
      return false;
    }
  }, [getLinks, setLinks, toast, successMessage, invalidUrlMessage, errorMessage, allowedTypes]);

  return { handleExternalUrl };
} 