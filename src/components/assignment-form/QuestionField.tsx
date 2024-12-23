import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Upload } from "lucide-react";
import { Question } from "./QuestionTypes";

interface QuestionFieldProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}

export const QuestionField = ({ question, value, onChange }: QuestionFieldProps) => {
  if (question.type === "richtext") {
    return (
      <RichTextEditor
        value={value || ""}
        onChange={onChange}
      />
    );
  }

  if (question.type === "boolean") {
    return (
      <div className="space-y-3">
        <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            checked={value === true}
            onChange={() => onChange(true)}
            className="h-4 w-4 text-[#62C59F]"
          />
          <span className="text-gray-700">Yes</span>
        </label>
        <label className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
          <input
            type="radio"
            checked={value === false}
            onChange={() => onChange(false)}
            className="h-4 w-4 text-[#62C59F]"
          />
          <span className="text-gray-700">No</span>
        </label>
      </div>
    );
  }

  if (question.type === "file") {
    return (
      <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-[#62C59F] transition-colors">
        <input
          type="file"
          id="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange(file);
            }
          }}
        />
        <label htmlFor="file" className="cursor-pointer">
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            {value?.name || "Click or drag to upload your work"}
          </p>
          {value?.name && (
            <p className="text-xs text-[#62C59F] mt-2">File selected</p>
          )}
        </label>
      </div>
    );
  }

  if (question.type === "select") {
    return (
      <select
        className="w-full p-2 border rounded-lg focus:border-[#62C59F] focus:ring-1 focus:ring-[#62C59F] outline-none"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an option</option>
        {question.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="focus:border-[#62C59F] focus:ring-1 focus:ring-[#62C59F]"
    />
  );
};