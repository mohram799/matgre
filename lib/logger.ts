/**
 * SHAMIKH LUXURY OS — Structured Logger
 * Production-grade logging with severity levels, context, and Sentry integration.
 * Replaces raw console.log throughout the codebase.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  /** API route or service name */
  service?: string;
  /** Request ID / correlation ID */
  requestId?: string;
  /** User phone or admin phone */
  userId?: string;
  /** HTTP method */
  method?: string;
  /** URL path */
  path?: string;
  /** Status code */
  status?: number;
  /** Duration in ms */
  durationMs?: number;
  /** Additional metadata */
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ─── Log Level Priority ───────────────────────────────────────────────────────

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ─── Logger Class ─────────────────────────────────────────────────────────────

class ShamakhLogger {
  private readonly minLevel: LogLevel;
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.minLevel = this.isProduction ? 'info' : 'debug';
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.minLevel];
  }

  private format(entry: LogEntry): string {
    if (this.isProduction) {
      // JSON structured log for log aggregators (Datadog, CloudWatch, etc.)
      return JSON.stringify(entry);
    }

    // Human-readable format for local dev
    const levelEmoji: Record<LogLevel, string> = {
      debug: '🔍',
      info: '✅',
      warn: '⚠️',
      error: '❌',
      fatal: '💀',
    };

    const prefix = `${levelEmoji[entry.level]} [${entry.level.toUpperCase()}] [SHAMIKH]`;
    const context = Object.keys(entry.context).length > 0
      ? ` | ${JSON.stringify(entry.context)}`
      : '';
    const error = entry.error
      ? `\n  Error: ${entry.error.name}: ${entry.error.message}`
      : '';

    return `${prefix} ${entry.message}${context}${error}`;
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, err?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      ...(err && {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      }),
    };

    const formatted = this.format(entry);

    switch (level) {
      case 'debug': console.debug(formatted); break;
      case 'info':  console.info(formatted);  break;
      case 'warn':  console.warn(formatted);  break;
      case 'error':
      case 'fatal': console.error(formatted); break;
    }

    // In production, send errors/fatals to Sentry (if configured)
    if (this.isProduction && (level === 'error' || level === 'fatal') && err) {
      this.sendToSentry(entry, err);
    }
  }

  private sendToSentry(entry: LogEntry, err: Error): void {
    const { sentry } = require('./sentry');
    sentry.captureError(err, {
      message: entry.message,
      context: entry.context as any,
      level: entry.level === 'fatal' ? 'fatal' : 'error',
    });
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, err?: Error | unknown, context?: LogContext) {
    const error = err instanceof Error ? err : new Error(String(err));
    this.log('error', message, context, error);
  }

  fatal(message: string, err?: Error | unknown, context?: LogContext) {
    const error = err instanceof Error ? err : new Error(String(err));
    this.log('fatal', message, context, error);
  }

  /**
   * Create a child logger with pre-set context (useful per API route)
   */
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext);
  }

  /**
   * Measure and log execution time for async operations
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(`${label} completed`, { ...context, durationMs: Date.now() - start });
      return result;
    } catch (err) {
      this.error(`${label} failed`, err, { ...context, durationMs: Date.now() - start });
      throw err;
    }
  }
}

// ─── Child Logger (pre-sets context) ─────────────────────────────────────────

class ChildLogger {
  constructor(
    private readonly parent: ShamakhLogger,
    private readonly baseContext: LogContext
  ) {}

  debug(message: string, extra?: LogContext) {
    this.parent.debug(message, { ...this.baseContext, ...extra });
  }
  info(message: string, extra?: LogContext) {
    this.parent.info(message, { ...this.baseContext, ...extra });
  }
  warn(message: string, extra?: LogContext) {
    this.parent.warn(message, { ...this.baseContext, ...extra });
  }
  error(message: string, err?: Error | unknown, extra?: LogContext) {
    this.parent.error(message, err, { ...this.baseContext, ...extra });
  }
}

// Singleton logger instance — import this everywhere
export const logger = new ShamakhLogger();

// ─── HTTP Request Logger Middleware Helper ────────────────────────────────────

/**
 * Wraps an API handler with structured request/response logging.
 * Usage: export const GET = withLogging(handler, '/api/products');
 */
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  routeName: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    const req = args[0] as Request;
    const traceId = req.headers.get('x-trace-id') || crypto.randomUUID().slice(0, 8);

    const childLogger = logger.child({
      service: routeName,
      traceId,
      method: req.method,
      path: new URL(req.url).pathname,
    });

    childLogger.info('Request received');

    try {
      const response = await handler(...args);
      childLogger.info('Request completed', {
        status: response.status,
        durationMs: Date.now() - start,
      });
      return response;
    } catch (err) {
      childLogger.error('Unhandled exception in route handler', err, {
        durationMs: Date.now() - start,
      });
      return new Response(
        JSON.stringify({ error: 'Internal server error', traceId }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }) as T;
}
