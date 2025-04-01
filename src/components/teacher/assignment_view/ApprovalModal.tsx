import React, { useState, useCallback, memo } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const SKILLS = [
  'Motivation',
  'Intellect',
  'Diligence',
  'Emotionality',
  'Sociability'
];

interface SkillsData {
  selectedSkills: string[];
  justification: string;
  feedback?: string;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (skillsData: SkillsData) => Promise<void>;
}

export const ApprovalModal = memo(({
  isOpen,
  onClose,
  onSubmit,
}: ApprovalModalProps) => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [justification, setJustification] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSkillToggle = useCallback((skill: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        // Only allow up to 3 skills
        if (prev.length < 3) {
          return [...prev, skill];
        }
        return prev;
      }
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill.');
      return;
    }

    if (!justification.trim()) {
      setError('Please justify the selected skills.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await onSubmit({
        selectedSkills,
        justification,
        feedback: feedback.trim() || undefined
      });
      // Reset form state
      setSelectedSkills([]);
      setJustification('');
      setFeedback('');
      onClose();
    } catch (err) {
      setError('Failed to submit approval. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSkills, justification, feedback, onSubmit, onClose]);

  // Reset form when modal is opened or closed
  React.useEffect(() => {
    if (!isOpen) {
      // Don't reset immediately to avoid visual glitches during closing animation
      const timer = setTimeout(() => {
        setSelectedSkills([]);
        setJustification('');
        setFeedback('');
        setError('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/80" />
        <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[600px] translate-x-[-50%] translate-y-[-50%] bg-white p-8 shadow-lg border border-gray-200">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Approval</h2>
              <p className="text-gray-600 text-base">
                You're about to approve this assignment. Once approved, it will be added to the student's portfolio and cannot be edited.
              </p>
            </div>

            {/* Skills selection */}
            <div className="space-y-4">
              <h3 className="text-base font-medium text-gray-900">
                What skills did you think the student practice? (Select Top 3)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SKILLS.map((skill) => (
                  <div key={skill} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`skill-${skill}`} 
                      checked={selectedSkills.includes(skill)}
                      onCheckedChange={() => handleSkillToggle(skill)}
                      disabled={!selectedSkills.includes(skill) && selectedSkills.length >= 3}
                    />
                    <Label htmlFor={`skill-${skill}`}>{skill}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Justify skills */}
            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900">
                Justify the selected skills
              </h3>
              <p className="text-gray-600 text-sm">
                How did each skill contribute to the creation of the artifact? What actions, decisions, or moments during the process demonstrated these skills?
              </p>
              <Textarea
                id="justification"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="How did each skill help you in creating this artifact?"
                className="min-h-[120px] resize-y w-full border border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md"
                disabled={isSubmitting}
                maxLength={200}
              />
              <div className="text-right text-sm text-gray-500">
                {justification.length}/200 max
              </div>
            </div>

            {/* Feedback (optional) */}
            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900">
                Feedback
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  (optional)
                </span>
              </h3>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Eg: Keep up the good work!"
                className="min-h-[100px] resize-y w-full border border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 rounded-md"
                disabled={isSubmitting}
              />
              <p className="text-gray-600 text-sm">
                Suggestion: You can use this to express appreciation for your student or share words of encouragement.
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* Action buttons */}
            <div className="flex justify-start gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white font-medium rounded-md h-10 px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Confirming...
                  </>
                ) : "Confirm"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-medium rounded-md h-10 px-6 py-2 border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
});

ApprovalModal.displayName = 'ApprovalModal'; 