/**
 * SHAMIKH LUXURY OS — Sentry Error Monitoring & Performance Tracing
 * Captures unhandled exceptions, API latency spikes, and performance regressions.
 * Operates in no-op mode when SENTRY_DSN is not configured.
 */

export interface ShamakhError {
  message: string;
  context?: Record<string, unknown>;
  level?: 'error' | 'warning' | 'info' | 'fatal';
  user?: { phone?: string; role?: string };
  tags?: Record<string, string>;
}

export interface ShamakhTransaction {
  name: string;
  op: string;
  startTimestamp: number;
  finish: (status?: 'ok' | 'internal_error' | 'cancelled') => void;
}

class ShamakhSentry {
  private isConfigured = false;
  private dsn = '';
  private environment = '';
  private sdk: any = null;

  constructor() {
    this.dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
    this.environment = process.env.NODE_ENV || 'development';
    this.isConfigured = !!this.dsn && !this.dsn.includes('placeholder');
  }

  /**
   * Initialize Sentry SDK via dynamic import (avoids build failures without @sentry/nextjs).
   * Call this from instrumentation.ts or _app.tsx.
   */
  async init(): Promise<void> {
    if (!this.isConfigured) {
      console.debug('[SHAMIKH SENTRY] DSN not configured — operating in no-op mode.');
      return;
    }

    try {
      this.sdk = await import('@sentry/nextjs' as any);
      this.sdk.init({
        dsn: this.dsn,
        environment: this.environment,
        tracesSampleRate: this.environment === 'production' ? 0.2 : 1.0,
        profilesSampleRate: 0.1,
        release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        beforeSend(event: any) {
          // Scrub PII from error reports
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          return event;
        },
        integrations: [],
      });
      console.info('[SHAMIKH SENTRY] Sentry initialized successfully.');
    } catch {
      console.debug('[SHAMIKH SENTRY] @sentry/nextjs not installed — operating in no-op mode.');
    }
  }

  /**
   * Capture and report an error to Sentry with structured context.
   */
  captureError(error: Error | string, meta?: ShamakhError): void {
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' ? error.stack : undefined;

    if (this.sdk) {
      this.sdk.withScope((scope: any) => {
        if (meta?.user) scope.setUser(meta.user);
        if (meta?.tags) Object.entries(meta.tags).forEach(([k, v]) => scope.setTag(k, v));
        if (meta?.context) scope.setContext('metadata', meta.context);
        scope.setLevel(meta?.level || 'error');
        this.sdk.captureException(typeof error === 'object' ? error : new Error(message));
      });
    } else {
      // Structured no-op fallback — always log to console
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: meta?.level || 'error',
        message,
        stack,
        context: meta?.context,
        tags: meta?.tags,
      };
      console.error('[SHAMIKH SENTRY NO-OP] Error captured:', JSON.stringify(logEntry, null, 2));
    }
  }

  /**
   * Start a performance transaction span.
   */
  startTransaction(name: string, op: string): ShamakhTransaction {
    const startTimestamp = Date.now();

    if (this.sdk) {
      const transaction = this.sdk.startTransaction({ name, op });
      return {
        name,
        op,
        startTimestamp,
        finish: (status: 'ok' | 'internal_error' | 'cancelled' = 'ok') => {
          transaction.setStatus(status);
          transaction.finish();
        },
      };
    }

    return {
      name,
      op,
      startTimestamp,
      finish: (status = 'ok') => {
        const durationMs = Date.now() - startTimestamp;
        console.debug(`[SHAMIKH SENTRY NO-OP] Transaction "${name}" (${op}) — ${status} in ${durationMs}ms`);
      },
    };
  }

  /**
   * Add a breadcrumb navigation trail for the current request context.
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    if (this.sdk) {
      this.sdk.addBreadcrumb({ message, category, data, level: 'info', timestamp: Date.now() / 1000 });
    }
  }

  /**
   * Set the authenticated user context for all subsequent captures.
   */
  setUser(phone: string, role: string): void {
    if (this.sdk) {
      this.sdk.setUser({ id: phone, role });
    }
  }

  /**
   * Flush all pending error reports before edge function termination.
   */
  async flush(timeoutMs = 2000): Promise<void> {
    if (this.sdk) {
      await this.sdk.flush(timeoutMs).catch(() => null);
    }
  }

  get configured(): boolean {
    return this.isConfigured;
  }
}

export const sentry = new ShamakhSentry();

/**
 * HOF: Wrap any async API handler with automatic Sentry error capture + performance tracing.
 */
export function withSentryHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  operationName: string
): T {
  return (async (...args: Parameters<T>) => {
    const txn = sentry.startTransaction(operationName, 'http.server');
    try {
      const result = await handler(...args);
      txn.finish('ok');
      return result;
    } catch (err) {
      sentry.captureError(err instanceof Error ? err : new Error(String(err)), {
        message: `Unhandled error in ${operationName}`,
        tags: { handler: operationName },
      });
      txn.finish('internal_error');
      throw err;
    }
  }) as T;
}
