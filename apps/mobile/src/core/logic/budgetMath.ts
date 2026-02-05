/**
 * Budget Math Logic (B1-B10)
 */

import { Budget, BudgetSpend, BudgetMetrics } from '../types';

/**
 * (B1) S_c(t): Sum of spends in period
 */
export function calculateSpent(spends: BudgetSpend[]): number {
    return spends.reduce((sum, s) => sum + s.amount, 0);
}

/**
 * (B4) Burn Rate v_c(t) = S_c(t) / d
 */
export function calculateBurnRate(spent: number, daysPassed: number): number {
    const d = Math.max(1, daysPassed);
    return spent / d;
}

/**
 * (B5) Forecast F_c = v_c * T
 * (B6) Forecast Remaining R^_c = L_c - F_c
 */
export function calculateForecast(burnRate: number, totalDaysInPeriod: number): number {
    return burnRate * totalDaysInPeriod;
}

/**
 * (B7) Risk Score RS_c = clamp((F_c - L_c)/L_c, 0, 1)
 */
export function calculateRiskScore(forecast: number, limit: number): number {
    if (limit === 0) return 1;
    const raw = (forecast - limit) / limit; // deviation percentage
    return Math.max(0, Math.min(1, raw));
}

/**
 * (B8) Days to Breach N = ceil((L_c - S_c)/v_c)
 * Returns Infinity if no breach expected
 */
export function calculateDaysToBreach(limit: number, spent: number, burnRate: number): number {
    if (burnRate <= 0) return Infinity;
    const remainingMoney = limit - spent;
    if (remainingMoney <= 0) return 0; // Already breached
    return Math.ceil(remainingMoney / burnRate);
}

/**
 * Full Metrics Calculation
 */
export function calculateBudgetMetrics(
    budget: Budget,
    spends: BudgetSpend[],
    periodTotalDays: number,
    daysPassed: number
): BudgetMetrics {
    const spent = calculateSpent(spends);
    const limit = budget.limit;

    // (B2)
    const percent = limit > 0 ? spent / limit : 0;

    // (B3)
    const remaining = limit - spent;

    // (B4)
    const burnRate = calculateBurnRate(spent, daysPassed);

    // (B5)
    const forecast = calculateForecast(burnRate, periodTotalDays);

    // (B6)
    const forecastRemaining = limit - forecast;

    // (B7)
    const riskScore = calculateRiskScore(forecast, limit);

    // (B8)
    const daysToBreach = calculateDaysToBreach(limit, spent, burnRate);

    // Derived Risk Bool
    // We consider it "At Risk" if Risk Score > 0 (Forecast > Limit) OR current percent > warning threshold
    const isRisk = riskScore > 0 || percent >= (budget.thresholds.danger || 0.9);

    return {
        spent,
        remaining,
        percent,
        burnRate,
        forecast,
        forecastRemaining,
        riskScore,
        daysToBreach,
        isRisk
    };
}

/**
 * (B9) EWMA Recommendation
 * μ_c(t) = α * S_c(t) + (1 - α) * μ_c(t-1)
 * α = 0.3
 */
export function calculateEWMA(history: number[], alpha: number = 0.3): number {
    if (history.length === 0) return 0;
    let ewma = history[0]; // Initialize with first value
    for (let i = 1; i < history.length; i++) {
        ewma = alpha * history[i] + (1 - alpha) * ewma;
    }
    return ewma;
}

/**
 * (B10) Volatility "Safe" Limit helper
 * σ_c = std(S_c)
 */
export function calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Calculate Recommended and Safe limits based on history (B9, B10)
 * history: Array of total spending in previous periods [S_oldest, ..., S_newest]
 */
export function calculateRecommendedLimits(history: number[]): { recommended: number; safe: number } {
    if (history.length === 0) return { recommended: 0, safe: 0 };

    const mu_c = calculateEWMA(history, 0.3); // alpha = 0.3 per spec
    const sigma_c = calculateStandardDeviation(history);

    // B9: L_rec = μ_c * (1 + m), m = 0.10
    const recommended = Math.ceil(mu_c * 1.10);

    // B10: L_safe = μ_c + k * σ_c, k = 0.5
    const safe = Math.ceil(mu_c + 0.5 * sigma_c);

    return { recommended, safe };
}
