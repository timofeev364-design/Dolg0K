/**
 * Plan7 generation logic for Babki / Anti-Delay
 * Генерация 7-дневного плана действий
 */

import { v4 as uuidv4 } from 'uuid';
import type { Obligation, PlanAction, Plan7Input, RiskLevel } from './types';

/**
 * Генерирует уникальный ID (fallback если uuid недоступен)
 */
function generateId(): string {
    if (typeof uuidv4 === 'function') {
        return uuidv4();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Форматирует дату в читаемый формат
 */
function formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/**
 * Получает дату дедлайна платежа в текущем/следующем месяце
 */
function getPaymentDeadline(obligation: Obligation, weekStart: Date): Date {
    const deadline = new Date(weekStart);
    deadline.setDate(obligation.dueDay);

    // Если день уже прошёл в текущем месяце, берём следующий
    if (deadline < weekStart) {
        deadline.setMonth(deadline.getMonth() + 1);
    }

    return deadline;
}

/**
 * Сортирует платежи по срочности
 */
function sortByUrgency(obligations: Obligation[], weekStart: Date): Obligation[] {
    return [...obligations].sort((a, b) => {
        const deadlineA = getPaymentDeadline(a, weekStart);
        const deadlineB = getPaymentDeadline(b, weekStart);
        return deadlineA.getTime() - deadlineB.getTime();
    });
}

/**
 * Генерирует действия на основе платежа
 */
function generatePaymentActions(
    obligation: Obligation,
    weekStart: Date,
    priority: number
): PlanAction[] {
    const actions: PlanAction[] = [];
    const deadline = getPaymentDeadline(obligation, weekStart);
    const deadlineStr = formatDate(deadline);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Действие: оплатить
    actions.push({
        id: generateId(),
        text: `💳 Оплатить "${obligation.name}" (${obligation.amount.toLocaleString('ru-RU')} ₽) до ${deadlineStr}`,
        priority,
        isDone: false,
        weekStart: weekStartStr,
        obligationId: obligation.id,
        createdAt: new Date().toISOString(),
    });

    return actions;
}

/**
 * Генерирует общие советы в зависимости от уровня риска
 */
function generateRiskBasedTips(
    riskLevel: RiskLevel,
    weekStart: Date,
    basePriority: number
): PlanAction[] {
    const tips: PlanAction[] = [];
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const lowRiskTips = [
        '✅ Отложите 10% от свободных средств в резерв',
        '📊 Проверьте подписки — возможно, что-то можно отключить',
    ];

    const mediumRiskTips = [
        '⚠️ Составьте список необязательных расходов, которые можно отложить',
        '📞 Если есть сложности — позвоните кредитору заранее',
        '💡 Проверьте возможность рассрочки у поставщиков услуг',
    ];

    const highRiskTips = [
        '🚨 Свяжитесь с кредиторами ДО просрочки — это важно!',
        '📝 Подготовьте заявление о реструктуризации (см. Шаблоны)',
        '🛑 Заморозьте все необязательные траты на неделю',
        '💬 Обсудите ситуацию с близкими — возможна временная помощь',
    ];

    let selectedTips: string[];
    switch (riskLevel) {
        case 'high':
            selectedTips = highRiskTips;
            break;
        case 'medium':
            selectedTips = mediumRiskTips;
            break;
        default:
            selectedTips = lowRiskTips;
    }

    selectedTips.forEach((tip, index) => {
        tips.push({
            id: generateId(),
            text: tip,
            priority: basePriority + index,
            isDone: false,
            weekStart: weekStartStr,
            createdAt: new Date().toISOString(),
        });
    });

    return tips;
}

/**
 * Основная функция генерации 7-дневного плана
 */
export function generatePlan7(input: Plan7Input): PlanAction[] {
    const { obligations, riskResult, weekStart } = input;
    const actions: PlanAction[] = [];

    // 1. Фильтруем неоплаченные платежи
    const unpaidObligations = obligations.filter(o => !o.isPaid);

    // 2. Сортируем по срочности
    const sortedObligations = sortByUrgency(unpaidObligations, weekStart);

    // 3. Генерируем действия для каждого платежа (макс 5)
    const topObligations = sortedObligations.slice(0, 5);
    let priority = 1;

    topObligations.forEach(obligation => {
        const paymentActions = generatePaymentActions(obligation, weekStart, priority);
        actions.push(...paymentActions);
        priority += paymentActions.length;
    });

    // 4. Добавляем советы в зависимости от уровня риска
    const tips = generateRiskBasedTips(riskResult.level, weekStart, priority);
    actions.push(...tips);

    return actions;
}

/**
 * Получает начало текущей недели (понедельник)
 */
export function getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Проверяет, актуален ли план для текущей недели
 */
export function isPlanCurrentWeek(planWeekStart: string, today: Date = new Date()): boolean {
    const currentWeekStart = getWeekStart(today);
    const currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];
    return planWeekStart === currentWeekStartStr;
}
