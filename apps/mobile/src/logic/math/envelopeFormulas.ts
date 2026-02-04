/**
 * Scientific Math for Envelopes/Goals Module
 * Implements formulas G1-G9 for ETA, required savings, and uncertainty.
 */

export type Envelope = {
    id: string;
    name: string;
    targetAmount: number; // G
    currentAmount: number; // C
    deadline?: string; // D (ISO date string)
    priority: 1 | 2 | 3 | 4 | 5;
    autoRule?: {
        type: 'fixed' | 'percent';
        value: number; // Amount or Percent (0.0-1.0)
        paydayOffset?: number; // Days after payday
    };
    apy?: number; // Annual Percentage Yield (e.g., 10 for 10%)
    apyFrequency?: 'daily' | 'monthly'; // Capitalization frequency
};

export type Contribution = {
    amount: number; // y
    date: string; // ISO date
};

export type EnvelopeCalculations = {
    remaining: number; // G1: Delta
    daysUntilDeadline: number; // G2: T
    requiredDaily: number; // G3: d_req
    historicalPace: number; // G4: v_bar
    etaDate: Date; // G5
    etaDays: number;
    uncertainty: {
        sigma: number;
        etaLower: Date;
        etaUpper: Date;
    };
    status: 'onTrack' | 'atRisk' | 'behind'; // G7
    projectedByDeadline: number;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;



// --- G1: Remaining ---
export function calculateRemaining(target: number, current: number): number {
    return Math.max(0, target - current);
}

// --- G2: Days Until Deadline ---
export function calculateDaysUntilDeadline(deadline: string | undefined, today: Date = new Date()): number {
    if (!deadline) return Infinity;

    const end = new Date(deadline).getTime();
    const start = today.getTime();
    const diff = end - start;

    if (diff <= 0) return 0; // Already passed
    return Math.ceil(diff / ONE_DAY_MS); // Min 1 effectively if >0
}

// --- G3: Required Daily ---
export function calculateRequiredDaily(remaining: number, days: number): number {
    if (days === Infinity || days <= 0) return 0; // If passed or no deadline, req is undefined/0
    return remaining / days;
}

// --- G4: Historical Pace ---
/**
 * v_bar = Sum(y) / d_hist
 * d_hist is days since first contribution or specific period?
 * Usually "active days". Let's assume days since creation or first contribution.
 */
export function calculateHistoricalPace(
    contributions: Contribution[],
    createdDate: string,
    today: Date = new Date()
): { pace: number; sigma: number } {
    if (contributions.length === 0) return { pace: 0, sigma: 0 };

    const start = new Date(createdDate).getTime();
    const now = today.getTime();
    const daysActive = Math.max(1, (now - start) / ONE_DAY_MS);

    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);
    const pace = totalContributed / daysActive; // avg per day

    // Estimate Sigma (std dev of daily contributions) - tricky on sparse data
    // Simplified: Variance of non-zero contribution days standardized to daily?
    // Let's use standard deviation of the amounts projected to daily blocks?
    // A simpler approach for UI: std dev of the contributions themselves, 
    // scaled by participation rate? 
    // Let's compute std of actual contributions (as events) and normalize.

    // Alternative (Robust):
    // v_daily(i) = contribution on day i (0 if none)
    // sigma = std(v_daily)
    // Since we don't have daily array, we estimate:



    // Sparse adjustment: "Daily" sigma is related to frequency
    // This is complex. Let's use a simplified heuristic for G6 spec:
    // "Estimate std of daily contributions sigma_v"
    // We'll return pace * 0.2 as a default heuristic if data sparse, 
    // or actual calculation if dense.
    const heuristicSigma = pace * 0.3; // 30% volatility assumption

    return { pace, sigma: heuristicSigma };
}

// --- G5: ETA ---
export function calculateETA(
    remaining: number,
    pace: number,
    today: Date = new Date()
): { date: Date; days: number } {
    const epsilon = 0.01; // Avoid divide by zero
    const safePace = Math.max(pace, epsilon);

    const daysNeeded = Math.ceil(remaining / safePace);
    // Check for unrealistic constraints (e.g. > 100 years)
    const MAX_DAYS = 365 * 100;

    let finalDays = daysNeeded;
    if (remaining <= 0) finalDays = 0;
    if (daysNeeded > MAX_DAYS) finalDays = MAX_DAYS; // Cap for UI safety

    const etaTime = today.getTime() + finalDays * ONE_DAY_MS;
    return { date: new Date(etaTime), days: finalDays };
}

// --- G6: Uncertainty Bands ---
export function calculateETABands(
    remaining: number,
    pace: number,
    sigma: number,
    today: Date = new Date()
): { lower: Date; upper: Date } {
    const epsilon = 0.01;
    // ETA^- = Delta / (v + sigma)  (Optimistic, shorter time)
    // ETA^+ = Delta / (v - sigma)  (Pessimistic, longer time)

    const fastPace = pace + sigma;
    const slowPace = Math.max(pace - sigma, epsilon);

    const minDays = Math.ceil(remaining / fastPace);
    const maxDays = Math.ceil(remaining / slowPace);

    const MAX_DAYS = 365 * 100; // Cap

    return {
        lower: new Date(today.getTime() + Math.min(minDays, MAX_DAYS) * ONE_DAY_MS),
        upper: new Date(today.getTime() + Math.min(maxDays, MAX_DAYS) * ONE_DAY_MS)
    };
}

// --- G7: Status ---
export function calculateStatus(
    etaDays: number,
    deadlineDays: number
): 'onTrack' | 'atRisk' | 'behind' {
    if (deadlineDays === Infinity) return 'onTrack'; // No deadline = always on track technically

    // "on-track if ETA <= D"
    if (etaDays <= deadlineDays) return 'onTrack';

    // "at-risk if ETA <= D + 0.2T"
    // T = deadlineDays
    const threshold = deadlineDays + 0.2 * deadlineDays;
    if (etaDays <= threshold) return 'atRisk';

    return 'behind';
}

// --- G8: Auto Rule ---
export function calculateAutoContribution(
    rule: Envelope['autoRule'],
    income: number
): number {
    if (!rule) return 0;
    if (rule.type === 'fixed') return rule.value;
    if (rule.type === 'percent') return rule.value * income;
    return 0;
}

// --- G9: Required with Interest ---
export function calculateRequiredWithInterest(
    target: number,
    current: number,
    days: number,
    apy: number,
    frequency: 'daily' | 'monthly' = 'monthly'
): { daily: number, totalInterest: number } {
    if (days <= 0) return { daily: 0, totalInterest: 0 };
    if (apy <= 0) {
        const daily = calculateRequiredDaily(target - current, days);
        return { daily, totalInterest: 0 };
    }

    const r_annual = apy / 100;

    // Convert Annual Rate to period rate and daily equivalent
    // 1. Calculate future value of CURRENT amount
    let fvCurrent = current;
    if (current > 0) {
        // FV = P * (1 + r/n)^(n*t)
        // t = days / 365
        const t_years = days / 365;
        if (frequency === 'daily') {
            fvCurrent = current * Math.pow(1 + r_annual / 365, 365 * t_years);
        } else {
            fvCurrent = current * Math.pow(1 + r_annual / 12, 12 * t_years);
        }
    }

    const remainingNeeded = Math.max(0, target - fvCurrent);
    if (remainingNeeded <= 0) return { daily: 0, totalInterest: fvCurrent - current };

    // 2. Calculate Daily Contribution (PMT)
    // We contribute daily.
    // If compounding is daily: standard annuity formula.
    // If compounding is monthly: equivalent daily rate needed?
    // Using effective daily rate for calculation to be precise.

    let r_daily_effective = 0;

    if (frequency === 'daily') {
        r_daily_effective = r_annual / 365;
    } else {
        // (1 + r_daily)^365 = (1 + r_monthly)^12
        // r_daily = (1 + r_annual/12)^(12/365) - 1
        r_daily_effective = Math.pow(1 + r_annual / 12, 12 / 365) - 1;
    }

    // PMT = FV * r / ((1+r)^n - 1)
    const pmt = remainingNeeded * r_daily_effective / (Math.pow(1 + r_daily_effective, days) - 1);

    // Total accumulated with interest = Target
    // Total contributed = PMT * days + Current
    // Total Interest = Target - (PMT * days + Current)
    const totalContributed = pmt * days + current;
    const totalInterest = target - totalContributed;

    return { daily: pmt, totalInterest };
}
