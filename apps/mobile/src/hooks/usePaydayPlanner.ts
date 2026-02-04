import { useState, useMemo } from 'react';
import {
    PaydayInput,
    AllocationBucket,
    calculateAllocation,
    simulateCashflow,
    BucketType
} from '../logic/math/paydayFormulas';

export function usePaydayPlanner(initialInput: PaydayInput) {
    const [overrides, setOverrides] = useState<Record<BucketType, number> | undefined>(undefined);

    // 1. Calculate Allocations (Recalculate on input or overrides change)
    const allocations = useMemo(() => {
        return calculateAllocation(initialInput, overrides);
    }, [initialInput, overrides]);

    // 2. Simulate Cashflow based on Allocations
    const simulation = useMemo(() => {
        return simulateCashflow(initialInput, allocations);
    }, [initialInput, allocations]);

    // 3. Helper to update a specific bucket (slide)
    // When one bucket changes, we must adjust others to keep sum = income.
    // This is a complex interaction usually.
    // Simplified: "Discretionary" absorbs changes.
    const updateAllocation = (type: BucketType, newValue: number) => {
        if (type === 'discretionary') return; // Usually calculated residual

        const currentAlloc = allocations;
        const diff = newValue - currentAlloc[type].allocated;

        // Take from discretionary
        // If discretionary < diff, we can't increase.
        // (Validation logic here)

        // For now, simpler: Just set override and let calculateAllocation handle?
        // But calculateAllocation is pure recommended.
        // We need stateful overrides.

        setOverrides(prev => {
            const safePrev = prev || {
                mandatory: allocations.mandatory.allocated,
                buffer: allocations.buffer.allocated,
                goals: allocations.goals.allocated,
                discretionary: allocations.discretionary.allocated
            };

            // Adjust discretionary to balance
            const newDisc = safePrev.discretionary - diff;

            return {
                ...safePrev,
                [type]: newValue,
                discretionary: newDisc
            };
        });
    };

    return {
        allocations,
        simulation,
        updateAllocation,
        isRisk: simulation.lowest < 0
    };
}
