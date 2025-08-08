import type { AssignmentFormValues } from "@/lib/validations/assignment";

function stripHtml(input?: string | null): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").trim();
}

export function getAssignmentSanityIssues(values: Partial<AssignmentFormValues>): string[] {
  const issues: string[] = [];

  if (!values) return ["No data provided"];

  if (!values.title || stripHtml(String(values.title)).length === 0) {
    issues.push("Missing title");
  }

  if (!values.subject || String(values.subject).trim().length === 0) {
    issues.push("Missing subject");
  }

  if (!values.artifact_type || String(values.artifact_type).trim().length === 0) {
    issues.push("Missing artifact type");
  }

  // At least one artifact reference should exist (id implies files may exist)
  const hasYoutubeLinks = Array.isArray(values.youtubelinks) && values.youtubelinks.some(l => l?.url && l.url.trim().length > 0);
  const hasExternalLinks = Array.isArray(values.externalLinks) && values.externalLinks.some(l => l?.url && l.url.trim().length > 0);
  const hasId = Boolean(values.id);
  if (!hasYoutubeLinks && !hasExternalLinks && !hasId) {
    issues.push("No artifact provided (file, YouTube, or external link)");
  }

  // Reflection sanity
  if (Array.isArray(values.selected_skills) && values.selected_skills.length > 20) {
    issues.push("Too many selected skills (limit 20)");
  }

  // Rich text fields shouldn't be only markup
  (['skills_justification','pride_reason','creation_process','learnings','challenges','improvements','acknowledgments'] as const)
    .forEach((key) => {
      const raw = (values as any)[key] as string | undefined;
      if (raw && stripHtml(raw).length === 0) {
        issues.push(`Field "${key.replace(/_/g,' ')}" appears empty`);
      }
    });

  return issues;
}

