import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '@/theme';
import { Button, Select } from '@/components';
import { GlassCard, AmbientHeader } from '@/components/ui/PremiumComponents';
import { useFinancialData, DebtItem } from '@/context/FinancialContext'; // Ensure this path is correct
import { Envelope } from '@/logic/math/envelopeFormulas'; // Ensure path

export default function FinancialTestScreen() {
    const router = useRouter();
    const { updateIncome, updateBalance, updateHousing, updateFood, addDebt, addGoal } = useFinancialData();
    const [step, setStep] = useState(1);

    // Step 1: Income
    const [income, setIncome] = useState('');
    const [balance, setBalance] = useState('');

    // Step 2: Expenses
    const [housing, setHousing] = useState('');
    const [food, setFood] = useState('');

    // Step 3: Debts (Simple Add One for now or Skip)
    const [hasDebt, setHasDebt] = useState<boolean | null>(null);
    const [debtName, setDebtName] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [debtMin, setDebtMin] = useState('');
    const [debtApr, setDebtApr] = useState('');

    // Step 4: Goals
    const [goalName, setGoalName] = useState('');
    const [goalTarget, setGoalTarget] = useState('');

    const nextStep = () => setStep(step + 1);

    const finishTest = async () => {
        // Save all data to Context
        if (income) updateIncome(parseFloat(income));
        if (balance) updateBalance(parseFloat(balance));
        if (housing) updateHousing(parseFloat(housing));
        if (food) updateFood(parseFloat(food));

        if (hasDebt && debtName && debtAmount) {
            addDebt({
                id: Date.now().toString(),
                name: debtName,
                balance: parseFloat(debtAmount),
                minPayment: parseFloat(debtMin) || 0,
                apr: parseFloat(debtApr) || 0
            });
        }

        if (goalName && goalTarget) {
            addGoal({
                id: Date.now().toString(),
                name: goalName,
                targetAmount: parseFloat(goalTarget),
                currentAmount: 0,
                priority: 1,
                deadline: new Date(Date.now() + 90 * 86400000).toISOString() // Default 3 months
            });
        }

        // Mark onboarding as completed
        const { getStorage } = require('@/db'); // Dynamic import to avoid cycles or ensure availability
        const storage = getStorage();
        await storage.saveSettings({ onboardingCompleted: true });

        router.replace('/'); 
    };

    return (
        <View style={styles.container}>
            <AmbientHeader />
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                <Text style={styles.stepIndicator}>Шаг {step} из 4</Text>

                {step === 1 && (
                    <View>
                        <Text style={styles.title}>Давайте начнем с основ</Text>
                        <Text style={styles.subtitle}>Введите ваш ежемесячный доход и текущий баланс.</Text>

                        <GlassCard style={styles.card}>
                            <Text style={styles.label}>Доход в месяц (₽)</Text>
                            <TextInput
                                style={styles.input}
                                value={income}
                                onChangeText={setIncome}
                                keyboardType="numeric"
                                placeholder="60000"
                                placeholderTextColor={colors.textTertiary}
                            />

                            <Text style={styles.label}>Текущие средства (₽)</Text>
                            <TextInput
                                style={styles.input}
                                value={balance}
                                onChangeText={setBalance}
                                keyboardType="numeric"
                                placeholder="5000"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </GlassCard>
                        <Button title="Далее" onPress={nextStep} style={{ marginTop: 20 }} />
                    </View>
                )}

                {step === 2 && (
                    <View>
                        <Text style={styles.title}>Обязательные расходы</Text>
                        <Text style={styles.subtitle}>Сколько вы тратите на самое важное?</Text>

                        <GlassCard style={styles.card}>
                            <Text style={styles.label}>Жилье (Аренда/Ипотека)</Text>
                            <TextInput style={styles.input} value={housing} onChangeText={setHousing} keyboardType="numeric" />

                            <Text style={styles.label}>Еда и продукты</Text>
                            <TextInput style={styles.input} value={food} onChangeText={setFood} keyboardType="numeric" />
                        </GlassCard>
                        <Button title="Далее" onPress={nextStep} style={{ marginTop: 20 }} />
                    </View>
                )}

                {step === 3 && (
                    <View>
                        <Text style={styles.title}>Кредитная нагрузка</Text>
                        <Text style={styles.subtitle}>Есть ли у вас кредиты или кредитные карты?</Text>

                        {hasDebt === null ? (
                            <View style={{ gap: 10, marginTop: 20 }}>
                                <Button title="Да, есть кредиты" onPress={() => setHasDebt(true)} variant="primary" />
                                <Button title="Нет, долгов нет" onPress={() => { setHasDebt(false); nextStep(); }} variant="secondary" />
                            </View>
                        ) : (
                            <View>
                                <GlassCard style={styles.card}>
                                    <Text style={styles.label}>Название (напр. Кредитка)</Text>
                                    <TextInput style={styles.input} value={debtName} onChangeText={setDebtName} />

                                    <Text style={styles.label}>Остаток долга (₽)</Text>
                                    <TextInput style={styles.input} value={debtAmount} onChangeText={setDebtAmount} keyboardType="numeric" />

                                    <Text style={styles.label}>Мин. платеж (₽)</Text>
                                    <TextInput style={styles.input} value={debtMin} onChangeText={setDebtMin} keyboardType="numeric" />

                                    <Text style={styles.label}>Процентная ставка (% годовых)</Text>
                                    <TextInput style={styles.input} value={debtApr} onChangeText={setDebtApr} keyboardType="numeric" placeholder="20" placeholderTextColor={colors.textTertiary} />
                                </GlassCard>
                                <Button title="Далее" onPress={nextStep} style={{ marginTop: 20 }} />
                            </View>
                        )}
                    </View>
                )}

                {step === 4 && (
                    <View>
                        <Text style={styles.title}>Ваша Цель</Text>
                        <Text style={styles.subtitle}>На что вы хотите накопить в первую очередь?</Text>

                        <GlassCard style={styles.card}>
                            <Text style={styles.label}>Название цели</Text>
                            <TextInput style={styles.input} value={goalName} onChangeText={setGoalName} placeholder="Например: Отпуск" placeholderTextColor={colors.textTertiary} />

                            <Text style={styles.label}>Цена (₽)</Text>
                            <TextInput style={styles.input} value={goalTarget} onChangeText={setGoalTarget} keyboardType="numeric" />
                        </GlassCard>
                        <Button title="Завершить" onPress={finishTest} style={{ marginTop: 20 }} />
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0, padding: spacing.lg, justifyContent: 'center' },
    content: { maxWidth: 500, width: '100%', alignSelf: 'center' },
    stepIndicator: { ...typography.caption, color: colors.accent, marginBottom: spacing.md, textAlign: 'center' },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
    subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center' },
    card: { padding: spacing.lg, gap: spacing.md },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: colors.bg1, color: colors.textPrimary, padding: 12, borderRadius: radius.ui, borderWidth: 1, borderColor: colors.stroke1, fontSize: 16 },
});
