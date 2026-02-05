import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Budget } from '../core';
import { Envelope } from '../logic/math/envelopeFormulas';
import { Debt } from '../logic/math/debtFormulas';

export type DebtItem = Debt; // Alias for compatibility

export interface Transaction {
    id: string;
    categoryId: string;
    amount: number;
    date: string;
    note?: string;
}

export interface FinancialCategory {
    id: string;
    name: string;
    icon: string;
    colorToken: string;
    type: 'expense' | 'income';
}

export interface GlobalFinancialState {
    // Income & Assets
    monthlyIncome: number;
    currentBalance: number; // Liquid Assets

    // Expenses Breakdown
    housingCost: number;
    foodCost: number;

    // Collections
    debts: DebtItem[];
    goals: Envelope[];
    budgets: Budget[];

    // New: Transactions & Categories
    transactions: Transaction[];
    categories: FinancialCategory[];

    // Actions
    updateIncome: (val: number) => void;
    updateBalance: (val: number) => void;
    updateHousing: (val: number) => void;
    updateFood: (val: number) => void;

    addDebt: (debt: DebtItem) => void;
    removeDebt: (id: string) => void;

    addGoal: (goal: Envelope) => void;
    removeGoal: (id: string) => void;
    updateGoal: (id: string, updates: Partial<Envelope>) => void;
    fundGoal: (id: string, amount: number) => void;

    addTransaction: (t: Transaction) => void;
    removeTransaction: (id: string) => void;

    updateBudget: (categoryId: string, limit: number) => void;

    // Computed (Helpers)
    totalDebt: number;
    totalMinPayments: number;
    totalMandatory: number;

    resetAllData: () => Promise<void>;
}

const FinancialContext = createContext<GlobalFinancialState | undefined>(undefined);

export function FinancialProvider({ children }: { children: ReactNode }) {
    // Default seed data matching what we saw in screenshots/mocks
    const [monthlyIncome, setMonthlyIncome] = useState(60000);
    const [currentBalance, setCurrentBalance] = useState(5000);
    const [housingCost, setHousingCost] = useState(20000);
    const [foodCost, setFoodCost] = useState(15000);

    const [debts, setDebts] = useState<DebtItem[]>([]);

    const [goals, setGoals] = useState<Envelope[]>([
        { id: 'emergency_fund', name: 'Подушка безопасности', targetAmount: 100000, currentAmount: 27000, priority: 1, deadline: '2025-01-01' }
    ]);

    const [budgets, setBudgets] = useState<Budget[]>([]);

    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const [categories] = useState<FinancialCategory[]>([
        { id: 'shops', name: 'Магазины', icon: 'shopping-cart', colorToken: '#FF5A6B', type: 'expense' },
        { id: 'marketplaces', name: 'Маркетплейсы', icon: 'package', colorToken: '#FF9F43', type: 'expense' },
        { id: 'housing', name: 'Жилье', icon: 'home', colorToken: '#A78BFA', type: 'expense' },
        { id: 'entertainment', name: 'Развлечения', icon: 'headphones', colorToken: '#F7C97B', type: 'expense' },
        { id: 'transport', name: 'Транспорт', icon: 'navigation', colorToken: '#6EE7FF', type: 'expense' },
        { id: 'taxi', name: 'Такси', icon: 'map-pin', colorToken: '#F368E0', type: 'expense' },
        { id: 'cigarettes', name: 'Сигареты', icon: 'wind', colorToken: '#576574', type: 'expense' },
        { id: 'savings', name: 'Отложил', icon: 'piggy-bank', colorToken: '#1DD1A1', type: 'expense' }, // Treating as expense for budget tracking? Or transfer?
        { id: 'coffee', name: 'Кофе', icon: 'coffee', colorToken: '#6F4E37', type: 'expense' },
        { id: 'restaurants', name: 'Рестораны/Бары', icon: 'glass', colorToken: '#8395A7', type: 'expense' },
        { id: 'unforeseen', name: 'Непредвиденные', icon: 'alert-circle', colorToken: '#FF4757', type: 'expense' },
    ]);

    // Computing derived values
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayments = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const totalMandatory = housingCost + foodCost; // + utilities etc if we add them

    const updateIncome = (val: number) => setMonthlyIncome(val);
    const updateBalance = (val: number) => setCurrentBalance(val);
    const updateHousing = (val: number) => setHousingCost(val);
    const updateFood = (val: number) => setFoodCost(val);

    const addDebt = (debt: DebtItem) => setDebts(prev => [...prev, debt]);
    const removeDebt = (id: string) => setDebts(prev => prev.filter(d => d.id !== id));

    const addGoal = (goal: Envelope) => setGoals(prev => [...prev, goal]);
    const removeGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));
    const fundGoal = (id: string, amount: number) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    };

    const addTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev]);
    const removeTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));

    const updateBudget = (categoryId: string, limit: number) => {
        setBudgets(prev => {
            const existing = prev.find(b => b.categoryId === categoryId);
            if (existing) {
                return prev.map(b => b.categoryId === categoryId ? { ...b, limit } : b);
            } else {
                return [...prev, {
                    id: Date.now().toString(),
                    categoryId,
                    limit,
                    amount: 0,
                    periodType: 'month',
                    periodStart: new Date().toISOString(),
                    periodEnd: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    thresholds: { warning: 0.8, danger: 1.0, exceeded: 0 }
                }];
            }
        });
    };

    const updateGoal = (id: string, updates: Partial<Envelope>) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    };

    const resetAllData = async () => {
        setMonthlyIncome(0);
        setCurrentBalance(0);
        setHousingCost(0);
        setFoodCost(0);
        setDebts([]);
        setGoals([]);
        setBudgets([]);
        setTransactions([]);

        try {
            const { getStorage } = require('../db');
            const storage = getStorage();
            await storage.saveSettings({ onboardingCompleted: false });
        } catch (e) {
            console.error("Failed to reset storage settings", e);
        }
    };

    return (
        <FinancialContext.Provider value={{
            monthlyIncome,
            currentBalance,
            housingCost,
            foodCost,
            debts,
            goals,
            budgets,
            transactions,
            categories,
            updateIncome,
            updateBalance,
            updateHousing,
            updateFood,
            addDebt,
            removeDebt,
            addGoal,
            removeGoal,
            updateGoal,
            fundGoal,
            addTransaction,
            removeTransaction,
            updateBudget,
            totalDebt,
            totalMinPayments,
            totalMandatory,
            resetAllData
        }}>
            {children}
        </FinancialContext.Provider>
    );
}

export function useFinancialData() {
    const context = useContext(FinancialContext);
    if (!context) {
        throw new Error('useFinancialData must be used within a FinancialProvider');
    }
    return context;
}
