/**
 * Card Component
 * Style: Obsidian FinTech
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors, radius, effects, spacing } from '../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'surface1' | 'surface2' | 'surface3';
    style?: ViewStyle;
    padding?: keyof typeof spacing | 'none';
    onPress?: () => void;
}

export function Card({
    children,
    variant = 'surface1',
    style,
    padding = 'lg', // 16px default
    onPress,
}: CardProps) {
    const containerStyle = [
        styles.base,
        {
            backgroundColor: colors[variant],
            padding: padding === 'none' ? 0 : spacing[padding],
        },
        style,
    ];

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    containerStyle,
                    pressed && styles.pressed
                ]}
            >
                {children}
            </Pressable>
        );
    }

    return (
        <View style={containerStyle}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.card, // 14
        borderWidth: 1,
        borderColor: colors.stroke1,
        // Shadow/Depth
        ...effects.shadow1,
    },
    pressed: {
        borderColor: colors.stroke2,
        backgroundColor: colors.surface2, // interactive feedback
    }
});
