import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { useState } from "react";
import teacherFeedbackImage from "/teacher-feedback.png";

interface TeacherFeedbackStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function TeacherFeedbackStep({ form }: TeacherFeedbackStepProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {/* Feedback image illustration */}
      <div className="flex justify-center items-center">
        <img
          src={teacherFeedbackImage}
          alt="Teacher feedback illustration"
          className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[408px] h-auto object-contain"
        />
      </div>

      <div className="flex flex-col text-center mt-6 md:mt-10 gap-2 md:gap-2.5">
        {/* Status message */}
        <h2 className="text-slate-900 text-base md:text-lg font-semibold">
          Your work is under review
        </h2>

        {/* Explanatory text */}
        <p className="text-slate-500 text-xs sm:text-sm max-w-72 sm:max-w-80 md:max-w-96 mx-auto">
          Your Artefact has been submitted and is now being reviewed by your
          teacher. You'll receive feedback soon. Keep an eye on your dashboard
          for updates!
        </p>
      </div>
    </div>
  );
}
