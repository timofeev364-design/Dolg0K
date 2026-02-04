
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius, effects } from '../../theme';
import { RiskBadge, RiskTier } from './RiskBadge';
import { ProgressThin } from './ProgressThin';
import { ForecastChip } from './ForecastChip';

interface BudgetCardProps {
    name: string;
    icon?: string;
    spent: number;
    limit: number;
    forecast: number;
    ciLower?: number;
    ciUpper?: number;
    riskTier: RiskTier;
    daysToOverrun?: number | null;
    useHistory?: boolean;
    onPress: () => void;
    onMenuPress?: () => void;
    onAddPress?: () => void;
}

export function BudgetCard({
    name,
    icon = 'activity',
    spent,
    limit,
    forecast,
    ciLower,
    ciUpper,
    riskTier,
    daysToOverrun,
    useHistory = false,
    onPress,
    onMenuPress,
    onAddPress
}: BudgetCardProps) {

    // Calculate percentage
    const percent = spent / Math.max(limit, 1);

    // Determine color for progress bar based on risk
    let barColor = colors.accent;
    if (riskTier === 'atRisk') barColor = colors.warning;
    if (riskTier === 'highRisk') barColor = colors.danger;
    if (riskTier === 'overLimit') barColor = '#FF0055'; // Magenta

    return (
        <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={onPress}
        >
            {/* Header Row */}
            <View style={styles.header}>
                <View style={styles.titleGroup}>
                    <View style={styles.iconBox}>
                        <Feather name={icon as any} size={16} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.title} numberOfLines={1}>{name}</Text>
                </View>
                {/* Risk Badge in Header for cleaner look, or Menu */}
                {/* Let's keep Menu here, maybe RiskBadge next to it? */}
                {/* For now, keeping original header layout */}
                <Pressable onPress={onMenuPress} hitSlop={10} style={{ opacity: 0.5 }}>
                    <Feather name="more-horizontal" size={20} color={colors.textTertiary} />
                </Pressable>
            </View>

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
                <View>
                    <Text style={styles.spentAmount}>
                        {Math.round(spent).toLocaleString()}
                        <Text style={styles.currency}> ₽</Text>
                    </Text>
                    <Text style={styles.limitLabel}>
                        / {limit.toLocaleString()}
                    </Text>
                </View>
                <RiskBadge level={riskTier} />
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <ProgressThin progress={percent} color={barColor} />
            </View>

            {/* Footer: Forecast & Actions */}
            <View style={styles.footer}>
                <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <ForecastChip
                        forecast={forecast}
                        ciLower={ciLower}
                        ciUpper={ciUpper}
                        showCI={useHistory}
                    />
                    {riskTier !== 'onTrack' && daysToOverrun && daysToOverrun > 0 && (
                        <Text style={styles.overrunText}>
                            ~{daysToOverrun}d
                        </Text>
                    )}
                </View>

                {onAddPress && (
                    <Pressable
                        onPress={onAddPress}
                        style={({ pressed }) => [styles.miniAddBtn, pressed && { backgroundColor: colors.surface3 }]}
                    >
                        <Feather name="plus" size={18} color={colors.textPrimary} />
                    </Pressable>
                )}
            </View>

        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.stroke1,
        ...effects.shadow1,
        marginBottom: spacing.md,
    },
    pressed: {
        backgroundColor: colors.surface2,
        borderColor: colors.stroke2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1, // allow title to take space
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        ...typography.bodyM,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
    },
    spentAmount: {
        ...typography.h3,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.5,
    },
    currency: {
        fontSize: 16,
        color: colors.textTertiary,
        fontWeight: '400',
    },
    limitLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
    progressContainer: {
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    overrunText: {
        ...typography.micro,
        color: colors.danger,
        fontWeight: '600',
    },
    miniAddBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.stroke1,
    }
});
