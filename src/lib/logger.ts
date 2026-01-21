/**
 * Production-Ready Logging Utility
 * 
 * Provides structured logging with different levels (info, warn, error)
 * Sanitizes sensitive data before logging
 * Includes context for debugging production issues
 * 
 * Usage:
 *   logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 *   logger.error('Database connection failed', { error, context });
 */

// List of sensitive keys that should be redacted
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'creditCard',
  'ssn',
  'privateKey',
];

/**
 * Check if a key is sensitive and should be redacted
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()));
}

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(data: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[Max Depth]';

  if (data === null || data === undefined) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, depth + 1));
  }

  // Handle objects
  if (typeof data === 'object') {
    // Handle special objects (Date, Error, etc.)
    if (data instanceof Date) return data.toISOString();
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        ...(process.env.NODE_ENV === 'development' && { stack: data.stack }),
      };
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (isSensitiveKey(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value, depth + 1);
      }
    }
    return redacted;
  }

  return data;
}

/**
 * Format log entry with timestamp and metadata
 */
function formatLogEntry(level: string, message: string, context?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || 'development';

  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    env,
    ...(context && { context: redactSensitiveData(context) }),
  };

  return JSON.stringify(entry);
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Get minimum log level from environment
 */
function getMinLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
  return LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
}

const minLogLevel = getMinLogLevel();

/**
 * Logger class with different log levels
 */
class Logger {
  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (minLogLevel <= LogLevel.DEBUG && process.env.NODE_ENV === 'development') {
      console.debug(formatLogEntry('debug', message, context));
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: Record<string, unknown>): void {
    if (minLogLevel <= LogLevel.INFO) {
      console.info(formatLogEntry('info', message, context));
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: Record<string, unknown>): void {
    if (minLogLevel <= LogLevel.WARN) {
      console.warn(formatLogEntry('warn', message, context));
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (minLogLevel <= LogLevel.ERROR) {
      const errorContext = {
        ...context,
        error: redactSensitiveData(error),
      };
      console.error(formatLogEntry('error', message, errorContext));
    }
  }

  /**
   * Log API request
   */
  logRequest(method: string, url: string, context?: Record<string, unknown>): void {
    this.info(`${method} ${url}`, {
      type: 'request',
      ...context,
    });
  }

  /**
   * Log API response
   */
  logResponse(method: string, url: string, status: number, duration?: number): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    const context = {
      type: 'response',
      status,
      ...(duration && { duration: `${duration}ms` }),
    };

    if (level === 'error') {
      this.error(`${method} ${url}`, null, context);
    } else if (level === 'warn') {
      this.warn(`${method} ${url}`, context);
    } else {
      this.info(`${method} ${url}`, context);
    }
  }

  /**
   * Log database operation
   */
  logDb(operation: string, collection: string, duration?: number): void {
    this.debug(`DB ${operation} ${collection}`, {
      type: 'database',
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  /**
   * Log security event
   */
  logSecurity(event: string, context?: Record<string, unknown>): void {
    this.warn(`Security: ${event}`, {
      type: 'security',
      ...context,
    });
  }

  /**
   * Log rate limit event
   */
  logRateLimit(identifier: string, endpoint: string): void {
    this.warn('Rate limit exceeded', {
      type: 'rate_limit',
      identifier,
      endpoint,
    });
  }

  /**
   * Log authentication event
   */
  logAuth(event: string, userId?: string, context?: Record<string, unknown>): void {
    this.info(`Auth: ${event}`, {
      type: 'authentication',
      userId,
      ...context,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, context?: Record<string, unknown>): void {
    const level = duration > 1000 ? 'warn' : 'debug';

    if (level === 'warn') {
      this.warn(`Slow operation: ${operation}`, {
        type: 'performance',
        duration: `${duration}ms`,
        ...context,
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        type: 'performance',
        duration: `${duration}ms`,
        ...context,
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Performance timer utility
 * 
 * Usage:
 *   const timer = startTimer();
 *   // ... do work
 *   const duration = timer.end();
 *   logger.logPerformance('operation', duration);
 */
export function startTimer() {
  const start = Date.now();

  return {
    end: (): number => {
      return Date.now() - start;
    },
  };
}

/**
 * Async function wrapper with logging
 */
export function withLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const timer = startTimer();
    try {
      logger.debug(`Starting: ${operationName}`);
      const result = await fn(...args);
      const duration = timer.end();
      logger.logPerformance(operationName, duration);
      return result;
    } catch (error) {
      const duration = timer.end();
      logger.error(`Failed: ${operationName}`, error, { duration });
      throw error;
    }
  }) as T;
}

/**
 * Request logger middleware helper
 */
export function createRequestLogger() {
  return (method: string, url: string, handler: () => Promise<Response>) => {
    return async () => {
      const timer = startTimer();
      const requestId = Math.random().toString(36).substring(7);

      logger.logRequest(method, url, { requestId });

      try {
        const response = await handler();
        const duration = timer.end();
        logger.logResponse(method, url, response.status, duration);
        return response;
      } catch (error) {
        const duration = timer.end();
        logger.error(`Request failed: ${method} ${url}`, error, {
          requestId,
          duration,
        });
        throw error;
      }
    };
  };
}

export default logger;
