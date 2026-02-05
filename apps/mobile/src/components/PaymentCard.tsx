import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Feather } from '@expo/vector-icons';
import type { Obligation } from '../core';
import { CATEGORY_LABELS } from '../core';

// Local helper 
function getCategoryColorLocal(category: string): string {
    switch (category) {
        case 'utilities': return '#A78BFA';
        case 'credit': return colors.danger;
        case 'subscription': return colors.accent;
        case 'mfo': return '#FB923C';
        default: return colors.textSecondary;
    }
}

interface PaymentCardProps {
    obligation: Obligation;
    onPress?: () => void;
    onTogglePaid?: () => void;
    onDelete?: () => void;
    style?: ViewStyle;
}

export function PaymentCard({ obligation, onPress, onTogglePaid, onDelete, style }: PaymentCardProps) {
    const [hovered, setHovered] = React.useState(false);

    // Safety check if imported helper fails or isn't available
    const categoryColor = getCategoryColorLocal(obligation.category);
    const categoryLabel = CATEGORY_LABELS[obligation.category] || obligation.category;

    const formattedAmount = obligation.amount.toLocaleString('ru-RU');

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={({ pressed }) => [
                styles.container,
                (hovered || pressed) && styles.hovered,
                style
            ]}
        >
            {/* Left Decorator Line (on hover) */}
            {(hovered) && <View style={styles.activeLine} />}

            {/* Checkbox Section */}
            <Pressable
                style={[
                    styles.checkbox,
                    obligation.isPaid && styles.checkboxChecked,
                    { borderColor: obligation.isPaid ? colors.success : colors.textTertiary }
                ]}
                onPress={onTogglePaid}
            >
                {obligation.isPaid && <Feather name="check" size={12} color={colors.bg0} />}
            </Pressable>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.mainInfo}>
                    <Text
                        style={[
                            styles.title,
                            obligation.isPaid && styles.textStruck
                        ]}
                        numberOfLines={1}
                    >
                        {obligation.name}
                    </Text>
                    <View style={styles.subRow}>
                        <Text style={styles.dateText}>{obligation.dueDay} числа</Text>
                        <Text style={styles.dot}>•</Text>
                        {/* Small category indicator */}
                        <Text style={[styles.categoryText, { color: categoryColor }]}>
                            {categoryLabel}
                        </Text>
                    </View>
                </View>

                {/* Right Side: Amount & Badge */}
                <View style={styles.rightSide}>
                    <Text style={[
                        styles.amount,
                        obligation.isPaid && styles.textStruck
                    ]}>
                        {formattedAmount} ₽
                    </Text>
                    {obligation.isPaid ? (
                        <View style={styles.paidBadge}>
                            <Text style={styles.paidText}>ОПЛАЧЕНО</Text>
                        </View>
                    ) : (
                        // If not paid, maybe show risk badge or nothing (cleaner)
                        null
                    )}
                </View>
            </View>

            {/* Delete Action (only visible on hover or if forced? 
                Mobile: swipe? Desktop: hover button) 
                For now keeping simple button on right if on delete prop 
            */}
            {onDelete && (
                <TouchableOpacity
                    onPress={onDelete}
                    style={[styles.deleteBtn, { opacity: hovered ? 1 : 0 }]} // Hide unless hovered on desktop 
                >
                    <Feather name="x" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
            )}

        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: 64, // Standard row Height
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        backgroundColor: 'transparent', // let list container bg show
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
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    checkboxChecked: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        ...typography.bodyM,
        marginBottom: 2,
    },
    textStruck: {
        color: colors.textTertiary,
        textDecorationLine: 'line-through',
        opacity: 0.7,
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        ...typography.caption,
    },
    dot: {
        ...typography.caption,
        color: colors.textTertiary,
        marginHorizontal: 4,
    },
    categoryText: {
        ...typography.caption,
        fontWeight: '500',
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
        color: colors.textPrimary,
        lineHeight: 20,
    },
    paidBadge: {
        backgroundColor: colors.success + '20', // transparent success
        paddingHorizontal: 4,
        borderRadius: 4,
        marginTop: 2,
    },
    paidText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.success,
    },
    deleteBtn: {
        padding: 8,
        marginLeft: 4,
    }
});

