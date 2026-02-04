/**
 * Input component
 * Style: Obsidian FinTech (Matte, No Neon)
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, KeyboardTypeOptions } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface InputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: KeyboardTypeOptions;
    error?: string;
    style?: ViewStyle;
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    editable?: boolean;
    rightElement?: React.ReactNode;
}

export function Input({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    error,
    style,
    multiline = false,
    numberOfLines = 1,
    maxLength,
    editable = true,
    rightElement,
}: InputProps) {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, style]}>
            {label && (
                <Text style={styles.label}>
                    {label}
                </Text>
            )}

            <View style={[
                styles.wrapper,
                focused && styles.wrapperFocused,
                !!error && styles.wrapperError,
                !editable && styles.wrapperDisabled,
                multiline && { minHeight: Math.max(48, numberOfLines * 24), alignItems: 'flex-start' },
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        multiline && { height: Math.max(48, numberOfLines * 24), paddingTop: 12 },
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    editable={editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        ...typography.caption,
        marginBottom: spacing.sm,
    },
    wrapper: {
        backgroundColor: colors.surface2,
        borderWidth: 1,
        borderColor: colors.stroke1,
        borderRadius: radius.ui, // 12
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md, // 12
        minHeight: 48,
    },
    wrapperFocused: {
        borderColor: colors.accent, // Ring 2px in web, simple border here
        // Ideally box-shadow for ring, but keeping it simple for RN
        // border width 1 is fine, color change is the key
    },
    wrapperError: {
        borderColor: colors.danger,
    },
    wrapperDisabled: {
        opacity: 0.5,
        backgroundColor: colors.bg0,
    },
    input: {
        flex: 1,
        ...typography.body,
        height: '100%',
        paddingVertical: 0, // Text input has default padding
    },
    rightElement: {
        marginLeft: spacing.sm,
    },
    error: {
        ...typography.micro,
        color: colors.danger,
        marginTop: spacing.xs,
    },
});
