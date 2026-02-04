import {
    Debt,
    SimulationParams,
    SimulationResult,
    PayoffMonth,
    calculateMonthlyRate,
    calculateAmortizationStep,
    Strategies
} from '../math/debtFormulas';

export class DebtOptimizer {

    static simulate(params: SimulationParams): SimulationResult {
        const { debts, strategy, extraPayment } = params;

        // Deep copy debts to not mutate original state during simulation
        let currentDebts = debts.map(d => ({ ...d }));

        // Sort debts by strategy to determine "Focus Debt" priority
        // Note: D9 says "extra_target = E + Σ mins of closed debts".
        // The target is usually the highest priority open debt.
        // We strictly follow the sort order for whoever gets the extra payment.
        const sortedOrder = [...currentDebts].sort(Strategies[strategy]).map(d => d.id);

        const schedule: PayoffMonth[] = [];
        const payoffOrder: string[] = [];

        let month = 0;
        const MAX_MONTHS = 360; // 30 years cap default safety

        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        // Run simulation tick by tick
        while (currentDebts.some(d => d.balance > 0) && month < MAX_MONTHS) {
            month++;

            let availableExtra = extraPayment; // E

            // Add min payments of CLOSED debts to available extra (Snowball/Avalanche common rule)
            // D9: "extra_target = E + Σ mins of closed debts"
            // We can calculate this by: Total Budget = Sum(All Initial Mins) + E.
            // We allocate this budget: first to Mins of Open Debts, then remainder to Priority Debt.
            const initialTotalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
            const totalMonthlyBudget = initialTotalMin + extraPayment;

            const monthLog: PayoffMonth = {
                month,
                totalPayment: 0,
                totalInterest: 0,
                totalPrincipal: 0,
                remainingBalance: 0,
                debtsStatus: {},
                closedDebts: []
            };

            // 1. Calculate mandatory interest and min payments for all open debts
            // But we must pay AT LEAST the min payment for each open debt.
            // OR pay the full balance if balance < min payment.

            let currentMonthSpent = 0;

            // We need to know which is the "Target" debt for the extra money.
            // It's the first one in sortedOrder that is still open.
            const openDebts = currentDebts.filter(d => d.balance > 0);
            // Sort open debts by strategy
            openDebts.sort(Strategies[strategy]);
            const targetDebtId = openDebts[0]?.id;

            // Temporary storage for payments this month
            const payments: Record<string, number> = {};

            // A. Satisfy Minimums for everyone (or close them if small)
            for (const debt of currentDebts) {
                if (debt.balance <= 0) continue;

                let payment = debt.minPayment;

                // Cap payment to payoff amount (Balance + Interest + Fees) roughly check
                // Ideally we calculate exact logic: 
                // We pay 'payment'. Inside 'calculateAmortizationStep', we see what happens.
                // But we want to avoid overpaying significantly.
                // Approx payoff = Balance * (1+r) + fees. 
                const r = calculateMonthlyRate(debt.apr);
                const approxPayoff = debt.balance + (debt.balance * r) + (debt.includeFees ? debt.fees : 0);

                if (payment > approxPayoff) {
                    payment = approxPayoff;
                }

                payments[debt.id] = payment;
                currentMonthSpent += payment;
            }

            // B. Assign Remaining Budget (Standard D9 logic)
            // "others get extra=0" implicitly handled by only paying mins above.
            // "extra_target = E + Σ mins of closed debts" -> effectively TotalBudget - SpentOnMins
            let remainder = totalMonthlyBudget - currentMonthSpent;

            if (remainder > 0 && targetDebtId) {
                // Give remainder to target
                payments[targetDebtId] = (payments[targetDebtId] || 0) + remainder;
                currentMonthSpent += remainder;
            }

            // C. Execute Payments / Step Time
            for (const debt of currentDebts) {
                if (debt.balance <= 0) {
                    monthLog.debtsStatus[debt.id] = 0;
                    continue;
                }

                const payment = payments[debt.id] || 0;

                const step = calculateAmortizationStep(
                    debt.balance,
                    payment,
                    debt.apr,
                    debt.includeFees ? debt.fees : 0
                );

                // Update debt state
                debt.balance = step.endBalance;

                // Log
                monthLog.totalPayment += payment;
                monthLog.totalInterest += step.interest;
                // Fees are not principal, but they are paid. 
                // totalPrincipal roughly = payment - interest - fees.
                monthLog.totalPrincipal += step.principal;

                // global totals
                totalInterestPaid += step.interest;
                totalPrincipalPaid += step.principal;

                monthLog.debtsStatus[debt.id] = debt.balance;

                if (debt.balance <= 0 && !payoffOrder.includes(debt.id)) {
                    payoffOrder.push(debt.id);
                    monthLog.closedDebts.push(debt.id);
                }
            }

            monthLog.remainingBalance = currentDebts.reduce((sum, d) => sum + d.balance, 0);
            schedule.push(monthLog);
        }

        return {
            summary: {
                totalInterest: totalInterestPaid,
                debtFreeMonth: month >= MAX_MONTHS ? -1 : month,
                totalPaid: totalInterestPaid + totalPrincipalPaid, // + fees if tracked globally
            },
            schedule,
            payoffOrder
        };
    }

    // --- D12: Savings ---
    static compare(debts: Debt[], extra: number, strategy: 'avalanche' | 'snowball') {
        const baseline = this.simulate({ debts, strategy: 'snowball', extraPayment: 0 }); // Min-only (strategy irrelevant for 0 extra usually, but Snowball is safer default)
        const optimized = this.simulate({ debts, strategy, extraPayment: extra });

        return {
            baseline,
            optimized,
            savings: baseline.summary.totalInterest - optimized.summary.totalInterest,
            monthsSaved: baseline.summary.debtFreeMonth - optimized.summary.debtFreeMonth
        };
    }
}
