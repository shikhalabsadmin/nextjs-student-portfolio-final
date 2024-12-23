import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id?: string;
  label: string;
  type: string;
  options?: string[];
  required: boolean;
  hint?: string;
  order_index: number;
}

interface QuestionManagerProps {
  templateId: string;
  existingQuestions?: Question[];
  onSave?: () => void;
}

export const QuestionManager = ({ templateId, existingQuestions = [], onSave }: QuestionManagerProps) => {
  const [questions, setQuestions] = useState<Question[]>(existingQuestions);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        label: "",
        type: "text",
        required: false,
        order_index: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate questions
      const invalidQuestions = questions.filter(q => !q.label || !q.type);
      if (invalidQuestions.length > 0) {
        toast.error("All questions must have a label and type");
        return;
      }

      // Delete existing questions
      if (existingQuestions.length > 0) {
        await supabase
          .from("template_questions")
          .delete()
          .eq("template_id", templateId);
      }

      // Insert new questions
      const { error } = await supabase
        .from("template_questions")
        .insert(
          questions.map((q, index) => ({
            ...q,
            template_id: templateId,
            order_index: index,
          }))
        );

      if (error) throw error;

      toast.success("Questions saved successfully");
      onSave?.();
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error("Failed to save questions");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Template Questions</h2>
        <Button onClick={addQuestion} className="bg-[#62C59F] hover:bg-[#62C59F]/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Question {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuestion(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Question Text</Label>
                <Input
                  value={question.label}
                  onChange={(e) => updateQuestion(index, "label", e.target.value)}
                  placeholder="Enter question text"
                />
              </div>

              <div>
                <Label>Question Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value) => updateQuestion(index, "type", value)}
                >
                  <option value="text">Text</option>
                  <option value="select">Multiple Choice</option>
                  <option value="boolean">Yes/No</option>
                  <option value="richtext">Rich Text</option>
                  <option value="file">File Upload</option>
                </Select>
              </div>

              {question.type === "select" && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={question.options?.join("\n") || ""}
                    onChange={(e) =>
                      updateQuestion(index, "options", e.target.value.split("\n").filter(Boolean))
                    }
                    placeholder="Enter options..."
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label>Hint (optional)</Label>
                <Input
                  value={question.hint || ""}
                  onChange={(e) => updateQuestion(index, "hint", e.target.value)}
                  placeholder="Enter hint text"
                />
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                  className="rounded border-gray-300 text-[#62C59F] focus:ring-[#62C59F]"
                />
                <span className="text-sm">Required</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#62C59F] hover:bg-[#62C59F]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Questions"}
          </Button>
        </div>
      )}
    </div>
  );
};