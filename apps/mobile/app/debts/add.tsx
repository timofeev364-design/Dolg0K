import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { Debt } from '../../src/logic/math/debtFormulas';

export default function AddDebtScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [apr, setApr] = useState('');
    const [minPayment, setMinPayment] = useState('');

    const handleSave = () => {
        if (!name || !balance || !apr) return;

        const newDebt: Debt = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            balance: parseFloat(balance),
            apr: parseFloat(apr),
            minPayment: parseFloat(minPayment) || 0,
            dueDay: 1, // Default
            fees: 0,
            includeFees: false
        };

        // Pass back via router params
        router.push({
            pathname: '/debts',
            params: { newDebt: JSON.stringify(newDebt) }
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Добавить долг', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>
                <Text style={styles.headerTitle}>Новый кредит</Text>

                <GlassCard style={styles.formCard} variant="surface1">

                    <View style={styles.field}>
                        <Text style={styles.label}>Название (например, Банк)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Тинькофф"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Остаток долга (₽)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="120000"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            value={balance}
                            onChangeText={setBalance}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Процентная ставка (% годовых)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="19.9"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            value={apr}
                            onChangeText={setApr}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Минимальный платеж (₽)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="5000"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            value={minPayment}
                            onChangeText={setMinPayment}
                        />
                    </View>

                    <Button
                        title="Добавить"
                        variant="primary"
                        onPress={handleSave}
                        style={{ marginTop: spacing.lg }}
                    />
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
    headerTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
    formCard: { padding: spacing.xl },
    field: { marginBottom: spacing.lg },
    label: { ...typography.body, color: colors.textSecondary, marginBottom: 8 },
    input: {
        backgroundColor: colors.bg1,
        borderWidth: 1,
        borderColor: colors.stroke1,
        borderRadius: radius.small,
        padding: 12,
        color: colors.textPrimary,
        ...typography.body
    },
});
