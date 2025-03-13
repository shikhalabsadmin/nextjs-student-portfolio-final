import { PreviewSection, PreviewField } from "@/components/ui/preview-section";
import { FileText } from "lucide-react";
import { SKILLS } from "@/constants";
import type { Assignment } from "@/types/assignments";

interface AssignmentViewProps {
  assignment: Assignment;
}

export function AssignmentView({ assignment }: AssignmentViewProps) {
  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      <PreviewSection title="Basic Information">
        <PreviewField label="Title" value={assignment.title} />
        <PreviewField label="Subject" value={assignment.subject} />
        <PreviewField label="Grade" value={assignment.grade} />
        <PreviewField label="Month" value={assignment.month} />
        <PreviewField label="Type" value={assignment.artifact_type} />
      </PreviewSection>

      <PreviewSection title="Artifact">
        {assignment.artifact_url?.split(',').map((file, index) => (
          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/40">
            <FileText className="w-4 h-4 text-gray-500" />
            <a 
              href={file} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate"
            >
              {file.split('/').pop()}
            </a>
          </div>
        ))}
      </PreviewSection>

      <PreviewSection title="Collaboration">
        <PreviewField 
          label="Team Project" 
          value={assignment.is_team_work ? 'Yes' : 'No'} 
        />
        {assignment.is_team_work && (
          <PreviewField 
            label="Team Contribution" 
            value={assignment.team_contribution} 
          />
        )}
        <PreviewField 
          label="Original Work" 
          value={assignment.is_original_work ? 'Yes' : 'No'} 
        />
        {!assignment.is_original_work && (
          <PreviewField 
            label="Originality Explanation" 
            value={assignment.originality_explanation} 
          />
        )}
      </PreviewSection>

      <PreviewSection title="Skills & Pride">
        <PreviewField 
          label="Selected Skills" 
          value={assignment.selected_skills?.map(skill => 
            SKILLS.find(s => s.id === skill)?.name || skill
          ).join(', ')} 
        />
        <PreviewField 
          label="Skills Justification" 
          value={assignment.skills_justification} 
        />
        <PreviewField 
          label="Pride Reason" 
          value={assignment.pride_reason} 
        />
      </PreviewSection>

      <PreviewSection title="Process & Reflection">
        <PreviewField 
          label="Creation Process" 
          value={assignment.creation_process} 
        />
        <PreviewField 
          label="Learnings" 
          value={assignment.learnings} 
        />
        <PreviewField 
          label="Challenges" 
          value={assignment.challenges} 
        />
        <PreviewField 
          label="Future Improvements" 
          value={assignment.improvements} 
        />
        {assignment.acknowledgments && (
          <PreviewField 
            label="Acknowledgments" 
            value={assignment.acknowledgments} 
          />
        )}
      </PreviewSection>
    </div>
  );
} 