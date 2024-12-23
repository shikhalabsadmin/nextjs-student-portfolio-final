import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuestionListHeaderProps {
  onAddClick: () => void;
}

export const QuestionListHeader = ({ onAddClick }: QuestionListHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold">Questions</h2>
      <Button onClick={onAddClick} className="bg-[#62C59F] hover:bg-[#62C59F]/90">
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </Button>
    </div>
  );
};