export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private formatMessage(message: string, data?: unknown): string {
    const dataStr = data ? JSON.stringify(data, null, 2) : '';
    return dataStr ? `${message}\n${dataStr}` : message;
  }

  private log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    const formattedMessage = this.formatMessage(message, data);
    console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${formattedMessage}`);
    
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

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
}

export const logger = new Logger(); 