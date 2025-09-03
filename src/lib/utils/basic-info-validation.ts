import { type AssignmentFormValues } from "@/lib/validations/assignment";

/**
 * Checks if basic text fields are complete (for navigation purposes)
 * @param formData The current assignment form data
 * @returns Boolean indicating whether text fields allow navigation
 */
export function isBasicInfoNavigationComplete(formData: AssignmentFormValues): boolean {
  // Check required string fields only (not files)
  const requiredFields: (keyof AssignmentFormValues)[] = ['title', 'artifact_type', 'subject', 'month'];
  return requiredFields.every(field => {
    const value = formData[field];
    
    if (typeof value === 'string') {
      return value.trim() !== '';
    } else if (Array.isArray(value)) {
      return value.length > 0;
    } else if (typeof value === 'boolean') {
      return value !== undefined;
    }
    
    return false;
  });
}

/**
 * Checks if all required fields in the Basic Information tab are filled (including files)
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

  // Check if at least one of files, youtubelinks, or externalLinks is present
  const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
    formData.youtubelinks.some(link => link?.url && link.url.trim().length > 0);
    
  const hasExternalLinks = Array.isArray(formData.externalLinks) && 
    formData.externalLinks.some(link => link?.url && link.url.trim().length > 0);

  const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
  
  // DEBUG: Log the validation details
  console.log('🔍 [BASIC_INFO_VALIDATION]', {
    assignmentId: formData.id,
    areRequiredFieldsFilled,
    hasYoutubeLinks,
    hasExternalLinks,
    hasFiles,
    youtubelinks: formData.youtubelinks,
    externalLinks: formData.externalLinks,
    files: formData.files?.length || 0,
    finalResult: areRequiredFieldsFilled && (hasYoutubeLinks || hasExternalLinks || hasFiles)
  });
  
  // All required fields must be filled AND either files, youtubelinks, or externalLinks must be present
  return areRequiredFieldsFilled && (hasYoutubeLinks || hasExternalLinks || hasFiles);
} 