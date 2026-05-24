/**
 * SHAMIKH LUXURY OS — Dynamic Pricing & Exchange Rate Engine
 * Calculates base pricing, dropshipping markup ratios, VIP discounts, 
 * luxury service fees, and real-time exchange rates (SAR, USD, AED, GBP, EUR).
 */

export interface CurrencyDetails {
  code: string;
  symbol: string;
  symbolAr: string;
  rateToBase: number; // Multiplier to convert base (SAR) to this currency
}

export const CURRENCIES: Record<string, CurrencyDetails> = {
  SAR: { code: 'SAR', symbol: 'SR', symbolAr: 'ر.س', rateToBase: 1.0 },
  USD: { code: 'USD', symbol: '$', symbolAr: 'دولار', rateToBase: 0.27 },
  AED: { code: 'AED', symbol: 'AED', symbolAr: 'د.إ', rateToBase: 0.98 },
  GBP: { code: 'GBP', symbol: '£', symbolAr: 'جنيه استرليني', rateToBase: 0.21 },
  EUR: { code: 'EUR', symbol: '€', symbolAr: 'يورو', rateToBase: 0.25 },
};

const VIP_DISCOUNTS: Record<string, number> = {
  guest: 0,
  bronze: 0.05,  // 5%
  silver: 0.12,  // 12%
  gold: 0.20,    // 20%
  diamond: 0.30, // 30%
};

/**
 * Calculates a premium luxury price from original dropshipping costs.
 * Formula: Price = (Cost * (1 + Margin%)) + Luxury Fixed Fee
 * Includes elegant luxury rounding logic.
 */
export function calculateLuxuryPrice(
  costPrice: number,
  marginPercent = 120, // Default 120% markup for luxury positioning
  fixedFee = 450       // Default fixed premium service fee in SAR
): number {
  const markupAmount = costPrice * (marginPercent / 100);
  const rawPrice = costPrice + markupAmount + fixedFee;
  
  // Luxury rounding: Round up to the nearest elegant 5 or 9
  const roundedUp = Math.ceil(rawPrice);
  const lastDigit = roundedUp % 10;
  
  if (lastDigit < 5) {
    return roundedUp - lastDigit + 5; // End in 5
  } else if (lastDigit > 5 && lastDigit < 9) {
    return roundedUp - lastDigit + 9; // End in 9
  }
  return roundedUp;
}

/**
 * Apply permanent VIP discount to an elegant price.
 */
export function applyVipDiscount(
  price: number,
  vipTier = 'guest'
): { original: number; discounted: number; savings: number; discountPercent: number } {
  const discountPct = VIP_DISCOUNTS[vipTier.toLowerCase()] ?? 0;
  const savings = Math.round(price * discountPct);
  const discounted = price - savings;
  
  return {
    original: price,
    discounted,
    savings,
    discountPercent: discountPct * 100,
  };
}

/**
 * Convert a base SAR amount to foreign currency with elegant formatting.
 */
export function convertCurrency(
  amountSar: number,
  targetCurrency = 'SAR'
): { amount: number; formatted: string; formattedAr: string; code: string } {
  const cur = CURRENCIES[targetCurrency.toUpperCase()] ?? CURRENCIES.SAR;
  const converted = amountSar * cur.rateToBase;
  const rounded = Number(converted.toFixed(2));
  
  return {
    amount: rounded,
    formatted: `${cur.symbol} ${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    formattedAr: `${rounded.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur.symbolAr}`,
    code: cur.code,
  };
}
