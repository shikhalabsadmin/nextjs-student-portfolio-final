export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  module?: string; // Optional new field
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private enabled = false; // Temporarily disable all logger output

  private formatMessage(message: string, data?: unknown): string {
    const dataStr = data ? JSON.stringify(data, null, 2) : '';
    return dataStr ? `${message}\n${dataStr}` : message;
  }

  // Keep the original log method signature but enhance internally
  private log(level: LogLevel, message: string, data?: unknown, module?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      module
    };

    const modulePrefix = module ? `[${module}] ` : '';
    const formattedMessage = this.formatMessage(message, data);
    
    // Original console logging behavior
    console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${modulePrefix}${formattedMessage}`);
    
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Original methods - unchanged API
  debug(message: string, data?: unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data);
  }

  getLogs(filter?: { level?: LogLevel }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter?.level && log.level !== filter.level) return false;
      return true;
    });
  }

  // New methods - won't break existing code
  
  /**
   * Creates a logger instance for a specific module
   * @param moduleName The name of the module
   */
  forModule(moduleName: string) {
    return {
      debug: (message: string, data?: unknown) => this.log('debug', message, data, moduleName),
      info: (message: string, data?: unknown) => this.log('info', message, data, moduleName),
      warn: (message: string, data?: unknown) => this.log('warn', message, data, moduleName),
      error: (message: string, data?: unknown) => this.log('error', message, data, moduleName)
    };
  }

  /**
   * Start performance timer (wrapper around console.time)
   */
  time(label: string) {
    if (this.enabled) {
      console.time(`[Performance] ${label}`);
    }
  }

  /**
   * End performance timer and log duration (wrapper around console.timeEnd)
   */
  timeEnd(label: string) {
    if (this.enabled) {
      console.timeEnd(`[Performance] ${label}`);
    }
  }

  /**
   * Get logs with enhanced filtering options
   */
  getFilteredLogs(filter?: { level?: LogLevel; module?: string }): LogEntry[] {
    return this.logs.filter(log => {
      if (filter?.level && log.level !== filter.level) return false;
      if (filter?.module && log.module !== filter.module) return false;
      return true;
    });
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();