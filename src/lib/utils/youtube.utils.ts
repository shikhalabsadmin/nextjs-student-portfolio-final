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

export const getVideoId = (url: string) => {
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
    return match ? match[1] : '';
  } catch {
    // If URL parsing fails, try regex as fallback
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/v\/|.*\/embed\/))([^"&?\s]{11})/);
    return match ? match[1] : '';
  }
};

export const fetchYouTubeVideoTitle = async (videoId: string) => {
  try {
    // Clean up the video ID by removing any URL parameters
    const cleanVideoId = videoId.split('?')[0].split('&')[0];
    
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanVideoId}&format=json`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch video title:', await response.text());
      return 'YouTube Video';
    }

    const data = await response.json();
    return data.title || 'YouTube Video';
  } catch (error) {
    console.error('Error fetching YouTube video title:', error);
    return 'YouTube Video';
  }
}; 