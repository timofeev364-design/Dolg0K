/**
 * Risk calculation tests
 */

import { calculateRisk, getDaysUntilSalary, isPaymentBeforeSalary } from '@babki/core';
import type { Obligation } from '@babki/core';

const createObligation = (overrides: Partial<Obligation> = {}): Obligation => ({
    id: '1',
    name: 'Test Payment',
    amount: 1000,
    dueDay: 15,
    category: 'other',
    isPaid: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
});

describe('getDaysUntilSalary', () => {
    it('returns days until salary in current month', () => {
        const today = new Date(2024, 0, 5); // Jan 5
        const salaryDay = 10;
        expect(getDaysUntilSalary(today, salaryDay)).toBe(5);
    });

    it('returns days until salary in next month', () => {
        const today = new Date(2024, 0, 15); // Jan 15
        const salaryDay = 10;
        const result = getDaysUntilSalary(today, salaryDay);
        expect(result).toBeGreaterThan(20);
    });
});

describe('isPaymentBeforeSalary', () => {
    it('returns true for payment before salary day', () => {
        const today = new Date(2024, 0, 5); // Jan 5
        const obligation = createObligation({ dueDay: 8 });
        expect(isPaymentBeforeSalary(obligation, today, 10)).toBe(true);
    });

    it('returns false for payment after salary day', () => {
        const today = new Date(2024, 0, 5); // Jan 5
        const obligation = createObligation({ dueDay: 15 });
        expect(isPaymentBeforeSalary(obligation, today, 10)).toBe(false);
    });
});

describe('calculateRisk', () => {
    it('returns low risk when no unpaid payments', () => {
        const result = calculateRisk({
            obligations: [createObligation({ isPaid: true })],
            salaryDay: 10,
            today: new Date(2024, 0, 5),
        });
        expect(result.level).toBe('low');
    });

    it('returns high risk when amount exceeds 70% of balance', () => {
        const result = calculateRisk({
            obligations: [createObligation({ amount: 8000, dueDay: 8 })],
            salaryDay: 10,
            currentBalance: 10000,
            today: new Date(2024, 0, 5),
        });
        expect(result.level).toBe('high');
    });

    it('returns medium risk when amount is 30-70% of balance', () => {
        const result = calculateRisk({
            obligations: [createObligation({ amount: 5000, dueDay: 8 })],
            salaryDay: 10,
            currentBalance: 10000,
            today: new Date(2024, 0, 5),
        });
        expect(result.level).toBe('medium');
    });

    it('calculates total amount due before salary', () => {
        const result = calculateRisk({
            obligations: [
                createObligation({ id: '1', amount: 1000, dueDay: 6 }),
                createObligation({ id: '2', amount: 2000, dueDay: 8 }),
                createObligation({ id: '3', amount: 3000, dueDay: 15, isPaid: true }),
            ],
            salaryDay: 10,
            today: new Date(2024, 0, 5),
        });
        expect(result.amountDueBeforeSalary).toBe(3000); // 1000 + 2000
    });
});
