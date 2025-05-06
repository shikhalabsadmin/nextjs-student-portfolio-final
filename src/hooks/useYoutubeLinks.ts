import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { isYouTubeUrl, getVideoId, fetchYouTubeVideoTitle } from "@/lib/utils/youtube";

type YoutubeLink = {
  url?: string;
  title?: string;
};

type YoutubeLinksOptions = {
  /**
   * Called before adding a link to get the current YouTube links
   */
  getLinks: () => YoutubeLink[];
  
  /**
   * Called to update YouTube links in the UI/state
   */
  setLinks: (links: YoutubeLink[]) => Promise<void>;
  
  /**
   * Optional custom messages for toasts
   */
  successMessage?: string;
  invalidUrlMessage?: string;
  errorMessage?: string;
};

type YoutubeHookReturn = {
  handleYoutubeUrl: (url: string) => Promise<boolean>;
};

/**
 * A reusable hook for managing YouTube links
 */
export function useYoutubeLinks(options: YoutubeLinksOptions): YoutubeHookReturn {
  const { 
    getLinks, 
    setLinks, 
    successMessage, 
    invalidUrlMessage, 
    errorMessage 
  } = options;
  
  const { toast } = useToast();

  const handleYoutubeUrl = useCallback(async (url: string) => {
    // Trim the URL to prevent common issues
    const trimmedUrl = url.trim();
    
    // Client-side validation
    if (!isYouTubeUrl(trimmedUrl)) {
      toast({
        title: "Invalid URL",
        description: invalidUrlMessage || "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return false;
    }

    const videoId = getVideoId(trimmedUrl);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: invalidUrlMessage || "Could not extract YouTube video ID.",
        variant: "destructive",
      });
      return false;
    }
    
    // Set up temporary placeholder and position tracking
    const currentLinks = getLinks();
    const newLinks = [...currentLinks];
    const emptyIndex = newLinks.findIndex(link => !link.url);
    const position = emptyIndex !== -1 ? emptyIndex : newLinks.length;
    
    // Add placeholder for immediate UI update
    if (emptyIndex !== -1) {
      newLinks[position] = { url: trimmedUrl, title: "Loading video title..." };
    } else {
      newLinks.push({ url: trimmedUrl, title: "Loading video title..." });
    }
    
    // Update UI immediately
    await setLinks(newLinks);
    
    try {
      // Fetch video metadata
      const title = await fetchYouTubeVideoTitle(videoId);
      if (!title) throw new Error("Could not fetch video title");
      
      // Update with real data
      const updatedLinks = [...newLinks];
      updatedLinks[position] = { url: trimmedUrl, title };
      
      await setLinks(updatedLinks);
      
      toast({
        title: "Success",
        description: successMessage || "YouTube video added successfully",
      });
      return true;
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      
      // Rollback on failure
      const rollbackLinks = [...currentLinks];
      
      await setLinks(rollbackLinks);
      
      toast({
        title: "Invalid URL",
        description: error instanceof Error 
          ? error.message 
          : (errorMessage || "Could not process YouTube URL."),
        variant: "destructive",
      });
      return false;
    }
  }, [getLinks, setLinks, toast, successMessage, invalidUrlMessage, errorMessage]);

  return { handleYoutubeUrl };
} 