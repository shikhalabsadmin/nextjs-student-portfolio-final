import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Question } from "./QuestionTypes";

interface QuestionCardProps {
  question: Question;
  onDelete: (id: string) => void;
}

export const QuestionCard = ({ question, onDelete }: QuestionCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{question.label}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-sm bg-gray-100 px-2 py-1 rounded">
              {question.type}
            </span>
            {question.grade_level?.map((grade) => (
              <span
                key={grade}
                className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded"
              >
                Grade {grade}
              </span>
            ))}
            {question.subject?.map((sub) => (
              <span
                key={sub}
                className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded"
              >
                {sub}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => question.id && onDelete(question.id)}
            className="text-red-500 hover:text-red-600"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};