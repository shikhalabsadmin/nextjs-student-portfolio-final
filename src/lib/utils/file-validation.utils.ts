export function validateFileType(file: File): boolean {
  // Allow image/*, video/*, audio/*, and PDF files
  const fileType = file.type.toLowerCase();
  
  return (
    fileType.startsWith("image/") ||
    fileType.startsWith("video/") ||
    fileType.startsWith("audio/") ||
    fileType === "application/pdf"
  );
}

// Maximum file size of 250MB
export function validateFileSize(file: File, maxSizeMB: number = 250): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
