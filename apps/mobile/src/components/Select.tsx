/**
 * Select component
 * Выпадающий список (простая реализация без native picker)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    value: string;
    options: SelectOption[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    error?: string;
}

export function Select({
    label,
    value,
    options,
    onValueChange,
    placeholder = 'Выберите...',
    error,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(o => o.value === value);

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <Pressable
                style={[styles.select, !!error && styles.selectError]}
                onPress={() => setIsOpen(true)}
            >
                <Text style={selectedOption ? styles.value : styles.placeholder}>
                    {selectedOption?.label ?? placeholder}
                </Text>
                <Text style={styles.arrow}>▼</Text>
            </Pressable>

            {error && <Text style={styles.error}>{error}</Text>}

            <Modal
                visible={isOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
                    <View style={styles.dropdown}>
                        <FlatList
                            data={options}
                            keyExtractor={item => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    style={[
                                        styles.option,
                                        item.value === value && styles.optionSelected,
                                    ]}
                                    onPress={() => {
                                        onValueChange(item.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            item.value === value && styles.optionTextSelected,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </Pressable>
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        marginBottom: spacing.xs,
    },
    select: {
        backgroundColor: colors.surface1,
        borderWidth: 1,
        borderColor: colors.stroke1,
        borderRadius: radius.ui,
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectError: {
        borderColor: colors.danger,
    },
    value: {
        ...typography.body,
    },
    placeholder: {
        ...typography.body,
        color: colors.textTertiary,
    },
    arrow: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    error: {
        ...typography.micro,
        color: colors.danger,
        marginTop: spacing.xs,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    dropdown: {
        backgroundColor: colors.surface1,
        borderRadius: radius.ui,
        width: '100%',
        maxHeight: 300,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    option: {
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    optionSelected: {
        backgroundColor: colors.accent + '20',
    },
    optionText: {
        ...typography.body,
    },
    optionTextSelected: {
        color: colors.accent,
        fontWeight: '600',
    },
});
