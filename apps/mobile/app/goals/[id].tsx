import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { Select } from '../../src/components';
import { useFinancialData } from '../../src/context/FinancialContext';
import { calculateRequiredDaily, calculateDaysUntilDeadline, calculateRequiredWithInterest } from '../../src/logic/math/envelopeFormulas';

export default function EditGoalScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { goals, updateGoal } = useFinancialData();

    const goal = goals.find(g => g.id === id);

    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [deadline, setDeadline] = useState('');
    const [apy, setApy] = useState('');
    const [apyFrequency, setApyFrequency] = useState<'daily' | 'monthly'>('monthly');

    useEffect(() => {
        if (goal) {
            setName(goal.name);
            setTargetAmount(goal.targetAmount.toString());
            setDeadline(goal.deadline || '');
            setApy(goal.apy ? goal.apy.toString() : '');
            setApyFrequency(goal.apyFrequency || 'monthly');
        }
    }, [goal]);

    if (!goal) return <Text>Goal not found</Text>;

    const targetNum = parseFloat(targetAmount) || 0;
    const currentNum = goal.currentAmount;
    const remaining = Math.max(0, targetNum - currentNum);

    // Live Calculation
    const today = new Date();
    const daysUntil = calculateDaysUntilDeadline(deadline, today);
    const requiredDaily = calculateRequiredDaily(remaining, daysUntil);
    const requiredMonthly = requiredDaily * 30;

    const handleSave = () => {
        if (!name || !targetAmount) {
            alert('Name and Amount are required');
            return;
        }

        updateGoal(goal.id, {
            name,
            targetAmount: targetNum,
            deadline: deadline || undefined
        });
        router.back();
    };

    const alert = (msg: string) => {
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Редактировать Цель', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={styles.content}>
                <GlassCard variant="surface1" style={styles.formCard}>
                    <View style={styles.field}>
                        <Text style={styles.label}>Название</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Название цели"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Целевая сумма (₽)</Text>
                        <TextInput
                            style={[styles.input, { ...typography.h3 }]}
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Дата окончания (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={deadline}
                            onChangeText={setDeadline}
                            placeholder="2026-01-01"
                            placeholderTextColor={colors.textTertiary}
                        />
                        <Text style={styles.hint}>Введите дату в будущем для расчета</Text>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.field, { flex: 1 }]}>
                            <Text style={styles.label}>Ставка (% годовых)</Text>
                            <TextInput
                                style={styles.input}
                                value={apy}
                                onChangeText={setApy}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                        <View style={[styles.field, { flex: 1, marginLeft: 16 }]}>
                            <Text style={styles.label}>Начисление</Text>
                            <Select
                                options={[{ label: 'Ежемесячно', value: 'monthly' }, { label: 'Ежедневно', value: 'daily' }]}
                                value={apyFrequency}
                                onValueChange={(v) => setApyFrequency(v as any)}
                            />
                        </View>
                    </View>
                </GlassCard>

                {/* Live Calculator Card */}
                <GlassCard variant="surface2" style={styles.calcCard}>
                    <Text style={styles.calcTitle}>Калькулятор Накоплений</Text>

                    {daysUntil > 0 && daysUntil !== Infinity ? (
                        <>
                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Нужно в день:</Text>
                                <Text style={styles.calcValue}>{Math.ceil(requiredDaily).toLocaleString()} ₽</Text>
                            </View>
                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Нужно в месяц:</Text>
                                <Text style={styles.calcValue}>{Math.ceil(requiredMonthly).toLocaleString()} ₽</Text>
                            </View>
                            <View style={styles.calcRow}>
                                <Text style={styles.calcLabel}>Осталось дней:</Text>
                                <Text style={styles.calcValue}>{daysUntil}</Text>
                            </View>
                        </>
                    ) : (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                            {deadline ? 'Дата уже прошла или некорректна' : 'Введите дату, чтобы узнать сколько откладывать'}
                        </Text>
                    )}
                </GlassCard>

                <Button
                    title="Сохранить"
                    onPress={handleSave}
                    size="lg"
                    style={{ marginTop: 24 }}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg, maxWidth: 600, alignSelf: 'center', width: '100%' },
    formCard: { padding: spacing.lg, marginBottom: spacing.md },
    calcCard: { padding: spacing.lg, borderColor: colors.accent, borderWidth: 1 },
    field: { marginBottom: spacing.md },
    label: { ...typography.body, color: colors.textSecondary, marginBottom: 8 },
    input: {
        backgroundColor: colors.bg1,
        padding: 12,
        padding: 12,
        borderRadius: radius.ui,
        color: colors.textPrimary,
        ...typography.body
    },
    hint: { ...typography.micro, color: colors.textTertiary, marginTop: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    calcTitle: { ...typography.h3, color: colors.primary, marginBottom: 16, textAlign: 'center' },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.stroke1, paddingBottom: 4 },
    calcLabel: { ...typography.body, color: colors.textSecondary },
    calcValue: { ...typography.h3, color: colors.textPrimary },
});
