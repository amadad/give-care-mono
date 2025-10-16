/**
 * Structured logging for Cloudflare Workers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  sessionId?: string;
  agentName?: string;
  step?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Structured logger for Cloudflare Workers
 *
 * Outputs JSON logs that can be parsed by observability tools.
 */
export class Logger {
  constructor(
    private context: LogContext = {},
    private minLevel: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...this.context,
      ...meta
    };

    // Use console methods for proper log level
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta = error instanceof Error
      ? { error: error.message, stack: error.stack, ...meta }
      : { error: String(error), ...meta };

    this.log('error', message, errorMeta);
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(
      { ...this.context, ...additionalContext },
      this.minLevel
    );
  }
}

/**
 * Create logger with session context
 */
export function createLogger(context: LogContext = {}): Logger {
  const minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  return new Logger(context, minLevel);
}
