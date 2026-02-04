import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { useFinancialData } from '../../src/context/FinancialContext';
import { useCategoryDistribution, ExtendedCategory } from '../../src/hooks/useCategoryDistribution';
import { Button } from '../../src/components/Button';

import { SegmentedControl } from '../../src/components';

const PRESETS = [
    { id: 'conservative', label: '70/20/10' },
    { id: 'balanced', label: '60/20/20' },
    { id: 'aggressive', label: '55/30/15' },
    { id: 'minimal', label: '80/10/10' },
] as const;

export default function PaydayScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const {
        monthlyIncome, updateIncome,
        budgets, updateBudget, categories, goals, fundGoal,
        housingCost, updateHousing
    } = useFinancialData();
    const router = useRouter();

    // Filter categories to treat Housing as a fixed deduction
    const distributionCategories = React.useMemo(() =>
        categories.filter(c => c.id !== 'housing'),
        [categories]);

    // Mapping budgets for initial state
    const initialBudgets = React.useMemo(() => {
        const map: Record<string, number> = {};
        budgets.forEach(b => map[b.categoryId] = b.limit);
        return map;
    }, [budgets]);

    // Mode State
    const [mode, setMode] = React.useState<'monthly' | 'daily'>('monthly');
    const [dailyIncome, setDailyIncome] = React.useState(0);
    const [debtRepayment, setDebtRepayment] = React.useState(0);

    // Calculated Inputs based on Mode
    const effectiveIncome = mode === 'monthly' ? monthlyIncome : dailyIncome;
    // In daily mode, we ignore housing/debt logic (as per request "zero out") unless we added a specific "daily deduction" input.
    // Assuming 0 deductions for daily simple mode.
    const effectiveHousing = mode === 'monthly' ? housingCost : 0;
    const effectiveDebt = mode === 'monthly' ? debtRepayment : 0;

    const netIncome = Math.max(0, effectiveIncome - effectiveDebt - effectiveHousing);

    // Sync Handler: Monthly = Live Sync, Daily = No-op (Wait for button)
    const handleSync = React.useCallback((id: string, amount: number) => {
        if (mode === 'monthly') {
            updateBudget(id, amount);
        }
    }, [mode, updateBudget]);

    // Initial Budgets: Monthly = Current, Daily = Reset (Empthy/Zero) so we distribute fresh amount
    const effectiveInitialBudgets = React.useMemo(() => {
        if (mode === 'daily') return {};
        return initialBudgets;
    }, [mode, initialBudgets]);

    const { items, updateItem, stats, config, setConfig, setPreset } = useCategoryDistribution(
        netIncome,
        distributionCategories,
        effectiveInitialBudgets,
        handleSync
    );

    const handleDistribute = () => {
        const savingsItem = items.find(i => i.id === 'savings');

        // 1. Handle Savings (Goals) - Same for both modes (Saving is Saving)
        if (savingsItem && savingsItem.amount > 0) {
            const amount = savingsItem.amount;
            const emergencyGoal = goals.find(g => g.id === 'emergency_fund');
            const otherGoals = goals.filter(g => g.id !== 'emergency_fund');

            if (Object.keys(goals).length === 0) {
                // No goals
            } else if (!emergencyGoal) {
                if (otherGoals.length > 0) fundGoal(otherGoals[0].id, amount);
            } else {
                if (otherGoals.length > 0) {
                    const cushionPart = Math.round(amount / 2);
                    const othersPart = amount - cushionPart;
                    fundGoal(emergencyGoal.id, cushionPart);
                    const perGoal = Math.floor(othersPart / otherGoals.length);
                    otherGoals.forEach((g, index) => {
                        const toAdd = index === 0 ? (othersPart - perGoal * (otherGoals.length - 1)) : perGoal;
                        fundGoal(g.id, toAdd);
                    });
                } else {
                    fundGoal(emergencyGoal.id, amount);
                }
            }
        }

        // 2. Handle Budgets
        if (mode === 'daily') {
            // INCREMENT existing budgets
            items.forEach(item => {
                if (item.group !== 'savings' && item.amount > 0) {
                    const currentLimit = budgets.find(b => b.categoryId === item.id)?.limit || 0;
                    updateBudget(item.id, currentLimit + item.amount);
                }
            });
            Alert.alert('Успешно', 'Суммы добавлены к текущим бюджетам!');
            // Optional: reset daily income?
            setDailyIncome(0);
        } else {
            // ALREADY SYNCED via handleSync (Live). Just notify.
            Alert.alert('Успешно', 'Бюджет (Месяц) обновлен!');
        }

        router.push('/');
    };

    const renderCategoryRow = (item: ExtendedCategory) => {
        const isPercent = item.mode === 'percent';
        const isSavings = item.id === 'savings';

        const hasOtherGoals = goals.filter(g => g.id !== 'emergency_fund').length > 0;
        const cushionStart = goals.find(g => g.id === 'emergency_fund');

        let subText = null;
        if (isSavings && item.amount > 0) {
            if (hasOtherGoals) {
                const half = Math.round(item.amount / 2);
                subText = (
                    <View style={styles.splitRow}>
                        <View style={styles.splitItem}>
                            <Feather name="shield" size={10} color={colors.success} />
                            <Text style={styles.splitText}>Подушка: {half.toLocaleString()} ₽</Text>
                        </View>
                        <View style={styles.splitItem}>
                            <Feather name="target" size={10} color={colors.accent} />
                            <Text style={styles.splitText}>Цели: {half.toLocaleString()} ₽</Text>
                        </View>
                    </View>
                );
            } else if (cushionStart) {
                subText = (
                    <View style={styles.splitRow}>
                        <View style={styles.splitItem}>
                            <Feather name="shield" size={10} color={colors.success} />
                            <Text style={styles.splitText}>Все на подушку</Text>
                        </View>
                    </View>
                );
            }
        }

        return (
            <View key={item.id} style={[styles.catRowWrapper, isSavings && styles.catRowSavings]}>
                <View style={[styles.catRow, isSavings && { borderBottomWidth: 0, paddingBottom: isSavings && item.amount > 0 ? 4 : 8 }]}>
                    <View style={[styles.groupIndicator, { backgroundColor: item.group === 'mandatory' ? colors.danger : (item.group === 'savings' ? colors.success : colors.accent) }]} />

                    <View style={styles.catLabelRow}>
                        <View style={[styles.iconBox, { backgroundColor: item.colorToken + '20' }]}>
                            <Feather name={item.icon as any} size={16} color={item.colorToken} />
                        </View>
                        <View>
                            <Text style={styles.catName}>{item.name}</Text>
                            <Text style={styles.catSub}>{item.group === 'mandatory' ? 'Обязательное' : (item.group === 'savings' ? 'Сбережения' : 'Гибкое')}</Text>
                        </View>
                    </View>

                    <View style={styles.controlsRow}>
                        <View style={[styles.inputWrapper, !isPercent && styles.activeInput]}>
                            <TextInput
                                style={[styles.smallInput, !isPercent && { color: colors.textPrimary }]}
                                value={Math.round(item.amount).toString()}
                                onChangeText={(v) => {
                                    const val = parseFloat(v);
                                    if (!isNaN(val)) updateItem(item.id, { mode: 'amount', amount: val });
                                }}
                                keyboardType="numeric"
                                onFocus={() => updateItem(item.id, { mode: 'amount' })}
                            />
                            <Text style={styles.unit}>₽</Text>
                        </View>

                        <View style={[styles.inputWrapper, isPercent && styles.activeInput]}>
                            <TextInput
                                style={[styles.smallInput, isPercent && { color: colors.accent }]}
                                value={item.percent.toFixed(1)}
                                onChangeText={(v) => {
                                    const val = parseFloat(v);
                                    if (!isNaN(val)) updateItem(item.id, { mode: 'percent', percent: val });
                                }}
                                keyboardType="numeric"
                                onFocus={() => updateItem(item.id, { mode: 'percent' })}
                            />
                            <Text style={styles.unit}>%</Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => updateItem(item.id, { isLocked: !item.isLocked })}
                            style={[styles.iconBtn, item.isLocked && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                        >
                            <Feather name={item.isLocked ? "lock" : "unlock"} size={14} color={item.isLocked ? colors.warning : colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
                {subText && (
                    <View style={styles.subTextContainer}>
                        {subText}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'План Распределения', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>

                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.title}>Распределение</Text>
                            <View style={{ width: 160 }}>
                                <SegmentedControl
                                    options={[{ label: 'Месяц', value: 'monthly' }, { label: 'День', value: 'daily' }]}
                                    value={mode}
                                    onChange={(v) => setMode(v as any)}
                                />
                            </View>
                        </View>
                        <Text style={styles.subtitle}>
                            Чистый доход: {Math.round(netIncome).toLocaleString()} ₽
                        </Text>
                    </View>

                    <GlassCard style={styles.topCard} variant="surface1">
                        <View style={styles.row}>
                            <View style={styles.field}>
                                <Text style={styles.label}>{mode === 'daily' ? 'Доход за день' : 'Общий Доход'}</Text>
                                <TextInput
                                    style={styles.mainInput}
                                    value={mode === 'daily' ? dailyIncome.toString() : monthlyIncome.toString()}
                                    onChangeText={(v) => {
                                        const val = parseFloat(v) || 0;
                                        if (mode === 'daily') setDailyIncome(val);
                                        else updateIncome(val);
                                    }}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Deductions - Only visible/active in Monthly mode or explicit daily deductions? 
                            Request said "zero out". Visually hiding/disabling makes sense to avoid confusion. */}
                        <View style={[styles.row, { opacity: mode === 'daily' ? 0.3 : 1 }]}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Погашение Долгов</Text>
                                <TextInput
                                    style={[styles.mainInput, { color: colors.danger }]}
                                    value={effectiveDebt.toString()}
                                    onChangeText={(v) => mode === 'monthly' && setDebtRepayment(parseFloat(v) || 0)}
                                    keyboardType="numeric"
                                    editable={mode === 'monthly'}
                                />
                            </View>
                            <View style={[styles.field, { marginLeft: 16 }]}>
                                <Text style={styles.label}>Жилье</Text>
                                <TextInput
                                    style={[styles.mainInput, { color: '#A78BFA' }]}
                                    value={effectiveHousing.toString()}
                                    onChangeText={(v) => mode === 'monthly' && updateHousing(parseFloat(v) || 0)}
                                    keyboardType="numeric"
                                    editable={mode === 'monthly'}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.statLabel}>База для распределения (Net)</Text>
                                <Text style={[styles.statValue, { color: colors.accent }]}>
                                    {Math.round(netIncome).toLocaleString()} ₽
                                </Text>
                            </View>
                            <View style={styles.statsBlock}>
                                <Text style={styles.statLabel}>Остаток</Text>
                                <Text style={[styles.statValue, { color: stats.remainingAmount < 0 ? colors.danger : colors.success }]}>
                                    {Math.round(stats.remainingAmount).toLocaleString()} ₽
                                </Text>
                                <Text style={[styles.statSub, { color: stats.remainingPercent < 0 ? colors.danger : colors.textSecondary }]}>
                                    {stats.remainingPercent.toFixed(1)}% free
                                </Text>
                            </View>
                        </View>

                        <View style={styles.togglesRow}>
                            <TouchableOpacity
                                style={[styles.pill, config.normalizationMode === 'auto-scale' && styles.activePill]}
                                onPress={() => setConfig(p => ({ ...p, normalizationMode: p.normalizationMode === 'strict' ? 'auto-scale' : 'strict' }))}
                            >
                                <Text style={[styles.pillText, config.normalizationMode === 'auto-scale' && styles.activePillText]}>🤖 Auto-Scale</Text>
                            </TouchableOpacity>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                {PRESETS.map(p => (
                                    <TouchableOpacity key={p.id} style={styles.chip} onPress={() => setPreset(p.id as any)}>
                                        <Text style={styles.chipText}>{p.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </GlassCard>

                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${Math.min(100, stats.totalPercent)}%` as any, backgroundColor: stats.totalPercent > 100 ? colors.danger : colors.accent }]} />
                    </View>
                    <Text style={styles.progressText}>Распределено: {stats.totalPercent.toFixed(1)}% ({Math.round(stats.totalAmount).toLocaleString()} ₽)</Text>

                    <GlassCard style={styles.listCard} variant="surface2">
                        {items.map(renderCategoryRow)}
                    </GlassCard>

                    <Button
                        title={mode === 'daily' ? "Добавить к Бюджету" : "Сохранить Бюджет"}
                        onPress={handleDistribute}
                        style={{ marginTop: 24, marginBottom: 40 }}
                        size="lg"
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    content: { padding: spacing.lg, paddingBottom: 100 },
    desktopContent: { maxWidth: 650, alignSelf: 'center', width: '100%' },

    header: { marginBottom: spacing.md },
    title: { ...typography.h3, color: colors.textPrimary },
    subtitle: { ...typography.caption, color: colors.textSecondary },

    topCard: { padding: spacing.md, marginBottom: spacing.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
    field: { flex: 1 },
    statsBlock: { alignItems: 'flex-end' },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    mainInput: { ...typography.h2, color: colors.textPrimary, borderBottomWidth: 1, borderBottomColor: colors.stroke1, paddingBottom: 4, minWidth: 120 },

    statLabel: { ...typography.caption, color: colors.textSecondary },
    statValue: { ...typography.h3, fontWeight: '700' },
    statSub: { ...typography.micro },

    togglesRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.surface3, borderWidth: 1, borderColor: colors.stroke1 },
    activePill: { backgroundColor: colors.accent + '20', borderColor: colors.accent },
    pillText: { ...typography.caption, color: colors.textSecondary },
    activePillText: { color: colors.accent },

    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.stroke1 },
    chipText: { ...typography.micro, color: colors.textSecondary },

    progressContainer: { height: 4, backgroundColor: colors.surface3, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
    progressBar: { height: '100%' },
    progressText: { ...typography.micro, textAlign: 'right', color: colors.textSecondary, marginBottom: spacing.md },

    listCard: { padding: spacing.sm, gap: 12 },
    catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 12, padding: 8, gap: 8 },
    groupIndicator: { width: 3, height: 24, borderRadius: 2 },
    catLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    catName: { ...typography.body, fontSize: 14, color: colors.textPrimary },
    catSub: { ...typography.micro, fontSize: 10, color: colors.textTertiary },

    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg0, borderRadius: 6, paddingHorizontal: 6, height: 32, borderWidth: 1, borderColor: 'transparent' },
    activeInput: { borderColor: colors.accent + '40' },
    smallInput: { color: colors.textSecondary, fontSize: 13, minWidth: 30, textAlign: 'right', padding: 0 },
    unit: { ...typography.micro, color: colors.textTertiary, marginLeft: 2 },
    iconBtn: { padding: 6, borderRadius: 6 },

    catRowWrapper: { marginBottom: 0, overflow: 'hidden' },
    catRowSavings: { backgroundColor: colors.surface1, borderRadius: 12 },
    subTextContainer: { paddingHorizontal: 48, paddingBottom: 8 },
    splitRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
    splitItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    splitText: { ...typography.micro, color: colors.textSecondary, fontSize: 11 },
});
