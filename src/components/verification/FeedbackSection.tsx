import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";

interface FeedbackSectionProps {
  feedback: string;
  setFeedback: (value: string) => void;
  skillsJustification: string;
  setSkillsJustification: (value: string) => void;
  remarks: string;
  setRemarks: (value: string) => void;
}

export const FeedbackSection = ({
  feedback,
  setFeedback,
  skillsJustification,
  setSkillsJustification,
  remarks,
  setRemarks,
}: FeedbackSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="feedback" className="text-sm font-medium text-gray-900">
          General Feedback
        </Label>
        <RichTextEditor
          value={feedback}
          onChange={setFeedback}
          placeholder="Provide general feedback about the assignment..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills-justification" className="text-sm font-medium text-gray-900">
          Skills Justification
        </Label>
        <RichTextEditor
          value={skillsJustification}
          onChange={setSkillsJustification}
          placeholder="Explain why you selected these skills..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium text-gray-900">
          Additional Remarks
        </Label>
        <RichTextEditor
          value={remarks}
          onChange={setRemarks}
          placeholder="Any additional comments or suggestions..."
        />
      </div>
    </div>
  );
};