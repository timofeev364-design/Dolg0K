/**
 * Dashboard Screen
 * Style: Obsidian Tech Premium
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, ViewStyle } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { Obligation, RiskResult } from '@babki/core';
import { calculateRisk, CATEGORY_LABELS } from '@babki/core';
import { getStorage } from '../src/db';
import { ListRow, Button, Card, Badge } from '../src/components';
import { AmbientHeader, Orb, GlassCard, MetalSheen } from '../src/components/ui/PremiumComponents';
import { colors, spacing, radius, typography } from '../src/theme';

export default function DashboardScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(0);

    const loadData = useCallback(async () => {
        const storage = getStorage();
        const [obls, setts] = await Promise.all([
            storage.getAllObligations(),
            storage.getSettings(),
        ]);

        setObligations(obls);
        if (setts) {
            setBalance(setts.currentBalance || 0);
            const risk = calculateRisk({
                obligations: obls,
                salaryDay: setts.salaryDay,
                currentBalance: setts.currentBalance,
            });
            setRiskResult(risk || null);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    // --- Calculated Data ---
    const upcomingPayments = obligations
        .filter(o => !o.isPaid)
        .sort((a, b) => a.dueDay - b.dueDay)
        .slice(0, 5);

    const totalUnpaid = obligations.filter(o => !o.isPaid).reduce((s, o) => s + o.amount, 0);
    const totalPaid = obligations.filter(o => o.isPaid).reduce((s, o) => s + o.amount, 0);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        >
            <AmbientHeader />

            {/* Header Row */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Обзор</Text>
                    <Text style={styles.headerSubtitle}>Финансовая сводка</Text>
                </View>
                {riskResult && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {/* 3D Orb for Status */}
                        <Orb
                            size={12}
                            color={riskResult.level === 'high' ? colors.danger : riskResult.level === 'medium' ? colors.warning : colors.success}
                        />
                        <Badge
                            label={riskResult.level === 'high' ? 'Тревога' : riskResult.level === 'medium' ? 'Риск' : 'Норма'}
                            variant={riskResult.level === 'high' ? 'danger' : riskResult.level === 'medium' ? 'warning' : 'success'}
                            dot={false}
                        />
                    </View>
                )}
            </View>

            {/* KPI Row (3-4 cards) */}
            <View style={styles.kpiRow}>
                <KpiCard label="К оплате (7 дней)" value={totalUnpaid} icon="credit-card" />
                <KpiCard label="Оплачено (30 дней)" value={totalPaid} icon="check-circle" />
                <KpiCard label="Баланс" value={balance} icon="briefcase" isAccent />
            </View>

            {/* Main Content Grid */}
            <View style={[styles.mainGrid, isDesktop && styles.desktopGrid]}>

                {/* Left: Upcoming (Flex 2 on desktop) */}
                <View style={[styles.column, isDesktop && { flex: 2 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Ближайшие платежи</Text>
                        <PressableText text="Все" onPress={() => router.push('/payments')} />
                    </View>

                    <Card padding="none" style={styles.cardList}>
                        {upcomingPayments.length > 0 ? (
                            <View>
                                {upcomingPayments.map((item, index) => (
                                    <ListRow
                                        key={item.id}
                                        title={item.name}
                                        subtitle={`${item.dueDay} числа • ${CATEGORY_LABELS[item.category]}`}
                                        rightText={`${item.amount.toLocaleString('ru-RU')} ₽`}
                                        status="warning" // Implicit due status for upcoming
                                        onPress={() => router.push(`/payments?edit=${item.id}`)}
                                        style={index === upcomingPayments.length - 1 ? { borderBottomWidth: 0 } : undefined}
                                    />
                                ))}
                            </View>
                        ) : (
                            <EmptyState
                                title="Нет платежей"
                                desc="Добавьте первый платёж или используйте шаблон."
                                onAction={() => router.push('/add-payment')}
                            />
                        )}
                    </Card>
                </View>

                {/* Right: Actions & Signals (Flex 1 on desktop) */}
                <View style={[styles.column, isDesktop && { flex: 1 }]}>

                    {/* Actions Panel */}
                    <Card style={styles.actionsPanel}>
                        <View style={styles.panelHeader}>
                            <Text style={typography.h3}>Действия</Text>
                        </View>
                        <Button
                            title="Пройти Фин. Тест"
                            variant="primary"
                            fullWidth
                            onPress={() => router.push('/financial-test')}
                            style={{ marginBottom: spacing.md }}
                            icon={<Feather name="check-square" size={18} color={colors.textOnAccent} />}
                        />
                        <Button
                            title="Добавить платёж"
                            variant="primary"
                            fullWidth
                            onPress={() => router.push('/add-payment')}
                            style={{ marginBottom: spacing.md }}
                        />
                        <Button
                            title="Бюджеты"
                            variant="secondary"
                            fullWidth
                            onPress={() => router.push('/budgets')}
                            style={{ marginBottom: spacing.md }}
                        />

                        <Button
                            title="Шаблоны"
                            variant="ghost"
                            fullWidth
                            onPress={() => router.push('/templates')}
                        />
                    </Card>

                    {/* Signals */}
                    <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>Сигналы</Text>
                    <Card padding="none">
                        <ListRow title="Напоминания" subtitle="09:00" icon="bell" style={{ height: 48 }} />
                        <ListRow title="Зарплата" subtitle="10 число" icon="calendar" style={{ height: 48, borderBottomWidth: 0 }} />
                    </Card>

                    {/* Emergency Pattern */}
                    {riskResult?.level === 'high' && (
                        <View style={styles.emergencyCard}>
                            <View style={styles.dangerLine} />
                            <Text style={styles.dangerTitle}>Требуется внимание</Text>
                            <Text style={styles.dangerText}>Не хватает средств до следующей зарплаты.</Text>
                            <Button
                                title="Открыть рекомендации"
                                variant="danger"
                                size="sm"
                                onPress={() => router.push('/panic')}
                                style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                            />
                        </View>
                    )}

                </View>
            </View>
        </ScrollView>
    );
}

// --- Micro Components ---

function KpiCard({ label, value, icon, isAccent }: { label: string, value: number, icon: any, isAccent?: boolean }) {
    return (
        <GlassCard style={styles.kpiCard} variant={isAccent ? 'surface2' : 'surface1'}>
            {/* Micro-sparkline or Sheen on hover would be added here via interactive pattern */}
            {isAccent && <MetalSheen />}

            <View style={styles.kpiHeader}>
                <Text style={styles.kpiLabel}>{label}</Text>
                <Feather name={icon} size={16} color={colors.textTertiary} />
            </View>
            <Text style={[styles.kpiValue, isAccent && { color: colors.accent }]}>
                {value.toLocaleString('ru-RU')} ₽
            </Text>
        </GlassCard>
    );
}

function PressableText({ text, onPress }: { text: string, onPress: () => void }) {
    return (
        <Text onPress={onPress} style={{ color: colors.accent, fontWeight: '500' }}>{text}</Text>
    );
}

function EmptyState({ title, desc, onAction }: { title: string, desc: string, onAction: () => void }) {
    return (
        <View style={styles.emptyState}>
            <Feather name="layers" size={24} color={colors.textTertiary} style={{ marginBottom: spacing.sm }} />
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyDesc}>{desc}</Text>
            <Button title="Добавить платёж" size="sm" variant="secondary" onPress={onAction} style={{ marginTop: spacing.md }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    content: {
        padding: spacing.lg, // 24 if possible, or md=16 then container margin
        maxWidth: 1120,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    headerTitle: {
        ...typography.h1,
        marginBottom: 4,
    },
    headerSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    kpiRow: {
        flexDirection: 'row',
        gap: spacing.md, // 16
        marginBottom: spacing.xl, // 32
        flexWrap: 'wrap',
    },
    kpiCard: {
        flex: 1,
        minWidth: 160,
    },
    kpiHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    kpiLabel: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    kpiValue: {
        ...typography.amountL,
        fontVariant: ['tabular-nums'] as any,
    },
    mainGrid: {
        flexDirection: 'column',
        gap: spacing.xl,
    } as ViewStyle,
    desktopGrid: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    } as ViewStyle,
    column: {
        flexDirection: 'column',
    } as ViewStyle,
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    } as ViewStyle,
    sectionTitle: {
        ...typography.h2,
    },
    cardList: {
        overflow: 'hidden',
    } as ViewStyle,
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    emptyTitle: {
        ...typography.bodyM,
        marginBottom: 4,
    },
    emptyDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    actionsPanel: {
        padding: spacing.lg,
    },
    panelHeader: {
        marginBottom: spacing.lg,
    },
    emergencyCard: {
        marginTop: spacing.lg,
        backgroundColor: 'rgba(255, 90, 107, 0.05)', // Almost transparent
        borderRadius: radius.card,
        padding: spacing.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    dangerLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        backgroundColor: colors.danger,
    },
    dangerTitle: {
        ...typography.bodyM,
        color: colors.textPrimary,
        marginBottom: 4,
        marginLeft: 4,
    },
    dangerText: {
        ...typography.caption,
        color: colors.textSecondary,
        marginLeft: 4,
    }
});
