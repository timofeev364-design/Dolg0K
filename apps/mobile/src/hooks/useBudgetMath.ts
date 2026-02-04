import { useMemo } from 'react';
import {
    calculateCumulativeSpend,
    calculateRemaining,
    calculateUtilization,
    calculateBurnRate,
    calculateLinearForecast,
    calculateEVMA,
    calculateForecastEWMA,
    calculateUncertaintyParams,
    calculateConfidenceInterval,
    calculateProbOverrun,
    calculateExpectedOverrunDay,
    calculateAnomalyScore,
    calculateRecommendedLimit,
    DailySpend,
    BudgetHistory,
    Z_80,
    Z_95,
    DEFAULT_ALPHA
} from '../logic/math/budgetFormulas';

export type BudgetCalculations = {
    currentSpend: number;
    remaining: number;
    utilization: number;
    burnRate: number;
    forecast: number;
    ciLower: number;
    ciUpper: number;
    sigmaF: number;
    probOverrun: number;
    expectedOverrunDay: number | null;
    anomalyScore: number;
    isAnomaly: boolean;
    recommendedLimit: number;
    riskTier: 'onTrack' | 'atRisk' | 'highRisk' | 'overLimit';
};

export type UseBudgetMathProps = {
    limit: number;
    dailySpends: DailySpend[];
    history: BudgetHistory;
    totalDays: number;
    currentDay: number; // 1-based index
    useSmoothing?: boolean;
    useHistory?: boolean;
    confidenceLevel?: 80 | 95;
    alpha?: number;
};

export function useBudgetMath({
    limit,
    dailySpends,
    history,
    totalDays,
    currentDay,
    useSmoothing = false,
    useHistory = false,
    confidenceLevel = 95,
    alpha = DEFAULT_ALPHA
}: UseBudgetMathProps): BudgetCalculations {

    return useMemo(() => {
        // 1. Current State
        const currentSpend = calculateCumulativeSpend(dailySpends, currentDay);
        const daySpendEntry = dailySpends.find(d => d.day === currentDay);
        const todaySpend = daySpendEntry ? daySpendEntry.amount : 0;

        const remaining = calculateRemaining(limit, currentSpend);
        const utilization = calculateUtilization(limit, currentSpend);
        const burnRate = calculateBurnRate(currentSpend, currentDay);

        // 2. Forecast
        let forecast = 0;
        if (useSmoothing) {
            const ewmaRate = calculateEVMA(dailySpends, alpha, currentDay);
            forecast = calculateForecastEWMA(currentSpend, ewmaRate, totalDays, currentDay);
        } else {
            forecast = calculateLinearForecast(burnRate, totalDays);
        }

        // 3. Uncertainty
        const { meanDay, stdDay } = calculateUncertaintyParams(history);
        const zScore = confidenceLevel === 95 ? Z_95 : Z_80;
        // Note: If useHistory is false, we might want to hide CI, 
        // but the spec says "Use history toggle to enable uncertainty/CI".
        // We compute it anyway, consumer decides whether to show it.
        const { lower, upper, sigmaF } = calculateConfidenceInterval(forecast, stdDay, totalDays, zScore);

        // 4. Probability
        // If useHistory is off, spec doesn't say Pr is 0, but "uncertainty from history" implies we need history for sigmaF.
        // If no history, sigmaF might be 0 -> step function prob (0 or 1).
        const probOverrun = calculateProbOverrun(forecast, limit, sigmaF);

        // 5. Expected Overrun Day
        const expectedOverrunDay = calculateExpectedOverrunDay(limit, currentSpend, burnRate, currentDay);

        // 6. Anomaly
        const anomalyScore = calculateAnomalyScore(todaySpend, meanDay, stdDay);
        const isAnomaly = Math.abs(anomalyScore) >= 2;

        // 7. Recommended
        const recommendedLimit = calculateRecommendedLimit(history);

        // 8. Risk Tier
        let riskTier: 'onTrack' | 'atRisk' | 'highRisk' | 'overLimit' = 'onTrack';

        if (utilization >= 1.0) {
            riskTier = 'overLimit';
        } else if (probOverrun > 0.60) {
            riskTier = 'highRisk';
        } else if ((probOverrun >= 0.30 && probOverrun <= 0.60) || (utilization >= 0.90 && utilization < 1.0)) {
            // Spec: At risk: Pr_c 0.30..0.60 OR P_c 0.90..1.00
            riskTier = 'atRisk';
        } else {
            // Spec: On track: Pr_c < 0.30 and P_c < 0.90
            riskTier = 'onTrack';
        }

        return {
            currentSpend,
            remaining,
            utilization,
            burnRate,
            forecast,
            ciLower: lower,
            ciUpper: upper,
            sigmaF,
            probOverrun,
            expectedOverrunDay,
            anomalyScore,
            isAnomaly,
            recommendedLimit,
            riskTier
        };
    }, [limit, dailySpends, history, totalDays, currentDay, useSmoothing, useHistory, confidenceLevel, alpha]);
}
