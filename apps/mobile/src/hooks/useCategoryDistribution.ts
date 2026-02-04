import { useState, useEffect, useCallback } from 'react';
import {
    DistributionItem,
    DistributionConfig,
    DistributionMode, // Added import
    amountFromPercent,
    percentFromAmount,
    scaleItems,
    getTotals
} from '../logic/math/distribution';
import { FinancialCategory } from '../context/FinancialContext';

export interface ExtendedCategory extends DistributionItem {
    name: string;
    icon: string;
    colorToken: string;
    originalId: string;
}

export function useCategoryDistribution(
    initialIncome: number,
    categories: FinancialCategory[],
    initialBudgets: Record<string, number>, // categoryId -> amount
    onSync: (categoryId: string, amount: number) => void
) {
    // Config
    const [config, setConfig] = useState<DistributionConfig>({
        income: initialIncome,
        roundingStep: 10,
        maxTotalPercent: 100,
        normalizationMode: 'auto-scale',
        priorityMode: 'mandatory-first'
    });

    // Internal State
    const [items, setItems] = useState<ExtendedCategory[]>(() => {
        return categories.map(cat => {
            const amount = initialBudgets[cat.id] || 0;
            const percent = percentFromAmount(amount, initialIncome);
            return {
                id: cat.id,
                originalId: cat.id,
                name: cat.name,
                icon: cat.icon,
                colorToken: cat.colorToken,
                isLocked: false,
                mode: 'amount', // Default to amount editing
                amount,
                percent,
                group: (cat.id === 'housing' || cat.id === 'shops') ? 'mandatory' : (cat.id === 'savings' ? 'savings' : 'flexible')
            };
        });
    });

    // Update income config when prop changes
    useEffect(() => {
        setConfig(prev => ({ ...prev, income: initialIncome }));
        // When income changes, if mode is %, update amounts.
        // If mode is Amount, update percents.
        setItems(prev => prev.map(item => {
            if (item.mode === 'percent') {
                const newAmount = amountFromPercent(item.percent, initialIncome, config.roundingStep);
                return { ...item, amount: newAmount };
            } else {
                const newPercent = percentFromAmount(item.amount, initialIncome);
                return { ...item, percent: newPercent };
            }
        }));
    }, [initialIncome, config.roundingStep]);

    // Main Edit Handler
    const updateItem = useCallback((id: string, updates: Partial<DistributionItem>) => {
        setItems(prev => {
            const targetIndex = prev.findIndex(i => i.id === id);
            if (targetIndex === -1) return prev;

            const oldItem = prev[targetIndex];
            const newItem = { ...oldItem, ...updates };

            // Recalculate counterpart
            if (newItem.mode === 'percent') {
                newItem.amount = amountFromPercent(newItem.percent, config.income, config.roundingStep);
            } else {
                newItem.percent = percentFromAmount(newItem.amount, config.income);
            }

            const deltaAmount = newItem.amount - oldItem.amount;

            // Clone items
            let nextItems = [...prev];
            nextItems[targetIndex] = newItem;

            // Logic A: Decrease -> Redistribute Surplus to ALL others (User request: "redistribute between other points")
            if (deltaAmount < 0) {
                const surplus = -deltaAmount;
                const others = nextItems.filter(i => i.id !== newItem.id && !i.isLocked);

                if (others.length > 0) {
                    const totalOthers = others.reduce((sum, i) => sum + i.amount, 0);
                    let distributed = 0;

                    others.forEach((other, index) => {
                        let share = 0;
                        if (totalOthers > 0) {
                            share = (other.amount / totalOthers) * surplus;
                        } else {
                            share = surplus / others.length;
                        }

                        // Last item adjustment to catch rounding errors ?? May not be needed if using float logic until end

                        const idx = nextItems.findIndex(i => i.id === other.id);
                        const newAmt = other.amount + share;
                        nextItems[idx] = {
                            ...other,
                            amount: newAmt,
                            percent: percentFromAmount(newAmt, config.income)
                        };
                    });
                }
            }
            // Logic B: Increase -> Take from SAME GROUP first, then others (User request: "limit on other non-mandatory should decrease")
            else if (deltaAmount > 0) {
                const deficit = deltaAmount;
                let remainingDeficit = deficit;

                // 1. Try same group
                const groupPeers = nextItems.filter(i => i.id !== newItem.id && !i.isLocked && i.group === newItem.group);
                if (groupPeers.length > 0) {
                    const totalGroup = groupPeers.reduce((sum, i) => sum + i.amount, 0);

                    groupPeers.forEach(peer => {
                        let take = 0;
                        if (totalGroup > 0) {
                            take = (peer.amount / totalGroup) * deficit;
                            take = Math.min(take, peer.amount); // Don't take more than available
                        }

                        if (take > 0) {
                            const idx = nextItems.findIndex(i => i.id === peer.id);
                            const newAmt = peer.amount - take;
                            nextItems[idx] = { ...peer, amount: newAmt, percent: percentFromAmount(newAmt, config.income) };
                            remainingDeficit -= take;
                        }
                    });
                }

                // 2. If still deficit (e.g. group exhausted), take from others
                if (remainingDeficit > 1) { // Threshold for float noise
                    const otherPeers = nextItems.filter(i => i.id !== newItem.id && !i.isLocked && i.group !== newItem.group);
                    if (otherPeers.length > 0) {
                        const totalOther = otherPeers.reduce((sum, i) => sum + i.amount, 0);
                        otherPeers.forEach(peer => {
                            let take = 0;
                            if (totalOther > 0) {
                                take = (peer.amount / totalOther) * remainingDeficit;
                                take = Math.min(take, peer.amount);
                            }

                            if (take > 0) {
                                const idx = nextItems.findIndex(i => i.id === peer.id);
                                const newAmt = peer.amount - take;
                                nextItems[idx] = { ...peer, amount: newAmt, percent: percentFromAmount(newAmt, config.income) };
                            }
                        });
                    }
                }
            }

            return nextItems;
        });
    }, [config]);

    // Effect to sync back to parent
    useEffect(() => {
        // Debounce syncing? Or straight sync?
        // Let's do straight for now as per "interactive" requirement
        items.forEach(item => {
            // Only sync if value changed meaningfully?
            // Parent handles "if diff".
            onSync(item.id, item.amount);
        });
    }, [items, onSync]);

    const setPreset = useCallback((preset: 'conservative' | 'balanced' | 'aggressive' | 'minimal') => {
        setItems(prev => {
            let splits = { mandatory: 0, savings: 0, flexible: 0 };
            switch (preset) {
                case 'conservative': splits = { mandatory: 70, savings: 20, flexible: 10 }; break;
                case 'balanced': splits = { mandatory: 60, savings: 20, flexible: 20 }; break;
                case 'aggressive': splits = { mandatory: 55, savings: 30, flexible: 15 }; break;
                case 'minimal': splits = { mandatory: 80, savings: 10, flexible: 10 }; break;
            }

            // Normalize within groups
            const groups = {
                mandatory: prev.filter(i => i.group === 'mandatory'),
                savings: prev.filter(i => i.group === 'savings'),
                flexible: prev.filter(i => i.group === 'flexible')
            };

            // Helper to distribute percentage across a group evenly
            const distribute = (groupItems: ExtendedCategory[], totalP: number) => {
                if (groupItems.length === 0) return [];
                const pPerItem = totalP / groupItems.length;
                return groupItems.map(i => ({
                    ...i,
                    mode: 'percent' as DistributionMode, // Force percent mode for presets
                    percent: pPerItem,
                    amount: amountFromPercent(pPerItem, config.income, config.roundingStep)
                }));
            };

            return [
                ...distribute(groups.mandatory, splits.mandatory),
                ...distribute(groups.savings, splits.savings),
                ...distribute(groups.flexible, splits.flexible),
            ].sort((a, b) => prev.findIndex(p => p.id === a.id) - prev.findIndex(p => p.id === b.id)); // keep order
        });
    }, [config]);

    return {
        items,
        config,
        setConfig,
        updateItem,
        setPreset,
        stats: {
            ...getTotals(items),
            remainingAmount: Math.max(0, config.income - getTotals(items).totalAmount),
            remainingPercent: Math.max(0, 100 - getTotals(items).totalPercent)
        }
    };
}
