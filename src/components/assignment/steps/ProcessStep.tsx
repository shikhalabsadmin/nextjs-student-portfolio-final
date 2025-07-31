import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { AssignmentFormValues } from "@/lib/validations/assignment";
import { CreationProcess } from "./reflection-sections/CreationProcess";
import { Learnings } from "./reflection-sections/Learnings";
import { Challenges } from "./reflection-sections/Challenges";
import { Improvements } from "./reflection-sections/Improvements";
import { Acknowledgments } from "./reflection-sections/Acknowledgments";
import { CreationProcessImages } from "./reflection-sections/CreationProcessImages";

// Helper function to get text content from HTML
const getTextContent = (html: string): string => {
  if (!html || html === '<p></p>') return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

interface ProcessStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

export function ProcessStep({ form }: ProcessStepProps) {
  // Track character counts for each field (text-only, not HTML)
  const [charCounts, setCharCounts] = useState({
    creation_process: getTextContent(form.getValues("creation_process") || '').length,
    learnings: getTextContent(form.getValues("learnings") || '').length,
    challenges: getTextContent(form.getValues("challenges") || '').length,
    improvements: getTextContent(form.getValues("improvements") || '').length,
    acknowledgments: getTextContent(form.getValues("acknowledgments") || '').length,
  });

  // Update character counts when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      setCharCounts({
        creation_process: getTextContent(value.creation_process || '').length,
        learnings: getTextContent(value.learnings || '').length,
        challenges: getTextContent(value.challenges || '').length,
        improvements: getTextContent(value.improvements || '').length,
        acknowledgments: getTextContent(value.acknowledgments || '').length,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <CreationProcess form={form} currentLength={charCounts.creation_process} />
      <CreationProcessImages form={form} />
      <Learnings form={form} currentLength={charCounts.learnings} />
      <Challenges form={form} currentLength={charCounts.challenges} />
      <Improvements form={form} currentLength={charCounts.improvements} />
      <Acknowledgments form={form} currentLength={charCounts.acknowledgments} />
    </div>
  );
}
