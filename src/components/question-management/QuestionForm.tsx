import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const questionSchema = z.object({
  label: z.string().min(1, "Question text is required"),
  type: z.string().min(1, "Question type is required"),
  grade_level: z.array(z.number()),
  subject: z.array(z.string()),
  order_index: z.number(),
  hint: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  onSuccess?: () => void;
}

export const QuestionForm = ({ onSuccess }: QuestionFormProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      grade_level: [],
      subject: [],
      order_index: 0,
      required: false,
      options: [],
    }
  });

  const onSubmit = async (data: QuestionFormData) => {
    const questionData = {
      label: data.label,
      type: data.type,
      grade_level: data.grade_level,
      subject: data.subject,
      order_index: data.order_index,
      hint: data.hint,
      required: data.required,
      options: data.options || [],
    };

    const { error } = await supabase
      .from("template_questions")
      .insert([questionData]);

    if (error) {
      toast.error("Failed to create question");
      return;
    }

    toast.success("Question created successfully");
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label>Question Text</Label>
        <Input {...register("label")} />
        {errors.label && (
          <p className="text-sm text-red-500 mt-1">{errors.label.message}</p>
        )}
      </div>

      <div>
        <Label>Question Type</Label>
        <select
          {...register("type")}
          className="w-full p-2 border rounded-lg"
        >
          <option value="">Select type...</option>
          <option value="text">Text</option>
          <option value="select">Multiple Choice</option>
          <option value="boolean">Yes/No</option>
          <option value="richtext">Rich Text</option>
          <option value="file">File Upload</option>
        </select>
        {errors.type && (
          <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <Label>Grade Levels</Label>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
            <label key={grade} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={grade}
                {...register("grade_level")}
                className="rounded border-gray-300"
              />
              <span>Grade {grade}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Subjects</Label>
        <div className="grid grid-cols-2 gap-2">
          {["Mathematics", "Science", "English", "History", "Art", "Music", "Physical Education", "Other"].map((subject) => (
            <label key={subject} className="flex items-center space-x-2">
              <input
                type="checkbox"
                value={subject}
                {...register("subject")}
                className="rounded border-gray-300"
              />
              <span>{subject}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Hint (Optional)</Label>
        <Input {...register("hint")} />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register("required")}
          className="rounded border-gray-300"
        />
        <Label>Required Question</Label>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#62C59F] hover:bg-[#62C59F]/90"
      >
        {isSubmitting ? "Creating..." : "Create Question"}
      </Button>
    </form>
  );
};