import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { useSharedFinances } from '../../src/hooks/useSharedFinances';

export default function SharedScreen() {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const members = [
        { id: '1', name: 'Я', monthlyIncome: 100000 },
        { id: '2', name: 'Партнер', monthlyIncome: 80000 },
    ];
    const initialTxns = [
        { id: '1', payerId: '1', amount: 5000, description: 'Продукты', date: new Date().toISOString(), splitMethod: 'weighted' as const }
    ];

    const { balances, settlements, weightedRatios } = useSharedFinances(members, initialTxns);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Общие Финансы', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>

                <View style={styles.header}>
                    <Text style={styles.title}>Баланс пары</Text>
                </View>

                {/* Balances */}
                <View style={styles.grid}>
                    {balances.map(b => {
                        const name = members.find(m => m.id === b.memberId)?.name;
                        const isOwed = b.net > 0;
                        return (
                            <GlassCard key={b.memberId} style={styles.card} variant="surface1">
                                <Text style={styles.name}>{name}</Text>
                                <Text style={[styles.net, { color: isOwed ? colors.success : colors.danger }]}>
                                    {isOwed ? '+' : ''}{Math.round(b.net)} ₽
                                </Text>
                                <Text style={styles.sub}>Paid: {Math.round(b.paid)}</Text>
                            </GlassCard>
                        );
                    })}
                </View>

                {/* Settlements */}
                {settlements.length > 0 && (
                    <View style={styles.settleSection}>
                        <Text style={styles.title}>Кто кому должен</Text>
                        {settlements.map((s, i) => {
                            const from = members.find(m => m.id === s.fromMemberId)?.name;
                            const to = members.find(m => m.id === s.toMemberId)?.name;
                            return (
                                <GlassCard key={i} style={styles.settleRow} variant="surface2">
                                    <Text style={styles.settleText}>
                                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{from}</Text>
                                        {' -> '}
                                        <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{to}</Text>
                                    </Text>
                                    <Text style={styles.settleAmount}>{s.amount} ₽</Text>
                                </GlassCard>
                            );
                        })}
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
    grid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    card: { flex: 1, padding: spacing.md, alignItems: 'center' },
    name: { ...typography.bodyM, color: colors.textPrimary },
    net: { ...typography.h2, marginVertical: 4 },
    sub: { ...typography.caption, color: colors.textTertiary },
    settleSection: {},
    settleRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, alignItems: 'center' },
    settleText: { ...typography.body, color: colors.textSecondary },
    settleAmount: { ...typography.h3, color: colors.accent },
});
