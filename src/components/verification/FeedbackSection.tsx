import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FeedbackSectionProps {
  feedback: string;
  setFeedback: (feedback: string) => void;
  skillsJustification: string;
  setSkillsJustification: (justification: string) => void;
  remarks: string;
  setRemarks: (remarks: string) => void;
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
        <Textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide general feedback about the assignment..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills-justification" className="text-sm font-medium text-gray-900">
          Skills Justification
        </Label>
        <Textarea
          id="skills-justification"
          value={skillsJustification}
          onChange={(e) => setSkillsJustification(e.target.value)}
          placeholder="Explain why you selected these skills..."
          className="min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium text-gray-900">
          Additional Remarks
        </Label>
        <Textarea
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Any additional comments or suggestions..."
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
};