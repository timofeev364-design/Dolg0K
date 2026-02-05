import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, radius, typography } from '@/theme';
import { Button, Select } from '@/components';
import { GlassCard, TechGrid } from '@/components/ui/PremiumComponents';
import { calculateEWMA, calculateStandardDeviation } from '../../src/core';

export default function EditBudgetScreen() {
    const router = useRouter();

    // Mock existing values (or from params)
    const [limit, setLimit] = useState('30000');
    const [period, setPeriod] = useState('month');
    const [autoAdjust, setAutoAdjust] = useState(false);

    // Mock history for B9/B10 check
    const mockHistory = [1200, 800, 2500, 500, 4000]; // 5 days
    const ewma = calculateEWMA(mockHistory);
    const stdDev = calculateStandardDeviation(mockHistory);
    // B10 Safe Limit: Average (approx 1800) + 1 Sigma? Or total for month?
    // Let's just show "Recommended Daily" for visualization.
    const safeDaily = Math.round(ewma + stdDev);

    const handleSave = () => {
        // In real app: save to DB
        router.back();
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Настройка бюджета',
                headerStyle: { backgroundColor: colors.bg0 },
                headerTintColor: colors.textPrimary,
            }} />

            <TechGrid />

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Основные параметры</Text>

                <GlassCard variant="surface1" style={styles.card}>
                    <Select
                        label="Период"
                        value={period}
                        options={[
                            { label: 'Месяц', value: 'month' },
                            { label: 'Неделя', value: 'week' },
                        ]}
                        onValueChange={setPeriod}
                    />

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Лимит (₽)</Text>
                        <TextInput
                            style={styles.input}
                            value={limit}
                            onChangeText={setLimit}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={colors.textTertiary}
                        />
                    </View>
                </GlassCard>

                <Text style={styles.sectionTitle}>Рекомендации</Text>
                <View style={styles.row}>
                    <GlassCard variant="surface2" style={styles.recCard}>
                        <Text style={styles.recLabel}>EWMA (Тренд)</Text>
                        <Text style={styles.recValue}>{Math.round(ewma)} ₽/день</Text>
                        <Text style={styles.recSub}>Ожидаемый расход</Text>
                    </GlassCard>
                    <GlassCard variant="surface2" style={styles.recCard}>
                        <Text style={styles.recLabel}>Safe (Волатильность)</Text>
                        <Text style={styles.recValue}>{safeDaily} ₽/день</Text>
                        <Text style={styles.recSub}>Безопасный лимит</Text>
                    </GlassCard>
                </View>

                <Text style={styles.sectionTitle}>Автоматизация</Text>
                <GlassCard variant="surface1" style={styles.card}>
                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchLabel}>Авто-коррекция (B9)</Text>
                            <Text style={styles.switchSub}>
                                Изменять лимит автоматически на основе прошлых трат (EWMA)
                            </Text>
                        </View>
                        <Switch
                            value={autoAdjust}
                            onValueChange={setAutoAdjust}
                            trackColor={{ false: colors.surface2, true: colors.accent }}
                            thumbColor={colors.textPrimary}
                        />
                    </View>
                </GlassCard>

            </ScrollView>

            <View style={styles.footer}>
                <Button title="Сохранить" onPress={handleSave} />
            </View>
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
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    card: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.bg0,
        borderWidth: 1,
        borderColor: colors.stroke1,
        borderRadius: radius.ui,
        padding: spacing.md,
        color: colors.textPrimary,
        ...typography.body,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    recCard: {
        flex: 1,
        padding: spacing.md,
    },
    recLabel: {
        ...typography.micro,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    recValue: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    recSub: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchLabel: {
        ...typography.body,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    switchSub: {
        ...typography.caption,
        color: colors.textTertiary,
        paddingRight: spacing.md,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.stroke1,
        backgroundColor: colors.surface1,
    }
});
