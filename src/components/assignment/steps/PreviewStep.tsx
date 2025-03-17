import { PreviewStepProps } from "@/lib/types/preview";
import {
  FileText,
  Users,
  Lightbulb,
  PenTool,
  Brain,
} from "lucide-react";
import { SKILLS } from "@/constants";
import {
  PreviewSection,
  PreviewField,
  ArtifactPreview,
  YoutubeLinksPreview,
} from "@/components/preview";

export function PreviewStep({ form }: PreviewStepProps) {
  const values = form.getValues();
  const selectedSkills = values.selected_skills
    .map((id) => SKILLS.find((s) => s.id === id)?.name)
    .filter(Boolean) as string[];
  
  // Check if there are any files or YouTube links to display
  const hasFiles = values.files && values.files.length > 0;
  const hasYoutubeLinks = values.youtubelinks && values.youtubelinks.some(link => link.url);
  const hasArtifacts = hasFiles || hasYoutubeLinks;

  return (
    <div className="space-y-8">
      <PreviewSection
        title="Basic Information"
        icon={<PenTool className="h-5 w-5 text-blue-500" />}
        className="border-l-4 border-l-blue-200 pl-4"
      >
        <div className="grid gap-4">
          <PreviewField label="Artifact Name" value={values.title} />
          {values.subject && <PreviewField label="Subject" value={values.subject} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.grade && <PreviewField label="Grade" value={values.grade} />}
            <PreviewField label="Month" value={values.month} />
          </div>
          <PreviewField label="Artifact Type" value={values.artifact_type} />
        </div>
      </PreviewSection>

      {hasArtifacts && (
        <PreviewSection
          title="Artifact Files"
          icon={<FileText className="h-5 w-5 text-blue-500" />}
          className="border-l-4 border-l-blue-200 pl-4"
        >
          <ArtifactPreview files={values.files || []} />
          <YoutubeLinksPreview links={values.youtubelinks || []} />
        </PreviewSection>
      )}

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <PreviewSection
          title="Collaboration and Originality"
          icon={<Users className="h-5 w-5 text-purple-500" />}
          className="border-l-4 border-l-purple-200 pl-4"
        >
          <div className="grid gap-4 overflow-hidden">
            <PreviewField
              label="Is this a team project?"
              value={values.is_team_work}
            />
            {values.is_team_work && (
              <PreviewField
                label="Describe your role and experience"
                value={values.team_contribution}
                className="border-l-2 border-gray-200 pl-3"
              />
            )}
            <PreviewField
              label="Did you create something new or original?"
              value={values.is_original_work}
            />
            {values.is_original_work && (
              <PreviewField
                label="Explain what was new"
                value={values.originality_explanation}
                className="border-l-2 border-gray-200 pl-3"
              />
            )}
          </div>
        </PreviewSection>

        <PreviewSection
          title="Skills and Pride"
          icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
          className="border-l-4 border-l-amber-200 pl-4"
        >
          <div className="grid gap-4 overflow-hidden">
            <PreviewField
              label="What skills did you practice? Select Top 3"
              value={selectedSkills}
            />
            <PreviewField
              label="Justify the selected skills"
              value={values.skills_justification}
              className="overflow-hidden"
            />
            <PreviewField
              label="Why are you proud of this artifact?"
              value={values.pride_reason}
              className="overflow-hidden"
            />
          </div>
        </PreviewSection>

        <PreviewSection
          title="Process, Learning, and Reflection"
          icon={<Brain className="h-5 w-5 text-green-500" />}
          className="border-l-4 border-l-green-200 pl-4"
        >
          <div className="grid gap-5 overflow-hidden">
            <PreviewField
              label="Describe the process you used to create it"
              value={values.creation_process}
              className="overflow-hidden"
            />
            <PreviewField
              label="Your learnings and future applications"
              value={values.learnings}
              className="overflow-hidden"
            />
            <PreviewField 
                label="Your challenges" 
                value={values.challenges}
                className="overflow-hidden" 
              />
              <PreviewField
                label="Your improvements"
                value={values.improvements}
                className="overflow-hidden"
              />
            <PreviewField 
              label="Your thanks" 
              value={values.acknowledgments}
              className="overflow-hidden" 
            />
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}