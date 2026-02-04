import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { useEnvelopeMath } from '../../src/hooks/useEnvelopeMath';
import { Envelope } from '../../src/logic/math/envelopeFormulas';

interface EnvelopeCardProps {
    item: Envelope;
    onDelete: (id: string) => void;
    onPress: () => void;
}

function EnvelopeCard({ item, onDelete, onPress }: EnvelopeCardProps) {
    // Mock contributions - in real app, fetch from DB
    const contributions = [{ amount: item.currentAmount, date: '2024-01-01' }];
    const createdAt = '2024-01-01';

    const {
        remaining,
        etaDate,
        status,
        requiredDaily,
        uncertainty
    } = useEnvelopeMath(item, contributions, createdAt);

    const statusColor =
        status === 'onTrack' ? colors.success :
            status === 'atRisk' ? colors.warning :
                colors.danger;

    const percent = Math.min(100, (item.currentAmount / item.targetAmount) * 100);

    return (
        <GlassCard style={styles.card} variant="surface1">
            <Pressable onPress={onPress}>
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', alignSelf: 'flex-start', marginTop: 4 }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {status === 'onTrack' ? 'Успеваем' : 'Риск'}
                            </Text>
                        </View>
                    </View>
                    <Pressable onPress={() => onDelete(item.id)} hitSlop={12} style={{ opacity: 0.8, padding: 4 }}>
                        <Feather name="trash-2" size={20} color="#FFFFFF" />
                    </Pressable>
                </View>
            </Pressable>

            <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: statusColor }]} />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.amountText}>{item.currentAmount.toLocaleString()} ₽</Text>
                    <Text style={styles.targetText}>/ {item.targetAmount.toLocaleString()} ₽</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Осталось накопить</Text>
                    <Text style={styles.metaValue}>{remaining.toLocaleString()} ₽</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Нужно в день</Text>
                    <Text style={styles.metaValue}>{Math.round(requiredDaily).toLocaleString()} ₽</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Прогноз (ETA)</Text>
                    <Text style={styles.metaValue}>{etaDate.toLocaleDateString()}</Text>
                </View>
            </View>

            <Text style={styles.bandText}>
                Научный диапазон: {uncertainty.etaLower.toLocaleDateString()} — {uncertainty.etaUpper.toLocaleDateString()}
            </Text>
        </GlassCard>
    );
}

import { useFinancialData } from '../../src/context/FinancialContext';

// ... (EnvelopeCard stays same) ...

export default function GoalsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const { goals, addGoal, removeGoal } = useFinancialData();

    // Initial load/reload param handling
    useEffect(() => {
        if (params.newGoal) {
            try {
                const newGoal = JSON.parse(params.newGoal as string);
                addGoal(newGoal);
                router.setParams({ newGoal: undefined });
            } catch (e) {
                console.error("Failed to parse new goal", e);
            }
        }
    }, [params.newGoal]);


    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Цели', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>
                <View style={styles.header}>
                    <Text style={styles.title}>Мои Цели</Text>
                    <Button
                        title="+ Новая цель"
                        size="sm"
                        variant="secondary"
                        onPress={() => router.push('/goals/add')}
                    />
                </View>

                {goals.length === 0 ? (
                    <Text style={{ color: colors.textSecondary }}>Нет активных целей. Создайте новую!</Text>
                ) : (
                    goals.map(g => (
                        goals.map(g => (
                            <EnvelopeCard
                                key={g.id}
                                item={g}
                                onDelete={removeGoal}
                                onPress={() => router.push(`/goals/${g.id}`)}
                            />
                        ))
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 800, alignSelf: 'center', width: '100%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl, alignItems: 'center' },
    title: { ...typography.h2, color: colors.textPrimary },
    card: { padding: spacing.md, marginBottom: spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    cardTitle: { ...typography.h3, color: colors.textPrimary },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.round },
    statusText: { ...typography.micro, fontWeight: '700', textTransform: 'uppercase' },
    progressSection: { marginBottom: spacing.md },
    progressBar: { height: 6, backgroundColor: colors.surface3, borderRadius: 3, marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 3 },
    progressLabels: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    amountText: { ...typography.h3, color: colors.textPrimary },
    targetText: { ...typography.body, color: colors.textSecondary },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    metaItem: {},
    metaLabel: { ...typography.micro, color: colors.textTertiary },
    metaValue: { ...typography.bodyM, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
    bandText: { ...typography.micro, color: colors.textTertiary, fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.stroke1 },
});
