/**
 * Plan7 generation tests
 */

import { generatePlan7, getWeekStart, isPlanCurrentWeek } from '@babki/core';
import type { Obligation, RiskResult } from '@babki/core';

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

const createRiskResult = (overrides: Partial<RiskResult> = {}): RiskResult => ({
    level: 'medium',
    amountDueBeforeSalary: 5000,
    daysUntilSalary: 10,
    atRiskPayments: [],
    ...overrides,
});

describe('getWeekStart', () => {
    it('returns Monday for a Wednesday', () => {
        const wednesday = new Date(2024, 0, 10); // Wed Jan 10, 2024
        const monday = getWeekStart(wednesday);
        expect(monday.getDay()).toBe(1); // Monday
        expect(monday.getDate()).toBe(8);
    });

    it('returns same day for a Monday', () => {
        const monday = new Date(2024, 0, 8); // Mon Jan 8, 2024
        const result = getWeekStart(monday);
        expect(result.getDate()).toBe(8);
    });
});

describe('generatePlan7', () => {
    it('generates actions for unpaid obligations', () => {
        const obligations = [
            createObligation({ id: '1', name: 'Rent', amount: 15000 }),
            createObligation({ id: '2', name: 'Utilities', amount: 3000 }),
        ];

        const result = generatePlan7({
            obligations,
            riskResult: createRiskResult(),
            weekStart: new Date(2024, 0, 8),
        });

        expect(result.length).toBeGreaterThan(0);
        expect(result.some(a => a.text.includes('Rent'))).toBe(true);
        expect(result.some(a => a.text.includes('Utilities'))).toBe(true);
    });

    it('excludes paid obligations', () => {
        const obligations = [
            createObligation({ id: '1', name: 'Rent', isPaid: true }),
            createObligation({ id: '2', name: 'Utilities', isPaid: false }),
        ];

        const result = generatePlan7({
            obligations,
            riskResult: createRiskResult(),
            weekStart: new Date(2024, 0, 8),
        });

        expect(result.some(a => a.text.includes('Rent'))).toBe(false);
        expect(result.some(a => a.text.includes('Utilities'))).toBe(true);
    });

    it('includes risk-based tips', () => {
        const result = generatePlan7({
            obligations: [createObligation()],
            riskResult: createRiskResult({ level: 'high' }),
            weekStart: new Date(2024, 0, 8),
        });

        // High risk tips should be present
        expect(result.some(a => a.text.includes('кредитор') || a.text.includes('заморозьте'))).toBe(true);
    });
});

describe('isPlanCurrentWeek', () => {
    it('returns true for current week', () => {
        const today = new Date(2024, 0, 10); // Wed
        const weekStart = getWeekStart(today).toISOString().split('T')[0];
        expect(isPlanCurrentWeek(weekStart, today)).toBe(true);
    });

    it('returns false for different week', () => {
        const today = new Date(2024, 0, 10);
        const oldWeekStart = '2024-01-01';
        expect(isPlanCurrentWeek(oldWeekStart, today)).toBe(false);
    });
});
