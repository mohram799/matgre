/**
 * SHAMIKH LUXURY OS — Stateful Circuit Breaker & Resilience Engine
 * Prevents cascading failures by isolating broken external dependencies.
 * Supported states: CLOSED, OPEN, HALF_OPEN
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Maximum number of failures before opening the circuit */
  failureThreshold: number;
  /** Cooldown time in milliseconds before testing recovery (transition to HALF_OPEN) */
  cooldownMs: number;
  /** Minimum number of request executions to evaluate failure rate */
  minimumRequests: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      cooldownMs: config.cooldownMs ?? 15000,
      minimumRequests: config.minimumRequests ?? 3,
    };
  }

  /**
   * Execute an asynchronous action protected by the circuit breaker.
   */
  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    this.checkCooldown();

    if (this.state === 'OPEN') {
      console.warn(`[SHAMIKH RESILIENCE] Circuit "${this.name}" is OPEN. Executing fallback.`);
      return fallback();
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err: any) {
      this.recordFailure(err);
      return fallback();
    }
  }

  private checkCooldown(): void {
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.config.cooldownMs) {
      this.state = 'HALF_OPEN';
      this.failureCount = 0;
      this.successCount = 0;
      this.totalRequests = 0;
      console.info(`[SHAMIKH RESILIENCE] Circuit "${this.name}" cooldown expired. Transitioned to HALF_OPEN.`);
    }
  }

  private recordSuccess(): void {
    this.totalRequests++;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // If we succeed consecutively in HALF_OPEN, close the circuit
      if (this.successCount >= this.config.minimumRequests) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        console.info(`[SHAMIKH RESILIENCE] Circuit "${this.name}" healed successfully. Transitioned to CLOSED.`);
      }
    }
  }

  private recordFailure(error: Error): void {
    this.totalRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    console.error(`[SHAMIKH RESILIENCE] Circuit "${this.name}" caught execution failure:`, error.message);

    if (this.state === 'CLOSED') {
      if (this.totalRequests >= this.config.minimumRequests && this.failureCount >= this.config.failureThreshold) {
        this.state = 'OPEN';
        console.error(`[SHAMIKH RESILIENCE] Circuit "${this.name}" failure threshold reached. Tripped to OPEN.`);
      }
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in HALF_OPEN trips it back to OPEN instantly
      this.state = 'OPEN';
      console.error(`[SHAMIKH RESILIENCE] Circuit "${this.name}" failed during recovery. Tripped back to OPEN.`);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getName(): string {
    return this.name;
  }
}

// ─── Global Circuit Breaker Registry ─────────────────────────────────────────

class CircuitRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.breakers.set(name, breaker);
    }
    return breaker;
  }

  getAllStatus(): Record<string, CircuitState> {
    const status: Record<string, CircuitState> = {};
    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getState();
    });
    return status;
  }
}

export const circuitRegistry = new CircuitRegistry();
