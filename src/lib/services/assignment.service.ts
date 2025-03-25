import { type NavigateFunction } from "react-router-dom";
import { createAssignment, updateAssignment, getAssignment } from "@/lib/api/assignments";
import { type AssignmentFormValues } from "@/lib/validations/assignment";
import { ASSIGNMENT_STATUS } from "@/constants/assignment-status";
import { NotificationService } from "@/lib/services/notification.service";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/config/routes";
import { ToastService } from "@/lib/services/toast.service";
import { debug } from "@/lib/utils/debug.service";
import { getDefaultValues } from "@/lib/services/assignment-defaults.service";

export class AssignmentService {
  private readonly notificationService = NotificationService.getInstance();
  private initialFormState: string | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private autoSaveAbortController: AbortController | null = null;
  private autoSaveInProgress = false;
  private readonly AUTOSAVE_DELAY = 1000;

  constructor(
    private readonly toast: ToastService,
    private readonly navigate: NavigateFunction,
    private readonly userId: string
  ) {
    debug.log("AssignmentService initialized", { userId });
  }

  /** Check if form data has changed */
  private isFormModified(currentData: AssignmentFormValues): boolean {
    return this.initialFormState !== null && this.initialFormState !== JSON.stringify(currentData);
  }

  /** Store initial form state for comparison */
  private storeInitialState(data: AssignmentFormValues): void {
    this.initialFormState = JSON.stringify(data);
  }

  /** Perform the actual auto-save operation */
  private async performAutoSave(id: string, data: AssignmentFormValues): Promise<void> {
    if (this.autoSaveInProgress) return;

    this.autoSaveInProgress = true;
    this.autoSaveAbortController = new AbortController();

    try {
      debug.startTimer("autoSave");
      await updateAssignment(id, { ...data, updated_at: new Date().toISOString() }, this.autoSaveAbortController.signal);
      debug.endTimer("autoSave");
      this.storeInitialState(data);
    } finally {
      this.autoSaveInProgress = false;
      this.autoSaveAbortController = null;
    }
  }

  /** Queue an auto-save with debounce */
  async autoSave(id: string, data: AssignmentFormValues): Promise<void> {
    if (!this.isFormModified(data)) return;

    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    if (this.autoSaveInProgress && this.autoSaveAbortController) this.autoSaveAbortController.abort();

    this.autoSaveTimeout = setTimeout(async () => {
      try {
        await this.performAutoSave(id, data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          debug.error("Auto-save failed", error);
          this.toast.error("Failed to auto-save changes");
        }
      }
    }, this.AUTOSAVE_DELAY);
  }

  /** Initialize a new or existing assignment */
  async initialize(id?: string): Promise<AssignmentFormValues | null> {
    const loadingId = this.toast.loading(id ? "Loading assignment..." : "Creating assignment...");
    try {
      const assignment = id && id !== ":id" ? await this.loadExistingAssignment(id) : await this.createNewAssignment();
      if (assignment) this.storeInitialState(assignment);
      return assignment;
    } catch (error) {
      debug.error("Initialization failed", error);
      this.toast.error(error instanceof Error ? error.message : "Failed to initialize assignment");
      return null;
    } finally {
      this.toast.dismiss(loadingId);
    }
  }

  private async createNewAssignment(): Promise<AssignmentFormValues> {
    const initialData: AssignmentFormValues = {
      ...getDefaultValues(),
      student_id: this.userId,
      status: ASSIGNMENT_STATUS.DRAFT,
    };

    const { id, ...dataWithoutId } = initialData;
    const newAssignment = await createAssignment(dataWithoutId);
    if (!newAssignment?.id) throw new Error("Failed to create assignment - no ID returned");

    this.navigate(ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(":id?", newAssignment.id), { replace: true });
    return { ...initialData, id: newAssignment.id };
  }

  private async loadExistingAssignment(id: string): Promise<AssignmentFormValues> {
    const assignment = await getAssignment(id);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.artifact_url && !assignment.files?.length) {
      assignment.files = this.convertLegacyArtifactUrl(assignment.artifact_url);
    }
    return assignment;
  }

  private convertLegacyArtifactUrl(artifactUrl: string): AssignmentFormValues["files"] {
    return artifactUrl.split(",").map(url => ({
      file_url: url.trim(),
      file_name: url.split("/").pop() || "unnamed_file",
      file_type: "",
      file_size: 0,
      uploaded_at: new Date().toISOString(),
    }));
  }

  /** Submit the assignment */
  async submit(data: AssignmentFormValues): Promise<void> {
    if (!data.id) throw new Error("Assignment ID required for submission");

    const loadingId = this.toast.loading("Submitting assignment...");
    try {
      const updatedAssignment = await updateAssignment(data.id, {
        ...data,
        student_id: this.userId,
        status: ASSIGNMENT_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
      });

      if (updatedAssignment.teacher_id) await this.notifyTeacher(updatedAssignment);

      this.toast.success("Assignment submitted");
    } catch (error) {
      debug.error("Submission failed", error);
      throw new Error("Failed to submit assignment");
    } finally {
      this.toast.dismiss(loadingId);
    }
  }

  private async notifyTeacher(assignment: AssignmentFormValues): Promise<void> {
    if (!assignment.id || !assignment.teacher_id) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", this.userId)
        .single();

      await this.notificationService.notifyAssignmentSubmitted(
        assignment.teacher_id,
        assignment.title || "Untitled Assignment",
        profile?.full_name || "A student",
        assignment.id
      );
    } catch (error) {
      debug.error("Notification failed", error);
      this.toast.error("Submission successful, but teacher notification failed");
    }
  }

  /** Cleanup resources */
  cleanup(): void {
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    if (this.autoSaveInProgress && this.autoSaveAbortController) this.autoSaveAbortController.abort();
    this.toast.dismissAll();
    debug.log("AssignmentService cleaned up");
  }
}