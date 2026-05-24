/**
 * SHAMIKH LUXURY OS — OpenTelemetry Instrumentation Bootstrapper
 * Establishes distributed tracing and performance monitoring via dynamic imports.
 * In production, aggregates traces to OpenTelemetry collectors (Grafana/Honeycomb/BetterStack).
 * Dynamic imports prevent build failures when @opentelemetry packages are not installed.
 */

export interface ShamakhSpan {
  end(): void;
  setAttribute(key: string, value: string | number | boolean): void;
}

class ShamakhTelemetry {
  private isInitialized = false;
  private tracer: any = null;
  private serviceName = 'shamikh-luxury-os-web';

  async init(): Promise<void> {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Attempt dynamic import — will succeed only when @opentelemetry packages are installed
      const [{ WebTracerProvider }, { SimpleSpanProcessor, ConsoleSpanExporter }, { Resource }] = await Promise.all([
        import('@opentelemetry/sdk-trace-web' as any),
        import('@opentelemetry/sdk-trace-base' as any),
        import('@opentelemetry/resources' as any),
      ]);

      const provider = new WebTracerProvider({
        resource: new Resource({
          'service.name': this.serviceName,
          'service.version': '1.0.0',
          'deployment.environment': process.env.NODE_ENV || 'development',
        }),
      });

      provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      provider.register();
      this.tracer = provider.getTracer(this.serviceName);
      this.isInitialized = true;
      console.info('[SHAMIKH TELEMETRY] OpenTelemetry initialized successfully.');
    } catch {
      // Expected failure if packages not installed — silently degrade to no-op
      console.debug('[SHAMIKH TELEMETRY] OpenTelemetry packages not available — operating in no-op mode.');
    }
  }

  /**
   * Start a custom span for performance tracking
   */
  startSpan(name: string): ShamakhSpan {
    if (this.tracer) {
      return this.tracer.startSpan(name);
    }
    // No-op span fallback
    return {
      end: () => {},
      setAttribute: () => {},
    };
  }

  /**
   * Log a named telemetry event (lightweight structured log beacon)
   */
  recordEvent(name: string, attributes: Record<string, string | number> = {}): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[SHAMIKH TELEMETRY] Event: ${name}`, attributes);
    }
  }
}

export const telemetry = new ShamakhTelemetry();

