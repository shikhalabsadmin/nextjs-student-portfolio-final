import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AssignmentPreview } from "@/components/preview";
import { getAssignmentWithFiles } from "@/lib/api/assignments";
import { SKILLS } from "@/constants";
import { Loading } from "@/components/ui/loading";
import { Error } from "@/components/ui/error";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { AssignmentFile } from "@/types/file";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { useQuery } from "@tanstack/react-query";

export function AssignmentDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use React Query for data fetching with automatic caching and refetching
  const {
    data: assignment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assignment", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await getAssignmentWithFiles(id);
      return data as unknown as AssignmentFormValues;
    },
  });

  // Handle unauthorized access in a useEffect
  useEffect(() => {
    if (
      !isLoading &&
      assignment &&
      assignment.status !== ASSIGNMENT_STATUS.APPROVED
    ) {
      navigate("/not-found", { replace: true });
    }
  }, [assignment, isLoading, navigate]);

  // Memoize selected skills to avoid recalculation on each render
  const selectedSkills = useMemo(() => {
    if (!assignment?.selected_skills) return [];

    return (
      (assignment.selected_skills
        .map((id: string) => SKILLS.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[]) || []
    );
  }, [assignment?.selected_skills]);

  // Memoize main image to avoid recalculation on each render
  const mainImage = useMemo(() => {
    if (!assignment?.files?.length) return null;

    // Find the latest image file
    const imageFile = [...(assignment.files || [])]
      .reverse()
      .find((file: AssignmentFile) => {
        const fileUrl = file?.file_url;
        return fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
      });

    return imageFile?.file_url || null;
  }, [assignment?.files]);

  // Handle error states
  if (error) {
    console.error("Error loading assignment:", error);
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <Error message="Failed to load assignment details" />;
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <Loading />;
      </div>
    );
  }

  // Handle no assignment data
  if (!assignment) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen">
        <Error message="Assignment not found" />;
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <AssignmentPreview
        values={assignment}
        selectedSkills={selectedSkills}
        mainImage={mainImage}
        isFullScreen={false}
        onClose={() => {}}
      />
    </div>
  );
}
