import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme';

export type RiskTier = 'onTrack' | 'atRisk' | 'highRisk' | 'overLimit';

interface RiskBadgeProps {
    level: RiskTier;
    showLabel?: boolean;
}

export function RiskBadge({ level, showLabel = true }: RiskBadgeProps) {
    let color = colors.success;
    let bg = colors.success + '20'; // 12% opacity roughly
    let icon: keyof typeof Feather.glyphMap = 'check-circle';
    let label = 'On Track';

    switch (level) {
        case 'onTrack':
            color = colors.success; // Cyan/Green
            bg = 'rgba(0, 255, 157, 0.1)';
            icon = 'check';
            label = 'On Track';
            break;
        case 'atRisk':
            color = colors.warning; // Yellow
            bg = 'rgba(255, 193, 7, 0.1)';
            icon = 'alert-circle';
            label = 'At Risk';
            break;
        case 'highRisk':
            color = colors.danger; // Orange/Red
            bg = 'rgba(255, 87, 34, 0.1)';
            icon = 'alert-triangle';
            label = 'High Risk';
            break;
        case 'overLimit':
            color = '#FF0055'; // Deep Red/Magenta for critical
            bg = 'rgba(255, 0, 85, 0.15)';
            icon = 'x-octagon';
            label = 'Over Limit';
            break;
    }

    return (
        <View style={[styles.container, { backgroundColor: bg, borderColor: color }]}>
            <Feather name={icon} size={12} color={color} />
            {showLabel && <Text style={[styles.text, { color }]}>{label}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.round,
        borderWidth: 1,
        gap: 4,
    },
    text: {
        ...typography.micro,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});
