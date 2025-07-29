/**
 * URL utilities for handling and validating different types of URL links
 */
import { type AssignmentFile } from "@/types/file";

// URL type constants
export const URL_TYPES = {
  YOUTUBE: 'youtube',
  GDRIVE: 'gdrive',
  CANVA: 'canva',
  FIGMA: 'figma',
  GENERIC: 'url'
};

/**
 * Determines the type of URL based on its domain
 */
export function getUrlType(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "youtu.be") {
      return URL_TYPES.YOUTUBE;
    }
    
    if (hostname === "drive.google.com" || hostname.endsWith(".googleusercontent.com")) {
      return URL_TYPES.GDRIVE;
    }
    
    if (hostname === "canva.com" || hostname === "www.canva.com") {
      return URL_TYPES.CANVA;
    }
    
    if (hostname === "figma.com" || hostname === "www.figma.com") {
      return URL_TYPES.FIGMA;
    }
    
    // Default to generic URL
    return URL_TYPES.GENERIC;
  } catch {
    // If URL parsing fails, return generic
    return URL_TYPES.GENERIC;
  }
}

/**
 * Validates that a string is a proper URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return getUrlType(url) === URL_TYPES.YOUTUBE;
}

/**
 * Validates that a URL is a Google Drive URL
 */
export function isGDriveUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return getUrlType(url) === URL_TYPES.GDRIVE;
}

/**
 * Validates that a URL is a Canva URL
 */
export function isCanvaUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return getUrlType(url) === URL_TYPES.CANVA;
}

/**
 * Extracts the YouTube video ID from a YouTube URL
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!isYouTubeUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be format
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    // Handle youtube.com format
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return videoId.split('?')[0];
    }
    
    // If URL parsing fails or no video ID found, try regex
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/v\/|.*\/embed\/))([^"&?\s]{11})/);
    return match ? match[1] : null;
  } catch {
    // If URL parsing fails, try regex as fallback
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/v\/|.*\/embed\/))([^"&?\s]{11})/);
    return match ? match[1] : null;
  }
}

/**
 * Extracts the Google Drive file ID from a Drive URL
 */
export function getGDriveFileId(url: string): string | null {
  if (!isGDriveUrl(url)) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Handle drive.google.com/file/d/{fileId}/view format
    const pathParts = urlObj.pathname.split('/');
    const fileIndex = pathParts.indexOf('file');
    if (fileIndex !== -1 && fileIndex < pathParts.length - 2) {
      return pathParts[fileIndex + 2];
    }
    
    // Handle drive.google.com/open?id={fileId} format
    const idParam = urlObj.searchParams.get('id');
    if (idParam) {
      return idParam;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Creates an AssignmentFile object from a URL
 */
export function handleUrlAddition(url: string): AssignmentFile {
  if (!isValidUrl(url)) {
    throw new Error("Please enter a valid URL");
  }

  const urlType = getUrlType(url);
  let title = "Linked Resource";
  
  // Try to get a better title based on URL type
  if (urlType === URL_TYPES.YOUTUBE) {
    title = "YouTube Video";
  } else if (urlType === URL_TYPES.GDRIVE) {
    title = "Google Drive Document";
  } else if (urlType === URL_TYPES.CANVA) {
    title = "Canva Design";
  } else if (urlType === URL_TYPES.FIGMA) {
    title = "Figma Design";
  }

  return {
    file_url: url,
    file_name: title,
    file_type: urlType,
    file_size: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 