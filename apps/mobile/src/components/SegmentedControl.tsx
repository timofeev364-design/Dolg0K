/**
 * SegmentedControl
 * Strict tab switcher for filters
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface SegmentedControlProps<T extends string> {
    options: { label: string; value: T; badge?: number }[];
    value: T;
    onChange: (value: T) => void;
    style?: StyleProp<ViewStyle>;
}

export function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    style
}: SegmentedControlProps<T>) {
    return (
        <View style={[styles.container, style]}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <Pressable
                        key={option.value}
                        onPress={() => onChange(option.value)}
                        style={[
                            styles.segment,
                            isActive && styles.segmentActive
                        ]}
                    >
                        <Text style={[
                            styles.label,
                            isActive && styles.labelActive
                        ]}>
                            {option.label}
                        </Text>
                        {option.badge !== undefined && option.badge > 0 && (
                            <View style={[styles.badge, isActive && styles.badgeActive]}>
                                <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                                    {option.badge}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface1,
        padding: 4, // Inner padding for track
        borderRadius: radius.ui,
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: radius.small,
    },
    segmentActive: {
        backgroundColor: colors.accentSoft,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.textPrimary,
    },
    badge: {
        marginLeft: spacing.xs,
        backgroundColor: colors.surface2,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: radius.round,
    },
    badgeActive: {
        backgroundColor: colors.accent,
    },
    badgeText: {
        ...typography.micro,
        color: colors.textSecondary,
    },
    badgeTextActive: {
        color: colors.textOnAccent,
    }
});
