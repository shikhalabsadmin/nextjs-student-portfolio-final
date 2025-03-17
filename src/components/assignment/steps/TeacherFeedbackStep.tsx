import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { useState } from "react";
import teacherFeedbackImage from "/teacher-feedback.png";

interface TeacherFeedbackStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function TeacherFeedbackStep({ form }: TeacherFeedbackStepProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl mx-auto py-4 md:py-8 px-4">
      {/* Feedback image illustration */}
      <div className="mb-4 md:mb-8 w-full flex justify-center">
        <div className="w-full max-w-[250px] md:max-w-[300px] aspect-[3/2] relative">
          {!imageError ? (
            <img
              src={teacherFeedbackImage}
              alt="Teacher feedback illustration"
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
              <span className="text-gray-500">Illustration unavailable</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Status message */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2 md:mb-4">
        Your work is under review
      </h2>
      
      {/* Explanatory text */}
      <p className="text-sm md:text-lg text-gray-600 max-w-xs md:max-w-lg">
        Your Artefact has been submitted and is now being reviewed by your teacher.
        You'll receive feedback soon. Keep an eye on your dashboard for updates!
      </p>
    </div>
  );
}