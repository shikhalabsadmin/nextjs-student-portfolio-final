export function validateFileType(file: File): boolean {
  const allowedTypes = {
    // Images
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    
    // Documents
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'application/vnd.ms-excel': true,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': true,
    'application/vnd.ms-powerpoint': true,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': true,
    'text/plain': true,
    
    // Audio
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/ogg': true,
    
    // Video
    'video/mp4': true,
    'video/quicktime': true,
    'video/webm': true,
  };
  
  return allowedTypes[file.type as keyof typeof allowedTypes] || false;
}

// Maximum file size of 50MB
export function validateFileSize(file: File, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
} 