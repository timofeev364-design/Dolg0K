/**
 * Badge Component
 * Style: Obsidian FinTech
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, typography, spacing } from '../theme';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    dot?: boolean;
}

export function Badge({ label, variant = 'neutral', dot = false }: BadgeProps) {
    const { bg, text, dotColor } = getBadgeColors(variant);

    return (
        <View style={[styles.container, { backgroundColor: bg }]}>
            {dot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
            <Text style={[styles.text, { color: text }]}>
                {label}
            </Text>
        </View>
    );
}

function getBadgeColors(variant: BadgeVariant) {
    switch (variant) {
        case 'accent':
            return { bg: colors.accentSoft, text: colors.accent, dotColor: colors.accent };
        case 'success':
            return { bg: colors.successSoft, text: colors.success, dotColor: colors.success };
        case 'warning':
            return { bg: colors.warningSoft, text: colors.warning, dotColor: colors.warning };
        case 'danger':
            return { bg: colors.dangerSoft, text: colors.danger, dotColor: colors.danger };
        case 'neutral':
        default:
            return { bg: colors.surface2, text: colors.textSecondary, dotColor: colors.textTertiary };
    }
}

const styles = StyleSheet.create({
    container: {
        height: 24,
        paddingHorizontal: spacing.sm, // 8
        borderRadius: radius.small, // 10
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.stroke1, // optional subtle border
        gap: 6,
    },
    text: {
        ...typography.micro,
        fontWeight: '600',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
