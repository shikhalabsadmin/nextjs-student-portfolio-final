export function validateFileType(file: File): boolean {
  // Allow image/*, video/*, audio/*, and PDF files
  const fileType = file.type.toLowerCase();
  
  return (
    fileType.startsWith("image/") ||
    fileType.startsWith("video/") ||
    fileType.startsWith("audio/") ||
    fileType.startsWith("application/pdf")
  );
}

// Maximum file size of 1GB
export function validateFileSize(file: File, maxSizeMB: number = 1024): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
