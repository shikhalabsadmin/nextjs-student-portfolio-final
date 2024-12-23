import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Question } from "./QuestionTypes";
import { QuestionCard } from "./QuestionCard";
import { QuestionListHeader } from "./QuestionListHeader";

export const QuestionList = () => {
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("template_questions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load questions");
        throw error;
      }

      return data as Question[];
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("template_questions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete question");
      return;
    }

    toast.success("Question deleted successfully");
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#62C59F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuestionListHeader onAddClick={() => {}} />
      <div className="grid gap-4">
        {questions?.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};