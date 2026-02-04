import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, typography } from '../../theme';

interface AnomalyInlineAlertProps {
    score: number; // Z-score
    visible: boolean;
}

export function AnomalyInlineAlert({ score, visible }: AnomalyInlineAlertProps) {
    if (!visible) return null;

    const isHigh = Math.abs(score) > 3;
    const color = isHigh ? colors.danger : colors.warning;

    return (
        <View style={[styles.container, { borderColor: color }]}>
            <Feather name="activity" size={12} color={color} />
            <Text style={[styles.text, { color }]}>
                Unusual activity detected (Z={score.toFixed(1)})
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2,
        borderLeftWidth: 2,
        paddingLeft: 8,
        marginBottom: 8,
    },
    text: {
        ...typography.micro,
        fontWeight: '500',
    }
});
