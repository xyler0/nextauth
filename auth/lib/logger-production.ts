type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: any;
}

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
    };

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to logging service (e.g., DataDog, CloudWatch, etc.)
      console.log(JSON.stringify(entry));
    } else {
      console.log(`[${level.toUpperCase()}]`, message, meta || '');
    }
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta);
    }
  }
}

export const logger = new Logger();