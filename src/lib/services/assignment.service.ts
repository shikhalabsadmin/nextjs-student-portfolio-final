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

/**
 * Improved AssignmentService with better error handling and cleanup
 */
export class AssignmentService {
  private notificationService: NotificationService;
  private initialFormState: string | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private autoSaveAbortController: AbortController | null = null;
  private autoSaveInProgress = false;
  private readonly AUTOSAVE_DELAY = 5000;

  /**
   * Initialize the assignment service
   */
  constructor(
    private toast: ToastService,
    private navigate: NavigateFunction,
    private userId?: string
  ) {
    this.notificationService = NotificationService.getInstance();
    debug.log("AssignmentService initialized", { userId });
  }

  /**
   * Check if form data has been modified from initial state
   */
  private isFormModified(currentData: AssignmentFormValues): boolean {
    return this.initialFormState !== null && 
           this.initialFormState !== JSON.stringify(currentData);
  }

  /**
   * Store initial form state for change detection
   */
  private storeInitialState(data: AssignmentFormValues): void {
    this.initialFormState = JSON.stringify(data);
    debug.log("Initial form state stored");
  }

  /**
   * Perform the actual auto-save operation
   */
  private async performAutoSave(id: string, data: AssignmentFormValues): Promise<void> {
    try {
      debug.endTimer("autoSave"); // End any existing timer first
    } catch (error) {
      // Ignore error if timer didn't exist
    }
    
    debug.startTimer("autoSave");
    
    // Create a new AbortController for this save operation
    this.autoSaveAbortController = new AbortController();
    this.autoSaveInProgress = true;
    
    try {
      await updateAssignment(id, {
        ...data,
        updated_at: new Date().toISOString()
      }, this.autoSaveAbortController.signal);
      
      debug.endTimer("autoSave");
      debug.log("Auto-save successful", { assignmentId: id });
      this.storeInitialState(data);
    } finally {
      this.autoSaveInProgress = false;
      this.autoSaveAbortController = null;
    }
  }

  /**
   * Auto-save assignment data after a delay
   */
  async autoSave(id: string, data: AssignmentFormValues): Promise<void> {
    if (!this.isFormModified(data)) {
      debug.log("Skipping auto-save - no changes detected");
      return;
    }

    // Cancel any scheduled auto-save
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      debug.log("Cleared previous auto-save timeout");
    }

    // Cancel any in-progress auto-save API call
    if (this.autoSaveInProgress && this.autoSaveAbortController) {
      debug.log("Aborting in-progress auto-save");
      this.autoSaveAbortController.abort();
      this.autoSaveInProgress = false;
    }

    return new Promise((resolve) => {
      this.autoSaveTimeout = setTimeout(async () => {
        const loadingId = this.toast.loading("Saving changes...");
        try {
          await this.performAutoSave(id, data);
          this.toast.success("Changes saved successfully");
          resolve();
        } catch (error) {
          // Only show error if not aborted
          if (error instanceof Error && error.name !== 'AbortError') {
            debug.error("Auto-save failed", error);
            this.toast.error("Failed to save changes");
            throw error;
          } else {
            debug.log("Auto-save aborted", { id });
          }
        } finally {
          this.toast.dismiss(loadingId);
        }
      }, this.AUTOSAVE_DELAY);
      
      debug.log(`Auto-save scheduled in ${this.AUTOSAVE_DELAY}ms`);
    });
  }

  /**
   * Initialize an assignment - either create new or load existing
   */
  async initialize(id?: string): Promise<AssignmentFormValues | null> {
    if (!this.userId) {
      debug.error("User not authenticated");
      this.toast.error("User not authenticated");
      return null;
    }

    const isNew = !id || id === ":id";
    const message = isNew ? "Creating new assignment..." : "Loading assignment...";
    const loadingId = this.toast.loading(message);

    debug.log("Initializing assignment", { id, isNew, userId: this.userId });

    try {
      const assignment = isNew
        ? await this.createNewAssignment()
        : await this.loadExistingAssignment(id);
      
      if (assignment) {
        this.storeInitialState(assignment);
      }
      
      this.toast.success(isNew ? "Assignment created" : "Assignment loaded");
      return assignment;
    } catch (error) {
      debug.error("Error initializing assignment", error);
      this.toast.error(error instanceof Error ? error.message : "Failed to initialize assignment");
      return null;
    } finally {
      this.toast.dismiss(loadingId);
    }
  }

  /**
   * Create a new assignment
   */
  private async createNewAssignment(): Promise<AssignmentFormValues> {
    debug.log("Creating new assignment", { userId: this.userId });
    const initialData: AssignmentFormValues = {
      ...getDefaultValues(),
      student_id: this.userId,
    };

    // Omit `id` from the payload; let Supabase generate it
    const { id, ...dataWithoutId } = initialData;
    const sanitizedData = {
      ...dataWithoutId,
      student_id: this.userId,
    };

    debug.log("Sanitized initial data for creation (id omitted)", sanitizedData);

    const newAssignment = await createAssignment(sanitizedData);
    if (!newAssignment?.id) {
      throw new Error("Failed to create assignment - no ID returned");
    }

    // Navigate to the new assignment's edit page
    const newRoute = ROUTES.STUDENT.MANAGE_ASSIGNMENT.replace(':id?', newAssignment.id);
    this.navigate(newRoute, { replace: true });
    debug.log("New assignment created", { id: newAssignment.id, redirectedTo: newRoute });
    
    return { ...initialData, id: newAssignment.id }; // Return with generated id
  }

  /**
   * Load an existing assignment
   */
  private async loadExistingAssignment(id: string): Promise<AssignmentFormValues> {
    debug.log("Loading existing assignment", { id });
    const assignment = await getAssignment(id);
    
    if (!assignment) {
      debug.error("Assignment not found", { id });
      throw new Error("Assignment not found");
    }

    // Handle legacy format - convert artifact_url to files if needed
    if (assignment.artifact_url && !assignment.files?.length) {
      debug.log("Converting legacy artifact_url to files", { artifact_url: assignment.artifact_url });
      
      assignment.files = assignment.artifact_url.split(",").map(url => ({
        file_url: url.trim(),
        file_name: url.split("/").pop() || "unnamed_file",
        file_type: "",
        file_size: 0,
        uploaded_at: new Date().toISOString(),
      }));
    }

    debug.log("Assignment loaded successfully", assignment);
    return assignment;
  }

  /**
   * Submit an assignment for review
   */
  async submit(data: AssignmentFormValues): Promise<void> {
    if (!data.id) {
      debug.error("Missing assignment ID for submission");
      throw new Error("Assignment ID is required for submission");
    }

    debug.log("Submitting assignment", { id: data.id });
    const loadingId = this.toast.loading("Submitting assignment...");
    
    try {
      const sanitizedData = {
        ...data,
        student_id: this.userId,
      };

      const updatedAssignment = await updateAssignment(data.id, {
        ...sanitizedData,
        status: ASSIGNMENT_STATUS.SUBMITTED,
        submitted_at: new Date().toISOString(),
      });

      debug.log("Assignment submission successful", { id: data.id });

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

  /**
   * Send notification to teacher about submitted assignment
   */
  private async notifyTeacher(assignment: AssignmentFormValues): Promise<void> {
    try {
      debug.log("Fetching student profile for notification", { userId: this.userId });
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', this.userId)
        .single();

      if (profileError) {
        debug.error("Error fetching student profile", profileError);
      }

      if (!assignment.id || !assignment.teacher_id) {
        debug.error("Missing required fields for teacher notification", { 
          id: assignment.id, 
          teacherId: assignment.teacher_id 
        });
        throw new Error("Missing required assignment fields");
      }

      const studentName = profile?.full_name || 'A student';
      debug.log("Sending notification to teacher", { 
        teacherId: assignment.teacher_id,
        assignmentId: assignment.id, 
        studentName 
      });
      
      await this.notificationService.notifyAssignmentSubmitted(
        assignment.teacher_id,
        assignment.title,
        studentName,
        assignment.id
      );
      
      debug.log("Teacher notification sent successfully");
    } catch (error) {
      debug.error("Error sending notification to teacher", error);
      this.toast.error("Assignment submitted but teacher notification failed");
    }
  }

  /**
   * Clean up timers and resources
   */
  cleanup(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
      debug.log("Auto-save timeout cleared during cleanup");
    }
    
    if (this.autoSaveAbortController) {
      this.autoSaveAbortController.abort();
      this.autoSaveAbortController = null;
      this.autoSaveInProgress = false;
      debug.log("Auto-save operation aborted during cleanup");
    }
    
    this.toast.dismissAll();
    debug.log("AssignmentService cleanup completed");
  }
}