/**
 * Scientific Shared Finances Math
 * Implements weighted splitting, net balances, and efficient settlement algorithms.
 */

export type Member = {
    id: string;
    name: string;
    monthlyIncome: number; // For weighted comparison
    avatar?: string;
};

export type SplitMethod = 'equal' | 'weighted' | 'exact' | 'percentage';

export type SharedTransaction = {
    id: string;
    payerId: string;
    amount: number;
    description: string;
    date: string; // ISO
    splitMethod: SplitMethod;
    // If 'exact', map memberId -> amount
    // If 'percentage', map memberId -> percent (0-100)
    // If 'equal' or 'weighted', these can be omitted or computed
    splitDetails?: Record<string, number>;
};

export type BalanceResult = {
    memberId: string;
    paid: number; // Total amount paid by this person
    share: number; // Total amount this person SHOULD have paid (consumption)
    net: number; // paid - share. Positive = Owed to me. Negative = I owe.
};

export type Settlement = {
    fromMemberId: string;
    toMemberId: string;
    amount: number;
};

// 1. Calculate Shares for a Single Transaction
export function calculateTransactionShares(
    transaction: SharedTransaction,
    members: Member[]
): Record<string, number> {
    const { amount, splitMethod, splitDetails, payerId } = transaction;
    const shares: Record<string, number> = {};

    // Initialize 0
    members.forEach(m => shares[m.id] = 0);

    if (splitMethod === 'equal') {
        const share = amount / members.length;
        members.forEach(m => shares[m.id] = share);
    }
    else if (splitMethod === 'weighted') {
        const totalIncome = members.reduce((sum, m) => sum + m.monthlyIncome, 0);
        if (totalIncome === 0) {
            // Fallback to equal if no income data
            const share = amount / members.length;
            members.forEach(m => shares[m.id] = share);
        } else {
            members.forEach(m => {
                const weight = m.monthlyIncome / totalIncome;
                shares[m.id] = amount * weight;
            });
        }
    }
    else if (splitMethod === 'exact' && splitDetails) {
        // Use details directly
        // Validation: sum should close to amount
        let sum = 0;
        members.forEach(m => {
            const val = splitDetails[m.id] || 0;
            shares[m.id] = val;
            sum += val;
        });
        // Distribute remainder if any due to rounding? Or trust exact?
        // Let's assume input is valid or we just use what's there.
    }
    else if (splitMethod === 'percentage' && splitDetails) {
        members.forEach(m => {
            const pct = splitDetails[m.id] || 0;
            shares[m.id] = amount * (pct / 100);
        });
    }

    return shares;
}

// 2. Calculate Global Net Balances
export function calculateBalances(
    transactions: SharedTransaction[],
    members: Member[]
): BalanceResult[] {
    const balances: Record<string, BalanceResult> = {};

    // Initialize
    members.forEach(m => {
        balances[m.id] = { memberId: m.id, paid: 0, share: 0, net: 0 };
    });

    for (const txn of transactions) {
        // Add to Payer
        if (balances[txn.payerId]) {
            balances[txn.payerId].paid += txn.amount;
        }

        // Add to Consumers (Shares)
        const shares = calculateTransactionShares(txn, members);
        for (const [memberId, amount] of Object.entries(shares)) {
            if (balances[memberId]) {
                balances[memberId].share += amount;
            }
        }
    }

    // Compute Net
    return Object.values(balances).map(b => ({
        ...b,
        net: b.paid - b.share
    }));
}

// 3. Settlement Algorithm (Minimize Transactions)
// "Simplifying Debts"
export function calculateSettlements(balances: BalanceResult[]): Settlement[] {
    const settlements: Settlement[] = [];

    // Separate into Debtors (net < 0) and Creditors (net > 0)
    // Ignore approximately zero
    const epsilon = 0.01;

    // Sort by magnitude to optimize?
    // Greedy approach usually works well enough for small N.

    let debtors = balances
        .filter(b => b.net < -epsilon)
        .map(b => ({ id: b.memberId, amount: -b.net })) // Store positive debt amount
        .sort((a, b) => b.amount - a.amount); // Largest debt first

    let creditors = balances
        .filter(b => b.net > epsilon)
        .map(b => ({ id: b.memberId, amount: b.net }))
        .sort((a, b) => b.amount - a.amount); // Largest credit first

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // Match amount
        const amount = Math.min(debtor.amount, creditor.amount);

        // Record settlement
        if (amount > epsilon) {
            settlements.push({
                fromMemberId: debtor.id,
                toMemberId: creditor.id,
                amount: Number(amount.toFixed(2))
            });
        }

        // Update remaining
        debtor.amount -= amount;
        creditor.amount -= amount;

        // Move indices if exhausted
        if (debtor.amount < epsilon) i++;
        if (creditor.amount < epsilon) j++;
    }

    return settlements;
}

// 4. Weighted Split Ratios Helper
export function getWeightedRatios(members: Member[]): Record<string, number> {
    const totalIncome = members.reduce((sum, m) => sum + m.monthlyIncome, 0);
    const ratios: Record<string, number> = {};

    if (totalIncome === 0) {
        const equal = 1 / Math.max(1, members.length);
        members.forEach(m => ratios[m.id] = equal);
    } else {
        members.forEach(m => ratios[m.id] = m.monthlyIncome / totalIncome);
    }
    return ratios;
}
