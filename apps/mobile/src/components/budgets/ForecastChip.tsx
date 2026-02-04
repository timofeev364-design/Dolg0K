import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

interface ForecastChipProps {
    forecast: number;
    ciLower?: number;
    ciUpper?: number;
    showCI?: boolean;
}

export function ForecastChip({ forecast, ciLower, ciUpper, showCI = false }: ForecastChipProps) {
    // Format currency
    const format = (n: number) => Math.round(n).toLocaleString();

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Forecast</Text>
            <View style={styles.valueRow}>
                <Text style={styles.number}>{format(forecast)}</Text>
                {showCI && ciLower !== undefined && ciUpper !== undefined && (
                    <Text style={styles.ciText}>
                        {` (${format(ciLower)} – ${format(ciUpper)})`}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    label: {
        ...typography.caption,
        fontSize: 11,
        color: colors.textTertiary,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    number: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textSecondary,
        fontVariant: ['tabular-nums'],
    },
    ciText: {
        ...typography.micro,
        color: colors.textTertiary,
        marginLeft: 4,
    }
});
