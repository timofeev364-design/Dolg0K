import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface ProgressThinProps {
    progress: number; // 0..1+
    color?: string;
    style?: ViewStyle;
}

export function ProgressThin({ progress, color = colors.accent, style }: ProgressThinProps) {
    const clamped = Math.max(0, Math.min(progress, 1));
    const isOverflow = progress > 1;

    // Determine color based on progress if not forced? 
    // Actually, usually the parent passes the color based on RiskTier.
    // We'll stick to passed color.

    return (
        <View style={[styles.track, style]}>
            {/* Fill */}
            <View
                style={[
                    styles.fill,
                    {
                        width: `${clamped * 100}%`,
                        backgroundColor: color
                    }
                ]}
            />

            {/* Ticks */}
            <View style={[styles.tick, { left: '70%' }]} />
            <View style={[styles.tick, { left: '90%' }]} />
            <View style={[styles.tick, { left: '100%', backgroundColor: colors.textTertiary }]} />

            {/* Overflow Indicator */}
            {isOverflow && (
                <View style={[styles.overflowMarker, { backgroundColor: colors.danger }]} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.surface3,
        position: 'relative',
        overflow: 'visible', // Allow ticks to possibly barely stick out or be exactly on edge
        width: '100%',
    },
    fill: {
        height: '100%',
        borderRadius: 2,
    },
    tick: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        zIndex: 1,
    },
    overflowMarker: {
        position: 'absolute',
        right: -2,
        top: -2,
        bottom: -2,
        width: 4,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: colors.bg0,
    }
});
