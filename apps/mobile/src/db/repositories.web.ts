/**
 * Web implementation of repositories using localStorage
 * Реализация репозиториев для веба через localStorage
 */

import type { Obligation, PlanAction, UserSettings, PlanInstance, PlanRule } from '../core';
import { PlanGenerator, calculateRisk } from '../core';

// Keys for localStorage
const KB_OBLIGATIONS = 'babki_obligations';
const KB_ACTIONS = 'babki_actions';
const KB_SETTINGS = 'babki_settings';
const KB_PLANS = 'babki_plans';
const KB_RULES = 'babki_rules';

function getIds<T extends { id: string }>(key: string): T[] {
    if (typeof localStorage === 'undefined') return [];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveIds<T>(key: string, data: T[]) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// OBLIGATIONS REPOSITORY
// ============================================

export async function getAllObligations(): Promise<Obligation[]> {
    return getIds<Obligation>(KB_OBLIGATIONS);
}

export async function getObligationById(id: string): Promise<Obligation | null> {
    const items = getIds<Obligation>(KB_OBLIGATIONS);
    return items.find(i => i.id === id) || null;
}

export async function createObligation(
    data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Obligation> {
    const items = getIds<Obligation>(KB_OBLIGATIONS);
    const now = new Date().toISOString();
    const newItem: Obligation = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
    };
    items.push(newItem);
    saveIds(KB_OBLIGATIONS, items);
    return newItem;
}

export async function updateObligation(
    id: string,
    data: Partial<Omit<Obligation, 'id' | 'createdAt'>>
): Promise<Obligation | null> {
    const items = getIds<Obligation>(KB_OBLIGATIONS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return null;

    const updated = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString(),
    };
    items[index] = updated;
    saveIds(KB_OBLIGATIONS, items);
    return updated;
}

export async function markObligationPaid(id: string): Promise<Obligation | null> {
    return updateObligation(id, {
        isPaid: true,
        lastPaidAt: new Date().toISOString(),
    });
}

export async function markObligationUnpaid(id: string): Promise<Obligation | null> {
    return updateObligation(id, {
        isPaid: false,
    });
}

export async function deleteObligation(id: string): Promise<boolean> {
    const items = getIds<Obligation>(KB_OBLIGATIONS);
    const filtered = items.filter(i => i.id !== id);
    if (filtered.length === items.length) return false;
    saveIds(KB_OBLIGATIONS, filtered);
    return true;
}

export async function resetAllPaidStatus(): Promise<void> {
    const items = getIds<Obligation>(KB_OBLIGATIONS);
    const updated = items.map(i => ({ ...i, isPaid: false }));
    saveIds(KB_OBLIGATIONS, updated);
}

// ============================================
// PLAN ACTIONS REPOSITORY
// ============================================

export async function getPlanActions(weekStart: string): Promise<PlanAction[]> {
    const items = getIds<PlanAction>(KB_ACTIONS);
    // Filter by weekStart (legacy) or just return all?
    // In legacy mode, we filter by weekStart.
    return items.filter(i => i.weekStart === weekStart);
}

export async function getActionsForPlan(planInstanceId: string): Promise<PlanAction[]> {
    const items = getIds<PlanAction>(KB_ACTIONS);
    return items.filter(i => i.planInstanceId === planInstanceId);
}

export async function savePlanActions(actions: PlanAction[]): Promise<void> {
    if (actions.length === 0) return;
    const items = getIds<PlanAction>(KB_ACTIONS);

    // Remove existing actions for this week (legacy logic)
    // Actually, createPlanInstance sets weekStart/planInstanceId. 
    // Here we might receive actions with weekStart.
    const weekStart = actions[0].weekStart;

    let result = items;
    if (weekStart) {
        result = items.filter(i => i.weekStart !== weekStart);
    }

    // Check if we are overwriting by planInstanceId?
    // Logic in repositories.ts removes by weekStart. 
    // BUT createPlanInstance does not call savePlanActions directly for new plan, it inserts.
    // However, createPlanInstance calls `db.insert`.
    // savePlanActions is used by legacy generation.

    result.push(...actions);
    saveIds(KB_ACTIONS, result);
}

export async function updatePlanActionStatus(id: string, isDone: boolean): Promise<void> {
    const items = getIds<PlanAction>(KB_ACTIONS);
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;
    items[index].isDone = isDone;
    // Also set completedAt if done?
    if (isDone) items[index].completedAt = new Date().toISOString();
    else items[index].completedAt = undefined;

    saveIds(KB_ACTIONS, items);
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

export async function getSettings(): Promise<UserSettings> {
    if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
    const data = localStorage.getItem(KB_SETTINGS);
    const stored = data ? JSON.parse(data) : {};
    return { ...DEFAULT_SETTINGS, ...stored };
}

export async function setSetting(key: keyof UserSettings, value: string | number | boolean | undefined): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    const current = await getSettings();
    const updated = { ...current, [key]: value };
    localStorage.setItem(KB_SETTINGS, JSON.stringify(updated));
}

export async function saveSettings(userSettings: UserSettings): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KB_SETTINGS, JSON.stringify(userSettings));
}

// ============================================
// PLAN INSTANCES & RULES REPOSITORY
// ============================================

export async function createPlanInstance(
    templateId: string,
    userParams?: Record<string, any>
): Promise<PlanInstance> {
    const userObligations = await getAllObligations();
    const userSettings = await getSettings();
    const now = new Date();

    const riskResult = calculateRisk({
        obligations: userObligations,
        salaryDay: userSettings.salaryDay,
        currentBalance: userSettings.currentBalance,
        today: now
    });

    const { instance, actions, rules } = PlanGenerator.createPlan(
        templateId,
        {
            obligations: userObligations,
            riskResult,
            weekStart: now,
            activePlan: undefined
        },
        userSettings,
        userParams
    );

    // Archive old plans
    const plans = getIds<PlanInstance>(KB_PLANS);
    const updatedPlans = plans.map(p =>
        p.status === 'active' ? { ...p, status: 'archived' as const } : p
    );

    // Save new plan
    updatedPlans.push({ ...instance, params: instance.params }); // JSON stringify not needed for localStorage object storage, but type implies it's object?
    // In SQL it was stringified. Here we can store as object if type matches.
    // PlanInstance type has params?: Record<string, any>. So object is fine.
    saveIds(KB_PLANS, updatedPlans);

    // Save actions
    const existingActions = getIds<PlanAction>(KB_ACTIONS);
    existingActions.push(...actions);
    saveIds(KB_ACTIONS, existingActions);

    // Save rules
    const existingRules = getIds<PlanRule>(KB_RULES);
    existingRules.push(...rules);
    saveIds(KB_RULES, existingRules);

    return instance;
}

export async function getActivePlan(): Promise<PlanInstance | null> {
    const plans = getIds<PlanInstance>(KB_PLANS);
    return plans.find(p => p.status === 'active') || null;
}

export async function getActiveRules(planInstanceId: string): Promise<PlanRule[]> {
    const rules = getIds<PlanRule>(KB_RULES);
    return rules.filter(r => r.planInstanceId === planInstanceId);
}
