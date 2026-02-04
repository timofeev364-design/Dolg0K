/**
 * ListRow Component
 * Strict table-like row for FinTech lists.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Feather } from '@expo/vector-icons';
import { Badge } from './Badge';

interface ListRowProps {
    title: string;
    subtitle?: string;
    rightText?: string;
    rightSubtext?: string;
    status?: 'success' | 'warning' | 'danger' | 'neutral';
    statusText?: string;
    icon?: keyof typeof Feather.glyphMap;
    onPress?: () => void;
    onDelete?: () => void; // New Prop
    isHeader?: boolean;
    style?: ViewStyle;
}

export function ListRow({
    title,
    subtitle,
    rightText,
    rightSubtext,
    status,
    statusText,
    icon,
    onPress,
    onDelete,
    isHeader = false,
    style,
}: ListRowProps) {
    const [hovered, setHovered] = React.useState(false);

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={({ pressed }) => [
                styles.container,
                isHeader && styles.headerContainer,
                (hovered || pressed) && !isHeader && styles.hovered,
                style
            ]}
        >
            {/* Left Decorator Line (on hover/active) */}
            {(hovered) && !isHeader && <View style={styles.activeLine} />}

            {/* Icon */}
            {icon && (
                <View style={styles.iconContainer}>
                    <Feather name={icon} size={18} color={isHeader ? colors.textTertiary : colors.textSecondary} />
                </View>
            )}

            {/* Main Content */}
            <View style={styles.main}>
                <Text style={[styles.title, isHeader && styles.headerText]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {/* Right Side */}
            <View style={styles.right}>
                {rightText && (
                    <Text style={[styles.rightText, isHeader && styles.headerText]}>
                        {rightText}
                    </Text>
                )}
                {rightSubtext && (
                    <Text style={[styles.subtitle, { textAlign: 'right' }]}>
                        {rightSubtext}
                    </Text>
                )}

                {/* Status Badge */}
                {statusText && (
                    <View style={{ marginTop: 4 }}>
                        <Badge label={statusText} variant={status === 'neutral' ? undefined : status as any} dot={!!status} />
                    </View>
                )}
            </View>

            {/* Delete Action */}
            {onDelete && !isHeader && (
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    style={({ pressed }) => [
                        styles.deleteBtn,
                        pressed && { opacity: 0.7, backgroundColor: colors.danger + '20' }
                    ]}
                >
                    <Feather name="trash-2" size={18} color={colors.textTertiary} />
                </Pressable>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.divider, // Thin divider
        height: 64, // Comfortable touch target
    },
    headerContainer: {
        height: 40,
        backgroundColor: colors.bg1,
        borderBottomWidth: 1,
        borderBottomColor: colors.stroke1,
    },
    hovered: {
        backgroundColor: colors.surface2,
    },
    activeLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: colors.accentLine,
    },
    iconContainer: {
        marginRight: spacing.md,
        width: 24,
        alignItems: 'center',
    },
    main: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: spacing.md,
    },
    title: {
        fontSize: typography.bodyM.fontSize,
        fontWeight: typography.bodyM.fontWeight,
        lineHeight: typography.bodyM.lineHeight,
        color: colors.textPrimary,
        marginBottom: 2,
    },
    headerText: {
        fontSize: typography.micro.fontSize,
        fontWeight: typography.micro.fontWeight,
        lineHeight: typography.micro.lineHeight,
        color: colors.textTertiary,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: typography.caption.fontSize,
        fontWeight: typography.caption.fontWeight,
        lineHeight: typography.caption.lineHeight,
        color: colors.textSecondary,
    },
    right: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    rightText: {
        fontSize: 16, // Override
        fontWeight: typography.amountM.fontWeight,
        lineHeight: 20,
        color: colors.textPrimary,
        fontVariant: ['tabular-nums'] as any, // Cast to avoid readonly immutable error
    },
    deleteBtn: {
        marginLeft: spacing.md,
        padding: 8,
        borderRadius: 8,
    }
});

