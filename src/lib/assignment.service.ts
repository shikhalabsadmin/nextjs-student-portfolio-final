// This file re-exports services to maintain backward compatibility
// while enforcing better SRP and modularity

// Re-export services from their new locations
export { debug } from "@/lib/utils/debug.service";
export { ToastService } from "@/lib/services/toast.service";
export { StepService } from "@/lib/services/step.service";
export { getDefaultValues } from "@/lib/services/assignment-defaults.service";
export { AssignmentService } from "@/lib/services/assignment.service";

// Type exports for backward compatibility
export type { StepValidation } from "@/lib/services/step.service";