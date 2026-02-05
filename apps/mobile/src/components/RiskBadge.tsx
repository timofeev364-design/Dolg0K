/**
 * RiskBadge component
 * Бейдж отображения уровня риска
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RiskLevel } from '../core';
import { getRiskColor, getRiskLabel } from '../core';
import { spacing, radius, typography } from '../theme';

interface RiskBadgeProps {
    level: RiskLevel;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function RiskBadge({ level, size = 'md', showLabel = true }: RiskBadgeProps) {
    const color = getRiskColor(level);
    const label = getRiskLabel(level);

    const sizeStyles = {
        sm: { paddingVertical: 2, paddingHorizontal: 6, ...typography.micro },
        md: { paddingVertical: 4, paddingHorizontal: 8, ...typography.caption },
        lg: { paddingVertical: 6, paddingHorizontal: 12, ...typography.body },
    };

    const currentSize = sizeStyles[size];

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: `${color}20`,
                    borderColor: color,
                    paddingVertical: currentSize.paddingVertical,
                    paddingHorizontal: currentSize.paddingHorizontal,
                },
            ]}
        >
            <View style={[styles.dot, { backgroundColor: color }]} />
            {showLabel && (
                <Text style={[styles.label, { color, fontSize: currentSize.fontSize }]}>
                    {label}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.round,
        borderWidth: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.xs,
    },
    label: {
        fontWeight: '600',
    },
});
