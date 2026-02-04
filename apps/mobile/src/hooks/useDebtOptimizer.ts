import { useMemo } from 'react';
import { Debt, SimulationResult } from '../logic/math/debtFormulas';
import { DebtOptimizer } from '../logic/simulation/debtOptimizer';

export type OptimizerHookResult = {
    baseline: SimulationResult;
    optimized: SimulationResult;
    savings: number;
    monthsSaved: number;
    marginalAnalysis: {
        nextLevelMonthsSaved: number; // For +500 RUB
    }
};

export function useDebtOptimizer(
    debts: Debt[],
    strategy: 'avalanche' | 'snowball',
    extraPayment: number
): OptimizerHookResult {

    return useMemo(() => {
        // 1. Run Comparison (D12)
        const { baseline, optimized, savings, monthsSaved } = DebtOptimizer.compare(debts, extraPayment, strategy);

        // 2. Run Sensitivity (D13)
        // Run E + 500
        const stepUp = 500;
        const sensSim = DebtOptimizer.simulate({
            debts,
            strategy,
            extraPayment: extraPayment + stepUp
        });

        // Marginal effect: how many MORE months saved compared to current 'optimized' plan
        // If optimized is 20 months, and senSim is 18 months, marginal is 2.
        // Spec says: "ΔT_free/ΔE estimated by running E and E+ΔE"
        // Display as: "+500₽ extra → debt-free -X months"
        const marginalMonths = Math.max(0, optimized.summary.debtFreeMonth - sensSim.summary.debtFreeMonth);

        return {
            baseline,
            optimized,
            savings,
            monthsSaved,
            marginalAnalysis: {
                nextLevelMonthsSaved: marginalMonths
            }
        };
    }, [debts, strategy, extraPayment]);
}
