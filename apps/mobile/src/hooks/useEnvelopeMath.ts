import { useMemo } from 'react';
import {
    Envelope,
    Contribution,
    EnvelopeCalculations,
    calculateRemaining,
    calculateDaysUntilDeadline,
    calculateRequiredDaily,
    calculateHistoricalPace,
    calculateETA,
    calculateETABands,
    calculateStatus
} from '../logic/math/envelopeFormulas';

export function useEnvelopeMath(
    envelope: Envelope,
    contributions: Contribution[],
    envelopeCreatedAt: string // ISO date
): EnvelopeCalculations {

    return useMemo(() => {
        const today = new Date();

        // G1
        const remaining = calculateRemaining(envelope.targetAmount, envelope.currentAmount);

        // G2
        const daysUntilDeadline = calculateDaysUntilDeadline(envelope.deadline, today);

        // G3
        const requiredDaily = calculateRequiredDaily(remaining, daysUntilDeadline);

        // G4
        const { pace, sigma } = calculateHistoricalPace(contributions, envelopeCreatedAt, today);

        // G5
        const { date: etaDate, days: etaDays } = calculateETA(remaining, pace, today);

        // G6
        const { lower, upper } = calculateETABands(remaining, pace, sigma, today);

        // G7
        const status = calculateStatus(etaDays, daysUntilDeadline);

        // Projected (by deadline if exists, else by 1 year)
        // If we have deadline, how much will we have?
        // Amount = Current + Pace * DaysUntilDeadline
        const safeDays = daysUntilDeadline === Infinity ? 365 : daysUntilDeadline;
        const projected = envelope.currentAmount + pace * safeDays;

        return {
            remaining,
            daysUntilDeadline,
            requiredDaily,
            historicalPace: pace,
            etaDate,
            etaDays,
            uncertainty: {
                sigma,
                etaLower: lower,
                etaUpper: upper
            },
            status,
            projectedByDeadline: projected
        };
    }, [envelope, contributions, envelopeCreatedAt]);
}
