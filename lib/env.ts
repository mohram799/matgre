/**
 * SHAMIKH LUXURY OS — Environment Validator
 * Validates all required environment variables at startup.
 * Provides type-safe access to env vars across the application.
 * Prevents cryptic runtime crashes from missing config.
 */

// ─── Environment Variable Definitions ────────────────────────────────────────

interface EnvSpec {
  key: string;
  required: boolean;
  secret?: boolean; // Mask in logs
  description: string;
  default?: string;
}

const ENV_SPEC: EnvSpec[] = [
  // Supabase
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project REST URL',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    secret: true,
    description: 'Supabase anonymous public key',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    secret: true,
    description: 'Supabase service role key (admin-level DB access)',
  },
  // Auth
  {
    key: 'SESSION_SECRET',
    required: true,
    secret: true,
    description: 'JWT signing secret (min 32 chars)',
    default: 'shamikh_luxury_super_secret_session_key_2026_change_in_production',
  },
  // Admin
  {
    key: 'NEXT_PUBLIC_ADMIN_PHONE',
    required: false,
    description: 'Admin login phone number',
  },
  {
    key: 'ADMIN_PASSWORD',
    required: false,
    secret: true,
    description: 'Admin login password (plain in dev; use hash in prod)',
  },
  // Stripe
  {
    key: 'STRIPE_SECRET_KEY',
    required: false,
    secret: true,
    description: 'Stripe secret key for payment intents',
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    secret: true,
    description: 'Stripe webhook signature secret',
  },
  // Email
  {
    key: 'RESEND_API_KEY',
    required: false,
    secret: true,
    description: 'Resend API key for transactional emails',
  },
  {
    key: 'FROM_EMAIL',
    required: false,
    description: 'Sender email for transactional emails',
    default: 'noreply@shamikh-luxury.com',
  },
  // App
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    required: false,
    description: 'Public site URL for links in emails',
    default: 'http://localhost:3000',
  },
  // Security
  {
    key: 'INTERNAL_API_KEY',
    required: false,
    secret: true,
    description: 'Internal API key for worker-to-API calls',
  },
  // Observability
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    secret: false,
    description: 'Sentry DSN for error tracking',
  },
];

// ─── Validation Result ────────────────────────────────────────────────────────

interface ValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  summary: string;
}

/**
 * Validate all environment variables against the spec.
 * Call once at startup to surface configuration issues early.
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const spec of ENV_SPEC) {
    const value = process.env[spec.key] ?? spec.default;

    if (!value) {
      if (spec.required) {
        missing.push(spec.key);
      } else {
        warnings.push(`${spec.key} not set — ${spec.description}`);
      }
    } else {
      // Apply defaults if value came from spec.default
      if (!process.env[spec.key] && spec.default) {
        process.env[spec.key] = spec.default;
      }
    }
  }

  // Special validation: SESSION_SECRET must be at least 32 chars
  const secret = process.env['SESSION_SECRET'];
  if (secret && secret.length < 32) {
    missing.push('SESSION_SECRET (must be ≥ 32 characters)');
  }

  const isValid = missing.length === 0;

  const summary = isValid
    ? `✅ Environment: All required variables set. ${warnings.length} optional missing.`
    : `❌ Environment: ${missing.length} required variables missing: ${missing.join(', ')}`;

  return { isValid, missing, warnings, summary };
}

// ─── Type-Safe Env Accessor ───────────────────────────────────────────────────

/**
 * Type-safe environment variable accessor.
 * Throws a descriptive error if a required variable is missing.
 */
export const env = {
  supabaseUrl: () => requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceKey: () => process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? null,
  sessionSecret: () => requireEnv('SESSION_SECRET'),
  stripeSecretKey: () => process.env['STRIPE_SECRET_KEY'] ?? null,
  stripeWebhookSecret: () => process.env['STRIPE_WEBHOOK_SECRET'] ?? null,
  resendApiKey: () => process.env['RESEND_API_KEY'] ?? null,
  fromEmail: () => process.env['FROM_EMAIL'] ?? 'noreply@shamikh-luxury.com',
  siteUrl: () => process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000',
  adminPhone: () => process.env['NEXT_PUBLIC_ADMIN_PHONE'] ?? null,
  adminPassword: () => process.env['ADMIN_PASSWORD'] ?? null,
  internalApiKey: () => process.env['INTERNAL_API_KEY'] ?? null,
  sentryDsn: () => process.env['NEXT_PUBLIC_SENTRY_DSN'] ?? null,
  isProduction: () => process.env['NODE_ENV'] === 'production',
  isDevelopment: () => process.env['NODE_ENV'] === 'development',
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[SHAMIKH ENV] Required environment variable "${key}" is not set. ` +
      `Please add it to your .env.local file.`
    );
  }
  return value;
}

// ─── Feature Flags ────────────────────────────────────────────────────────────

/**
 * Feature flag system — enables/disables features without code deploys.
 * In production, back this with a database table or LaunchDarkly.
 */
export const featureFlags = {
  stripePayments: () => Boolean(env.stripeSecretKey()),
  emailNotifications: () => Boolean(env.resendApiKey()),
  fraudDetection: () => process.env['ENABLE_FRAUD_DETECTION'] !== 'false',
  aiRecommendations: () => process.env['ENABLE_AI'] !== 'false',
  dropshippingSync: () => Boolean(process.env['ALIEXPRESS_API_KEY']),
  multiTenancy: () => process.env['ENABLE_MULTI_TENANCY'] === 'true',
  maintenanceMode: () => process.env['MAINTENANCE_MODE'] === 'true',
};

// ─── Startup Validation (runs when module is imported) ───────────────────────

if (typeof window === 'undefined') {
  // Only run on server side
  const result = validateEnvironment();
  if (!result.isValid) {
    console.error(result.summary);
    // In development: warn but don't crash (helps initial setup)
    // In production: would call process.exit(1)
  } else if (result.warnings.length > 0) {
    console.warn('[SHAMIKH ENV]', result.summary);
  } else {
    console.info('[SHAMIKH ENV] ✅ All environment variables validated successfully');
  }
}
