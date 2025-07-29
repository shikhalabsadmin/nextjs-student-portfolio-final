import { useState } from "react";
import { toast } from "sonner";
import { Image, Upload, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFile } from "@/types/file";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { uploadAssignmentFile, deleteFile, fetchAssignmentFiles } from "@/lib/api/assignments";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CreationProcessImagesProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function CreationProcessImages({ form }: CreationProcessImagesProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the necessary form values
  const assignmentId = form.watch("id") as string | undefined;
  const studentId = form.watch("student_id") as string | undefined;
  
  // Get access to the React Query client instance from the root
  const queryClient = useQueryClient();
  
  // Query to fetch images
  const { 
    data: processImages = [], 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['processImages', assignmentId],
    queryFn: async () => {
      if (!assignmentId) return [];
      
      try {
        const files = await fetchAssignmentFiles(assignmentId);
        // Only consider files that are images AND have is_process_documentation set to true
        return files.filter(file => 
          file && 
          // Check for is_process_documentation flag
          file.is_process_documentation === true &&
          // Filter for image types
          (
            (file.file_type && file.file_type.startsWith('image/')) || 
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext => 
              file.file_name && file.file_name.toLowerCase().endsWith(ext)
            )
          )
        );
      } catch (error) {
        console.error("Error loading process images:", error);
        setError("Failed to load images. Please try refreshing the page.");
        return [];
      }
    },
    enabled: !!assignmentId,
  });
  
  // Mutation for deleting images
  const deleteMutation = useMutation({
    mutationFn: async ({ imageId }: { imageId: string }) => {
      return await deleteFile(imageId);
    },
    onSuccess: () => {
      // Invalidate and refetch the images query
      queryClient.invalidateQueries({ queryKey: ['processImages', assignmentId] });
      toast.success("Image removed from process documentation");
    },
    onError: (error) => {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image. Please try again.");
    }
  });
  
  // Handle image selection and upload
  const handleImageSelect = async () => {
    if (!assignmentId) {
      toast.error("Please save the assignment first before adding images.");
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;
      
      setIsUploading(true);
      setError(null);
      
      try {
        // Create temp files for immediate display
        const filesArray = Array.from(files);
        
        // Validate file sizes
        const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
        const oversizedFiles = filesArray.filter(file => file.size > MAX_FILE_SIZE);
        
        if (oversizedFiles.length > 0) {
          toast.error(`${oversizedFiles.length} file(s) exceed the 1GB size limit and will be skipped.`);
        }
        
        // Filter out oversized files
        const validFiles = filesArray.filter(file => file.size <= MAX_FILE_SIZE);
        
        if (validFiles.length === 0) {
          setIsUploading(false);
          return;
        }
        
        // Create temporary optimistic UI updates
        const tempImages = validFiles.map(file => ({
          id: `temp-${Date.now()}-${file.name}`,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: URL.createObjectURL(file),
          assignment_id: assignmentId,
          student_id: studentId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_process_documentation: true // Set this flag for process documentation images
        } as AssignmentFile));
        
        // Update cache optimistically
        queryClient.setQueryData(['processImages', assignmentId], (old: AssignmentFile[] = []) => {
          return [...old, ...tempImages];
        });
        
        // Upload files in background with assignment and student IDs
        // Include is_process_documentation flag
        const uploadPromises = validFiles.map(file => 
          uploadAssignmentFile(
            file, 
            assignmentId, 
            studentId, 
            { is_process_documentation: true } // Add metadata for process documentation
          ).catch(error => {
            console.error(`Error uploading ${file.name}:`, error);
            return null;
          })
        );
        
        const uploadedImages = await Promise.all(uploadPromises);
        const successfulUploads = uploadedImages.filter(Boolean).length;
        const failedUploads = validFiles.length - successfulUploads;
        
        // Clean up object URLs
        tempImages.forEach(image => {
          if (typeof image.file_url === 'string' && image.file_url.startsWith('blob:')) {
            URL.revokeObjectURL(image.file_url);
          }
        });
        
        // Invalidate the query to refresh with real data
        queryClient.invalidateQueries({ queryKey: ['processImages', assignmentId] });
        
        if (failedUploads > 0) {
          toast.error(`${failedUploads} image(s) failed to upload. Please try again.`);
        }
        
        if (successfulUploads > 0) {
          toast.success(`${successfulUploads} image(s) uploaded successfully`);
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        toast.error("Failed to upload images. Please try again.");
        
        // Invalidate to revert to accurate server state
        queryClient.invalidateQueries({ queryKey: ['processImages', assignmentId] });
      } finally {
        setIsUploading(false);
      }
    };
    
    input.click();
  };
  
  // Handle image deletion
  const handleDeleteImage = (image: AssignmentFile) => {
    if (!image.id || image.id.startsWith('temp-')) {
      // Just remove from UI if it's a temp image
      queryClient.setQueryData(['processImages', assignmentId], (old: AssignmentFile[] = []) => {
        return old.filter(img => img.id !== image.id);
      });
      return;
    }
    
    // Use the mutation for deleting
    deleteMutation.mutate({ imageId: image.id });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Process Documentation</h3>
          <p className="text-sm text-gray-500">Add images showing your creation process</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 text-gray-600 w-full sm:w-auto justify-center sm:justify-start"
          onClick={handleImageSelect}
          disabled={isUploading || !assignmentId}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Images
            </>
          )}
        </Button>
      </div>
      
      {error ? (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md text-red-600 text-sm">
          {error}
          <Button 
            variant="link" 
            size="sm" 
            className="ml-2 text-red-600 underline" 
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md border-gray-300 bg-gray-50">
          <Loader2 className="h-8 w-8 text-gray-400 mb-2 animate-spin" />
          <p className="text-sm text-gray-500">Loading images...</p>
        </div>
      ) : processImages.length > 0 ? (
        <div className="relative">
          <Carousel className="w-full" opts={{ loop: processImages.length > 1 }}>
            <CarouselContent>
              {processImages.map((image) => {
                // Ensure type safety by casting to AssignmentFile
                const typedImage: AssignmentFile = image as AssignmentFile;
                const isDeleting = deleteMutation.isPending && deleteMutation.variables?.imageId === typedImage.id;
                const isTemp = typedImage.id?.startsWith('temp-');
                
                return (
                <CarouselItem key={typedImage.id}>
                  <div className="relative group aspect-[4/3] w-full overflow-hidden rounded-md border border-gray-200">
                    {typedImage.file_url ? (
                      <img
                        src={typedImage.file_url}
                        alt={typedImage.file_name || 'Process image'}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Handle broken images
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTZweCIgZmlsbD0iIzZiNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgbWlzc2luZzwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400">Image missing</span>
                      </div>
                    )}
                    {isTemp && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => handleDeleteImage(typedImage)}
                        disabled={isDeleting || isTemp}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isDeleting ? "Removing..." : "Remove Image"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs mt-2 truncate text-center text-gray-600">
                    {typedImage.file_name || 'Unnamed image'}
                  </p>
                </CarouselItem>
                );
              })}
            </CarouselContent>
            {processImages.length > 1 && (
              <>
                <div className="flex items-center justify-center pt-2">
                  <span className="text-sm text-muted-foreground">
                    {processImages.length} images
                  </span>
                </div>
                <CarouselPrevious className="left-1 sm:left-2" />
                <CarouselNext className="right-1 sm:right-2" />
              </>
            )}
          </Carousel>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md border-gray-300 bg-gray-50">
          <Image className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No process images added yet</p>
        </div>
      )}
      
      {!assignmentId && (
        <p className="text-xs text-amber-600">
          Save the assignment first to enable image uploads
        </p>
      )}
    </div>
  );
} 