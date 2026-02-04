import { useState, useMemo } from 'react';
import {
    Member,
    SharedTransaction,
    calculateBalances,
    calculateSettlements,
    getWeightedRatios,
    Settlement
} from '../logic/math/sharedFormulas';

export function useSharedFinances(
    initialMembers: Member[],
    initialTransactions: SharedTransaction[]
) {
    const [transactions, setTransactions] = useState<SharedTransaction[]>(initialTransactions);

    // Memoize Ratios (usually static unless income changes)
    const weightedRatios = useMemo(() => getWeightedRatios(initialMembers), [initialMembers]);

    // Calculate Balances & Settlements
    const { balances, settlements, totalSharedCost } = useMemo(() => {
        const bals = calculateBalances(transactions, initialMembers);
        const setts = calculateSettlements(bals);
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        return { balances: bals, settlements: setts, totalSharedCost: total };
    }, [transactions, initialMembers]);

    // Actions
    const addTransaction = (txn: SharedTransaction) => {
        setTransactions(prev => [...prev, txn]);
    };

    // Helper to "Mark as Settled"
    // Usually means creating a transaction where A pays B?
    // Or just clearing the state?
    // In Shared Finances apps, "Settling" usually adds a "Repayment" transaction.
    // Payer: Debtor, Split: 100% to Creditor (so Creditor 'consumed' the negative amount? No.)
    // Repayment Logic:
    // User A pays User B 1000 RUB.
    // Transaction: Amount 1000. Payer: A. Split: Exact { B: 1000 }.
    // Result: A Paid +1000, Share 0 -> Net +1000.
    // B Paid 0, Share +1000 -> Net -1000.
    // If A owed 1000 (Net -1000) and B was owed 1000 (Net +1000), 
    // New Net A: -1000 + 1000 = 0.
    // New Net B: +1000 - 1000 = 0.
    // Correct.
    const settleDebt = (settlement: Settlement) => {
        const txn: SharedTransaction = {
            id: `settle_${Date.now()}`,
            payerId: settlement.fromMemberId,
            amount: settlement.amount,
            description: 'Settlement Payment',
            date: new Date().toISOString(),
            splitMethod: 'exact',
            splitDetails: {
                [settlement.toMemberId]: settlement.amount
            }
        };
        addTransaction(txn);
    };

    return {
        members: initialMembers,
        transactions,
        balances,
        settlements,
        weightedRatios,
        totalSharedCost,
        addTransaction,
        settleDebt
    };
}
