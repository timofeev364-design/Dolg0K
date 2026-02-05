/**
 * Logic for Plan Generator (Phase 2)
 * Логика генератора планов
 */

import { v4 as uuidv4 } from 'uuid';
import {
    PlanTemplate, PlanInstance, PlanAction, PlanRule,
    Plan7Input, UserSettings, PlanHorizon
} from './types';
import { ALL_PLAN_TEMPLATES } from './templates';

export class PlanGenerator {

    /**
     * Создает новый план на основе шаблона
     */
    static createPlan(
        templateId: string,
        input: Plan7Input,
        // @ts-ignore: settings currently unused but reserved for future logic
        settings: UserSettings,
        userParams?: Record<string, any>
    ): { instance: PlanInstance, actions: PlanAction[], rules: PlanRule[] } {

        const template = ALL_PLAN_TEMPLATES.find(t => t.id === templateId);
        if (!template) throw new Error(`Template ${templateId} not found`);

        const now = new Date();
        const instanceId = uuidv4();

        // Determine horizon: use user param or default to first supported
        // Cast userParams?.horizon to PlanHorizon if valid, else default
        let horizon: PlanHorizon = template.horizons[0];
        if (userParams?.horizon && template.horizons.includes(userParams.horizon as PlanHorizon)) {
            horizon = userParams.horizon as PlanHorizon;
        }

        // 1. Создаем экземпляр плана
        const instance: PlanInstance = {
            id: instanceId,
            templateId: template.id,
            status: 'active',
            startedAt: now.toISOString(),
            endsAt: this.calculateEndDate(now, horizon).toISOString(),
            riskLevel: input.riskResult.level,
            savedAmount: 0,
            horizon: horizon,
            params: userParams
        };

        const actions: PlanAction[] = [];
        const rules: PlanRule[] = [];

        // 2. Генерируем задачи из "ядра" (обязательные платежи)
        // Только если это не чисто резервный план или если настройки требуют
        // If template doesn't explicitly exclude core obligations behavior
        if (template.category !== 'reserve') {
            actions.push(...this.generateObligationActions(input, instanceId));
        }

        // 3. Генерируем специфичные задачи для шаблона
        if (template.tasksBlueprint && template.tasksBlueprint.length > 0) {
            actions.push(...this.generateActionsFromBlueprint(template.tasksBlueprint, instanceId));
        } else {
            // Fallback for legacy templates (no blueprint)
            actions.push(...this.generateLegacyTemplateActions(template, instanceId));
        }

        // 4. Генерируем правила
        if (template.rulesBlueprint && template.rulesBlueprint.length > 0) {
            rules.push(...this.generateRulesFromBlueprint(template.rulesBlueprint, instanceId));
        } else {
            rules.push(...this.generateLegacyRules(template, instanceId));
        }

        return { instance, actions, rules };
    }

    /**
     * Вычисляет дату окончания плана
     */
    private static calculateEndDate(startDate: Date, horizon: PlanHorizon): Date {
        const d = new Date(startDate);
        switch (horizon) {
            case 'day': d.setDate(d.getDate() + 1); break;
            case 'week': d.setDate(d.getDate() + 7); break;
            case 'month': d.setMonth(d.getMonth() + 1); break;
            case 'quarter': d.setMonth(d.getMonth() + 3); break;
            case 'year': d.setFullYear(d.getFullYear() + 1); break;
        }
        return d;
    }

    /**
     * Генерирует действия по обязательствам (из ядра)
     */
    private static generateObligationActions(input: Plan7Input, instanceId: string): PlanAction[] {
        const actions: PlanAction[] = [];
        const { obligations } = input;

        // Берем только неоплаченные
        const unpaid = obligations.filter(o => !o.isPaid);

        unpaid.forEach((obl) => {
            // Простая логика: если дата платежа близко (7 дней)
            const dueDay = obl.dueDay;
            const todayDay = new Date().getDate();
            // Handle month wrap-around roughly for MVP
            let diff = dueDay - todayDay;
            if (diff < 0) diff += 30; // Approximation

            if (diff >= 0 && diff <= 10) { // Increased window
                actions.push({
                    id: uuidv4(),
                    text: `💳 Оплатить "${obl.name}" (${obl.amount} ₽) до ${dueDay} числа`,
                    priority: 1, // Высокий приоритет
                    isDone: false,
                    planInstanceId: instanceId,
                    obligationId: obl.id,
                    isRecurring: false,
                    createdAt: new Date().toISOString(),
                    tag: 'обязательные',
                    estimatedEffect: 0 // Payment prevents debt but doesn't "save" money directly unless implicit
                });
            }
        });

        return actions;
    }

    /**
     * Генерирует задачи из Blueprint
     */
    private static generateActionsFromBlueprint(
        blueprint: NonNullable<PlanTemplate['tasksBlueprint']>,
        instanceId: string
    ): PlanAction[] {
        const actions: PlanAction[] = [];
        const now = new Date().toISOString();

        blueprint.forEach(bp => {
            // Simple filtering logic: if blueprint implies a frequency that matches horizon?
            // For MVP, we include all tasks in blueprint, unless they have specific logic (TODO)
            // Ideally, blueprint tasks should be selected based on horizon.
            // But user spec says "The generator will pick subset". 
            // Since we manually defined blueprints for specific scenarios, we assume they fit.
            // If we have "daily" task in "year" plan, it's recurring.

            // Check repeat logic
            const isRecurring = !!bp.repeat;

            // Resolve effect (if it's a string placeholder or number)
            let effect = 0;
            if (typeof bp.estimatedEffect === 'number') {
                effect = bp.estimatedEffect;
            }

            actions.push({
                id: uuidv4(),
                text: bp.title,
                description: bp.description,
                priority: bp.priority,
                isDone: false,
                planInstanceId: instanceId,
                isRecurring: isRecurring,
                createdAt: now,
                tag: bp.tag,
                estimatedEffect: effect,
                points: 10 // default points
            });
        });

        return actions;
    }

    /**
    * Генерирует правила из Blueprint
    */
    private static generateRulesFromBlueprint(
        blueprint: NonNullable<PlanTemplate['rulesBlueprint']>,
        instanceId: string
    ): PlanRule[] {
        return blueprint.map(bp => ({
            id: uuidv4(),
            text: bp.description, // Use description as rule text for now as it is more user friendly
            isActive: true,
            planInstanceId: instanceId
        }));
    }

    /**
     * Генерирует правила (Legacy fallback)
     */
    private static generateLegacyRules(template: PlanTemplate, instanceId: string): PlanRule[] {
        const rules: PlanRule[] = [];

        if (template.category === 'reserve') {
            rules.push({ id: uuidv4(), text: 'Сначала заплати себе (в резерв)', isActive: true, planInstanceId: instanceId });
            rules.push({ id: uuidv4(), text: 'Пауза 24 часа перед покупкой', isActive: true, planInstanceId: instanceId });
        } else if (template.category === 'debt') {
            rules.push({ id: uuidv4(), text: 'НИКАКИХ новых долгов', isActive: true, planInstanceId: instanceId });
        }

        return rules;
    }

    /**
     * Генерирует специфичные задачи шаблона (Legacy fallback)
     */
    private static generateLegacyTemplateActions(
        template: PlanTemplate,
        instanceId: string
    ): PlanAction[] {
        const actions: PlanAction[] = [];
        const now = new Date().toISOString();

        // Fallback: берем примеры из шаблона
        template.exampleTasks.forEach((task, idx) => {
            actions.push({
                id: uuidv4(),
                text: task,
                priority: 3 + idx,
                isDone: false,
                planInstanceId: instanceId,
                isRecurring: false,
                createdAt: now,
                tag: 'общее',
                points: 5
            });
        });

        return actions;
    }
}
