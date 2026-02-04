/**
 * Scientific Math for Budgets Module
 * Implements formulas B1-B11 for forecasting and risk analysis.
 */

// --- Constants & Types ---

export type DailySpend = {
    day: number; // 1..T
    amount: number;
};

export type BudgetHistory = {
    periods: number[][]; // Array of arrays, where each inner array is daily spends for a period
};

export type ForecastResult = {
    forecast: number;
    ciLower: number;
    ciUpper: number;
    sigmaF: number;
};

export const Z_80 = 1.28;
export const Z_95 = 1.96;
export const DEFAULT_ALPHA = 0.30;

// --- Helper: Normal CDF Approximation (for Pr(Overrun)) ---
// Using error function approximation
function erf(x: number): number {
    // save the sign of x
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    // constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function normalCDF(x: number, mean: number, std: number): number {
    if (std === 0) return x >= mean ? 1 : 0;
    return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))));
}

// --- B1: Cumulative Spend ---
export function calculateCumulativeSpend(dailySpends: DailySpend[], currentDay: number): number {
    return dailySpends
        .filter(d => d.day <= currentDay)
        .reduce((sum, d) => sum + d.amount, 0);
}

// --- B2: Remaining ---
export function calculateRemaining(limit: number, currentSpend: number): number {
    return limit - currentSpend;
}

// --- B3: Utilization ---
export function calculateUtilization(limit: number, currentSpend: number): number {
    return currentSpend / Math.max(limit, 1);
}

// --- B4: Average Daily Burn Rate ---
export function calculateBurnRate(currentSpend: number, currentDay: number): number {
    if (currentDay <= 0) return 0;
    return currentSpend / currentDay;
}

// --- B5: Linear Forecast ---
export function calculateLinearForecast(burnRate: number, totalDays: number): number {
    return burnRate * totalDays;
}

// --- B6: EWMA Forecast ---
// v_ewma,c(n) = α·y_c(n) + (1−α)·v_ewma,c(n−1)
export function calculateEVMA(
    dailySpends: DailySpend[],
    alpha: number = DEFAULT_ALPHA,
    currentDay: number
): number {
    // Sort spends by day to ensure order
    const sortedSpends = [...dailySpends].sort((a, b) => a.day - b.day);

    let ewma = 0;
    // Initialize with first day's spend if available, or just start iterating
    // We assume v_ewma(0) = 0 or first spend. Let's start iterating from day 1.

    // Find max day to iterate up to
    for (let d = 1; d <= currentDay; d++) {
        const spendEntry = sortedSpends.find(s => s.day === d);
        const amount = spendEntry ? spendEntry.amount : 0;

        if (d === 1) {
            ewma = amount; // Initialization
        } else {
            ewma = alpha * amount + (1 - alpha) * ewma;
        }
    }
    return ewma;
}

export function calculateForecastEWMA(
    currentSpend: number,
    ewmaRate: number,
    totalDays: number,
    currentDay: number
): number {
    return currentSpend + ewmaRate * (totalDays - currentDay);
}

// --- B7: Uncertainty (History) ---
export function calculateUncertaintyParams(history: BudgetHistory): { meanDay: number; stdDay: number } {
    // Flatten all periods to get strict daily variance? 
    // "Compute daily mean and std from historical periods" implies pooling all daily values.
    const allDailySpends: number[] = [];
    history.periods.forEach(periodSpends => {
        allDailySpends.push(...periodSpends);
    });

    if (allDailySpends.length === 0) return { meanDay: 0, stdDay: 0 };

    const n = allDailySpends.length;
    const mean = allDailySpends.reduce((a, b) => a + b, 0) / n;
    const variance = allDailySpends.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n; // or n-1 for sample
    const std = Math.sqrt(variance);

    return { meanDay: mean, stdDay: std };
}

export function calculateConfidenceInterval(
    forecast: number,
    stdDay: number,
    totalDays: number,
    zScore: number
): { lower: number; upper: number; sigmaF: number } {
    const sigmaF = stdDay * Math.sqrt(totalDays);
    return {
        lower: forecast - zScore * sigmaF,
        upper: forecast + zScore * sigmaF,
        sigmaF
    };
}

// --- B8: Probability of Overrun ---
export function calculateProbOverrun(forecast: number, limit: number, sigmaF: number): number {
    // Pr(F > L) = 1 - CDF(L; mean=F, std=sigmaF)
    const epsilon = 0.0001;
    return 1 - normalCDF(limit, forecast, Math.max(sigmaF, epsilon));
}

// --- B9: Expected Day of Overrun ---
export function calculateExpectedOverrunDay(
    limit: number,
    currentSpend: number,
    burnRate: number,
    currentDay: number
): number | null {
    if (burnRate <= 0) return null; // Infinity
    const remaining = limit - currentSpend;
    const daysWait = Math.ceil(remaining / burnRate);
    // It says "N_over = ceil( (L - S) / v )" -- this is days remaining. 
    // The spec says "Expected day of overrun", which might be absolute Day Index.
    // Assuming the formula means relative days from now, or absolute?
    // "N_over = ceil( (L_c − S_c(n)) / v̄_c(n) )" -> This results in "Days Remaining until overrun".
    // If we want the Day Index, we add currentDay. 
    // Let's return the absolute day index estimate.
    return currentDay + daysWait;
}

// --- B10: Anomaly Detection ---
export function calculateAnomalyScore(
    todaySpend: number,
    meanDay: number,
    stdDay: number
): number {
    const epsilon = 0.0001;
    return (todaySpend - meanDay) / Math.max(stdDay, epsilon);
}

// --- B11: Recommended Limit ---
export function calculateRecommendedLimit(history: BudgetHistory, k: number = 0.5): number {
    const periodTotals = history.periods.map(p => p.reduce((a, b) => a + b, 0));
    if (periodTotals.length === 0) return 0;

    const n = periodTotals.length;
    const mean = periodTotals.reduce((a, b) => a + b, 0) / n;
    const variance = periodTotals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return mean + k * std;
}
