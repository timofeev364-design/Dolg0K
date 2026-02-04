/**
 * Core types for Babki / Anti-Delay
 * Модели данных для управления платежами
 */

/** Уровень риска просрочки */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Категория платежа */
export type PaymentCategory =
    | 'utilities'    // ЖКХ
    | 'credit'       // Кредит
    | 'subscription' // Подписки
    | 'mfo'          // МФО
    | 'other';       // Другое

/** Обязательный платёж */
export interface Obligation {
    id: string;
    name: string;
    amount: number;
    /** День месяца (1-31) когда нужно платить */
    dueDay: number;
    category: PaymentCategory;
    /** Оплачен ли платёж в текущем месяце */
    isPaid: boolean;
    /** Дата последней оплаты (ISO string) */
    lastPaidAt?: string;
    createdAt: string;
    updatedAt: string;
}

/** Горизонт планирования */
export type PlanHorizon = 'day' | 'week' | 'month' | 'quarter' | 'year';

/** Тип плана */
export type PlanType = 'reserve' | 'debt' | 'optimization' | 'stability';

/** Интенсивность плана */
export type PlanIntensity = 'easy' | 'medium' | 'hard';

/** Правило поведения */
export interface PlanRule {
    id: string;
    text: string;
    /** Если true, правило отображается как "активное" на главном экране */
    isActive: boolean;
    /** ID экземпляра плана */
    planInstanceId: string;
}

/** Метрика плана */
export interface PlanMetric {
    id: string;
    label: string;
    value: number;
    unit: 'currency' | 'percent' | 'count';
}

/** Шаблон задачи в плане */
export interface TaskBlueprint {
    title: string;
    description: string;
    /** Правило расписания (например, "day 1", "weekly") */
    schedule: string;
    priority: number;
    /** Шаблон повтора (например, "ежедневно") или null */
    repeat: string | null;
    tag: MetadataTag;
    /** Оценка эффекта в рублях (если есть) или null */
    estimatedEffect: number | string | null;
}

/** Шаблон правила (триггер-действие) */
export interface RuleBlueprint {
    trigger: string;
    action: string;
    description: string;
    /** Параметры триггера (JSON) */
    triggerParams?: Record<string, any>;
}

/** Тег задачи для аналитики */
export type MetadataTag = 'резерв' | 'долги' | 'подписки' | 'экономия' | 'доход' | 'ревью' | 'общее' | 'импульс' | 'обязательные' | 'напоминания' | 'итог' | 'нетворкинг' | 'трекер' | 'комиссии';

/** Шаблон плана (из каталога) */
export interface PlanTemplate {
    id: string;
    title: string;
    description: string;
    category: PlanType;
    /** Поддерживаемые горизонты (массив) */
    horizons: PlanHorizon[]; // Changed from single horizon
    intensity: string;       // Changed from enum to string to support "10 мин/день"
    /** Кому подходит */
    targetAudience: string;
    /** Необходимые данные (ключи) */
    requirements: string[]; // This was already string[], keeping it, but semantics changed to localized strings or keys? User provided keys like "день_зарплаты". Let's stick to strings.
    /** Пример задач (оставляем для совместимости UI, генерируется из blueprint) */
    exampleTasks: string[];

    // New rich fields
    requiredParams?: string[];
    defaultParams?: Record<string, any>;
    tasksBlueprint?: TaskBlueprint[];
    rulesBlueprint?: RuleBlueprint[];
}

/** Экземпляр активного плана пользователя */
export interface PlanInstance {
    id: string;
    templateId: string;
    status: 'active' | 'completed' | 'archived';
    startedAt: string;
    /** Дата окончания (вычисляется из горизонта) */
    endsAt: string;
    horizon: PlanHorizon; // Added specific horizon for this instance
    /** Текущий уровень риска */
    riskLevel: RiskLevel;
    /** Сэкономлено средств */
    savedAmount: number;
    /** Параметры пользователя (JSON) */
    params?: Record<string, any>;
}

/** Действие в плане (конкретная задача) */
export interface PlanAction {
    id: string;
    /** Текст действия */
    text: string;
    description?: string; // Added description
    /** Приоритет (1 = highest) */
    priority: number;
    /** Выполнено ли */
    isDone: boolean;
    /** ID экземпляра плана, к которому относится действие */
    planInstanceId?: string;
    /** Начало недели (для совместимости) */
    weekStart?: string;
    /** Связанный платёж (опционально) */
    obligationId?: string;
    /** Повторяющееся действие? */
    isRecurring: boolean;

    // New fields
    tag?: MetadataTag;
    estimatedEffect?: number; // In rubles, standardized
    points?: number;
    completedAt?: string;

    createdAt: string;
}

/** Настройки пользователя */
export interface UserSettings {
    /** День зарплаты (1-31) */
    salaryDay: number;
    /** Время напоминаний (HH:MM) */
    notificationTime: string;
    /** Показан ли онбординг */
    onboardingCompleted: boolean;
    /** Текущий баланс (опционально, вводится пользователем) */
    currentBalance?: number;
    /** ID активного плана (если есть) */
    activePlanId?: string;
}

/** Шаблон обращения */
export interface Template {
    id: string;
    /** Категория: банк, МФО, управляющая компания */
    category: 'bank' | 'mfo' | 'management';
    /** Название шаблона */
    title: string;
    /** Описание ситуации */
    description: string;
    /** Текст шаблона */
    content: string;
}

/** Данные для расчёта риска */
export interface RiskCalculationInput {
    obligations: Obligation[];
    salaryDay: number;
    currentBalance?: number;
    /** Текущая дата (для тестов можно передать любую) */
    today?: Date;
}

/** Результат расчёта риска */
export interface RiskResult {
    level: RiskLevel;
    /** Сумма к оплате до зарплаты */
    amountDueBeforeSalary: number;
    /** Дней до зарплаты */
    daysUntilSalary: number;
    /** Платежи в зоне риска */
    atRiskPayments: Obligation[];
}

/** Входные данные для генерации плана */
export interface Plan7Input {
    obligations: Obligation[];
    riskResult: RiskResult;
    /** Начало недели (понедельник) */
    weekStart: Date;
    /** Активный план (если есть) */
    activePlan?: PlanInstance;
}

/** Формат хранения настроек в key-value */
export interface SettingsRow {
    key: string;
    value: string;
}

/** Названия категорий на русском */
export const CATEGORY_LABELS: Record<PaymentCategory, string> = {
    utilities: 'ЖКХ',
    credit: 'Кредит',
    subscription: 'Подписки',
    mfo: 'МФО',
    other: 'Другое',
};

/** Названия категорий шаблонов на русском */
export const TEMPLATE_CATEGORY_LABELS: Record<Template['category'], string> = {
    bank: 'Банк',
    mfo: 'МФО',
    management: 'Управляющая компания',
};

/** Названия горизонтов на русском */
export const HORIZON_LABELS: Record<PlanHorizon, string> = {
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    quarter: 'Квартал',
    year: 'Год',
};

/** Названия типов планов на русском */
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
    reserve: 'Резерв',
    debt: 'Долги',
    optimization: 'Оптимизация',
    stability: 'Стабильность',
};

/** ==========================================
 * Feature 2: Category Budgets Data Model
 * ========================================== */

export type BudgetPeriod = 'week' | 'month';

export interface BudgetCategory {
    id: string;
    name: string;
    icon: string; // Feather icon name
    colorToken: string; // hex or theme token
}

/** Лимит бюджета на категорию */
export interface Budget {
    id: string;
    categoryId: string;
    periodType: BudgetPeriod;
    /** ISO Date string start of period */
    periodStart: string;
    /** ISO Date string end of period */
    periodEnd: string;
    /** Лимит L_c (руб) */
    limit: number;
    /** Пороги уведомлений (0.7, 0.9, 1.0) */
    thresholds: {
        warning: number; // default 0.7
        danger: number;  // default 0.9
        exceeded: number; // default 1.0
    };
    createdAt: string;
    updatedAt: string;
}

/** Трата в рамках бюджета */
export interface BudgetSpend {
    id: string;
    budgetId: string; // or categoryId if across periods? usually linked to category, calculated per period
    categoryId: string;
    amount: number;
    date: string; // ISO
    description?: string;
}

/** Рассчитанные метрики бюджета (Derived) */
export interface BudgetMetrics {
    spent: number;       // S_c(t)
    remaining: number;   // R_c(t)
    percent: number;     // P_c(t)
    burnRate: number;    // v_c(t)
    forecast: number;    // F_c
    forecastRemaining: number; // R^_c
    riskScore: number;   // RS_c
    daysToBreach: number; // N
    isRisk: boolean;
}
