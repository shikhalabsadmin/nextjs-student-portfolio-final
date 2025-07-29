import { type AssignmentFormValues } from "@/lib/validations/assignment";

/**
 * Migrates YouTube links from the legacy format to the new external links format
 * Used to ensure backward compatibility with existing data
 * @param data The raw assignment data 
 * @returns The processed assignment data with migration applied
 */
export function migrateAssignmentData(data: AssignmentFormValues): AssignmentFormValues {
  // Deep clone to avoid mutation issues
  const migratedData = structuredClone(data);
  
  // Migrate youtubelinks to externalLinks if needed
  if (Array.isArray(data.youtubelinks) && data.youtubelinks.length > 0) {
    // Check if externalLinks already exists and has content
    const hasExistingExternalLinks = Array.isArray(data.externalLinks) && 
      data.externalLinks.some(link => link?.url && link.url.trim() !== "");
    
    if (!hasExistingExternalLinks) {
      // Transform youtubelinks to the externalLinks format
      migratedData.externalLinks = data.youtubelinks.map(link => ({
        url: link.url,
        title: link.title,
        type: 'youtube'
      }));
    }
  }
  
  // If externalLinks doesn't exist at all, initialize it
  if (!Array.isArray(migratedData.externalLinks)) {
    migratedData.externalLinks = [];
  }
  
  // If youtubelinks doesn't exist at all, initialize it
  if (!Array.isArray(migratedData.youtubelinks)) {
    migratedData.youtubelinks = [];
  }
  
  return migratedData;
} 