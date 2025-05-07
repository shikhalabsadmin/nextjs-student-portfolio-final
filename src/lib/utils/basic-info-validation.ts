import { type AssignmentFormValues } from "@/lib/validations/assignment";

/**
 * Checks if all required fields in the Basic Information tab are filled
 * @param formData The current assignment form data
 * @returns Boolean indicating whether all required fields are completed
 */
export function isBasicInfoComplete(formData: AssignmentFormValues): boolean {
  // Check required string fields
  const requiredFields: (keyof AssignmentFormValues)[] = ['title', 'artifact_type', 'subject', 'month'];
  const areRequiredFieldsFilled = requiredFields.every(field => {
    const value = formData[field];
    
    // Handle different types of values appropriately
    if (typeof value === 'string') {
      return value.trim() !== '';
    } else if (Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'boolean') {
      return value !== undefined;
    }
    
    return false; // If field is undefined or null, it's not valid
  });

  // Check if at least one of files or youtubelinks is present
  const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
    formData.youtubelinks.some(link => link?.url && link.url.trim().length > 0);
    
  const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
  
  // All required fields must be filled AND either files or youtubelinks must be present
  return areRequiredFieldsFilled && (hasYoutubeLinks || hasFiles);
} 