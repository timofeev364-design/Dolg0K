import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface RiskBadgeProps {
    level: 'low' | 'medium' | 'high';
    text?: string;
}

export function RiskBadge({ level, text }: RiskBadgeProps) {
    let color = colors.success;
    let icon: keyof typeof Feather.glyphMap = 'check-circle';
    let label = 'В норме';

    if (level === 'medium') {
        color = colors.warning;
        icon = 'alert-circle';
        label = 'Риск';
    } else if (level === 'high') {
        color = colors.danger;
        icon = 'alert-triangle';
        label = 'Критично';
    }

    return (
        <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
            <Feather name={icon} size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={[styles.badgeText, { color }]}>{text || label}</Text>
        </View>
    );
}

interface ForecastChipProps {
    amount: number;
    diff: number; // forecast - limit
}

export function ForecastChip({ amount, diff }: ForecastChipProps) {
    const isOver = diff > 0;
    const color = isOver ? colors.danger : colors.textSecondary;

    return (
        <View style={styles.forecastContainer}>
            <Text style={styles.forecastLabel}>Прогноз:</Text>
            <Text style={[styles.forecastValue, { color }]}>
                {amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })}
            </Text>
            {isOver && (
                <Text style={styles.forecastDiff}>
                    (+{diff.toLocaleString('ru-RU', { maximumFractionDigits: 0 })})
                </Text>
            )}
        </View>
    );
}

interface SparklineProps {
    data: number[];
    height?: number;
    width?: number;
    color?: string;
}

export function MiniSparkline({ data, height = 30, width = 60, color = colors.accent }: SparklineProps) {
    if (!data.length) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; // avoid division by zero

    return (
        <View style={{ height, width, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
            {data.map((point, i) => {
                const h = ((point - min) / range) * height; // normalize
                // clamp min height to 2px so it's visible
                const barHeight = Math.max(2, h);
                return (
                    <View
                        key={i}
                        style={{
                            flex: 1,
                            backgroundColor: color,
                            height: barHeight,
                            borderRadius: 1,
                            opacity: 0.6 + (i / data.length) * 0.4 // fade in effect
                        }}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.round,
        borderWidth: 1,
    },
    badgeText: {
        ...typography.micro,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    forecastContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    forecastLabel: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    forecastValue: {
        ...typography.caption,
        fontWeight: '600',
    },
    forecastDiff: {
        ...typography.micro,
        color: colors.danger,
    }
});
