/**
 * Plan Catalog
 * Strict list of available financial plans.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { Button, SegmentedControl } from '..';

interface PlanCatalogProps {
    onSelectPlan: (planId: string) => void;
}

export function PlanCatalog({ onSelectPlan }: PlanCatalogProps) {
    const [filter, setFilter] = useState('все');

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Выберите стратегию</Text>
            <Text style={styles.subtitle}>Планы адаптируются под ваш доход</Text>

            <View style={styles.filterContainer}>
                <SegmentedControl
                    options={[
                        { label: 'Все', value: 'все' },
                        { label: 'Резерв', value: 'резерв' },
                        { label: 'Долги', value: 'долги' },
                    ]}
                    value={filter}
                    onChange={(val) => setFilter(val)}
                />
            </View>

            <View style={styles.list}>
                <PlanTemplateCard
                    title="Быстрый старт"
                    desc="Соберите 10,000 ₽ за 30 дней."
                    meta="30 дней • Лёгкий"
                    onPress={() => onSelectPlan('p1')}
                />
                <PlanTemplateCard
                    title="Закрытие кредитки"
                    desc="Агрессивный план."
                    meta="45 дней • Хардкор"
                    onPress={() => onSelectPlan('p2')}
                />
            </View>
        </ScrollView>
    );
}

function PlanTemplateCard({ title, desc, meta, onPress }: { title: string, desc: string, meta: string, onPress: () => void }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardDesc}>{desc}</Text>
                <View style={styles.metaRow}>
                    <Feather name="clock" size={14} color={colors.textTertiary} />
                    <Text style={styles.metaText}>{meta}</Text>
                </View>
            </View>
            <View style={styles.actionCol}>
                <Button title="Начать" size="sm" variant="secondary" onPress={onPress} />
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
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    filterContainer: {
        marginBottom: spacing.lg,
    },
    list: {
        gap: spacing.md,
    },
    card: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.stroke1,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        marginRight: spacing.md,
    },
    cardTitle: {
        ...typography.bodyM,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    cardDesc: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        ...typography.micro,
        color: colors.textTertiary,
    },
    actionCol: {
        justifyContent: 'center',
    }
});
