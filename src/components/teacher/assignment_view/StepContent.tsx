import React from 'react';
import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from '@/lib/validations/assignment';
import { TeacherFeedbackItem } from '@/types/teacher/hooks/useSingleAssignmentView';

const Work = React.lazy(() => import("@/components/teacher/assignment_view/step-component/work"));
const Feedback = React.lazy(() => import("@/components/teacher/assignment_view/step-component/Feedback"));

interface StepContentProps {
  step: string;
  form?: UseFormReturn<AssignmentFormValues>;
  feedbackItems?: TeacherFeedbackItem[];
}

const StepContent: React.FC<StepContentProps> = ({ step, form, feedbackItems }) => {
  switch (step) {
    case 'work':
      return <Work form={form} />;
    case 'feedback':
      return <Feedback form={form!} feedbackItems={feedbackItems || []} />;
    default:
      return <Work form={form} />;
  }
};

export default StepContent;

