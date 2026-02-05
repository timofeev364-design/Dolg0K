/**
 * Platform-specific storage adapter
 * Абстракция хранилища для web (localStorage/IndexedDB) и mobile (SQLite)
 */

import { Platform } from 'react-native';
import { PlanInstance, PlanRule, PlanGenerator, calculateRisk } from '../core';
import type { Obligation, PlanAction, UserSettings, Budget, BudgetCategory, BudgetSpend } from '../core';

// Storage interface
export interface StorageAdapter {
    // Obligations
    getAllObligations(): Promise<Obligation[]>;
    getObligationById(id: string): Promise<Obligation | null>;
    createObligation(data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Obligation>;
    updateObligation(id: string, data: Partial<Omit<Obligation, 'id' | 'createdAt'>>): Promise<Obligation | null>;
    deleteObligation(id: string): Promise<boolean>;
    markObligationPaid(id: string): Promise<Obligation | null>;
    markObligationUnpaid(id: string): Promise<Obligation | null>;

    // Plan Actions
    getPlanActions(weekStart: string): Promise<PlanAction[]>;
    getActionsForPlan(planInstanceId: string): Promise<PlanAction[]>;
    savePlanActions(actions: PlanAction[]): Promise<void>;
    updatePlanActionStatus(id: string, isDone: boolean): Promise<void>;

    // Feature 2: Budgets
    getBudgets(): Promise<Budget[]>;
    saveBudget(budget: Budget): Promise<void>;
    deleteBudget(id: string): Promise<void>;
    getSpends(budgetId?: string): Promise<BudgetSpend[]>;
    saveSpend(spend: BudgetSpend): Promise<void>;
    getCategories(): Promise<BudgetCategory[]>;
    saveCategory(category: BudgetCategory): Promise<void>;

    // Settings
    getSettings(): Promise<UserSettings>;
    saveSettings(settings: UserSettings): Promise<void>;
    setSetting(key: keyof UserSettings, value: string | number | boolean | undefined): Promise<void>;

    // Plan Engine
    createPlanInstance(templateId: string, userParams?: Record<string, any>): Promise<PlanInstance>;
    getActivePlan(): Promise<PlanInstance | null>;
    getActiveRules(planInstanceId: string): Promise<PlanRule[]>;

    // Utils
    initialize(): Promise<void>;
    clearAllData(): Promise<void>;
}

// ============================================
// WEB STORAGE (localStorage)
// ============================================

class WebStorageAdapter implements StorageAdapter {
    private readonly OBLIGATIONS_KEY = 'babki_obligations';
    private readonly PLAN_ACTIONS_KEY = 'babki_plan_actions';
    private readonly SETTINGS_KEY = 'babki_settings';
    private readonly PLANS_KEY = 'babki_plans';
    private readonly RULES_KEY = 'babki_rules';

    // Feature 2 Keys
    private readonly BUDGETS_KEY = 'babki_budgets';
    private readonly SPENDS_KEY = 'babki_spends';
    private readonly CATEGORIES_KEY = 'babki_budget_categories';

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private getItem<T>(key: string, defaultValue: T): T {
        if (typeof window === 'undefined') return defaultValue;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    }

    private setItem(key: string, value: unknown): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(key, JSON.stringify(value));
    }

    async initialize(): Promise<void> {
        // Seed categories if empty
        const cats = this.getItem<BudgetCategory[]>(this.CATEGORIES_KEY, []);
        if (cats.length === 0) {
            const defaults: BudgetCategory[] = [
                { id: 'c1', name: 'Еда', icon: 'coffee', colorToken: '#FF6B6B' },
                { id: 'c2', name: 'Транспорт', icon: 'navigation', colorToken: '#4ECDC4' },
                { id: 'c3', name: 'Жилье', icon: 'home', colorToken: '#FFE66D' },
                { id: 'c4', name: 'Развлечения', icon: 'headphones', colorToken: '#1A535C' }
            ];
            this.setItem(this.CATEGORIES_KEY, defaults);
        }
    }

    async clearAllData(): Promise<void> {
        if (typeof window === 'undefined') return;
        localStorage.clear();
    }

    // === Obligations ===

    async getAllObligations(): Promise<Obligation[]> {
        return this.getItem<Obligation[]>(this.OBLIGATIONS_KEY, []);
    }

    async getObligationById(id: string): Promise<Obligation | null> {
        const all = await this.getAllObligations();
        return all.find(o => o.id === id) ?? null;
    }

    async createObligation(data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Obligation> {
        const now = new Date().toISOString();
        const obligation: Obligation = {
            ...data,
            id: this.generateId(),
            createdAt: now,
            updatedAt: now,
        };

        const all = await this.getAllObligations();
        all.push(obligation);
        this.setItem(this.OBLIGATIONS_KEY, all);

        return obligation;
    }

    async updateObligation(id: string, data: Partial<Omit<Obligation, 'id' | 'createdAt'>>): Promise<Obligation | null> {
        const all = await this.getAllObligations();
        const index = all.findIndex(o => o.id === id);

        if (index === -1) return null;

        all[index] = {
            ...all[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        this.setItem(this.OBLIGATIONS_KEY, all);
        return all[index];
    }

    async deleteObligation(id: string): Promise<boolean> {
        const all = await this.getAllObligations();
        const filtered = all.filter(o => o.id !== id);
        this.setItem(this.OBLIGATIONS_KEY, filtered);
        return true;
    }

    async markObligationPaid(id: string): Promise<Obligation | null> {
        return this.updateObligation(id, {
            isPaid: true,
            lastPaidAt: new Date().toISOString(),
        });
    }

    async markObligationUnpaid(id: string): Promise<Obligation | null> {
        return this.updateObligation(id, { isPaid: false });
    }

    // === Plan Actions ===

    async getPlanActions(weekStart: string): Promise<PlanAction[]> {
        const all = this.getItem<PlanAction[]>(this.PLAN_ACTIONS_KEY, []);
        return all.filter(a => a.weekStart === weekStart);
    }

    async getActionsForPlan(planInstanceId: string): Promise<PlanAction[]> {
        const all = this.getItem<PlanAction[]>(this.PLAN_ACTIONS_KEY, []);
        return all.filter(a => a.planInstanceId === planInstanceId);
    }

    async savePlanActions(actions: PlanAction[]): Promise<void> {
        if (actions.length === 0) return;

        const weekStart = actions[0].weekStart;
        const all = this.getItem<PlanAction[]>(this.PLAN_ACTIONS_KEY, []);

        // Filter out actions with same weekStart provided
        let result = all;
        if (weekStart) {
            result = all.filter(a => a.weekStart !== weekStart);
        }

        result.push(...actions);
        this.setItem(this.PLAN_ACTIONS_KEY, result);
    }

    async updatePlanActionStatus(id: string, isDone: boolean): Promise<void> {
        const all = this.getItem<PlanAction[]>(this.PLAN_ACTIONS_KEY, []);
        const index = all.findIndex(a => a.id === id);

        if (index !== -1) {
            all[index].isDone = isDone;
            if (isDone) all[index].completedAt = new Date().toISOString();
            else all[index].completedAt = undefined;
            this.setItem(this.PLAN_ACTIONS_KEY, all);
        }
    }

    // === Use Feature 2: Budgets ===
    async getBudgets(): Promise<Budget[]> {
        return this.getItem<Budget[]>(this.BUDGETS_KEY, []);
    }

    async saveBudget(budget: Budget): Promise<void> {
        const all = await this.getBudgets();
        const index = all.findIndex(b => b.id === budget.id);
        if (index >= 0) all[index] = budget;
        else all.push(budget);
        this.setItem(this.BUDGETS_KEY, all);
    }

    async deleteBudget(id: string): Promise<void> {
        const all = await this.getBudgets();
        this.setItem(this.BUDGETS_KEY, all.filter(b => b.id !== id));
    }

    async getSpends(budgetId?: string): Promise<BudgetSpend[]> {
        const all = this.getItem<BudgetSpend[]>(this.SPENDS_KEY, []);
        if (budgetId) return all.filter(s => s.budgetId === budgetId);
        return all;
    }

    async saveSpend(spend: BudgetSpend): Promise<void> {
        const all = await this.getSpends(); // gets all actually, filter in getSpends arg is just filter
        const index = all.findIndex(s => s.id === spend.id);
        if (index >= 0) all[index] = spend;
        else all.push(spend);
        this.setItem(this.SPENDS_KEY, all);
    }

    async getCategories(): Promise<BudgetCategory[]> {
        return this.getItem<BudgetCategory[]>(this.CATEGORIES_KEY, []);
    }

    async saveCategory(category: BudgetCategory): Promise<void> {
        const all = await this.getCategories();
        const index = all.findIndex(c => c.id === category.id);
        if (index >= 0) all[index] = category;
        else all.push(category);
        this.setItem(this.CATEGORIES_KEY, all);
    }

    // === Settings ===

    async getSettings(): Promise<UserSettings> {
        return this.getItem<UserSettings>(this.SETTINGS_KEY, {
            salaryDay: 10,
            notificationTime: '09:00',
            onboardingCompleted: false,
        });
    }

    async saveSettings(userSettings: UserSettings): Promise<void> {
        this.setItem(this.SETTINGS_KEY, userSettings);
    }

    async setSetting(key: keyof UserSettings, value: string | number | boolean | undefined): Promise<void> {
        const current = await this.getSettings();
        const updated = { ...current, [key]: value };
        this.setItem(this.SETTINGS_KEY, updated);
    }

    // === Plan Engine ===

    async createPlanInstance(templateId: string, userParams?: Record<string, any>): Promise<PlanInstance> {
        const userObligations = await this.getAllObligations();
        const userSettings = await this.getSettings();
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

        // Archive active plans
        const allPlans = this.getItem<PlanInstance[]>(this.PLANS_KEY, []);
        const updatedPlans = allPlans.map(p =>
            p.status === 'active' ? { ...p, status: 'archived' as const } : p
        );

        // Save new plan
        // Store params as object directly in localStorage
        updatedPlans.push({ ...instance });
        this.setItem(this.PLANS_KEY, updatedPlans);

        // Save actions
        const existingActions = this.getItem<PlanAction[]>(this.PLAN_ACTIONS_KEY, []);
        existingActions.push(...actions);
        this.setItem(this.PLAN_ACTIONS_KEY, existingActions);

        // Save rules
        const existingRules = this.getItem<PlanRule[]>(this.RULES_KEY, []);
        existingRules.push(...rules);
        this.setItem(this.RULES_KEY, existingRules);

        return instance;
    }

    async getActivePlan(): Promise<PlanInstance | null> {
        const plans = this.getItem<PlanInstance[]>(this.PLANS_KEY, []);
        return plans.find(p => p.status === 'active') || null;
    }

    async getActiveRules(planInstanceId: string): Promise<PlanRule[]> {
        const rules = this.getItem<PlanRule[]>(this.RULES_KEY, []);
        return rules.filter(r => r.planInstanceId === planInstanceId);
    }
}

// ============================================
// NATIVE STORAGE (SQLite) - lazy loaded
// ============================================

class NativeStorageAdapter implements StorageAdapter {
    private initialized = false;

    async initialize(): Promise<void> {
        if (this.initialized) return;

        const { initDatabase } = await import('./setup');
        await initDatabase();
        this.initialized = true;
    }

    async clearAllData(): Promise<void> {
        const { clearAllData } = await import('./setup');
        await clearAllData();
    }

    // Feature 2 Stubs (To separate file later)
    async getBudgets(): Promise<Budget[]> { return []; }
    async saveBudget(budget: Budget): Promise<void> { }
    async deleteBudget(id: string): Promise<void> { }
    async getSpends(budgetId?: string): Promise<BudgetSpend[]> { return []; }
    async saveSpend(spend: BudgetSpend): Promise<void> { }
    async getCategories(): Promise<BudgetCategory[]> { return []; }
    async saveCategory(category: BudgetCategory): Promise<void> { }

    async getAllObligations(): Promise<Obligation[]> {
        const { getAllObligations } = await import('./repositories');
        return getAllObligations();
    }

    async getObligationById(id: string): Promise<Obligation | null> {
        const { getObligationById } = await import('./repositories');
        return getObligationById(id);
    }

    async createObligation(data: Omit<Obligation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Obligation> {
        const { createObligation } = await import('./repositories');
        return createObligation(data);
    }

    async updateObligation(id: string, data: Partial<Omit<Obligation, 'id' | 'createdAt'>>): Promise<Obligation | null> {
        const { updateObligation } = await import('./repositories');
        return updateObligation(id, data);
    }

    async deleteObligation(id: string): Promise<boolean> {
        const { deleteObligation } = await import('./repositories');
        return deleteObligation(id);
    }

    async markObligationPaid(id: string): Promise<Obligation | null> {
        const { markObligationPaid } = await import('./repositories');
        return markObligationPaid(id);
    }

    async markObligationUnpaid(id: string): Promise<Obligation | null> {
        const { markObligationUnpaid } = await import('./repositories');
        return markObligationUnpaid(id);
    }

    async getPlanActions(weekStart: string): Promise<PlanAction[]> {
        const { getPlanActions } = await import('./repositories');
        return getPlanActions(weekStart);
    }

    async getActionsForPlan(planInstanceId: string): Promise<PlanAction[]> {
        const { getActionsForPlan } = await import('./repositories');
        return getActionsForPlan(planInstanceId);
    }

    async savePlanActions(actions: PlanAction[]): Promise<void> {
        const { savePlanActions } = await import('./repositories');
        return savePlanActions(actions);
    }

    async updatePlanActionStatus(id: string, isDone: boolean): Promise<void> {
        const { updatePlanActionStatus } = await import('./repositories');
        return updatePlanActionStatus(id, isDone);
    }

    async getSettings(): Promise<UserSettings> {
        const { getSettings } = await import('./repositories');
        return getSettings();
    }

    async saveSettings(userSettings: UserSettings): Promise<void> {
        const { saveSettings } = await import('./repositories');
        return saveSettings(userSettings);
    }

    async setSetting(key: keyof UserSettings, value: string | number | boolean | undefined): Promise<void> {
        const { setSetting } = await import('./repositories');
        return setSetting(key, value);
    }

    async createPlanInstance(templateId: string, userParams?: Record<string, any>): Promise<PlanInstance> {
        const { createPlanInstance } = await import('./repositories');
        return createPlanInstance(templateId, userParams);
    }

    async getActivePlan(): Promise<PlanInstance | null> {
        const { getActivePlan } = await import('./repositories');
        return getActivePlan();
    }

    async getActiveRules(planInstanceId: string): Promise<PlanRule[]> {
        const { getActiveRules } = await import('./repositories');
        return getActiveRules(planInstanceId);
    }
}

// ============================================
// EXPORT
// ============================================

/**
 * Возвращает адаптер хранилища в зависимости от платформы
 */
export function getStorageAdapter(): StorageAdapter {
    if (Platform.OS === 'web') {
        return new WebStorageAdapter();
    }
    return new NativeStorageAdapter();
}

// Singleton instance
let storageInstance: StorageAdapter | null = null;

/**
 * Получает singleton экземпляр адаптера хранилища
 */
export function getStorage(): StorageAdapter {
    if (!storageInstance) {
        storageInstance = getStorageAdapter();
    }
    return storageInstance;
}
