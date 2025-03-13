import { toast } from "sonner";
import { type NavigateFunction } from "react-router-dom";
import { createAssignment, updateAssignment, getAssignment } from "@/lib/api/assignments";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { type AssignmentStep } from "@/types/assignment";
import { AssignmentStatus } from "@/types/assignment-status";
import { NotificationService } from "@/lib/services/notification.service";
import { supabase } from "@/integrations/supabase/client";
import { STEPS } from "@/lib/config/steps";
import { ROUTES } from "@/config/routes";

// Debug utility with stricter typing
export const debug = {
  enabled: process.env.NODE_ENV === "development",
  log: (message: string, data?: unknown) => {
    if (debug.enabled) console.log(`[Assignment Form] ${message}`, data ?? "");
  },
  error: (message: string, error?: unknown) => {
    if (debug.enabled) console.error(`[Assignment Form Error] ${message}`, error ?? "");
  },
};

// Enhanced ToastService with cleanup
export class ToastService {
  private activeToastIds: Set<string | number> = new Set();

  loading(message: string): string | number {
    const id = toast.loading(message);
    this.activeToastIds.add(id);
    return id;
  }

  success(message: string): void {
    toast.success(message);
  }

  error(message: string): void {
    toast.error(message);
  }

  dismiss(id: string | number): void {
    toast.dismiss(id);
    this.activeToastIds.delete(id);
  }

  dismissAll(): void {
    this.activeToastIds.forEach(id => toast.dismiss(id));
    this.activeToastIds.clear();
  }
}

// Enhanced default values with stricter typing
export const getDefaultValues = (): AssignmentFormValues => ({
  title: "",
  subject: "",
  grade: "",
  status: AssignmentStatus.DRAFT,
  month: new Date().toLocaleString('default', { month: 'long' }),
  student_id: "", // Will be set by the form
  is_team_work: false,
  is_original_work: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),

  // Optional fields
  teacher_id: null,
  artifact_url: null,
  parent_assignment_id: null,
  team_contribution: null,
  originality_explanation: null,
  selected_skills: [],
  skills_justification: null,
  pride_reason: null,
  creation_process: null,
  learnings: null,
  challenges: null,
  improvements: null,
  acknowledgments: null,
  submitted_at: null,
  verified_at: null,
  artifact_type: "",

  // JSON fields
  feedback: null,
  revision_history: [],
  current_revision: 0,
  youtubelinks: [],

  // Files array
  files: [],
});

// Improved AssignmentService with better error handling and cleanup
export class AssignmentService {
  private notificationService: NotificationService;
  private initialFormState: string | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private readonly AUTOSAVE_DELAY = 2000;

  constructor(
    private toast: ToastService,
    private navigate: NavigateFunction,
    private userId?: string
  ) {
    this.notificationService = NotificationService.getInstance();
  }

  private isFormModified(currentData: AssignmentFormValues): boolean {
    return this.initialFormState !== null && 
           this.initialFormState !== JSON.stringify(currentData);
  }

  private storeInitialState(data: AssignmentFormValues): void {
    this.initialFormState = JSON.stringify(data);
  }

  private async performAutoSave(id: string, data: AssignmentFormValues): Promise<void> {
    await updateAssignment(id, { ...data, updated_at: new Date().toISOString() });
    debug.log("Auto-save successful", { assignmentId: id });
    this.storeInitialState(data);
  }

  async autoSave(id: string, data: AssignmentFormValues): Promise<void> {
    if (!this.isFormModified(data)) {
      debug.log("Skipping auto-save - no changes detected");
      return;
    }

    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    return new Promise((resolve) => {
      this.autoSaveTimeout = setTimeout(async () => {
        const loadingId = this.toast.loading("Saving changes...");
        try {
          await this.performAutoSave(id, data);
          this.toast.success("Changes saved successfully");
          resolve();
        } catch (error) {
          debug.error("Auto-save failed", error);
          this.toast.error("Failed to save changes");
          throw error;
        } finally {
          this.toast.dismiss(loadingId);
        }
      }, this.AUTOSAVE_DELAY);
    });
  }

  async initialize(id?: string): Promise<AssignmentFormValues | null> {
    if (!this.userId) {
      debug.error("User not authenticated");
      this.toast.error("User not authenticated");
      return null;
    }

    const loadingId = this.toast.loading(
      !id || id === ":id" ? "Creating new assignment..." : "Loading assignment..."
    );

    try {
      const assignment = (!id || id === ":id")
        ? await this.createNewAssignment()
        : await this.loadExistingAssignment(id);
      
      if (assignment) {
        this.storeInitialState(assignment);
      }
      
      this.toast.success(!id || id === ":id" ? "Assignment created" : "Assignment loaded");
      return assignment;
    } catch (error) {
      debug.error("Error initializing assignment", error);
      this.toast.error(error instanceof Error ? error.message : "Failed to initialize assignment");
      return null;
    } finally {
      this.toast.dismiss(loadingId);
    }
  }

  private async createNewAssignment(): Promise<AssignmentFormValues> {
    debug.log("Creating new assignment", { userId: this.userId });
    const initialData: AssignmentFormValues = {
      ...getDefaultValues(),
      student_id: this.userId,
    };

    const newAssignment = await createAssignment(initialData);
    if (!newAssignment?.id) {
      throw new Error("Failed to create assignment");
    }

    this.navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id?', newAssignment.id), { replace: true });
    return { ...initialData, id: newAssignment.id };
  }

  private async loadExistingAssignment(id: string): Promise<AssignmentFormValues> {
    const assignment = await getAssignment(id);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.artifact_url && !assignment.files?.length) {
      assignment.files = assignment.artifact_url.split(",").map(url => ({
        file_url: url.trim(),
        file_name: url.split("/").pop() || "unnamed_file",
        file_type: "",
        file_size: 0,
        uploaded_at: new Date().toISOString(),
      }));
    }

    return assignment;
  }

  async submit(data: AssignmentFormValues): Promise<void> {
    if (!data.id) {
      throw new Error("Assignment ID is required for submission");
    }

    const loadingId = this.toast.loading("Submitting assignment...");
    try {
      const updatedAssignment = await updateAssignment(data.id, {
        ...data,
        status: AssignmentStatus.SUBMITTED,
        submitted_at: new Date().toISOString(),
      });

      if (updatedAssignment.teacher_id) {
        await this.notifyTeacher(updatedAssignment);
      }

      this.navigate(ROUTES.STUDENT.DASHBOARD);
      this.toast.success("Assignment submitted successfully");
    } catch (error) {
      debug.error("Error submitting assignment", error);
      this.toast.error("Failed to submit assignment");
      throw error;
    } finally {
      this.toast.dismiss(loadingId);
    }
  }

  private async notifyTeacher(assignment: AssignmentFormValues): Promise<void> {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', this.userId)
        .single();

      if (profileError) {
        debug.error("Error fetching student profile", profileError);
      }

      if (!assignment.id || !assignment.teacher_id) {
        throw new Error("Missing required assignment fields");
      }

      await this.notificationService.notifyAssignmentSubmitted(
        assignment.teacher_id,
        assignment.title,
        profile?.full_name || 'A student',
        assignment.id
      );
    } catch (error) {
      debug.error("Error sending notification", error);
      this.toast.error("Assignment submitted but teacher notification failed");
    }
  }

  cleanup(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }
    this.toast.dismissAll();
  }
}

// Enhanced StepService with better type safety
export class StepService {
  private stepValidations: StepValidation[];
  private visitedSteps: Set<AssignmentStep> = new Set();

  constructor(private steps = STEPS) {
    this.stepValidations = [
      { id: 'basic-info', requiredFields: ['title', 'artifact_type', 'month'], isComplete: false },
      { id: 'role-originality', requiredFields: ['is_team_work', 'is_original_work'], isComplete: false },
      { id: 'skills-reflection', requiredFields: ['selected_skills'], isComplete: false },
      { id: 'process-challenges', requiredFields: ['creation_process', 'challenges'], isComplete: false },
      { id: 'review-submit', requiredFields: [], isComplete: false },
    ];
  }

  markStepVisited(stepId: AssignmentStep): void {
    this.visitedSteps.add(stepId);
  }

  isStepVisited(stepId: AssignmentStep): boolean {
    return this.visitedSteps.has(stepId);
  }

  validateStep(stepId: AssignmentStep, formData: AssignmentFormValues): boolean {
    if (!this.isStepVisited(stepId)) {
      this.markStepVisited(stepId); // Auto-mark as visited to fix potential initialization issues
    }

    const step = this.stepValidations.find(s => s.id === stepId);
    if (!step) return false;

    // Check required fields
    const requiredFieldsValid = step.requiredFields.every(field => {
      const value = formData[field];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return true;
      return value !== null && value !== undefined && value !== '';
    });

    // For basic-info step, also check if either files or youtubelinks are provided
    if (stepId === 'basic-info') {
      const hasFiles = Array.isArray(formData.files) && formData.files.length > 0;
      const hasYoutubeLinks = Array.isArray(formData.youtubelinks) && 
                             formData.youtubelinks.some(link => link.url && link.url.trim() !== '');
      
      step.isComplete = requiredFieldsValid && (hasFiles || hasYoutubeLinks);
    } else {
      step.isComplete = requiredFieldsValid;
    }

    return step.isComplete;
  }

  canNavigateToStep(targetStep: AssignmentStep, currentStep: AssignmentStep, formData: AssignmentFormValues): boolean {
    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    const targetIndex = this.steps.findIndex(step => step.id === targetStep);

    if (targetIndex < 0 || currentIndex < 0) return false;
    if (targetIndex < currentIndex) return true;

    return this.steps.slice(0, currentIndex + 1).every(step => 
      this.validateStep(step.id, formData)
    );
  }

  getNext(currentStep: AssignmentStep, formData: AssignmentFormValues): AssignmentStep | null {
    if (!this.validateStep(currentStep, formData)) {
      return null;
    }

    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    return currentIndex < this.steps.length - 1 ? this.steps[currentIndex + 1].id : null;
  }

  getPrevious(currentStep: AssignmentStep): AssignmentStep | null {
    const currentIndex = this.steps.findIndex(step => step.id === currentStep);
    return currentIndex > 0 ? this.steps[currentIndex - 1].id : null;
  }

  isStepComplete(stepId: AssignmentStep): boolean {
    return this.stepValidations.find(s => s.id === stepId)?.isComplete ?? false;
  }

  resetStepValidation(): void {
    this.stepValidations.forEach(step => {
      step.isComplete = false;
    });
    this.visitedSteps.clear();
  }
}

export interface StepValidation {
  id: AssignmentStep;
  requiredFields: (keyof AssignmentFormValues)[];
  isComplete: boolean;
}