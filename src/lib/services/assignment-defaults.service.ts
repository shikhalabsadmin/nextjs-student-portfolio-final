import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { AssignmentStatus } from "@/types/assignment-status";
import { debug } from "@/lib/utils/debug.service";

/**
 * Gets default values for a new assignment form
 */
export function getDefaultValues(): AssignmentFormValues {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const timestamp = new Date().toISOString();
  
  debug.log("Generating default values for new assignment", { currentMonth, timestamp });
  
  return {
    // Required fields with simple defaults
    title: "",
    subject: "",
    grade: "",
    status: AssignmentStatus.DRAFT,
    month: currentMonth,
    
    // Boolean values with sensible defaults
    is_team_work: false,
    is_original_work: true,
    
    // Timestamps
    created_at: timestamp,
    updated_at: timestamp,
    
    // Student identifier (will be set by the form)
    student_id: "",
    
    // Optional fields with empty defaults
    teacher_id: null,
    artifact_url: null,
    parent_assignment_id: null,
    artifact_type: "",
    
    // Text fields that should never be null (initialized as empty strings)
    team_contribution: "",
    originality_explanation: "",
    skills_justification: "",
    pride_reason: "",
    creation_process: "",
    learnings: "",
    challenges: "",
    improvements: "",
    acknowledgments: "",
    
    // Arrays with empty defaults
    selected_skills: [],
    revision_history: [],
    youtubelinks: [{url: "", title: ""}],
    files: [],
    
    // Additional metadata
    submitted_at: null,
    verified_at: null,
    feedback: null,
    current_revision: 0,
    
    // These fields might be missing from the schema but included for completeness
    id: ""
  };
} 