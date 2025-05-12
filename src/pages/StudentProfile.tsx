import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { GRADE_LEVELS } from "@/constants/grade-subjects";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROFILE_KEYS } from "@/query-key/profile";
import { X, Upload, Info } from "lucide-react";
import SCHOOL_OPTIONS from "@/constants/student_profile_school_options";
import { getProfileInfo } from "@/api/profiles";

// Define maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

// Schema
const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required").default(""),
  grade: z.string().min(1, "Grade is required").default(""),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .default(""),
  school_name: z.string().default(""),
  image: z.string().optional().default(""),
  image_path: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

// UI Component
export const StudentProfile = ({
  user,
}: {
  user: {
    id?: string;
    image?: string;
    full_name?: string;
    grade?: string;
    bio?: string;
    school_name?: string;
    image_path?: string;
  };
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: (user?.full_name as string) || "",
      grade: (user?.grade as string) || "",
      bio: (user?.bio as string) || "",
      school_name: (user?.school_name as string) || "",
      image: (user?.image as string) || "",
      image_path: (user?.image_path as string) || "",
    },
  });

  // Use React Query to fetch profile data
  const { data: profileData } = useQuery({
    queryKey: PROFILE_KEYS.profile(user?.id),
    queryFn: async () => {
      const response = await getProfileInfo(user?.id);

      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch profile data",
          variant: "destructive",
        });
        throw new Error(response.message);
      }

      const data = response?.data;

      console.log("[DEBUG Profile Picture] data", {
        data:data,
        full_name: data["fullname"],
        bio: data["bio"],
        grade: data["grade"],
        image: data["image"],
        image_path: data["image_path"],
        school_name: data["school_name"],
      });

      form.reset({
        full_name: data["fullname"],
        bio: data["bio"],
        grade: data["grade"],
        image: data["image"],
        image_path: data["image_path"],
        school_name: data["school_name"],
      });

      return data;
    },
    enabled: !!user?.id,
  });

  // Function to handle file upload to Supabase storage and return the file name and public URL
  const uploadProfilePicture = async (
    file: File
  ): Promise<{ fileName: string; publicUrl: string }> => {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profilepictures")
      .upload(fileName, file, {
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.log("[DEBUG Profile Picture] uploadProfilePicture error", {
        uploadError,
        fileName,
        fileExt,
        file,
      });
      toast({
        title: "Error",
        description: "Failed to upload profile picture to storage",
        variant: "destructive",
      });
      throw new Error("Failed to upload profile picture to storage");
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profilepictures").getPublicUrl(fileName);

    console.log("[DEBUG Profile Picture] uploadProfilePicture success", {
      fileName,
      publicUrl,
    });

    return { fileName, publicUrl: publicUrl ?? "" };
  };

  // Function to delete file from Supabase storage and delete the image from the database
  const deleteProfilePicture = async (fileName: string) => {
    console.log("[DEBUG Profile Picture] deleteProfilePicture", {
      fileName,
    });
    if (!fileName || fileName.trim() === "") return;

    try {
      const [storageResponse, profileResponse] = await Promise.all([
        supabase.storage.from("profilepictures").remove([fileName]),

        supabase
          .from("profiles")
          .update({ image: null, image_path: null })
          .eq("id", user?.id),
      ]);

      if (storageResponse.error) {
        console.log("[DEBUG Profile Picture] deleteProfilePicture error", {
          storageResponse,
        });
        toast({
          title: "Error",
          description: "Failed to delete profile picture from storage",
          variant: "destructive",
        });
        throw new Error("Failed to delete profile picture from storage");
      }

      if (profileResponse.error) {
        console.log("[DEBUG Profile Picture] deleteProfilePicture error", {
          profileResponse,
        });
        toast({
          title: "Error",
          description: "Failed to update profile picture from database",
          variant: "destructive",
        });
        throw new Error("Failed to update profile picture from database");
      }
      console.log("[DEBUG Profile Picture] deleteProfilePicture success");
    } catch (error) {
      console.log("[DEBUG Profile Picture] deleteProfilePicture error", {
        error,
      });
      toast({
        title: "Error",
        description: "Failed to delete profile picture",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const currentImage = form.getValues("image") || "";
      const currentImagePath = form.getValues("image_path") || "";
      
      console.log("[DEBUG Profile Picture] updateProfileMutation", {
        currentImage,
        currentImagePath,
        originalImage: user?.image,
        originalImagePath: user?.image_path,
        selectedFile
      });

      try {
        let newImageUrl = currentImage;
        let newImagePath = currentImagePath;
        
        // CASE 1: Image deleted - check if original image was removed
        if (user?.image && !currentImage) {
          console.log("[DEBUG Profile Picture] Image deleted, removing from storage");
          
          // Only delete from storage if it's an actual uploaded image (not a blob)
          if (user.image_path && !user.image_path.includes("blob:")) {
            await deleteProfilePicture(user.image_path);
          }
          
          // Clear image URLs
          newImageUrl = "";
          newImagePath = "";
        } 
        // CASE 2: New image uploaded
        else if (selectedFile) {
          console.log("[DEBUG Profile Picture] New image selected, uploading");
          
          // Delete old image first if it exists and isn't a blob preview
          if (user?.image_path && !user.image_path.includes("blob:")) {
            await deleteProfilePicture(user.image_path);
          }
          
          // Upload new image
          const response = await uploadProfilePicture(selectedFile);
          
          if (!response.fileName || !response.publicUrl) {
            console.log("[DEBUG Profile Picture] Upload failed", response);
            toast({
              title: "Error",
              description: "Failed to upload profile picture",
              variant: "destructive",
            });
            throw new Error("Failed to upload profile picture");
          }
          
          // Update with new image URLs
          newImageUrl = response.publicUrl;
          newImagePath = response.fileName;
          
          console.log("[DEBUG Profile Picture] Upload success", {
            newImageUrl,
            newImagePath
          });
        }
        // CASE 3: No image change - keep existing values
        
        // Update profile with all changes including image status
        console.log("[DEBUG Profile Picture] Updating profile", {
          fullName: values.full_name,
          bio: values.bio,
          schoolName: values.school_name,
          image: newImageUrl,
          imagePath: newImagePath
        });
        
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: values.full_name,
            bio: values.bio || "",
            school_name: values.school_name || "",
            image: newImageUrl,
            image_path: newImagePath,
          })
          .eq("id", user.id);

        if (updateError) {
          console.log("[DEBUG Profile Picture] Profile update failed", updateError);
          
          // If update fails and we uploaded a new image, clean it up
          if (selectedFile && newImagePath && newImagePath !== user?.image_path) {
            await deleteProfilePicture(newImagePath);
          }
          
          toast({
            title: "Error",
            description: "Failed to update profile",
            variant: "destructive",
          });
          throw updateError;
        }

        // Clean up any blob URLs
        if (currentImage && currentImage.includes("blob:")) {
          URL.revokeObjectURL(currentImage);
        }
        
        // Reset selected file state after successful update
        setSelectedFile(null);

        console.log("[DEBUG Profile Picture] Profile update success");

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } catch (error) {
        console.log("[DEBUG Profile Picture] updateProfileMutation error", error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    // Just pass the form values, we'll use the selectedFile state for upload
    updateProfileMutation.mutate(values);
  };

  // Handle delete button click - only affects local UI state until save
  const handleDeleteImage = () => {
    const currentImage = form.getValues("image");
    
    console.log("[DEBUG Profile Picture] handleDeleteImage local only", {
      currentImage,
    });

    if (currentImage) {
      // If it's a blob URL preview, revoke it
      if (currentImage.includes("blob:")) {
        console.log(
          "[DEBUG Profile Picture] handleDeleteImage revoking blob URL",
          currentImage
        );
        URL.revokeObjectURL(currentImage);
      }
      
      // Mark image for deletion by clearing form values
      // The actual deletion will happen when the user clicks Save
      form.setValue("image", "", { shouldDirty: true });
      form.setValue("image_path", "", { shouldDirty: true });
      setSelectedFile(null);
      
      // Force form to update UI
      form.trigger("image");
      
      console.log("[DEBUG Profile Picture] Image marked for deletion");
    }
  };

  // Handle file change for preview
  const handleFileChange = (files: FileList | null) => {
    console.log("[DEBUG Profile Picture] handleFileChange", files);

    // Clean up previous preview URL if it's a blob URL
    const currentImage = form.getValues("image");
    if (
      currentImage &&
      typeof currentImage === "string" &&
      currentImage.startsWith("blob:")
    ) {
      URL.revokeObjectURL(currentImage);
    }

    // Create preview for new file
    if (files && files.length > 0) {
      // Validate file size before creating preview
      const file = files[0];
      console.log("[DEBUG Profile Picture] handleFileChange new file", file);

      if (file.size > MAX_FILE_SIZE) {
        console.log(
          "[DEBUG Profile Picture] handleFileChange new file too large",
          file.size
        );
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        console.log(
          "[DEBUG Profile Picture] handleFileChange new file invalid type",
          file.type
        );
        toast({
          title: "Invalid file type",
          description: "Only JPG, PNG, and WebP images are supported",
          variant: "destructive",
        });
        return;
      }

      // Store the actual file in state
      setSelectedFile(file);

      // Create preview URL and set form value
      const previewUrl = URL.createObjectURL(file);
      console.log(
        "[DEBUG Profile Picture] handleFileChange new file url",
        previewUrl
      );
      form.setValue("image", previewUrl, { shouldDirty: true });
      
      // Don't set image_path to file.name as it will be replaced with a UUID on upload
      // Just note that we have a selected file
      console.log("[DEBUG Profile Picture] Selected file ready for upload");
      
      // Force form to update UI
      form.trigger("image");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto p-6 sm:p-8 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100">
        <div className="space-y-1.5 mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-500 text-sm">
            Complete your profile to help us personalize your learning
            experience
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <FormLabel className="text-base font-semibold text-gray-700">
                Profile Picture
              </FormLabel>

              <div>
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden relative group">
                  {form.watch("image") ? (
                    <img
                      src={
                        typeof form.watch("image") === "string"
                          ? form.watch("image")
                          : ""
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log("[DEBUG Profile Picture] Failed to load profile picture", {
                          e,
                        });
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        toast({
                          title: "Error",
                          description: "Failed to load profile picture",
                          variant: "destructive",
                        });
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center justify-center">
                      <Upload className="w-6 h-6 mb-2" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Upload and Delete buttons */}
                <div className="w-32 sm:w-40 flex justify-center gap-4 mt-3">
                  <input
                    type="file"
                    id="profile-image-upload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                  <label
                    htmlFor="profile-image-upload"
                    aria-label="Upload profile picture"
                    title="Upload Profile Picture"
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-white shadow-md hover:shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                  </label>
                  {/* Show delete button if there's an image (preview or existing) */}
                  {form.watch("image") && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200`}
                    >
                      <X className="w-6 h-6 transform group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </div>

                {/* File info text */}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <Info className="w-4 h-4 text-gray-400" />
                  <span>
                    Max file size: 5MB. Supported formats: JPG, PNG, WebP
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 rounded-lg shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="school_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      School Name
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ? field.value : undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 rounded-lg shadow-sm">
                          <SelectValue placeholder="Select your school" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCHOOL_OPTIONS.map((school) => (
                          <SelectItem key={school} value={school}>
                            {school}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Grade Level
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled
                  >
                    <FormControl>
                      <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(GRADE_LEVELS).map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Bio
                    </FormLabel>
                    <FormDescription className="text-xs text-gray-500">
                      {field.value?.length || 0}/500 characters
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Tell us about yourself, your interests, and what you hope to achieve..."
                      className="min-h-[120px] resize-y bg-gray-50/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 rounded-lg shadow-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="h-11 px-6 border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="h-11 px-8 bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
              >
                {updateProfileMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};
