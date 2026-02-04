/**
 * Scientific Payday Planner Math
 * Implements priority allocation and daily cashflow recursion (CFR).
 */

export type BucketType = 'mandatory' | 'buffer' | 'goals' | 'discretionary';

export type AllocationBucket = {
    id: BucketType;
    label: string;
    minReq: number; // Absolute minimum required
    allocated: number; // Actual allocated amount
    priority: number; // 1 = highest
    items: { id: string; name: string; amount: number; dueDay?: number }[];
};

export type PlannedFlow = {
    day: number; // 1..30 relative to start
    date: string; // ISO
    inflow: number;
    outflow: number;
    balance: number;
    description?: string;
};

export type PaydayPlanResult = {
    totalIncome: number;
    unallocated: number;
    buckets: Record<BucketType, AllocationBucket>;
    cashflow: PlannedFlow[];
    lowestBalance: number;
    riskDay: number | null; // Day index where balance dips < 0
    isSafe: boolean;
};

export type PaydayInput = {
    currentBalance: number;
    paydayAmount: number;
    paydayDate: string; // ISO
    nextPaydayDate: string; // ISO - to define period length
    bufferRate: number; // 0.0 - 1.0 (e.g. 0.10 for 10% buffer)
    mandatories: { id: string; name: string; amount: number; dueDay: number }[]; // Bills
    goals: { id: string; name: string; target: number; current: number; priority: number }[];
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Helper: Get day index from date string relative to start
function getDayIndex(dateStr: string, startStr: string): number {
    const d = new Date(dateStr).getTime();
    const s = new Date(startStr).getTime();
    return Math.ceil((d - s) / ONE_DAY_MS);
}

// 1. Automatic Priority Allocation
export function calculateAllocation(
    input: PaydayInput,
    manualOverrides?: Record<BucketType, number> // User sliders
): Record<BucketType, AllocationBucket> {
    const { paydayAmount, bufferRate, mandatories, goals } = input;

    // Total available to allocate is Payday Amount (usually). 
    // Or do we plan inclusive of current balance?
    // "Payday Planner" usually plans the *Incoming* money.
    // However, risk check needs Current Balance.

    // Bucket 1: Mandatory
    // Sum of bills due in this period
    const totalMandatory = mandatories.reduce((sum, m) => sum + m.amount, 0);

    // Bucket 2: Buffer
    const totalBuffer = paydayAmount * bufferRate;

    // Bucket 3: Goals
    // Simple heuristic: 20% of remaining? Or specific targets?
    // Let's assume goals have 'target contribution' logic. 
    // For now, let's say sum of unsatisfied goals or just a fixed %? 
    // Spec says "allocation priority".
    // Let's alloc remaining after M+B to Goals, then Discretionary.
    // Ideally user inputs total for Goals or we use envelope "req daily".
    // We'll set a default "Goal Ask" = 20% of Income.
    const goalAsk = paydayAmount * 0.20;

    // Bucket 4: Discretionary (Remainder)

    // Initial Allocation
    let remaining = paydayAmount;

    const allocM = Math.min(remaining, totalMandatory);
    remaining = Math.max(0, remaining - allocM);

    const allocB = Math.min(remaining, totalBuffer);
    remaining = Math.max(0, remaining - allocB);

    const allocG = Math.min(remaining, goalAsk);
    remaining = Math.max(0, remaining - allocG);

    const allocD = remaining;

    // Apply Overrides if present (sliders)
    // If user changes one, we likely rebalance 'Discretionary' or 'Buffer'?
    // Complex slider logic usually implemented in UI state, here we return "Recommended".

    return {
        mandatory: {
            id: 'mandatory',
            label: 'Обязательные (Жилье, Еда)',
            minReq: totalMandatory,
            allocated: allocM,
            priority: 1,
            items: mandatories
        },
        buffer: {
            id: 'buffer',
            label: 'Подушка безопасности',
            minReq: 0,
            allocated: allocB,
            priority: 2,
            items: []
        },
        goals: {
            id: 'goals',
            label: 'Цели',
            minReq: 0,
            allocated: allocG,
            priority: 3,
            items: goals.map(g => ({ ...g, amount: 0 })) // Individual goal alloc logic separate
        },
        discretionary: {
            id: 'discretionary',
            label: 'Развлечения',
            minReq: 0,
            allocated: allocD,
            priority: 4,
            items: []
        }
    };
}

// 2. Cashflow Recursion
export function simulateCashflow(
    input: PaydayInput,
    allocations: Record<BucketType, AllocationBucket>
): { flow: PlannedFlow[]; lowest: number; riskDay: number | null } {
    const { currentBalance, paydayDate, nextPaydayDate, mandatories } = input;

    const start = new Date(paydayDate).getTime();
    const end = new Date(nextPaydayDate).getTime();
    const days = Math.ceil((end - start) / ONE_DAY_MS);

    const flow: PlannedFlow[] = [];
    let balance = currentBalance;
    let lowest = balance;
    let riskDay: number | null = null;

    // On Day 0 (Payday), we receive Income.
    // NOTE: Does 'currentBalance' already include this payday?
    // Usually "Planner" happens *before* or *on* payday.
    // Let's assume we add paydayAmount to balance on Day 0.
    balance += input.paydayAmount;

    for (let t = 0; t <= days; t++) {
        const currentDate = new Date(start + t * ONE_DAY_MS);
        const dayOfMonth = currentDate.getDate();

        // Outflows
        // 1. Mandatories (Bills)
        // Find bills checking Due Day
        // Simplified: if dueDay == dayOfMonth, pay it.
        // We should map mandatories to specific occurrences in this window.
        const dayBills = mandatories.filter(m => m.dueDay === dayOfMonth);
        const billsTotal = dayBills.reduce((sum, m) => sum + m.amount, 0);

        // 2. Daily Burn (Discretionary spread)
        // We assume Discretionary allocated is spent evenly?
        // Or we don't simulate discretionary outflow specifically on dates, 
        // just treating it as "consumed" or leaving it in balance?
        // To catch "Risk", we usually only simulate FIXED outflows.
        // If we simulate discretionary, we lower balance.
        // Let's simulate Discretionary / days burn.
        const dailyDisc = Math.max(0, allocations.discretionary.allocated / days);

        // Inflow
        // Only initial payday (handled at t=0 start) or other events?
        // We added payday at t=0.

        const outflow = billsTotal + dailyDisc;
        balance -= outflow;

        if (balance < lowest) lowest = balance;
        if (balance < 0 && riskDay === null) riskDay = t;

        flow.push({
            day: t,
            date: currentDate.toISOString(),
            inflow: t === 0 ? input.paydayAmount : 0,
            outflow: outflow,
            balance: balance,
            description: dayBills.length > 0 ? `Paid: ${dayBills.map(b => b.name).join(', ')}` : undefined
        });
    }

    return { flow, lowest, riskDay };
}
