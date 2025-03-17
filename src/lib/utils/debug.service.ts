// Debug utility with stricter typing and enhanced functionality
class DebugService {
  private readonly enabled: boolean;
  private readonly namespace: string;
  
  constructor(namespace: string) {
    this.enabled = process.env.NODE_ENV === "development";
    this.namespace = namespace;
  }

  log(message: string, data?: unknown): void {
    if (!this.enabled) return;
    console.log(`[${this.namespace}] ${message}`, data ?? "");
  }

  info(message: string, data?: unknown): void {
    if (!this.enabled) return;
    console.info(`[${this.namespace}] ${message}`, data ?? "");
  }

  warn(message: string, data?: unknown): void {
    if (!this.enabled) return;
    console.warn(`[${this.namespace}] ${message}`, data ?? "");
  }

  error(message: string, error?: unknown): void {
    if (!this.enabled) return;
    console.error(`[${this.namespace} Error] ${message}`, error ?? "");
  }

  // Log a step in a multi-step process
  step(message: string, data?: unknown): void {
    if (!this.enabled) return;
    console.log(`[${this.namespace} Step] ${message}`, data ?? "");
  }

  // Group logs visually
  group(label: string, callback: () => void): void {
    if (!this.enabled) return;
    console.group(`[${this.namespace}] ${label}`);
    callback();
    console.groupEnd();
  }

  // Timer methods
  startTimer(label: string): void {
    if (!this.enabled) return;
    console.time(`[${this.namespace}] ${label}`);
  }

  endTimer(label: string): void {
    if (!this.enabled) return;
    console.timeEnd(`[${this.namespace}] ${label}`);
  }
}

// Create instances for different parts of the application
export const debug = new DebugService("Assignment Form");
export const debugAPI = new DebugService("API");
export const debugStorage = new DebugService("Storage");
export const debugAuth = new DebugService("Auth");
export const debugDB = new DebugService("Database");

// Allow creation of custom debug instances
export function createDebugService(namespace: string): DebugService {
  return new DebugService(namespace);
} 