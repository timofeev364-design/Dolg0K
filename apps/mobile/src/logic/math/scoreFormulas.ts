/**
 * Scientific Financial Health Score Math
 * Implements standard credit risk and financial health metrics with logistic scoring.
 */

export type FinancialProfile = {
    monthlyIncome: number;
    monthlyMandatoryExpenses: number; // Rent, Food, Utilities
    monthlyDebtPayments: number; // Min payments
    totalLiquidAssets: number; // Cash, Savings
    totalDebt: number; // Excl mortgage ideally, but total for now
};

export type ScoreFactor = {
    id: 'DSR' | 'RC' | 'LR' | 'BO' | 'DBR';
    label: string;
    value: number; // Raw metric value
    score: number; // 0-100 normalized score
    weight: number; // Importance 0-1
    contribution: number; // Points contributed to total
    impact: 'positive' | 'negative' | 'neutral';
    recommendation?: string;
};

export type HealthScoreResult = {
    totalScore: number; // 0-1000
    rating: 'Отлично' | 'Хорошо' | 'Нормально' | 'Плохо' | 'Критично' | string;
    factors: ScoreFactor[];
};

// --- Logistic Transform Helper ---
// Maps input x to 0..100 based on midpoint x0 and steepness k
// type: 'growth' (higher is better) or 'decay' (lower is better)
function logisticScore(
    x: number,
    x0: number,
    k: number,
    type: 'growth' | 'decay'
): number {
    // Sigmoid: 1 / (1 + exp(-k*(x-x0)))
    // We want range 0..100.
    // Growth: Higher x -> Higher score.
    // Decay: Higher x -> Lower score.

    if (type === 'growth') {
        return 100 / (1 + Math.exp(-k * (x - x0)));
    } else {
        // For decay (like debt), we want 100 at 0, and 0 at high.
        // Standard sigmoid grows. So we compute growth of negative x?
        // Or just 100 - growth(x).
        return 100 * (1 - (1 / (1 + Math.exp(-k * (x - x0)))));
    }
}

// --- Metrics Calculation ---

// 1. DSR: Debt Service Ratio = DebtPayments / Income
// Good: < 30%. Bad: > 50%.
// x0 approx 0.40. k needs to map 0.3->80, 0.5->20.
export function calculateDSRScore(dsr: number): number {
    return logisticScore(dsr, 0.40, 15, 'decay');
}

// 2. RC: Reserve Coverage = LiquidAssets / Mandatory
// Good: > 6 months. Bad: < 1 month.
// x0 approx 3. k maps 1->20, 6->90.
export function calculateRCScore(rc: number): number {
    // Cap RC at 12 to avoid infinity influencing score too easily? Sigmoid handles it.
    return logisticScore(rc, 3.0, 0.8, 'growth');
}

// 3. LR: Liquidity Ratio = LiquidAssets / TotalDebt
// Good: > 50% (can pay off half). Bad: 0.
// x0 approx 0.25 (can pay quarter).
// If TotalDebt is 0, Score is 100.
export function calculateLRScore(liquid: number, debt: number): number {
    if (debt === 0) return 100;
    const lr = liquid / debt;
    return logisticScore(lr, 0.25, 5, 'growth');
}

// 4. BO: Burnout / Free Cash Flow Ratio = (Income - Mandatory - DebtPayments) / Income
// "Surplus Ratio".
// Good: > 20% savings rate. Bad: < 0%.
// x0 approx 0.10.
export function calculateBOScore(surplusRatio: number): number {
    return logisticScore(surplusRatio, 0.10, 15, 'growth');
}

// 5. DBR: Debt Burden Ratio = TotalDebt / AnnualIncome
// Good: < 30%. Bad: > 100%.
// x0 approx 0.6.
export function calculateDBRScore(dbr: number): number {
    return logisticScore(dbr, 0.60, 4, 'decay');
}

// --- Main Calculator ---
export function calculateHealthScore(profile: FinancialProfile): HealthScoreResult {
    const { monthlyIncome, monthlyMandatoryExpenses, monthlyDebtPayments, totalLiquidAssets, totalDebt } = profile;

    // Guard zero income
    const safeIncome = Math.max(monthlyIncome, 1);
    const safeMandatory = Math.max(monthlyMandatoryExpenses, 1);

    // Raw Metrics
    const dsr = monthlyDebtPayments / safeIncome;
    const rc = totalLiquidAssets / safeMandatory;
    const lr = totalDebt > 0 ? totalLiquidAssets / totalDebt : 1; // 1.0 (100%) if no debt
    const surplus = monthlyIncome - monthlyMandatoryExpenses - monthlyDebtPayments;
    const surplusRatio = surplus / safeIncome;
    const dbr = totalDebt / (safeIncome * 12);

    // Scores
    const s_dsr = calculateDSRScore(dsr);
    const s_rc = calculateRCScore(rc);
    const s_lr = totalDebt === 0 ? 100 : calculateLRScore(totalLiquidAssets, totalDebt);
    const s_bo = calculateBOScore(surplusRatio);
    const s_dbr = calculateDBRScore(dbr);

    // Weights (Must sum to 1.0)
    // DSR: 25% (Cashflow danger)
    // RC: 25% (Safety net)
    // BO: 20% (Growth potential)
    // DBR: 15% (Long term burden)
    // LR: 15% (Solvency)
    const weights = {
        DSR: 0.25,
        RC: 0.25,
        BO: 0.20,
        DBR: 0.15,
        LR: 0.15
    };

    // Weighted Sum
    const weightedSum =
        s_dsr * weights.DSR +
        s_rc * weights.RC +
        s_bo * weights.BO +
        s_dbr * weights.DBR +
        s_lr * weights.LR;

    // Total Score scaled to 0-1000
    const totalScore = Math.round(weightedSum * 10);

    // Rating
    let rating: HealthScoreResult['rating'] = 'Критично';
    if (totalScore >= 900) rating = 'Отлично';
    else if (totalScore >= 750) rating = 'Хорошо';
    else if (totalScore >= 600) rating = 'Нормально';
    else if (totalScore >= 400) rating = 'Плохо';
    else rating = 'Критично';

    // Construct Factors List
    const factors: ScoreFactor[] = [
        {
            id: 'DSR',
            label: 'Обслуживание долга (DSR)',
            value: dsr,
            score: s_dsr,
            weight: weights.DSR,
            contribution: s_dsr * weights.DSR * 10,
            impact: s_dsr > 80 ? 'positive' : s_dsr < 50 ? 'negative' : 'neutral',
            recommendation: s_dsr < 60 ? 'Рефинансируйте дорогие кредиты или увеличьте доход.' : undefined
        },
        {
            id: 'RC',
            label: 'Запас прочности (RC)',
            value: rc,
            score: s_rc,
            weight: weights.RC,
            contribution: s_rc * weights.RC * 10,
            impact: s_rc > 80 ? 'positive' : s_rc < 50 ? 'negative' : 'neutral',
            recommendation: s_rc < 60 ? 'Сформируйте подушку безопасности минимум на 3 месяца.' : undefined
        },
        {
            id: 'BO',
            label: 'Свободные деньги (BO)',
            value: surplusRatio,
            score: s_bo,
            weight: weights.BO,
            contribution: s_bo * weights.BO * 10,
            impact: s_bo > 80 ? 'positive' : s_bo < 50 ? 'negative' : 'neutral',
            recommendation: s_bo < 50 ? 'Проверьте подписки и регулярные расходы.' : undefined
        },
        {
            id: 'DBR',
            label: 'Долговая нагрузка (DBR)',
            value: dbr,
            score: s_dbr,
            weight: weights.DBR,
            contribution: s_dbr * weights.DBR * 10,
            impact: s_dbr > 80 ? 'positive' : s_dbr < 50 ? 'negative' : 'neutral',
        },
        {
            id: 'LR',
            label: 'Платежеспособность (LR)',
            value: lr,
            score: s_lr,
            weight: weights.LR,
            contribution: s_lr * weights.LR * 10,
            impact: s_lr > 80 ? 'positive' : s_lr < 50 ? 'negative' : 'neutral',
        }
    ];

    // Sort factors by "worst impact" first to highlight what to fix
    factors.sort((a, b) => a.score - b.score);

    return {
        totalScore,
        rating,
        factors
    };
}
