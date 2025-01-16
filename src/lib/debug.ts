interface DebugEvent {
  type: string;
  data: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

class AssignmentDebugger {
  private submissionId: string;
  private events: DebugEvent[];

  constructor(submissionId: string) {
    this.submissionId = submissionId;
    this.events = [];
    this.loadExistingEvents();
  }

  private loadExistingEvents() {
    try {
      const existingEvents = sessionStorage.getItem(`debug_${this.submissionId}`);
      if (existingEvents) {
        this.events = JSON.parse(existingEvents);
      }
    } catch (e) {
      console.error('Failed to load existing events:', e);
    }
  }

  private saveEvents() {
    try {
      sessionStorage.setItem(`debug_${this.submissionId}`, JSON.stringify(this.events));
    } catch (e) {
      console.error('Failed to save events:', e);
    }
  }

  log(type: string, data: any, metadata?: Record<string, any>) {
    const event: DebugEvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      metadata
    };

    this.events.push(event);
    this.saveEvents();

    // Also log to console for immediate feedback
    console.log(`[Assignment:${this.submissionId}] ${type}:`, {
      ...data,
      ...(metadata ? { metadata } : {})
    });
  }

  error(type: string, error: any, context?: Record<string, any>) {
    this.log(type, {
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack
      } : error,
      context
    });
  }

  getEvents(): DebugEvent[] {
    return this.events;
  }

  static getSubmissionLogs(submissionId: string): DebugEvent[] {
    try {
      const events = sessionStorage.getItem(`debug_${submissionId}`);
      return events ? JSON.parse(events) : [];
    } catch (e) {
      console.error('Failed to get submission logs:', e);
      return [];
    }
  }

  static getAllLogs(): Record<string, DebugEvent[]> {
    const logs: Record<string, DebugEvent[]> = {};
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('debug_')) {
        try {
          const submissionId = key.replace('debug_', '');
          logs[submissionId] = JSON.parse(sessionStorage.getItem(key) || '[]');
        } catch (e) {
          console.error('Failed to parse logs:', e);
        }
      }
    }

    return logs;
  }
}

export const createDebugger = (submissionId: string) => new AssignmentDebugger(submissionId);
export const getSubmissionLogs = AssignmentDebugger.getSubmissionLogs;
export const getAllLogs = AssignmentDebugger.getAllLogs; 