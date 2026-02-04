/**
 * Button component
 * Style: Obsidian FinTech (Matte, No Neon)
 */

import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, typography, effects } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
    icon,
    iconPosition = 'left',
}: ButtonProps) {

    // Size Defs
    const height = size === 'sm' ? 36 : size === 'lg' ? 48 : 44; // MD is 44 according to spec
    const paddingX = size === 'sm' ? 12 : size === 'lg' ? 18 : 16;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.base,
                { height, paddingHorizontal: paddingX },
                getContainerStyle(variant, pressed, disabled),
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? colors.textOnAccent : colors.accent} size="small" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && <PressableIconWrapper>{icon}</PressableIconWrapper>}
                    <Text style={[
                        styles.text,
                        size === 'sm' ? typography.micro : typography.bodyM,
                        { color: getTextColor(variant, disabled) },
                        textStyle
                    ]}>
                        {title}
                    </Text>
                    {icon && iconPosition === 'right' && <PressableIconWrapper>{icon}</PressableIconWrapper>}
                </>
            )}
        </Pressable>
    );
}

const PressableIconWrapper = ({ children }: { children: React.ReactNode }) => (
    <React.Fragment>
        {/* Could add margin if needed via cloneElement or wrapping view, but simple gap is set in base */}
        {children}
    </React.Fragment>
)

function getTextColor(variant: ButtonVariant, disabled: boolean): string {
    if (disabled) return colors.textDisabled;

    switch (variant) {
        case 'primary': return colors.textOnAccent;
        case 'secondary': return colors.textPrimary;
        case 'danger': return colors.danger;
        case 'ghost': return colors.textSecondary;
    }
}

const styles = StyleSheet.create({
    base: {
        borderRadius: radius.ui, // 12 -> 16
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    text: {
        // Font styles are merged from props
        textAlign: 'center',
        fontWeight: '600'
    },
    fullWidth: {
        width: '100%',
    },
});

function getContainerStyle(variant: ButtonVariant, pressed: boolean, disabled: boolean): ViewStyle {
    if (disabled) {
        return {
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.stroke1,
            opacity: 0.5,
        };
    }

    switch (variant) {
        case 'primary':
            return {
                backgroundColor: pressed ? colors.accentHover : colors.accent,
                ...effects.shadow1,
                // Strong 3D Pill Effect
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                borderTopColor: 'rgba(255,255,255,0.7)', // Sharp top edge
                borderBottomColor: 'rgba(0,0,0,0.5)',     // Shadowed bottom edge
                // Attempting web-only shine
                // box-shadow: inset 0 1px 0 rgba(255,255,255,0.4) // Not valid in RN style obj directly but harmless comment
            };
        case 'secondary':
            return {
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: pressed ? colors.stroke2 : colors.stroke1,
                borderTopColor: 'rgba(255,255,255,0.3)', // Visible edge
                borderBottomColor: 'rgba(0,0,0,0.5)',
                ...effects.shadow1, // Also give it depth
                elevation: 4,
            };
        case 'danger':
            return {
                backgroundColor: colors.dangerSoft,
                borderWidth: 1,
                borderColor: colors.dangerStroke,
            };
        case 'ghost':
            return {
                backgroundColor: pressed ? colors.surface2 : 'transparent',
            };
    }
}
