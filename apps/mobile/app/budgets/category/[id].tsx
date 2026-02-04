import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '@/theme';
import { Budget, BudgetSpend, calculateBudgetMetrics } from '@babki/core';
import { TechGrid, AmbientHeader, GlassCard } from '@/components/ui/PremiumComponents';
import { ListRow, Button } from '@/components';

// Mock Data (in real app, fetch from DB)
const MOCK_CATEGORIES = [
    { id: '1', name: 'Еда', icon: 'coffee', colorToken: '#FFD700' },
    { id: '2', name: 'Транспорт', icon: 'truck', colorToken: '#00BFFF' },
    { id: '3', name: 'Шоппинг', icon: 'shopping-bag', colorToken: '#FF69B4' },
];

export default function CategoryDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    useWindowDimensions();

    // 1. Fetch Data
    const category = MOCK_CATEGORIES.find(c => c.id === id) || { id: 'unknown', name: 'Unknown', icon: 'help-circle', colorToken: '#888' };

    // Mock Budget
    const budget: Budget = {
        id: 'b1',
        categoryId: category.id as string,
        periodType: 'month',
        periodStart: '2023-09-01',
        periodEnd: '2023-09-30',
        limit: 30000,
        thresholds: { warning: 0.7, danger: 0.9, exceeded: 1.0 },
        createdAt: '',
        updatedAt: ''
    };

    // Mock Spends (Growth pattern)
    const spends: BudgetSpend[] = useMemo(() => [
        { id: 's1', budgetId: 'b1', categoryId: category.id as string, amount: 1200, date: '2023-09-02' },
        { id: 's2', budgetId: 'b1', categoryId: category.id as string, amount: 800, date: '2023-09-05' },
        { id: 's3', budgetId: 'b1', categoryId: category.id as string, amount: 2500, date: '2023-09-08' },
        { id: 's4', budgetId: 'b1', categoryId: category.id as string, amount: 500, date: '2023-09-10' },
        { id: 's5', budgetId: 'b1', categoryId: category.id as string, amount: 4000, date: '2023-09-14' }, // Big spend
    ], [category.id]);

    const totalDays = 30;
    const daysPassed = 15;

    // 2. Metrics
    const metricsLink = useMemo(() => calculateBudgetMetrics(budget, spends, totalDays, daysPassed), [budget, spends]);
    const { spent, forecast, riskScore, daysToBreach, isRisk } = metricsLink;

    // B8 logic in metrics.daysToBreach

    // Chart Data (Cumulative Daily for 15 days)
    // We simulate daily buckets
    const chartData = useMemo(() => {
        const data = [];
        let cum = 0;
        for (let i = 1; i <= daysPassed; i++) {
            // Find spends on day i (simplified)
            // Real logic involves date parsing. We'll just distribute mock spends
            const daySpends = spends.filter(s => parseInt(s.date.split('-')[2]) === i);
            const daySum = daySpends.reduce((a, b) => a + b.amount, 0);
            cum += daySum;
            data.push({ day: i, value: cum });
        }
        return data;
    }, [spends, daysPassed]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: category.name,
                headerStyle: { backgroundColor: colors.bg0 },
                headerTintColor: colors.textPrimary,
                headerRight: () => (
                    <Button title="Настроить" variant="ghost" size="sm" onPress={() => router.push('/budgets/edit-budget')} />
                )
            }} />

            <TechGrid />
            <AmbientHeader />

            <ScrollView contentContainerStyle={styles.content}>

                {/* 1. Header & Status */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>{Math.round(spent).toLocaleString()} ₽</Text>
                        <Text style={styles.headerSubtitle}>из {budget.limit.toLocaleString()} ₽</Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        isRisk ? styles.statusDanger : styles.statusSuccess
                    ]}>
                        <Text style={[
                            styles.statusText,
                            isRisk ? { color: colors.danger } : { color: colors.success }
                        ]}>
                            {isRisk ? 'В риске' : 'В норме'}
                        </Text>
                    </View>
                </View>

                {/* 2. Chart (View-based Bars mimicking Line fill) */}
                <GlassCard style={styles.chartCard} variant="surface1">
                    <Text style={styles.chartLabel}>Динамика трат (накопительно)</Text>
                    <View style={styles.chartArea}>
                        {/* Threshold Line (Limit is 100% height) */}
                        <View style={styles.limitLine} />
                        <Text style={styles.limitLabel}>Лимит</Text>

                        <View style={styles.barsContainer}>
                            {chartData.map((d, idx) => {
                                const heightPct = Math.min((d.value / budget.limit) * 100, 100);
                                return (
                                    <View key={idx} style={styles.barColumn}>
                                        <View style={[
                                            styles.barFill,
                                            { height: `${heightPct}%`, backgroundColor: d.value > budget.limit ? colors.danger : colors.accent }
                                        ]} />
                                    </View>
                                )
                            })}
                        </View>
                    </View>
                </GlassCard>

                {/* 3. Forecast Block */}
                <View style={styles.forecastRow}>
                    <GlassCard style={[styles.forecastItem, { flex: 1.5 }]} variant="surface2">
                        <Text style={styles.forecastLabel}>Прогноз на конец</Text>
                        <Text style={styles.forecastValue}>{Math.round(forecast).toLocaleString()} ₽</Text>
                        <Text style={styles.forecastSub}>
                            {forecast > budget.limit ? `+${Math.round(forecast - budget.limit)} перерасход` : 'В рамках бюджета'}
                        </Text>
                    </GlassCard>

                    {/* B8 Signal */}
                    {riskScore > 0 && daysToBreach !== Infinity && (
                        <GlassCard style={[styles.forecastItem, { flex: 2, borderColor: colors.danger }]} variant="surface2">
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                <Feather name="alert-triangle" size={14} color={colors.danger} style={{ marginRight: 6 }} />
                                <Text style={[styles.forecastLabel, { color: colors.danger }]}>Риск перерасхода</Text>
                            </View>
                            <Text style={styles.forecastValue}>{daysToBreach} дн.</Text>
                            <Text style={styles.forecastSub}>осталось до лимита</Text>
                        </GlassCard>
                    )}
                </View>

                {/* 4. Transactions */}
                <Text style={styles.sectionTitle}>История</Text>
                <GlassCard style={{ padding: 0 }} variant="surface1">
                    {spends.map((s, i) => (
                        <ListRow
                            key={s.id}
                            title="Транзакция"
                            subtitle={s.date}
                            rightText={`-${s.amount} ₽`}
                            style={i === spends.length - 1 ? { borderBottomWidth: 0 } : undefined}
                        />
                    ))}
                </GlassCard>

            </ScrollView>
        </View>
    );
}

const styles: any = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    content: {
        padding: spacing.lg,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xl,
    },
    headerTitle: {
        ...typography.amountL,
        color: colors.textPrimary,
    },
    headerSubtitle: {
        ...typography.bodyM,
        color: colors.textTertiary,
    },
    statusBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: radius.round,
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    statusSuccess: {
        backgroundColor: 'rgba(42, 232, 167, 0.1)',
        borderColor: 'rgba(42, 232, 167, 0.3)',
    },
    statusDanger: {
        backgroundColor: 'rgba(255, 90, 107, 0.1)',
        borderColor: 'rgba(255, 90, 107, 0.3)',
    },
    statusText: {
        ...typography.caption,
        fontWeight: '600',
    },
    chartCard: {
        height: 220,
        marginBottom: spacing.lg,
        justifyContent: 'flex-end',
    },
    chartLabel: {
        position: 'absolute',
        top: 16,
        left: 16,
        ...typography.caption,
        color: colors.textTertiary,
    },
    chartArea: {
        flex: 1,
        marginTop: 40,
        position: 'relative',
        borderBottomWidth: 1,
        borderBottomColor: colors.stroke1,
        borderLeftWidth: 1, // Y-axis
        borderLeftColor: colors.stroke1,
    },
    limitLine: {
        position: 'absolute',
        top: 0, // 100% height = limit
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: colors.textTertiary,
        borderStyle: 'dashed', // simple line for now
        opacity: 0.5,
    },
    limitLabel: {
        position: 'absolute',
        top: -20,
        right: 0,
        fontSize: 10,
        color: colors.textTertiary,
    },
    barsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    barColumn: {
        flex: 1,
        height: '100%', // container height
        justifyContent: 'flex-end',
        marginHorizontal: 1,
    },
    barFill: {
        width: '100%',
        minHeight: 2,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2,
        opacity: 0.8,
    },
    forecastRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    forecastItem: {
        padding: spacing.md,
    },
    forecastLabel: {
        fontSize: 11,
        color: colors.textTertiary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    forecastValue: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 20,
        fontVariant: ['tabular-nums'] as any,
    },
    forecastSub: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    sectionTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
        color: colors.textPrimary,
    }
});
