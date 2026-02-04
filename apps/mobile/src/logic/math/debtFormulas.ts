/**
 * Scientific Math for Debts Module
 * Implements formulas D1-D14 for debt amortization and optimization.
 */

// --- Types ---
export type Debt = {
    id: string;
    name: string;
    balance: number; // B0
    apr: number; // Annual Percentage Rate (rA)
    minPayment: number; // m
    dueDay: number;
    fees: number; // f
    includeFees: boolean;
};

export type SimulationParams = {
    debts: Debt[];
    strategy: 'avalanche' | 'snowball';
    extraPayment: number; // E
    useDailyCompounding?: boolean; // Default false (monthly)
};

export type PayoffMonth = {
    month: number;
    totalPayment: number;
    totalInterest: number;
    totalPrincipal: number;
    remainingBalance: number;
    debtsStatus: Record<string, number>; // debtId -> remaining balance
    closedDebts: string[]; // IDs of debts closed this month
};

export type SimulationResult = {
    summary: {
        totalInterest: number; // (D10)
        debtFreeMonth: number; // (D11)
        totalPaid: number;
        savings?: number; // (D12) vs baseline
    };
    schedule: PayoffMonth[];
    payoffOrder: string[]; // Order of debt IDs cleared
};

// --- D1: Monthly Rate ---
export function calculateMonthlyRate(apr: number): number {
    return (apr / 12) / 100;
}

// --- D2: Monthly Interest ---
export function calculateMonthlyInterest(balance: number, apr: number): number {
    const r = calculateMonthlyRate(apr);
    return balance * r;
}

// --- D3: Total Payment (for a single debt in isolation or stepped) ---
// Note: In simulation, payment allocation is complex (D9).
// This is for basic checking.
export function calculatePayment(minPayment: number, extra: number): number {
    return minPayment + extra;
}

// --- D4/D5: Amortization Step ---
// Returns { interest, principal, endBalance }
export function calculateAmortizationStep(
    balance: number,
    payment: number,
    apr: number,
    fees: number = 0
): { interest: number; principal: number; endBalance: number; fees: number } {
    // Interest
    const interest = calculateMonthlyInterest(balance, apr);

    // Total obligation this month = Interest + Fees
    const nonPrincipalComponent = interest + fees;

    // Principal payment
    // principal(t) = max(0, p(t) - I(t) - fees)
    const principal = Math.max(0, payment - nonPrincipalComponent);

    // New balance
    // B(t+1) = max(0, B(t) - principal)
    let endBalance = balance - principal;

    // Edge case: if payment > balance + interest + fees (payoff)
    // The 'principal' calculated above might leave negative balance if we don't cap it.
    // Actually standard formula: endBalance = B_prev + Int + Fees - Payment
    // If endBalance < 0, it means overpaid.
    // Let's preserve the logic:
    if (endBalance < 0) endBalance = 0;

    return { interest, principal, endBalance, fees };
}

// --- D6: Negative Amortization Check ---
export function isNegativeAmortization(debt: Debt): boolean {
    const interest = calculateMonthlyInterest(debt.balance, debt.apr);
    const totalRequired = interest + (debt.includeFees ? debt.fees : 0);
    return debt.minPayment <= totalRequired;
}

// --- D7/D8: Strategy Sorting ---
export const Strategies = {
    avalanche: (a: Debt, b: Debt) => {
        // Descending APR
        return b.apr - a.apr;
    },
    snowball: (a: Debt, b: Debt) => {
        // Ascending Balance
        return a.balance - b.balance;
    }
};

// --- D13: Marginal Effect ---
// This will be called by the consumer using two simulations
export function calculateMarginalSavings(
    baselineFreeMonth: number,
    newFreeMonth: number
): number {
    return Math.max(0, baselineFreeMonth - newFreeMonth);
}
