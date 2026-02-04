/**
 * Risk calculation logic for Babki / Anti-Delay
 * Алгоритм оценки риска просрочки платежей
 */

import type { Obligation, RiskCalculationInput, RiskResult, RiskLevel } from './types';

/**
 * Вычисляет количество дней до следующего дня зарплаты
 */
export function getDaysUntilSalary(today: Date, salaryDay: number): number {
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Если сегодня день зарплаты или позже
    if (currentDay >= salaryDay) {
        // Следующая зарплата в следующем месяце
        const nextMonth = currentMonth + 1;
        const nextYear = nextMonth > 11 ? currentYear + 1 : currentYear;
        const nextSalaryDate = new Date(nextYear, nextMonth % 12, salaryDay);
        return Math.ceil((nextSalaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    } else {
        // Зарплата в этом месяце
        const salaryDate = new Date(currentYear, currentMonth, salaryDay);
        return Math.ceil((salaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
}

/**
 * Проверяет, попадает ли платёж в период до зарплаты
 */
export function isPaymentBeforeSalary(
    obligation: Obligation,
    today: Date,
    salaryDay: number
): boolean {
    const currentDay = today.getDate();
    const dueDay = obligation.dueDay;

    if (currentDay < salaryDay) {
        // Зарплата ещё будет в этом месяце
        // Платёж в зоне риска если он между сегодня и днём зарплаты
        return dueDay >= currentDay && dueDay < salaryDay;
    } else {
        // Зарплата уже была или сегодня
        // Платёж в зоне риска если он до конца месяца или в начале следующего до зарплаты
        return dueDay > currentDay || dueDay < salaryDay;
    }
}

/**
 * Фильтрует неоплаченные платежи до зарплаты
 */
export function getUnpaidPaymentsBeforeSalary(
    obligations: Obligation[],
    today: Date,
    salaryDay: number
): Obligation[] {
    return obligations.filter(o =>
        !o.isPaid && isPaymentBeforeSalary(o, today, salaryDay)
    );
}

/**
 * Рассчитывает уровень риска
 * 
 * Логика:
 * - LOW: Сумма платежей до зарплаты < 30% баланса или баланс не указан и платежей мало
 * - MEDIUM: Сумма платежей 30-70% баланса или есть платежи в ближайшие 3 дня
 * - HIGH: Сумма платежей > 70% баланса или платёж завтра/сегодня без средств
 */
/**
 * Рассчитывает уровень риска (Algorithm v2)
 * 
 * Логика:
 * 1. Проверяем просрочки (Overdue) -> Сразу HIGH
 * 2. Считаем обязательства на 7 дней вперед
 * 3. Если есть баланс, считаем нагрузку (Load = 7 days sum / Balance)
 * 4. Учитываем наличие резерва (пока просто по факту наличия баланса > суммы)
 */
export function calculateRisk(input: RiskCalculationInput): RiskResult {
    const today = input.today || new Date();
    const { obligations, salaryDay, currentBalance } = input;

    // 1. Проверка просрочек (самый критичный фактор)
    const hasOverdue = obligations.some(o => !o.isPaid && new Date(o.dueDay) < today && !o.isPaid /* Упрощение: в реале надо сравнивать полные даты */);
    // В текущей модели dueDay это число месяца.
    // Считаем просрочкой если (сегодня > dueDay) и (не оплачено) и (этот месяц)
    // Для простоты пока оставим старую логику фильтрации, но добавим флаг "просрочено"

    // Новая логика: берем платежи на ближайшие 7 дней
    const next7DaysPayments = obligations.filter(o => {
        if (o.isPaid) return false;
        const due = o.dueDay;
        const current = today.getDate();

        let diff = due - current;
        if (diff < 0) diff += 30; // Переход месяца (грубо)

        return diff >= 0 && diff <= 7;
    });

    const amountDue7Days = next7DaysPayments.reduce((sum, o) => sum + o.amount, 0);
    const amountDueBeforeSalary = getUnpaidPaymentsBeforeSalary(obligations, today, salaryDay)
        .reduce((sum, o) => sum + o.amount, 0);
    const daysUntilSalary = getDaysUntilSalary(today, salaryDay);

    let level: RiskLevel = 'low';

    // Если есть явные просрочки (пока грубая эвристика: если есть неоплаченные с dueDay < сегодня)
    // Лучше это делать через полноценные даты, но в MVP dueDay - это число.
    // Допустим, если сегодня 15, а dueDay 10 и не оплачено -> просрочка.
    const isOverdue = obligations.some(o => !o.isPaid && o.dueDay < today.getDate() && (today.getDate() - o.dueDay < 15));

    if (isOverdue) {
        level = 'high';
    } else if (currentBalance !== undefined) {
        // Есть данные о балансе
        // Если баланса не хватает даже на 7 дней -> HIGH
        if (currentBalance < amountDue7Days) {
            level = 'high';
        }
        // Если баланса хватает на 7 дней, но нагрузка высокая (> 50% баланса уйдет за неделю)
        else if (amountDue7Days > currentBalance * 0.5) {
            level = 'medium';
        }
        else {
            level = 'low';
        }
    } else {
        // Без данных о балансе - по сумме и количеству
        if (amountDue7Days > 0 && next7DaysPayments.length >= 3) {
            level = 'medium';
        }
        // Если очень крупная сумма на неделю (эвристика: > 5000р условно, но лучше без хардкода)
        // Оставим пока medium.
    }

    return {
        level,
        amountDueBeforeSalary, // Оставляем для совместимости
        daysUntilSalary,
        atRiskPayments: next7DaysPayments // Теперь возвращаем список на 7 дней
    };
}

/**
 * Возвращает цвет для уровня риска
 */
export function getRiskColor(level: RiskLevel): string {
    switch (level) {
        case 'low': return '#22C55E';    // Зелёный
        case 'medium': return '#F59E0B'; // Жёлтый/оранжевый
        case 'high': return '#EF4444';   // Красный
    }
}

/**
 * Возвращает текстовое описание уровня риска
 */
export function getRiskLabel(level: RiskLevel): string {
    switch (level) {
        case 'low': return 'Низкий риск';
        case 'medium': return 'Средний риск';
        case 'high': return 'Высокий риск';
    }
}
