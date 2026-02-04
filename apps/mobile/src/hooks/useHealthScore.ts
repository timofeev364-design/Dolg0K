import { useMemo } from 'react';
import {
    FinancialProfile,
    HealthScoreResult,
    calculateHealthScore
} from '../logic/math/scoreFormulas';

export function useHealthScore(profile: FinancialProfile): HealthScoreResult {
    return useMemo(() => {
        return calculateHealthScore(profile);
    }, [
        profile.monthlyIncome,
        profile.monthlyMandatoryExpenses,
        profile.monthlyDebtPayments,
        profile.totalLiquidAssets,
        profile.totalDebt
    ]);
}
