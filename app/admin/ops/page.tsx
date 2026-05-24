'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
type OverallHealth = 'healthy' | 'degraded' | 'critical';

interface OpsStatus {
  timestamp: string;
  overallHealth: OverallHealth;
  circuitBreakers: {
    all: Record<string, CircuitState>;
    open: string[];
    halfOpen: string[];
  };
  environment: {
    checks: Record<string, boolean>;
    configured: number;
    total: number;
    readiness: string;
  };
  platform: {
    runtime: string;
    region: string;
    nodeEnv: string;
    version: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 10_000;

const HEALTH_CONFIG: Record<OverallHealth, { color: string; bg: string; glow: string; label: string; icon: string }> = {
  healthy:  { color: '#10ffb4', bg: 'rgba(16,255,180,0.08)', glow: '0 0 24px rgba(16,255,180,0.35)', label: 'Fully Operational', icon: '✦' },
  degraded: { color: '#ffcc00', bg: 'rgba(255,204,0,0.08)',  glow: '0 0 24px rgba(255,204,0,0.35)',  label: 'Degraded',         icon: '⚠' },
  critical: { color: '#ff4b6e', bg: 'rgba(255,75,110,0.08)', glow: '0 0 24px rgba(255,75,110,0.35)', label: 'Critical',          icon: '✕' },
};

const CIRCUIT_CONFIG: Record<CircuitState, { color: string; bg: string; label: string; dot: string }> = {
  CLOSED:    { color: '#10ffb4', bg: 'rgba(16,255,180,0.12)',  label: 'CLOSED',    dot: '#10ffb4' },
  HALF_OPEN: { color: '#ffcc00', bg: 'rgba(255,204,0,0.12)',   label: 'HALF-OPEN', dot: '#ffcc00' },
  OPEN:      { color: '#ff4b6e', bg: 'rgba(255,75,110,0.12)',  label: 'OPEN',      dot: '#ff4b6e' },
};

const SERVICE_LABELS: Record<string, string> = {
  stripe:      'Stripe Payments',
  supabase:    'Supabase DB',
  aliexpress:  'AliExpress Supplier',
  openai:      'OpenAI GPT',
  resend:      'Resend Email',
  redis:       'Redis Cache',
  meilisearch: 'Meilisearch',
};

const ENV_LABELS: Record<string, string> = {
  supabase:    'Supabase',
  stripe:      'Stripe',
  openai:      'OpenAI',
  redis:       'Redis / Upstash',
  resend:      'Resend Email',
  meilisearch: 'Meilisearch',
  sentry:      'Sentry DSN',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OpsPage() {
  const [status, setStatus] = useState<OpsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ops/status', {
        headers: { 'x-admin-secret': '' }, // In prod, inject from session
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OpsStatus = await res.json();
      setStatus(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const health = status ? HEALTH_CONFIG[status.overallHealth] : HEALTH_CONFIG.healthy;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>⚜</span>
          <div>
            <h1 style={styles.h1}>SHAMIKH OPS CENTER</h1>
            <p style={styles.subtitle}>Platform Observability & Resilience Dashboard</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={fetchStatus} style={styles.refreshBtn} id="ops-refresh-btn">
            ↻ Refresh
          </button>
          {lastRefresh && (
            <p style={styles.lastRefresh}>
              Updated: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      {loading && !status ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner} />
          <p style={{ color: '#666', marginTop: 16 }}>Fetching platform status...</p>
        </div>
      ) : error ? (
        <div style={styles.errorBanner}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <span>Unable to reach ops endpoint: {error}</span>
        </div>
      ) : status ? (
        <main style={styles.main}>

          {/* Overall Health Banner */}
          <section style={{ ...styles.healthBanner, background: health.bg, boxShadow: health.glow }}>
            <span style={{ ...styles.healthIcon, color: health.color }}>{health.icon}</span>
            <div>
              <p style={{ ...styles.healthLabel, color: health.color }}>{health.label.toUpperCase()}</p>
              <p style={styles.healthMeta}>
                {status.circuitBreakers.open.length === 0
                  ? 'All circuits operational — no service disruptions detected.'
                  : `${status.circuitBreakers.open.length} circuit(s) OPEN: ${status.circuitBreakers.open.join(', ')}`}
              </p>
            </div>
            <div style={styles.healthTimestamp}>
              {new Date(status.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </section>

          {/* Grid */}
          <div style={styles.grid}>

            {/* Circuit Breakers */}
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>
                <span style={styles.cardIcon}>◈</span> Circuit Breakers
                <span style={styles.livePill}>LIVE</span>
              </h2>
              <div style={styles.circuitList}>
                {Object.entries(status.circuitBreakers.all).map(([name, state]) => {
                  const cfg = CIRCUIT_CONFIG[state as CircuitState];
                  return (
                    <div key={name} style={{ ...styles.circuitRow, background: cfg.bg }} id={`circuit-${name}`}>
                      <div style={styles.circuitLeft}>
                        <span style={{ ...styles.circuitDot, background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}` }} />
                        <span style={styles.circuitName}>{SERVICE_LABELS[name] ?? name}</span>
                      </div>
                      <span style={{ ...styles.circuitBadge, color: cfg.color, borderColor: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Environment Readiness */}
            <section style={styles.card}>
              <h2 style={styles.cardTitle}>
                <span style={styles.cardIcon}>◇</span> Environment Readiness
                <span style={styles.readinessPill}>{status.environment.readiness}</span>
              </h2>
              <div style={styles.circuitList}>
                {Object.entries(status.environment.checks).map(([key, configured]) => (
                  <div key={key} style={{ ...styles.circuitRow, background: configured ? 'rgba(16,255,180,0.05)' : 'rgba(255,75,110,0.05)' }} id={`env-${key}`}>
                    <div style={styles.circuitLeft}>
                      <span style={{
                        ...styles.circuitDot,
                        background: configured ? '#10ffb4' : '#ff4b6e',
                        boxShadow: `0 0 8px ${configured ? '#10ffb4' : '#ff4b6e'}`,
                      }} />
                      <span style={styles.circuitName}>{ENV_LABELS[key] ?? key}</span>
                    </div>
                    <span style={{
                      ...styles.circuitBadge,
                      color:       configured ? '#10ffb4' : '#ff4b6e',
                      borderColor: configured ? '#10ffb4' : '#ff4b6e',
                    }}>
                      {configured ? 'CONFIGURED' : 'MISSING'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Platform Info */}
            <section style={{ ...styles.card, ...styles.cardWide }}>
              <h2 style={styles.cardTitle}>
                <span style={styles.cardIcon}>◉</span> Platform Metadata
              </h2>
              <div style={styles.metaGrid}>
                {[
                  { label: 'Runtime',    value: status.platform.runtime },
                  { label: 'Region',     value: status.platform.region },
                  { label: 'Node Env',   value: status.platform.nodeEnv },
                  { label: 'Version',    value: status.platform.version },
                  { label: 'Circuits',   value: `${Object.keys(status.circuitBreakers.all).length} registered` },
                  { label: 'Open',       value: status.circuitBreakers.open.length.toString() },
                  { label: 'Half-Open',  value: status.circuitBreakers.halfOpen.length.toString() },
                  { label: 'Poll Rate',  value: `${POLL_INTERVAL_MS / 1000}s` },
                ].map(({ label, value }) => (
                  <div key={label} style={styles.metaItem}>
                    <p style={styles.metaLabel}>{label}</p>
                    <p style={styles.metaValue}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      ) : null}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#080810',
    color: '#e0e0e0',
    fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    padding: '0 0 80px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '28px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.015)',
    backdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 32,
    color: '#c9a96e',
    textShadow: '0 0 20px rgba(201,169,110,0.5)',
  },
  h1: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#f0f0f0',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: 12,
    color: '#666',
    letterSpacing: '0.06em',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  refreshBtn: {
    background: 'rgba(201,169,110,0.12)',
    border: '1px solid rgba(201,169,110,0.3)',
    color: '#c9a96e',
    padding: '8px 20px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
  },
  lastRefresh: {
    margin: 0,
    fontSize: 11,
    color: '#444',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(201,169,110,0.2)',
    borderTop: '3px solid #c9a96e',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBanner: {
    margin: 40,
    padding: '20px 28px',
    background: 'rgba(255,75,110,0.1)',
    border: '1px solid rgba(255,75,110,0.3)',
    borderRadius: 12,
    color: '#ff4b6e',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 14,
  },
  main: {
    padding: '32px 40px',
    maxWidth: 1400,
    margin: '0 auto',
  },
  healthBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    padding: '24px 32px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 32,
    position: 'relative',
  },
  healthIcon: {
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1,
  },
  healthLabel: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.1em',
  },
  healthMeta: {
    margin: '4px 0 0',
    fontSize: 13,
    color: '#777',
  },
  healthTimestamp: {
    marginLeft: 'auto',
    fontSize: 28,
    fontWeight: 200,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: '0.05em',
    fontVariantNumeric: 'tabular-nums',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 24,
  },
  card: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '24px 28px',
  },
  cardWide: {
    gridColumn: '1 / -1',
  },
  cardTitle: {
    margin: '0 0 20px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: '#888',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    color: '#c9a96e',
    fontSize: 14,
  },
  livePill: {
    marginLeft: 'auto',
    background: 'rgba(16,255,180,0.12)',
    color: '#10ffb4',
    border: '1px solid rgba(16,255,180,0.25)',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 10,
    letterSpacing: '0.1em',
    fontWeight: 700,
  },
  readinessPill: {
    marginLeft: 'auto',
    background: 'rgba(201,169,110,0.12)',
    color: '#c9a96e',
    border: '1px solid rgba(201,169,110,0.25)',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 11,
    letterSpacing: '0.05em',
    fontWeight: 700,
  },
  circuitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  circuitRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.04)',
    transition: 'all 0.2s',
  },
  circuitLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  circuitDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  circuitName: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: 500,
  },
  circuitBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    border: '1px solid',
    borderRadius: 6,
    padding: '3px 10px',
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
  },
  metaItem: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '14px 16px',
  },
  metaLabel: {
    margin: '0 0 6px',
    fontSize: 11,
    color: '#555',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  metaValue: {
    margin: 0,
    fontSize: 15,
    color: '#e0e0e0',
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
};
