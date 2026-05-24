/**
 * SHAMIKH LUXURY OS — AI Commerce Intelligence Engine
 * Predicts customer demand, dynamically adjusts pricing, and computes inventory warnings.
 */

// ─── AI Demand Forecasting ───────────────────────────────────────────────────

/**
 * Predicts product demand score and trend velocity based on storefront interaction metrics.
 */
export function predictProductDemand(
  views: number,
  purchaseCount: number,
  recentVelocity: number
): {
  demandScore: number;
  trend: 'rising' | 'stable' | 'dropping';
  confidence: number;
} {
  const conversionRate = views > 0 ? purchaseCount / views : 0;
  const demandScore = Math.min(
    Math.round(conversionRate * 100 * 2.5 + recentVelocity * 10),
    100
  );

  let trend: 'rising' | 'stable' | 'dropping' = 'stable';
  if (recentVelocity > 5 || conversionRate > 0.15) {
    trend = 'rising';
  } else if (recentVelocity === 0 && views < 10) {
    trend = 'dropping';
  }

  const confidence = views > 50 ? 0.9 : views > 10 ? 0.7 : 0.4;

  return {
    demandScore,
    trend,
    confidence,
  };
}

// ─── AI Inventory Depletion Warning ───────────────────────────────────────────

/**
 * Computes how many days of inventory remain before running out based on average daily velocity.
 */
export function evaluateInventoryDepletion(
  stockQty: number,
  avgSalesPerDay: number
): {
  daysRemaining: number;
  alertLevel: 'critical' | 'warn' | 'healthy';
  message: string;
} {
  if (stockQty <= 0) {
    return { daysRemaining: 0, alertLevel: 'critical', message: 'نفدت الكمية تماماً' };
  }

  if (avgSalesPerDay <= 0) {
    return { daysRemaining: 999, alertLevel: 'healthy', message: 'مخزون مستقر (لا توجد مبيعات نشطة)' };
  }

  const daysRemaining = Math.round(stockQty / avgSalesPerDay);

  let alertLevel: 'critical' | 'warn' | 'healthy' = 'healthy';
  let message = 'مخزون مستقر وآمن';

  if (daysRemaining <= 3) {
    alertLevel = 'critical';
    message = `تنبيه حرج: المخزون يوشك على النفاد خلال ${daysRemaining} أيام!`;
  } else if (daysRemaining <= 7) {
    alertLevel = 'warn';
    message = `تنبيه: يوصى بطلب كميات إضافية، المخزون يكفي لـ ${daysRemaining} أيام فقط.`;
  }

  return {
    daysRemaining,
    alertLevel,
    message,
  };
}

// ─── AI Dynamic Pricing Optimization ──────────────────────────────────────────

/**
 * Dynamically computes optimal pricing margins based on product demand and supplier stock availability.
 */
export function calculateOptimalLuxuryPrice(
  baseCost: number,
  popularityScore: number,
  supplierStock: number
): {
  optimalPrice: number;
  marginPercent: number;
  markupApplied: number;
} {
  let markupMultiplier = 1.35; // Default 35% margin for luxury positioning

  // If popularity score is extremely high, adjust margin up by 15%
  if (popularityScore > 80) {
    markupMultiplier += 0.15;
  } else if (popularityScore > 50) {
    markupMultiplier += 0.05;
  }

  // If supplier stock is low, scarcity premium applies (+10%)
  if (supplierStock > 0 && supplierStock < 10) {
    markupMultiplier += 0.10;
  }

  const optimalPrice = Math.round(baseCost * markupMultiplier);
  const marginPercent = Math.round(((optimalPrice - baseCost) / optimalPrice) * 100);

  return {
    optimalPrice,
    marginPercent,
    markupApplied: Math.round(optimalPrice - baseCost),
  };
}
