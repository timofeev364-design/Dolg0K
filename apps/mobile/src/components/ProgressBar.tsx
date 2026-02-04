/**
 * ProgressBar Component
 * Thin, premium progress indicator.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface ProgressBarProps {
    progress: number; // 0 to 1
    color?: string;
    height?: number;
    style?: ViewStyle;
}

export function ProgressBar({
    progress,
    color = colors.accent,
    height = 4,
    style
}: ProgressBarProps) {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);

    return (
        <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
            <View
                style={[
                    styles.fill,
                    {
                        width: `${clampedProgress * 100}%`,
                        backgroundColor: color,
                        borderRadius: height / 2,
                    }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        backgroundColor: colors.surface2,
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
    }
});
