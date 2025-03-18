import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { useState, useEffect } from "react";
import { CreationProcess } from "./reflection-sections/CreationProcess";
import { Learnings } from "./reflection-sections/Learnings";
import { Challenges } from "./reflection-sections/Challenges";
import { Improvements } from "./reflection-sections/Improvements";
import { Acknowledgments } from "./reflection-sections/Acknowledgments";

interface ReflectionStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ReflectionStep({ form }: ReflectionStepProps) {
  // Track character counts for each field
  const [charCounts, setCharCounts] = useState({
    creation_process: form.getValues("creation_process")?.length || 0,
    learnings: form.getValues("learnings")?.length || 0,
    challenges: form.getValues("challenges")?.length || 0,
    improvements: form.getValues("improvements")?.length || 0,
    acknowledgments: form.getValues("acknowledgments")?.length || 0,
  });

  // Update character counts when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setCharCounts({
        creation_process: value.creation_process?.length || 0,
        learnings: value.learnings?.length || 0,
        challenges: value.challenges?.length || 0,
        improvements: value.improvements?.length || 0,
        acknowledgments: value.acknowledgments?.length || 0,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <CreationProcess form={form} currentLength={charCounts.creation_process} />
      <Learnings form={form} currentLength={charCounts.learnings} />
      <Challenges form={form} currentLength={charCounts.challenges} />
      <Improvements form={form} currentLength={charCounts.improvements} />
      <Acknowledgments form={form} currentLength={charCounts.acknowledgments} />
    </div>
  );
}
