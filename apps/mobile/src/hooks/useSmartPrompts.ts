import { useMemo } from 'react';
import {
    SmartPrompt,
    Transaction,
    detectSubscriptions,
    recommendDebtStrategy,
    analyzeBudgetRisks,
    analyzeScoreDrop
} from '../logic/intelligence/promptRules';
import { Debt } from '../logic/math/debtFormulas';
import { ScoreFactor } from '../logic/math/scoreFormulas';

type UseSmartPromptsProps = {
    transactions?: Transaction[];
    debts?: Debt[];
    budgets?: { name: string; probOverrun: number; limit: number; forecast: number }[];
    prevScoreFactors?: ScoreFactor[];
    currentScoreFactors?: ScoreFactor[];
};

export function useSmartPrompts({
    transactions = [],
    debts = [],
    budgets = [],
    prevScoreFactors = [],
    currentScoreFactors = []
}: UseSmartPromptsProps) {

    return useMemo(() => {
        const allPrompts: SmartPrompt[] = [];

        // 1. Subscriptions
        if (transactions.length > 0) {
            const subPrompts = detectSubscriptions(transactions);
            allPrompts.push(...subPrompts);
        }

        // 2. Debts
        if (debts.length > 0) {
            const debtPrompt = recommendDebtStrategy(debts);
            if (debtPrompt) allPrompts.push(debtPrompt);
        }

        // 3. Budgets
        if (budgets.length > 0) {
            const budgetPrompts = analyzeBudgetRisks(budgets);
            allPrompts.push(...budgetPrompts);
        }

        // 4. Score
        if (prevScoreFactors.length > 0 && currentScoreFactors.length > 0) {
            const scorePrompts = analyzeScoreDrop(prevScoreFactors, currentScoreFactors);
            allPrompts.push(...scorePrompts);
        }

        // Sort by confidence
        return allPrompts.sort((a, b) => b.confidence - a.confidence);

    }, [transactions, debts, budgets, prevScoreFactors, currentScoreFactors]);
}
