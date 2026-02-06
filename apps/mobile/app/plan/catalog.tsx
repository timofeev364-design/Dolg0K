import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
    ALL_PLAN_TEMPLATES,
    PlanTemplate,
    PlanHorizon,
    PlanType,
    HORIZON_LABELS,
    PLAN_TYPE_LABELS
} from '../../src/core';

export default function PlanCatalogScreen() {
    const router = useRouter();
    const [selectedHorizon, setSelectedHorizon] = useState<PlanHorizon | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<PlanType | 'all'>('all');

    const filteredTemplates = useMemo(() => {
        return ALL_PLAN_TEMPLATES.filter(t => {
            // Check if selectedHorizon match ANY of the template horizons
            const matchHorizon = selectedHorizon === 'all' || t.horizons.includes(selectedHorizon as PlanHorizon);
            const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
            return matchHorizon && matchCategory;
        });
    }, [selectedHorizon, selectedCategory]);

    const handleSelectTemplate = (templateId: string) => {
        router.push({
            pathname: '/plan/setup',
            params: { templateId }
        });
    };

    return (
        <SafeAreaView style={styles.container as any}>
            <View style={styles.header}>
                <Text style={styles.title}>Каталог планов</Text>
                <Text style={styles.subtitle}>Выберите стратегию под вашу ситуацию</Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                    <FilterChip
                        label="Все сроки"
                        active={selectedHorizon === 'all'}
                        onPress={() => setSelectedHorizon('all')}
                    />
                    {(Object.keys(HORIZON_LABELS) as PlanHorizon[]).map(h => (
                        <FilterChip
                            key={h}
                            label={HORIZON_LABELS[h]}
                            active={selectedHorizon === h}
                            onPress={() => setSelectedHorizon(h)}
                        />
                    ))}
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filtersScroll, { marginTop: 8 }]}>
                    <FilterChip
                        label="Все цели"
                        active={selectedCategory === 'all'}
                        onPress={() => setSelectedCategory('all')}
                    />
                    {(Object.keys(PLAN_TYPE_LABELS) as PlanType[]).map(c => (
                        <FilterChip
                            key={c}
                            label={PLAN_TYPE_LABELS[c]}
                            active={selectedCategory === c}
                            onPress={() => setSelectedCategory(c)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <ScrollView contentContainerStyle={styles.listContent}>
                <Text style={styles.countText}>Найдено шаблонов: {filteredTemplates.length}</Text>

                {filteredTemplates.map(template => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onPress={() => handleSelectTemplate(template.id)}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

function FilterChip({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) {
    return (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            onPress={onPress}
        >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

function TemplateCard({ template, onPress }: { template: PlanTemplate, onPress: () => void }) {
    // Show first horizon label or range if multiple
    const horizonLabel = template.horizons.map(h => HORIZON_LABELS[h]).join(', ');

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={[styles.badge, styles[`badge_${template.category}`]]}>
                    <Text style={styles.badgeText}>{PLAN_TYPE_LABELS[template.category]}</Text>
                </View>
                <Text style={styles.horizonText}>⏱ {horizonLabel}</Text>
            </View>

            <Text style={styles.cardTitle}>{template.title}</Text>
            <Text style={styles.cardDesc}>{template.description}</Text>

            <View style={styles.cardFooter}>
                <Text style={styles.footerLabel}>Сложность: <Text style={styles.intensityVal}>{getIntensityDisplay(template.intensity)}</Text></Text>
                <Text style={styles.arrow}>→</Text>
            </View>
        </TouchableOpacity>
    );
}

function getIntensityDisplay(intensity: string) {
    // If it is one of the standard keys, return emoji
    if (intensity === 'easy') return '🟢 Легко';
    if (intensity === 'medium') return '🟡 Средне';
    if (intensity === 'hard') return '🔴 Жестко';
    // Else return the string itself (e.g. "10 мин/день")
    return intensity;
}

import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../src/theme';

const styles = StyleSheet.create<any>({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.md,
        paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold as any,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    filtersContainer: {
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
    },
    filtersScroll: {
        paddingHorizontal: spacing.md,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.background,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: '#FFFFFF',
        fontWeight: fontWeight.semibold as any,
    },
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    countText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        // Shadows typically handled by elevation or shadow props if not in theme
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    cardTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold as any,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    cardDesc: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.sm,
    },
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    // Badges might need specific colors or valid theme colors for categories
    badge_reserve: { backgroundColor: '#DCFCE7' },
    badge_debt: { backgroundColor: '#FEE2E2' },
    badge_optimization: { backgroundColor: '#E0F2FE' },
    badge_stability: { backgroundColor: '#F3E8FF' },
    badgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold as any,
        color: colors.text, // or specific contrast
        textTransform: 'uppercase',
    },
    horizonText: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        fontWeight: fontWeight.medium as any,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    footerLabel: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    intensityVal: {
        color: colors.text,
        fontWeight: fontWeight.medium as any,
    },
    arrow: {
        fontSize: fontSize.lg,
        color: colors.textMuted,
    }
});
