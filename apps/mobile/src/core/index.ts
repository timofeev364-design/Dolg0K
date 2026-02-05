/**
 * @babki/core - Shared types and logic
 * Экспорт всех модулей пакета
 */

// Types
export * from './types';

// Risk calculation
export {
    calculateRisk,
    getDaysUntilSalary,
    getUnpaidPaymentsBeforeSalary,
    isPaymentBeforeSalary,
    getRiskColor,
    getRiskLabel,
} from './risk';

// Plan7 generation
export {
    generatePlan7,
    getWeekStart,
    isPlanCurrentWeek,
} from './plan7';

// Templates
export {
    ALL_PLAN_TEMPLATES,
    TEMPLATES_DISCLAIMER,
    getTemplatesByCategory,
    getTemplateById,
    getTemplateCategories,
} from './templates';

export * from './message_templates';

export { PlanGenerator } from './generator';

export * from './logic/budgetMath'; // Export Budget Math
