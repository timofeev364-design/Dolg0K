/**
 * Scientific Smart Prompts / Intelligence Rules
 * Detects patterns and generates actionable insights with confidence levels.
 */

import { Debt, SimulationResult } from '../math/debtFormulas';
import { DebtOptimizer } from '../simulation/debtOptimizer';
import { ScoreFactor } from '../math/scoreFormulas';

export type PromptType = 'subscription' | 'debt_strategy' | 'budget_risk' | 'score_drop';

export type SmartPrompt = {
    id: string;
    type: PromptType;
    title: string;
    message: string;
    confidence: number; // 0.0 - 1.0
    actionLabel: string;
    actionData?: any;
    explanation?: string; // "Why"
};

export type Transaction = {
    id: string;
    merchant: string;
    amount: number;
    date: string; // ISO
    categoryId?: string;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// 1. Subscription Detection
// Logic: Group by merchant -> Check intervals -> Check amount variance
export function detectSubscriptions(transactions: Transaction[]): SmartPrompt[] {
    const merchants: Record<string, Transaction[]> = {};

    // Group
    transactions.forEach(t => {
        const key = t.merchant.toLowerCase().trim();
        if (!merchants[key]) merchants[key] = [];
        merchants[key].push(t);
    });

    const prompts: SmartPrompt[] = [];

    for (const [merchant, txns] of Object.entries(merchants)) {
        if (txns.length < 3) continue; // Need samples

        // Sort date desc
        txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Check Intervals
        const intervals: number[] = [];
        for (let i = 0; i < txns.length - 1; i++) {
            const diff = Math.abs(new Date(txns[i].date).getTime() - new Date(txns[i + 1].date).getTime());
            intervals.push(diff / ONE_DAY_MS);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const intervalVariance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
        const intervalStd = Math.sqrt(intervalVariance);

        // Check Amount Stability
        const amounts = txns.map(t => t.amount);
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const amountVariance = amounts.reduce((a, b) => a + Math.pow(b - avgAmount, 2), 0) / amounts.length;
        const amountStd = Math.sqrt(amountVariance);

        // Heuristic: Low interval variance (near 30 days) AND Low amount variance
        // Confidence = (1 - CV_interval) * (1 - CV_amount)
        // CV = std / mean
        const cvInterval = intervalStd / (avgInterval || 1);
        const cvAmount = amountStd / (avgAmount || 1);

        // Filter noise
        if (cvInterval > 0.2 || cvAmount > 0.1) continue;

        // Subscription candidate!
        const confidence = (1 - cvInterval) * (1 - cvAmount);

        // Periodicity estimation
        let periodicity = 'monthly';
        if (Math.abs(avgInterval - 7) < 2) periodicity = 'weekly';
        if (Math.abs(avgInterval - 365) < 10) periodicity = 'yearly';

        prompts.push({
            id: `sub_${merchant}`,
            type: 'subscription',
            title: 'Possible Subscription',
            message: `Recurring ${periodicity} payment of ${avgAmount.toFixed(0)} ₽ to ${txns[0].merchant}`,
            confidence,
            actionLabel: 'Track as Fixed Cost',
            explanation: `Found ${txns.length} transactions roughly ${avgInterval.toFixed(1)} days apart with stable amounts.`
        });
    }

    return prompts;
}

// 2. Debt Strategy Recommendation
export function recommendDebtStrategy(debts: Debt[]): SmartPrompt | null {
    if (debts.length < 2) return null;

    // Compare strategies with 0 extra (or small extra to see leverage)
    // Actually, usually user pays existing minimums. Strategies matter when there is surplus.
    // Let's assume a hypothetical modest extra to see efficiency, or just current state.
    // D7/D8 implies we switch order of payout. Even with just min payments, 
    // "Avalanche" vs "Snowball" usually assumes we apply "freed up min payments" 
    // to the next debt (Snowball logic built into simulation).
    // So distinct strategy matters.

    const avalancheSim = DebtOptimizer.simulate({ debts, strategy: 'avalanche', extraPayment: 0 });
    const snowballSim = DebtOptimizer.simulate({ debts, strategy: 'snowball', extraPayment: 0 });

    const avInterest = avalancheSim.summary.totalInterest;
    const sbInterest = snowballSim.summary.totalInterest;

    // If Avalanche saves significant money (> 1000 RUB or > 5%)
    const diff = sbInterest - avInterest;

    if (diff > 1000) {
        return {
            id: 'debt_strat_avalanche',
            type: 'debt_strategy',
            title: 'Switch to Avalanche',
            message: `Save ${diff.toFixed(0)} ₽ in interest by paying highest APR first.`,
            confidence: 0.9,
            actionLabel: 'Apply Strategy',
            explanation: `Snowball costs ${sbInterest.toFixed(0)} ₽ vs Avalanche ${avInterest.toFixed(0)} ₽.`
        };
    }

    // If Snowball is effectively free (diff small) but clears debts faster?
    // Snowball usually clears *first* debt faster.
    const sbFirstClear = snowballSim.schedule.findIndex(m => m.closedDebts.length > 0);
    const avFirstClear = avalancheSim.schedule.findIndex(m => m.closedDebts.length > 0);

    if (sbFirstClear < avFirstClear && diff < 500) {
        return {
            id: 'debt_strat_snowball',
            type: 'debt_strategy',
            title: 'Psychological Win',
            message: `Clear your first debt ${avFirstClear - sbFirstClear} months sooner with minimal extra cost.`,
            confidence: 0.85,
            actionLabel: 'Use Snowball',
            explanation: `Snowball closes a debt in month ${sbFirstClear}, Avalanche in month ${avFirstClear}. Interest cost diff is negligible.`
        };
    }

    return null;
}

// 3. Budget Risk Analysis
// Input: Budget Metrics (probOverrun)
export function analyzeBudgetRisks(
    budgets: { name: string; probOverrun: number; limit: number; forecast: number }[]
): SmartPrompt[] {
    const risks = budgets.filter(b => b.probOverrun > 0.60);

    return risks.map(b => ({
        id: `risk_${b.name}`,
        type: 'budget_risk',
        title: `Risk: ${b.name}`,
        message: `${(b.probOverrun * 100).toFixed(0)}% chance to exceed limit by ~${(b.forecast - b.limit).toFixed(0)} ₽`,
        confidence: b.probOverrun, // Direct mapping
        actionLabel: 'Adjust Budget',
        explanation: `Based on current spending pace and historical volatility.`
    }));
}

// 4. Score Drop Analysis
export function analyzeScoreDrop(
    oldFactors: ScoreFactor[],
    newFactors: ScoreFactor[]
): SmartPrompt[] {
    const prompts: SmartPrompt[] = [];

    newFactors.forEach(newF => {
        const oldF = oldFactors.find(o => o.id === newF.id);
        if (!oldF) return;

        const delta = newF.score - oldF.score;
        if (delta < -5) { // Significant drop
            prompts.push({
                id: `score_drop_${newF.id}`,
                type: 'score_drop',
                title: `${newF.label} Hurting Score`,
                message: `${newF.label} dropped by ${Math.abs(delta).toFixed(0)} points.`,
                confidence: 1.0,
                actionLabel: 'View Impact',
                explanation: `Value changed from ${oldF.value.toFixed(2)} to ${newF.value.toFixed(2)}.`
            });
        }
    });

    return prompts;
}
