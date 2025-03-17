import { toast } from "sonner";
import { debug } from "@/lib/utils/debug.service";

/**
 * Enhanced ToastService with automatic tracking and cleanup
 */
export class ToastService {
  private activeToastIds: Set<string | number> = new Set();

  /**
   * Show a loading toast with automatic tracking
   */
  loading(message: string): string | number {
    debug.info(`Loading toast: ${message}`);
    const id = toast.loading(message);
    this.activeToastIds.add(id);
    return id;
  }

  /**
   * Show a success toast
   */
  success(message: string): void {
    debug.info(`Success toast: ${message}`);
    toast.success(message);
  }

  /**
   * Show an error toast
   */
  error(message: string): void {
    debug.info(`Error toast: ${message}`);
    toast.error(message);
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(id: string | number): void {
    debug.info(`Dismissing toast: ${id}`);
    toast.dismiss(id);
    this.activeToastIds.delete(id);
  }

  /**
   * Dismiss all active toasts
   */
  dismissAll(): void {
    debug.info(`Dismissing all toasts: ${this.activeToastIds.size} total`);
    this.activeToastIds.forEach(id => toast.dismiss(id));
    this.activeToastIds.clear();
  }
} 