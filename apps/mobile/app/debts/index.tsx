import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { TechGrid, AmbientHeader, GlassCard, MetalSheen } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { useDebtOptimizer } from '../../src/hooks/useDebtOptimizer';
import { Debt } from '../../src/logic/math/debtFormulas';

import { useFinancialData } from '../../src/context/FinancialContext';

export default function DebtsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    // Global Context State
    const { debts, addDebt, removeDebt } = useFinancialData();

    // UI State
    const [extra, setExtra] = useState(5000);
    const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

    // Handle "returning" from Add screen with new data
    useEffect(() => {
        if (params.newDebt) {
            try {
                // The Add Screen should probably add directly to context, or we parse here
                // For now, let's keep this shim to add to context if passed back
                const newDebt = JSON.parse(params.newDebt as string);
                addDebt(newDebt);
                router.setParams({ newDebt: undefined });
            } catch (e) {
                console.error("Failed to parse new debt", e);
            }
        }
    }, [params.newDebt]);

    // Scientific Logic Hook
    const { optimized, baseline, savings, monthsSaved, marginalAnalysis } = useDebtOptimizer(debts, strategy, extra);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Оптимизатор Долгов', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />

            <TechGrid />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Мои Долги</Text>
                        <Text style={styles.subtitle}>{debts.length} активных кредита</Text>
                    </View>
                    <Button
                        title="+ Добавить"
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push('/debts/add')}
                    />
                </View>

                {debts.length === 0 ? (
                    <GlassCard style={styles.emptyState} variant="surface1">
                        <Text style={styles.emptyText}>У вас пока нет добавленных долгов.</Text>
                        <Button title="Добавить первый долг" variant="primary" onPress={() => router.push('/debts/add')} />
                    </GlassCard>
                ) : (
                    <>
                        {/* KPI Comparison */}
                        <View style={styles.kpiRow}>
                            <GlassCard style={styles.kpiCard} variant="surface1">
                                <Text style={styles.kpiLabel}>Переплата (Сейчас)</Text>
                                <Text style={[styles.kpiValue, { color: colors.textSecondary }]}>
                                    {Math.round(baseline.summary.totalInterest).toLocaleString()} ₽
                                </Text>
                                <Text style={styles.kpiSub}>Без ускорения</Text>
                            </GlassCard>

                            <GlassCard style={styles.kpiCard} variant="surface2">
                                <MetalSheen />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={styles.kpiLabel}>Оптимизация</Text>
                                    <Feather name="trending-down" color={colors.accent} size={16} />
                                </View>
                                <Text style={[styles.kpiValue, { color: colors.accent }]}>
                                    {Math.round(optimized.summary.totalInterest).toLocaleString()} ₽
                                </Text>
                                <Text style={[styles.kpiSub, { color: colors.success }]}>
                                    Выгода {Math.round(savings).toLocaleString()} ₽
                                </Text>
                            </GlassCard>
                        </View>

                        {/* Extra Payment Input */}
                        <GlassCard style={styles.controlCard} variant="surface1">
                            <Text style={styles.sectionTitle}>Дополнительно в месяц</Text>
                            <View style={styles.inputRow}>
                                <Button title="-" size="sm" variant="ghost" onPress={() => setExtra(Math.max(0, extra - 1000))} />
                                <Text style={styles.inputValue}>{extra.toLocaleString()} ₽</Text>
                                <Button title="+" size="sm" variant="ghost" onPress={() => setExtra(extra + 1000)} />
                            </View>
                            <Text style={styles.controlHint}>
                                Чем больше вы платите сверх минимума, тем быстрее гасятся долги.
                            </Text>
                        </GlassCard>

                        {/* Strategy Control */}
                        <View style={styles.strategySection}>
                            <Text style={styles.sectionTitle}>Стратегия погашения</Text>
                            <View style={styles.toggleRow}>
                                <Button
                                    title="Лавина (Выгода)"
                                    variant={strategy === 'avalanche' ? 'primary' : 'ghost'}
                                    onPress={() => setStrategy('avalanche')}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    title="Снежный ком (Скорость)"
                                    variant={strategy === 'snowball' ? 'primary' : 'ghost'}
                                    onPress={() => setStrategy('snowball')}
                                    style={{ flex: 1 }}
                                />
                            </View>
                            <Text style={styles.strategyDesc}>
                                {strategy === 'avalanche'
                                    ? 'Сначала гасим долги с самым высоким % (максимальная экономия).'
                                    : 'Сначала гасим самые маленькие долги (быстрые победы).'}
                            </Text>
                        </View>

                        {/* Timeline / Simulation Result */}
                        <GlassCard style={styles.resultCard}>
                            <View style={styles.resultRow}>
                                <Feather name="calendar" size={24} color={colors.textPrimary} />
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.resultLabel}>Срок свободы</Text>
                                    <Text style={styles.resultValue}>
                                        {optimized.summary.debtFreeMonth} мес
                                        {baseline.summary.debtFreeMonth > optimized.summary.debtFreeMonth && (
                                            <Text style={{ color: colors.success }}> (быстрее на {monthsSaved} мес)</Text>
                                        )}
                                    </Text>
                                </View>
                            </View>

                            {/* Marginal Analysis (D13) */}
                            <View style={styles.marginalBox}>
                                <Feather name="info" size={14} color={colors.textTertiary} />
                                <Text style={styles.marginalText}>
                                    +500 ₽ к платежу сэкономят еще {marginalAnalysis.nextLevelMonthsSaved} мес.
                                </Text>
                            </View>
                        </GlassCard>

                        {/* Debt List */}
                        <View style={styles.listSection}>
                            <Text style={styles.sectionTitle}>Список кредитов</Text>
                            {debts.map(debt => (
                                <GlassCard key={debt.id} style={styles.debtRow} variant="surface1">
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.debtName}>{debt.name}</Text>
                                        <Text style={styles.debtDetails}>{debt.apr}% годовых • Минимум {debt.minPayment}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                        <Text style={styles.debtBalance}>{debt.balance.toLocaleString()} ₽</Text>
                                        <Pressable onPress={() => removeDebt(debt.id)}>
                                            <Feather name="trash-2" size={16} color={colors.danger} />
                                        </Pressable>
                                    </View>
                                </GlassCard>
                            ))}
                        </View>
                    </>
                )}

            </ScrollView>
        </View>
    );
}

function debtListIsEmpty(debts: Debt[]) {
    return debts.length === 0;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 800, alignSelf: 'center', width: '100%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
    title: { ...typography.h2, color: colors.textPrimary },
    subtitle: { ...typography.body, color: colors.textSecondary },
    emptyState: { padding: spacing.xl, alignItems: 'center', gap: spacing.md },
    emptyText: { ...typography.body, color: colors.textSecondary },
    kpiRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    kpiCard: { flex: 1, padding: spacing.md },
    kpiLabel: { ...typography.caption, color: colors.textTertiary },
    kpiValue: { ...typography.h3, marginTop: 4 },
    kpiSub: { ...typography.micro, marginTop: 4 },
    controlCard: { padding: spacing.md, marginBottom: spacing.xl },
    inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm },
    inputValue: { ...typography.h3, color: colors.textPrimary },
    controlHint: { ...typography.caption, color: colors.textTertiary },
    strategySection: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.h3, marginBottom: spacing.md },
    toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    strategyDesc: { ...typography.caption, color: colors.textTertiary },
    resultCard: { padding: spacing.lg, marginBottom: spacing.xl },
    resultRow: { flexDirection: 'row', alignItems: 'center' },
    resultLabel: { ...typography.caption, color: colors.textSecondary },
    resultValue: { ...typography.h2, color: colors.textPrimary },
    marginalBox: { flexDirection: 'row', gap: 6, marginTop: spacing.md, padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.small },
    marginalText: { ...typography.caption, color: colors.textSecondary },
    listSection: { gap: spacing.md },
    debtRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
    debtName: { ...typography.bodyM, color: colors.textPrimary },
    debtDetails: { ...typography.caption, color: colors.textTertiary },
    debtBalance: { ...typography.amountM, color: colors.textPrimary },
});
