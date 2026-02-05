/**
 * Data repositories for CRUD operations
 * Репозитории для работы с платежами, планом и настройками
 */

import { eq } from 'drizzle-orm';
import type { Obligation, PlanAction, UserSettings } from '../core';
import { PlanGenerator, PlanInstance, PlanRule, calculateRisk } from '../core';
import { getDatabase } from './setup';
import { obligations, planActions, settings, planInstances, planRules } from './schema';

// ============================================
// OBLIGATIONS REPOSITORY
// ============================================

/**
 * Генерирует уникальный ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Получает все платежи
 */
export async function getAllObligations(): Promise<Obligation[]> {
    const db = getDatabase();
    const rows = await db.select().from(obligations);

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        amount: row.amount,
        dueDay: row.dueDay,
        category: row.category as Obligation['category'],
        isPaid: row.isPaid,
        lastPaidAt: row.lastPaidAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }));
}

/**
 * Получает платёж по ID
 */
export async function getObligationById(id: string): Promise<Obligation | null> {
    const db = getDatabase();
    const rows = await db.select().from(obligations).where(eq(obligations.id, id));

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        id: row.id,
        name: row.name,
        amount: row.amount,
        dueDay: row.dueDay,
        category: row.category as Obligation['category'],
        isPaid: row.isPaid,
        lastPaidAt: row.lastPaidAt ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

/**
 * Создаёт новый платёж
 */
export async function createObligation(
    data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Obligation> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    const newObligation: Obligation = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
    };

    await db.insert(obligations).values({
        id: newObligation.id,
        name: newObligation.name,
        amount: newObligation.amount,
        dueDay: newObligation.dueDay,
        category: newObligation.category,
        isPaid: newObligation.isPaid,
        lastPaidAt: newObligation.lastPaidAt ?? null,
        createdAt: newObligation.createdAt,
        updatedAt: newObligation.updatedAt,
    });

    return newObligation;
}

/**
 * Обновляет платёж
 */
export async function updateObligation(
    id: string,
    data: Partial<Omit<Obligation, 'id' | 'createdAt'>>
): Promise<Obligation | null> {
    const db = getDatabase();
    const existing = await getObligationById(id);

    if (!existing) return null;

    const updated: Obligation = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
    };

    await db.update(obligations)
        .set({
            name: updated.name,
            amount: updated.amount,
            dueDay: updated.dueDay,
            category: updated.category,
            isPaid: updated.isPaid,
            lastPaidAt: updated.lastPaidAt ?? null,
            updatedAt: updated.updatedAt,
        })
        .where(eq(obligations.id, id));

    return updated;
}

/**
 * Отмечает платёж как оплаченный
 */
export async function markObligationPaid(id: string): Promise<Obligation | null> {
    return updateObligation(id, {
        isPaid: true,
        lastPaidAt: new Date().toISOString(),
    });
}

/**
 * Отмечает платёж как неоплаченный
 */
export async function markObligationUnpaid(id: string): Promise<Obligation | null> {
    return updateObligation(id, {
        isPaid: false,
    });
}

/**
 * Удаляет платёж
 */
export async function deleteObligation(id: string): Promise<boolean> {
    const db = getDatabase();
    await db.delete(obligations).where(eq(obligations.id, id));
    return true;
}

/**
 * Сбрасывает статус "оплачен" для всех платежей (начало месяца)
 */
export async function resetAllPaidStatus(): Promise<void> {
    const db = getDatabase();
    await db.update(obligations).set({ isPaid: false });
}

// ============================================
// PLAN ACTIONS REPOSITORY
// ============================================

/**
 * Получает действия плана для недели
 */
export async function getPlanActions(weekStart: string): Promise<PlanAction[]> {
    const db = getDatabase();
    const rows = await db.select().from(planActions).where(eq(planActions.weekStart, weekStart));

    return rows.map(row => ({
        id: row.id,
        text: row.text,
        description: row.description ?? undefined,
        priority: row.priority,
        isDone: row.isDone,
        weekStart: row.weekStart ?? undefined,
        planInstanceId: row.planInstanceId ?? undefined,
        obligationId: row.obligationId ?? undefined,
        isRecurring: row.isRecurring,
        createdAt: row.createdAt,
        tag: row.tag as any,
        estimatedEffect: row.estimatedEffect ?? undefined,
        points: row.points ?? undefined,
        completedAt: row.completedAt ?? undefined,
    }));
}

/**
 * Получает действия конкретного плана
 */
export async function getActionsForPlan(planInstanceId: string): Promise<PlanAction[]> {
    const db = getDatabase();
    const rows = await db.select().from(planActions).where(eq(planActions.planInstanceId, planInstanceId));

    return rows.map(row => ({
        id: row.id,
        text: row.text,
        description: row.description ?? undefined,
        priority: row.priority,
        isDone: row.isDone,
        weekStart: row.weekStart ?? undefined,
        planInstanceId: row.planInstanceId ?? undefined,
        obligationId: row.obligationId ?? undefined,
        isRecurring: row.isRecurring,
        createdAt: row.createdAt,
        tag: row.tag as any,
        estimatedEffect: row.estimatedEffect ?? undefined,
        points: row.points ?? undefined,
        completedAt: row.completedAt ?? undefined,
    }));
}

/**
 * Сохраняет действия плана (заменяет существующие для недели)
 */
export async function savePlanActions(actions: PlanAction[]): Promise<void> {
    const db = getDatabase();

    if (actions.length === 0) return;

    const weekStart = actions[0].weekStart;

    if (weekStart) {
        // Удаляем старые действия для этой недели (старая логика)
        await db.delete(planActions).where(eq(planActions.weekStart, weekStart));
    }

    // Вставляем новые
    for (const action of actions) {
        await db.insert(planActions).values({
            id: action.id,
            text: action.text,
            priority: action.priority,
            isDone: action.isDone,
            weekStart: action.weekStart ?? null,
            planInstanceId: action.planInstanceId ?? null,
            obligationId: action.obligationId ?? null,
            isRecurring: action.isRecurring,
            createdAt: action.createdAt,
        });
    }
}

/**
 * Обновляет статус действия плана
 */
export async function updatePlanActionStatus(id: string, isDone: boolean): Promise<void> {
    const db = getDatabase();
    await db.update(planActions).set({ isDone }).where(eq(planActions.id, id));
}

// ============================================
// SETTINGS REPOSITORY
// ============================================

const DEFAULT_SETTINGS: UserSettings = {
    salaryDay: 10,
    notificationTime: '09:00',
    onboardingCompleted: false,
    currentBalance: undefined,
};

/**
 * Получает настройки пользователя
 */
export async function getSettings(): Promise<UserSettings> {
    const db = getDatabase();
    const rows = await db.select().from(settings);

    const settingsMap: Record<string, string> = {};
    for (const row of rows) {
        settingsMap[row.key] = row.value;
    }

    return {
        salaryDay: settingsMap.salaryDay ? parseInt(settingsMap.salaryDay, 10) : DEFAULT_SETTINGS.salaryDay,
        notificationTime: settingsMap.notificationTime ?? DEFAULT_SETTINGS.notificationTime,
        onboardingCompleted: settingsMap.onboardingCompleted === 'true',
        currentBalance: settingsMap.currentBalance ? parseFloat(settingsMap.currentBalance) : undefined,
        userName: settingsMap.userName ?? undefined,
    };
}

/**
 * Сохраняет настройку
 */
export async function setSetting(key: keyof UserSettings, value: string | number | boolean | undefined): Promise<void> {
    const db = getDatabase();
    const stringValue = value === undefined ? '' : String(value);

    // Upsert
    const existing = await db.select().from(settings).where(eq(settings.key, key));

    if (existing.length > 0) {
        await db.update(settings).set({ value: stringValue }).where(eq(settings.key, key));
    } else {
        await db.insert(settings).values({ key, value: stringValue });
    }
}

/**
 * Сохраняет все настройки
 */
export async function saveSettings(userSettings: UserSettings): Promise<void> {
    await setSetting('salaryDay', userSettings.salaryDay);
    await setSetting('notificationTime', userSettings.notificationTime);
    await setSetting('onboardingCompleted', userSettings.onboardingCompleted);
    if (userSettings.currentBalance !== undefined) {
        await setSetting('currentBalance', userSettings.currentBalance);
    }
    if (userSettings.userName !== undefined) {
        await setSetting('userName', userSettings.userName);
    }
}

// ============================================
// PLAN INSTANCES & RULES REPOSITORY
// ============================================


/**
 * Создаёт новый план
 */
export async function createPlanInstance(
    templateId: string,
    userParams?: Record<string, any>
): Promise<PlanInstance> {
    const db = getDatabase();

    // 1. Получаем необходимые данные
    const userObligations = await getAllObligations();
    const userSettings = await getSettings();
    const now = new Date();

    // Считаем риск
    const riskResult = calculateRisk({
        obligations: userObligations,
        salaryDay: userSettings.salaryDay,
        currentBalance: userSettings.currentBalance,
        today: now
    });

    // 2. Генерируем план
    // Note: User params are merging with detected params in logic
    const { instance, actions, rules } = PlanGenerator.createPlan(
        templateId,
        {
            obligations: userObligations,
            riskResult,
            weekStart: now,
            activePlan: undefined // We are archiving old one
        },
        userSettings,
        userParams // Pass user params to generator
    );

    // 3. Сохраняем в БД
    // Сначала архивируем старые активные планы
    await db.update(planInstances)
        .set({ status: 'archived' })
        .where(eq(planInstances.status, 'active'));

    // Сохраняем новый
    await db.insert(planInstances).values({
        id: instance.id,
        templateId: instance.templateId,
        status: instance.status,
        startedAt: instance.startedAt,
        endsAt: instance.endsAt,
        riskLevel: instance.riskLevel,
        savedAmount: instance.savedAmount,
        horizon: instance.horizon,
        params: instance.params ? JSON.stringify(instance.params) : null
    });

    // Сохраняем задачи (Actions)
    for (const action of actions) {
        await db.insert(planActions).values({
            id: action.id,
            text: action.text,
            description: action.description,
            priority: action.priority,
            isDone: action.isDone,
            weekStart: now.toISOString(), // Legacy compatibility
            obligationId: action.obligationId ?? null,
            createdAt: action.createdAt,
            planInstanceId: instance.id,
            isRecurring: action.isRecurring,
            tag: action.tag,
            estimatedEffect: action.estimatedEffect,
            points: action.points,
            completedAt: action.completedAt
        });
    }

    // Сохраняем правила (Rules)
    for (const rule of rules) {
        await db.insert(planRules).values({
            id: rule.id,
            text: rule.text,
            isActive: rule.isActive,
            planInstanceId: rule.planInstanceId
        });
    }

    return instance;
}

/**
 * Получает текущий активный план
 */
export async function getActivePlan(): Promise<PlanInstance | null> {
    const db = getDatabase();
    const rows = await db.select().from(planInstances).where(eq(planInstances.status, 'active'));

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        id: row.id,
        templateId: row.templateId,
        status: row.status as 'active' | 'completed' | 'archived',
        startedAt: row.startedAt,
        endsAt: row.endsAt,
        riskLevel: row.riskLevel as any,
        savedAmount: row.savedAmount,
        horizon: row.horizon as any,
        params: row.params ? JSON.parse(row.params) : undefined
    };
}

/**
 * Получает правила активного плана
 */
export async function getActiveRules(planInstanceId: string): Promise<PlanRule[]> {
    const db = getDatabase();
    const rows = await db.select().from(planRules).where(eq(planRules.planInstanceId, planInstanceId));

    return rows.map(r => ({
        id: r.id,
        text: r.text,
        isActive: r.isActive ?? true,
        planInstanceId: r.planInstanceId
    }));
}
