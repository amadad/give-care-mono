/**
 * Logging Utility
 *
 * Environment-aware logging wrapper
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }

  // Always log (for critical production messages)
  always(level: LogLevel, message: string, ...args: unknown[]): void {
    const prefix = `[${level.toUpperCase()}]`;
    console.log(prefix, message, ...args);
  }
}

export const logger = new Logger();
