/**
 * SHAMIKH LUXURY OS — Enterprise Service Registry
 * Central registry of all circuit-breaker-protected external dependencies.
 * Pre-tuned configs reflect real-world SLA characteristics of each service.
 *
 * Usage:
 *   import { services } from '@/lib/service-registry';
 *   const result = await services.stripe.execute(() => stripe.charges.create(...), () => mockFallback());
 */

import { circuitRegistry } from '@/lib/circuit-breaker';

/**
 * Service identifiers — used as named keys in the circuit registry.
 */
export const SERVICE = {
  STRIPE:     'stripe',
  SUPABASE:   'supabase',
  ALIEXPRESS: 'aliexpress',
  OPENAI:     'openai',
  RESEND:     'resend',
  REDIS:      'redis',
  MEILISEARCH:'meilisearch',
} as const;

export type ServiceName = (typeof SERVICE)[keyof typeof SERVICE];

/**
 * Pre-tuned circuit breaker configs per service.
 *
 * Strategy rationale:
 *  - Stripe: low threshold, fast cooldown — payment failures are critical.
 *  - Supabase: lenient — it's the primary DB; wait longer before opening.
 *  - AliExpress: very lenient — external scraping is inherently flaky.
 *  - OpenAI: moderate — degrade to heuristic fallback quickly.
 *  - Resend: lenient — emails are async best-effort.
 *  - Redis: aggressive — fast cache layer should be ultra-available.
 *  - Meilisearch: moderate — fall back to Supabase full-text if unavailable.
 */
const SERVICE_CONFIGS: Record<ServiceName, { failureThreshold: number; cooldownMs: number; minimumRequests: number }> = {
  [SERVICE.STRIPE]: {
    failureThreshold: 3,
    cooldownMs: 10_000,
    minimumRequests: 2,
  },
  [SERVICE.SUPABASE]: {
    failureThreshold: 8,
    cooldownMs: 30_000,
    minimumRequests: 5,
  },
  [SERVICE.ALIEXPRESS]: {
    failureThreshold: 5,
    cooldownMs: 20_000,
    minimumRequests: 3,
  },
  [SERVICE.OPENAI]: {
    failureThreshold: 4,
    cooldownMs: 15_000,
    minimumRequests: 2,
  },
  [SERVICE.RESEND]: {
    failureThreshold: 6,
    cooldownMs: 30_000,
    minimumRequests: 3,
  },
  [SERVICE.REDIS]: {
    failureThreshold: 3,
    cooldownMs: 8_000,
    minimumRequests: 2,
  },
  [SERVICE.MEILISEARCH]: {
    failureThreshold: 5,
    cooldownMs: 20_000,
    minimumRequests: 3,
  },
};

/**
 * Initialize all circuit breakers eagerly so they appear in telemetry
 * even before their first real call.
 */
function bootstrap(): void {
  (Object.entries(SERVICE_CONFIGS) as [ServiceName, typeof SERVICE_CONFIGS[ServiceName]][]).forEach(
    ([name, config]) => {
      circuitRegistry.getOrCreate(name, config);
    }
  );
}

bootstrap();

/**
 * Convenience accessor — returns the circuit breaker for a given service.
 * Guarantees the pre-tuned config is always applied.
 */
export const services = {
  stripe:      circuitRegistry.getOrCreate(SERVICE.STRIPE,      SERVICE_CONFIGS[SERVICE.STRIPE]),
  supabase:    circuitRegistry.getOrCreate(SERVICE.SUPABASE,    SERVICE_CONFIGS[SERVICE.SUPABASE]),
  aliexpress:  circuitRegistry.getOrCreate(SERVICE.ALIEXPRESS,  SERVICE_CONFIGS[SERVICE.ALIEXPRESS]),
  openai:      circuitRegistry.getOrCreate(SERVICE.OPENAI,      SERVICE_CONFIGS[SERVICE.OPENAI]),
  resend:      circuitRegistry.getOrCreate(SERVICE.RESEND,      SERVICE_CONFIGS[SERVICE.RESEND]),
  redis:       circuitRegistry.getOrCreate(SERVICE.REDIS,       SERVICE_CONFIGS[SERVICE.REDIS]),
  meilisearch: circuitRegistry.getOrCreate(SERVICE.MEILISEARCH, SERVICE_CONFIGS[SERVICE.MEILISEARCH]),
} as const;
