/**
 * Active Plan Screen (Obsidian Tech Premium)
 * The Command Center for financial goals.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { ProgressBar, Button, ListRow } from '..';
import { Orb, GlassCard, TechGrid } from '../ui/PremiumComponents';
import { getStorage } from '../../db';
import type { PlanInstance, PlanAction } from '../../core';

interface ActivePlanProps {
    plan: PlanInstance;
    onBack: () => void;
}

export function ActivePlan({ plan, onBack }: ActivePlanProps) {
    const [actions, setActions] = useState<PlanAction[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadActions = useCallback(async () => {
        const storage = getStorage();
        const acts = await storage.getActionsForPlan(plan.id);
        setActions(acts);
    }, [plan.id]);

    useEffect(() => { loadActions(); }, [loadActions]);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const storage = getStorage();
        await storage.updatePlanActionStatus(id, !currentStatus);
        await loadActions();
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadActions();
        setRefreshing(false);
    }

    // Metrics
    const completed = actions.filter(a => a.isDone).length;
    const total = actions.length;
    const progress = total > 0 ? completed / total : 0;
    const progressPercent = Math.round(progress * 100);

    const streak = 1; // Placeholder for now, requires streak logic in core
    // Horizontal logic
    const horizonDays = plan.horizon === 'week' ? 7 : plan.horizon === 'month' ? 30 : plan.horizon === 'year' ? 365 : 90;

    // Group actions: Active vs Done
    const activeActions = actions.filter(a => !a.isDone).sort((a, b) => a.priority - b.priority);
    const doneActions = actions.filter(a => a.isDone);

    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024; // Wide desktop

    return (
        <View style={styles.container}>
            <TechGrid />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color={colors.textSecondary} />
                    </Pressable>
                    <View style={styles.headerContent}>
                        <Text style={styles.planTitle}>{plan.templateId === 'p1' ? 'Быстрый старт' : 'Финансовый план'}</Text>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={styles.statusText}>Активен</Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                {isDesktop ? (
                    /* DESKTOP GRID LAYOUT (2 Columns) */
                    <View style={styles.gridContainer}>
                        {/* LEFT COLUMN: Progress & Metrics (Fixed Width or 40%) */}
                        <View style={styles.leftCol}>
                            {/* Progress Section */}
                            <View style={styles.section}>
                                <View style={styles.progressHeader}>
                                    <View>
                                        <Text style={styles.progressLabel}>Прогресс цели</Text>
                                        <Text style={styles.progressValue}>{progressPercent}%</Text>
                                    </View>
                                    <Orb size={64} color={colors.accent} intensity="hard" />
                                </View>
                                <ProgressBar progress={progress} height={8} />
                                <Text style={styles.progressSubtext}>{completed} из {total} задач выполнено</Text>
                            </View>

                            {/* Success Metrics */}
                            <View style={styles.metricsGrid}>
                                <GlassCard style={styles.metricBox} variant="surface2">
                                    <Feather name="zap" size={20} color={colors.warning} style={styles.metricIcon} />
                                    <Text style={styles.metricValue}>{streak} день</Text>
                                    <Text style={styles.metricLabel}>Стрик</Text>
                                </GlassCard>
                                <GlassCard style={styles.metricBox} variant="surface2">
                                    <Feather name="flag" size={20} color={colors.accent} style={styles.metricIcon} />
                                    <Text style={styles.metricValue}>{horizonDays} дн</Text>
                                    <Text style={styles.metricLabel}>Горизонт</Text>
                                </GlassCard>
                            </View>

                            {/* Correction / Actions */}
                            <View style={styles.correctionSection}>
                                <Text style={styles.sectionTitle}>Управление</Text>
                                <ListRow
                                    title="Завершить план"
                                    subtitle="Архивировать текущий план"
                                    icon="archive"
                                    onPress={onBack}
                                />
                            </View>
                        </View>

                        {/* RIGHT COLUMN: Tasks (Flex 1) */}
                        <View style={styles.rightCol}>
                            {/* Current Tasks */}
                            <GlassCard style={[styles.missionCard, { flex: 1, minHeight: 400 }]} variant="surface1">
                                <View style={styles.missionHeader}>
                                    <Text style={styles.missionTitle}>Текущие задачи</Text>
                                    <Text style={styles.missionDate}>В работе</Text>
                                </View>

                                {activeActions.length > 0 ? (
                                    activeActions.map(action => (
                                        <View key={action.id} style={styles.taskRow}>
                                            <Pressable
                                                style={[styles.checkbox, action.isDone && styles.checkboxDone]}
                                                onPress={() => handleToggle(action.id, action.isDone)}
                                            >
                                                {action.isDone && <Feather name="check" size={14} color={colors.bg0} />}
                                            </Pressable>
                                            <View style={styles.taskContent}>
                                                <Text style={styles.taskText}>{action.text}</Text>
                                                {action.description && <Text style={styles.taskSubtext}>{action.description}</Text>}
                                            </View>
                                            <Button title="Сделано" size="sm" onPress={() => handleToggle(action.id, action.isDone)} />
                                        </View>
                                    ))
                                ) : (
                                    <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                                        Все активные задачи выполнены!
                                    </Text>
                                )}
                            </GlassCard>

                            {/* Completed Tasks (History) */}
                            {doneActions.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>История выполнения</Text>
                                    {doneActions.slice(0, 5).map(action => (
                                        <ListRow
                                            key={action.id}
                                            title={action.text}
                                            subtitle="Выполнено"
                                            status="success"
                                            onPress={() => handleToggle(action.id, action.isDone)}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                ) : (
                    /* MOBILE LAYOUT (Stack) */
                    <>
                        {/* Progress Section */}
                        <View style={styles.section}>
                            <View style={styles.progressHeader}>
                                <View>
                                    <Text style={styles.progressLabel}>Прогресс цели</Text>
                                    <Text style={styles.progressValue}>{progressPercent}%</Text>
                                </View>
                                <Orb size={48} color={colors.accent} intensity="hard" />
                            </View>
                            <ProgressBar progress={progress} height={6} />
                            <Text style={styles.progressSubtext}>{completed} из {total} задач выполнено</Text>
                        </View>

                        {/* Current Tasks */}
                        <GlassCard style={styles.missionCard} variant="surface1">
                            <View style={styles.missionHeader}>
                                <Text style={styles.missionTitle}>Текущие задачи</Text>
                                <Text style={styles.missionDate}>В работе</Text>
                            </View>

                            {activeActions.length > 0 ? (
                                activeActions.map(action => (
                                    <View key={action.id} style={styles.taskRow}>
                                        <Pressable
                                            style={[styles.checkbox, action.isDone && styles.checkboxDone]}
                                            onPress={() => handleToggle(action.id, action.isDone)}
                                        >
                                            {action.isDone && <Feather name="check" size={14} color={colors.bg0} />}
                                        </Pressable>
                                        <View style={styles.taskContent}>
                                            <Text style={styles.taskText}>{action.text}</Text>
                                            {action.description && <Text style={styles.taskSubtext}>{action.description}</Text>}
                                        </View>
                                        <Button title="Сделано" size="sm" onPress={() => handleToggle(action.id, action.isDone)} />
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
                                    Все активные задачи выполнены!
                                </Text>
                            )}
                        </GlassCard>

                        {/* Success Metrics */}
                        <View style={styles.metricsGrid}>
                            <GlassCard style={styles.metricBox} variant="surface2">
                                <Feather name="zap" size={20} color={colors.warning} style={styles.metricIcon} />
                                <Text style={styles.metricValue}>{streak} день</Text>
                                <Text style={styles.metricLabel}>Стрик</Text>
                            </GlassCard>
                            <GlassCard style={styles.metricBox} variant="surface2">
                                <Feather name="flag" size={20} color={colors.accent} style={styles.metricIcon} />
                                <Text style={styles.metricValue}>{horizonDays} дн</Text>
                                <Text style={styles.metricLabel}>Горизонт</Text>
                            </GlassCard>
                        </View>

                        {/* Completed Tasks (History) */}
                        {doneActions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Выполнено</Text>
                                {doneActions.slice(0, 5).map(action => (
                                    <ListRow
                                        key={action.id}
                                        title={action.text}
                                        subtitle="Выполнено"
                                        status="success"
                                        onPress={() => handleToggle(action.id, action.isDone)}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Correction / Actions */}
                        <View style={styles.correctionSection}>
                            <Text style={styles.sectionTitle}>Управление</Text>
                            <ListRow
                                title="Завершить план"
                                subtitle="Архивировать текущий план"
                                icon="archive"
                                onPress={onBack}
                            />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    backButton: {
        padding: spacing.sm,
    },
    headerContent: {
        alignItems: 'center',
    },
    planTitle: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface2,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.round,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        ...typography.micro,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    progressLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    progressValue: {
        fontWeight: typography.body.fontWeight,
        fontSize: typography.body.fontSize,
        color: colors.accent,
        fontVariant: ['tabular-nums'] as any,
    },
    progressSubtext: {
        marginTop: spacing.xs,
        ...typography.caption,
        color: colors.textTertiary,
        textAlign: 'right',
    },
    missionCard: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card, // Fixed from lg to card
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.stroke1,
        marginBottom: spacing.xl,
    },
    missionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    missionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    missionDate: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.accent,
        marginRight: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxDone: {
        backgroundColor: colors.accent,
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        ...typography.body,
        color: colors.textPrimary,
    },
    taskSubtext: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    metricBox: {
        flex: 1,
        backgroundColor: colors.surface1,
        padding: spacing.md,
        borderRadius: radius.ui, // Fixed from md to ui
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    metricIcon: {
        marginBottom: spacing.xs,
    },
    metricValue: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    metricLabel: {
        color: colors.textTertiary,
        fontSize: 11,
        textTransform: 'uppercase',
    },
    correctionSection: {
        // 
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
    },
    // Desktop Grid Styles
    desktopContent: {
        maxWidth: 1280, // Wider for 2col
        paddingHorizontal: spacing.xl,
    },
    gridContainer: {
        flexDirection: 'row',
        gap: spacing.xl,
        alignItems: 'flex-start',
    },
    leftCol: {
        width: 320,
        flexShrink: 0,
    },
    rightCol: {
        flex: 1,
        minWidth: 400,
    }
});
