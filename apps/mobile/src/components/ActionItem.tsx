/**
 * ActionItem component
 * Элемент плана с чекбоксом
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { PlanAction } from '../core';
import { colors, spacing, radius, typography } from '../theme';
interface ActionItemProps {
    action: PlanAction;
    onToggle?: () => void;
}
export function ActionItem({ action, onToggle }: ActionItemProps) {
    return (
        <Pressable
            style={[styles.container, action.isDone && styles.containerDone]}
            onPress={onToggle}
        >
            {/* Checkbox */}
            <View style={[styles.checkbox, action.isDone && styles.checkboxChecked]}>
                {action.isDone && <Text style={styles.checkmark}>✓</Text>}
            </View>
            {/* Text */}
            <Text
                style={[styles.text, action.isDone && styles.textDone]}
                numberOfLines={3}
            >
                {action.text}
            </Text>
            {/* Priority indicator */}
            <View style={[styles.priority, getPriorityStyle(action.priority)]}>
                <Text style={styles.priorityText}>{action.priority}</Text>
            </View>
        </Pressable>
    );
}
function getPriorityStyle(priority: number): { backgroundColor: string } {
    const priorityColor =
        priority >= 8 ? colors.danger :
            priority >= 5 ? colors.warning :
                colors.success;
    return { backgroundColor: priorityColor };
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.surface1,
        padding: spacing.md,
        borderRadius: radius.ui, // ВАЖНО: убедитесь что тут radius.ui
        marginBottom: spacing.sm,
    },
    containerDone: {
        opacity: 0.7,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: radius.small,
        borderWidth: 2,
        borderColor: colors.stroke1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    checkmark: {
        color: colors.bg0,
        fontWeight: 'bold',
        fontSize: 14,
    },
    text: {
        flex: 1,
        ...typography.body,
    },
    textDone: {
        color: colors.textTertiary,
        textDecorationLine: 'line-through',
    },
    priority: {
        width: 24,
        height: 24,
        borderRadius: radius.round, // ВАЖНО: убедитесь что тут radius.round
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
    },
    priorityText: {
        color: colors.bg0,
        fontSize: 12,
        fontWeight: 'bold',
    },
});