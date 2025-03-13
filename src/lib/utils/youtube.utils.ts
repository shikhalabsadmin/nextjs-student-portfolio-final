import { type AssignmentFile } from "@/types/file";

export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

export function getYouTubeVideoTitle(url: string): string {
  try {
    const videoId = url.includes('youtu.be') 
      ? url.split('/').pop() 
      : new URLSearchParams(new URL(url).search).get('v');
    
    return videoId ? `YouTube Video (${videoId})` : 'YouTube Video';
  } catch {
    return 'YouTube Video';
  }
}

export function handleUrlAddition(url: string): AssignmentFile {
  if (!isYouTubeUrl(url)) {
    throw new Error("Please enter a valid YouTube URL");
  }

  return {
    file_url: url,
    file_name: getYouTubeVideoTitle(url),
    file_type: 'youtube',
    file_size: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 