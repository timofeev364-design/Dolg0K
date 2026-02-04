/**
 * SQLite database schema with Drizzle ORM
 * Схема базы данных для хранения платежей, плана и настроек
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Таблица обязательных платежей
 */
export const obligations = sqliteTable('obligations', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    amount: real('amount').notNull(),
    dueDay: integer('due_day').notNull(), // 1-31
    category: text('category').notNull(), // utilities, credit, subscription, mfo, other
    isPaid: integer('is_paid', { mode: 'boolean' }).notNull().default(false),
    lastPaidAt: text('last_paid_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});

/**
 * Таблица экземпляров планов
 */
export const planInstances = sqliteTable('plan_instances', {
    id: text('id').primaryKey(),
    templateId: text('template_id').notNull(),
    status: text('status').notNull(), // active, completed, archived
    startedAt: text('started_at').notNull(),
    endsAt: text('ends_at').notNull(),
    riskLevel: text('risk_level').notNull(),
    savedAmount: real('saved_amount').notNull().default(0),
    horizon: text('horizon').notNull().default('month'),
    params: text('params'), // JSON string
});

/**
 * Таблица действий 7-дневного плана
 */
export const planActions = sqliteTable('plan_actions', {
    id: text('id').primaryKey(),
    text: text('text').notNull(),
    description: text('description'),
    priority: integer('priority').notNull(),
    isDone: integer('is_done', { mode: 'boolean' }).notNull().default(false),
    weekStart: text('week_start'), // DEPRECATED
    planInstanceId: text('plan_instance_id'),
    obligationId: text('obligation_id'),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).notNull().default(false),
    tag: text('tag'),
    estimatedEffect: real('estimated_effect'),
    points: integer('points'),
    completedAt: text('completed_at'),
    createdAt: text('created_at').notNull(),
});

/**
 * Таблица правил плана
 */
export const planRules = sqliteTable('plan_rules', {
    id: text('id').primaryKey(),
    text: text('text').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    planInstanceId: text('plan_instance_id').notNull(),
});

/**
 * Таблица настроек (key-value)
 */
export const settings = sqliteTable('settings', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
});

// Type exports
export type ObligationRow = typeof obligations.$inferSelect;
export type NewObligationRow = typeof obligations.$inferInsert;
export type PlanActionRow = typeof planActions.$inferSelect;
export type NewPlanActionRow = typeof planActions.$inferInsert;
export type PlanInstanceRow = typeof planInstances.$inferSelect;
export type NewPlanInstanceRow = typeof planInstances.$inferInsert;
export type PlanRuleRow = typeof planRules.$inferSelect;
export type NewPlanRuleRow = typeof planRules.$inferInsert;
export type SettingRow = typeof settings.$inferSelect;
