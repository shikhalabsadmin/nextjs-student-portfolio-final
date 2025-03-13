import type { UseFormReturn } from "react-hook-form";
import type { AssignmentFormValues } from "@/lib/validations/assignment";
import { FileText } from "lucide-react";
import { SKILLS } from "@/constants";

interface PreviewStepProps {
  form: UseFormReturn<AssignmentFormValues>;
}

interface PreviewSectionProps {
  title: string;
  children: React.ReactNode;
}

interface PreviewFieldProps {
  label: string;
  value: string | string[] | boolean | null | undefined;
}

function PreviewSection({ title, children }: PreviewSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg text-gray-900">{title}</h3>
      <div className="space-y-4 bg-gray-50/50 rounded-lg p-4">{children}</div>
    </div>
  );
}

function PreviewField({ label, value }: PreviewFieldProps) {
  if (value === undefined || value === null) return null;

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {typeof value === "boolean" ? (
        <p className="text-sm text-gray-900">{value ? "Yes" : "No"}</p>
      ) : Array.isArray(value) ? (
        <p className="text-sm text-gray-900">{value.join(", ")}</p>
      ) : (
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}

export function PreviewStep({ form }: PreviewStepProps) {
  const values = form.getValues();
  const selectedSkills = values.selected_skills
    .map((id) => SKILLS.find((s) => s.id === id)?.name)
    .filter(Boolean);

  return (
    <div className="space-y-8">
      <PreviewSection title="Basic Information">
        <PreviewField label="Artifact Name" value={values.title} />
        <PreviewField label="Subject" value={values.subject} />
        <PreviewField label="Grade" value={values.grade} />
        <PreviewField label="Month" value={values.month} />
        <PreviewField label="Artifact Type" value={values.artifact_type} />
      </PreviewSection>

      <PreviewSection title="Artifact">
        {values.files?.map((file) => (
          <div
            key={file.file_url}
            className="flex items-center gap-2 p-2 rounded-lg bg-white/40"
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 truncate"
            >
              {file.file_name}
            </a>
          </div>
        ))}
      </PreviewSection>

      <PreviewSection title="Collaboration and Originality">
        <PreviewField label="Is this a team project?" value={values.is_team_work} />
        {values.is_team_work && (
          <PreviewField
            label="Describe your role and experience"
            value={values.team_contribution}
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
          />
        )}
      </PreviewSection>

      <PreviewSection title="Skills and Pride">
        <PreviewField
          label="What skills did you practice? Select Top 3"
          value={selectedSkills}
        />
        <PreviewField
          label="Justify the selected skills"
          value={values.skills_justification}
        />
        <PreviewField
          label="Why are you proud of this artifact?"
          value={values.pride_reason}
        />
      </PreviewSection>

      <PreviewSection title="Process, Learning, and Reflection">
        <PreviewField
          label="Describe the process you used to create it"
          value={values.creation_process}
        />
        <PreviewField
          label="Your learnings and future applications"
          value={values.learnings}
        />
        <PreviewField label="Your challenges" value={values.challenges} />
        <PreviewField label="Your improvements" value={values.improvements} />
        <PreviewField label="Your thanks" value={values.acknowledgments} />
      </PreviewSection>
    </div>
  );
} 