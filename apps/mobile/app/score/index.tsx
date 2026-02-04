import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard, Orb } from '../../src/components/ui/PremiumComponents';
import { useHealthScore } from '../../src/hooks/useHealthScore';
import { Button } from '../../src/components/Button';

import { useFinancialData } from '../../src/context/FinancialContext';

export default function HealthScoreScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const [showForm, setShowForm] = useState(false);

    // Connect to Context
    const {
        monthlyIncome, updateIncome,
        currentBalance, updateBalance,
        housingCost, updateHousing,
        foodCost, updateFood,
        totalDebt, totalMinPayments, totalMandatory
    } = useFinancialData();

    const profile = {
        monthlyIncome,
        monthlyMandatoryExpenses: totalMandatory,
        monthlyDebtPayments: totalMinPayments,
        totalLiquidAssets: currentBalance,
        totalDebt: totalDebt
    };

    const { totalScore, rating, factors } = useHealthScore(profile);

    const scoreColor = totalScore >= 750 ? colors.success : totalScore >= 600 ? colors.warning : colors.danger;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Фин. Здоровье', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>

                {/* Score Circle */}
                <View style={styles.scoreSection}>
                    <View style={styles.orbContainer}>
                        <Orb size={200} color={scoreColor} />
                        <View style={styles.scoreOverlay}>
                            <Text style={[styles.scoreValue, { color: scoreColor }]}>{totalScore}</Text>
                            <Text style={styles.scoreRating}>{rating}</Text>
                        </View>
                    </View>
                    <Button
                        title={showForm ? "Скрыть параметры" : "Изменить параметры"}
                        variant="secondary"
                        size="sm"
                        onPress={() => setShowForm(!showForm)}
                    />
                </View>

                {/* Input Form */}
                {showForm && (
                    <GlassCard style={styles.formCard} variant="surface1">
                        <View style={styles.inputRow}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Доход (мес)</Text>
                                <TextInput style={styles.input} value={monthlyIncome.toString()} onChangeText={(v) => updateIncome(parseFloat(v) || 0)} keyboardType="numeric" />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Сбережения</Text>
                                <TextInput style={styles.input} value={currentBalance.toString()} onChangeText={(v) => updateBalance(parseFloat(v) || 0)} keyboardType="numeric" />
                            </View>
                        </View>
                        <View style={styles.inputRow}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Жилье</Text>
                                <TextInput style={styles.input} value={housingCost.toString()} onChangeText={(v) => updateHousing(parseFloat(v) || 0)} keyboardType="numeric" />
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Еда</Text>
                                <TextInput style={styles.input} value={foodCost.toString()} onChangeText={(v) => updateFood(parseFloat(v) || 0)} keyboardType="numeric" />
                            </View>
                        </View>

                        {/* Read Only Debt Info */}
                        <View style={styles.inputRow}>
                            <View style={styles.field}>
                                <Text style={styles.label}>Платежи по долгам</Text>
                                <Text style={[styles.input, { backgroundColor: colors.surface2, color: colors.textSecondary }]}>{totalMinPayments} ₽</Text>
                            </View>
                            <View style={styles.field}>
                                <Text style={styles.label}>Общий долг</Text>
                                <Text style={[styles.input, { backgroundColor: colors.surface2, color: colors.textSecondary }]}>{totalDebt} ₽</Text>
                            </View>
                        </View>
                    </GlassCard>
                )}

                {/* Factors List */}
                <View style={styles.factorsList}>
                    <Text style={styles.sectionTitle}>Факторы влияния</Text>
                    {factors.map(f => (
                        <GlassCard key={f.id} style={styles.factorCard} variant="surface1">
                            <View style={styles.factorHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.iconBox, { backgroundColor: f.impact === 'positive' ? colors.success + '20' : f.impact === 'negative' ? colors.danger + '20' : colors.surface3 }]}>
                                        <Feather
                                            name={f.impact === 'positive' ? 'trending-up' : f.impact === 'negative' ? 'trending-down' : 'minus'}
                                            color={f.impact === 'positive' ? colors.success : f.impact === 'negative' ? colors.danger : colors.textSecondary}
                                            size={16}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.factorLabel}>{f.label}</Text>
                                        <Text style={styles.factorMetric}>Значение: {f.value.toFixed(2)} • Очки: {Math.round(f.score)}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.factorContribution, { color: f.impact === 'positive' ? colors.success : colors.textSecondary }]}>
                                    {f.contribution > 0 ? '+' : ''}{Math.round(f.contribution)}
                                </Text>
                            </View>
                            {f.recommendation && (
                                <View style={styles.recBox}>
                                    <Feather name="zap" size={12} color={colors.accent} />
                                    <Text style={styles.recText}>{f.recommendation}</Text>
                                </View>
                            )}
                        </GlassCard>
                    ))}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
    scoreSection: { alignItems: 'center', marginBottom: spacing.xl },
    orbContainer: { position: 'relative', width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    scoreOverlay: { position: 'absolute', alignItems: 'center' },
    scoreValue: { fontSize: 64, fontWeight: '700', color: colors.textPrimary },
    scoreRating: { ...typography.h3, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 2 },
    formCard: { padding: spacing.md, marginBottom: spacing.lg },
    inputRow: { flexDirection: 'row', gap: spacing.md },
    field: { flex: 1, marginBottom: spacing.sm },
    label: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: colors.bg1, color: colors.textPrimary, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.stroke1 },
    factorsList: { gap: spacing.md },
    sectionTitle: { ...typography.h3, marginBottom: spacing.sm, color: colors.textPrimary },
    factorCard: { padding: spacing.md },
    factorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    factorLabel: { ...typography.bodyM, color: colors.textPrimary },
    factorMetric: { ...typography.micro, color: colors.textTertiary },
    factorContribution: { ...typography.h3, fontWeight: '600' },
    recBox: { flexDirection: 'row', gap: 6, marginTop: spacing.md, padding: 8, backgroundColor: colors.surface2, borderRadius: radius.small, alignItems: 'center' },
    recText: { ...typography.caption, color: colors.accent },
});
