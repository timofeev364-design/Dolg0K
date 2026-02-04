export type DistributionMode = 'percent' | 'amount';
export type NormalizationMode = 'strict' | 'auto-scale';
export type PriorityMode = 'mandatory-first' | 'proportional';

export interface DistributionItem {
    id: string;
    isLocked: boolean;
    mode: DistributionMode;
    percent: number; // 0-100
    amount: number; // >= 0
    group: 'mandatory' | 'flexible' | 'savings';
}

export interface DistributionConfig {
    income: number;
    roundingStep: number;
    maxTotalPercent: number;
    normalizationMode: NormalizationMode;
    priorityMode: PriorityMode;
}

// F1: Amount from percent
export const amountFromPercent = (percent: number, income: number, step: number): number => {
    return Math.round((income * percent / 100) / step) * step;
};

// F2: Percent from amount
export const percentFromAmount = (amount: number, income: number): number => {
    const safeIncome = Math.max(income, 0.01);
    return Math.min(100, Math.max(0, (amount / safeIncome) * 100));
};

// A4: Scale flexible items
export const scaleItems = (
    items: DistributionItem[],
    targetPercent: number,
    flexibleIds: Set<string>
): Record<string, number> => {
    // Determine current total of flexible items
    const currentFlexTotal = items
        .filter(i => flexibleIds.has(i.id))
        .reduce((sum, i) => sum + i.percent, 0);

    if (currentFlexTotal <= 0.01) return {};

    const scale = targetPercent / currentFlexTotal;
    const updates: Record<string, number> = {};

    items.forEach(i => {
        if (flexibleIds.has(i.id)) {
            updates[i.id] = i.percent * scale;
        }
    });

    return updates;
};

// Internal helper to get totals
export const getTotals = (items: DistributionItem[]) => {
    return {
        totalPercent: items.reduce((sum, i) => sum + i.percent, 0),
        totalAmount: items.reduce((sum, i) => sum + i.amount, 0)
    };
};
