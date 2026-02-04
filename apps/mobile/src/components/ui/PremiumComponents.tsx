import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, effects } from '../../theme';

// ==========================================
// 1. PHYSICAL ORB (Procedural 3D Sphere)
// ==========================================
interface OrbProps {
    size?: number;
    color?: string; // Main accent color
    intensity?: 'soft' | 'medium' | 'hard';
    style?: StyleProp<ViewStyle>;
}

export function Orb({ size = 10, color = colors.accent, style }: OrbProps) {
    return (
        <View style={[styles.orbContainer, { width: size, height: size }, style]}>
            <LinearGradient
                colors={[color, '#000000']}
                start={{ x: 0.3, y: 0.2 }}
                end={{ x: 0.8, y: 0.9 }}
                style={[styles.orbBody, { borderRadius: size / 2 }]}
            />
            {/* Specular Highlight (The "Gloss") */}
            <View style={[
                styles.specular,
                {
                    width: size * 0.4,
                    height: size * 0.25,
                    top: size * 0.1,
                    left: size * 0.15,
                    borderRadius: size
                }
            ]} />
        </View>
    );
}

// ==========================================
// 2. GLASS CARD (Obsidian Material)
// ==========================================
interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    variant?: 'surface1' | 'surface2';
    onPress?: () => void;
}

export function GlassCard({ children, style, variant = 'surface1', onPress }: GlassCardProps) {
    const bgColors = variant === 'surface1'
        ? [colors.surface1, colors.bg0] as const
        : [colors.surface2, colors.surface1] as const;

    const content = (
        <LinearGradient
            colors={bgColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.1, y: 1.2 }}
            style={[styles.glassCard, style as any]}
        >
            {/* Inner Glare (Top Left) */}
            <LinearGradient
                colors={['rgba(255,255,255,0.08)', 'transparent']}
                style={styles.innerGlare}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.7, y: 0.7 }}
            />
            {/* Rim Light (Bottom Edge - Neon Reflection) */}
            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.1)']}
                style={styles.rimLight}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
            {/* Top Specular (Sharp Edge) */}
            <View style={styles.topSpecular} />
            {children}
        </LinearGradient>
    );

    if (onPress) {
        return (
            <Pressable onPress={onPress}>
                {({ pressed }) => (
                    <View style={{ opacity: pressed ? 0.95 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }}>
                        {content}
                    </View>
                )}
            </Pressable>
        );
    }

    return content;
}

// ==========================================
// 3. AMBIENT HEADER (Light Cone)
// ==========================================
export function AmbientHeader() {
    return (
        <View style={styles.ambientContainer} pointerEvents="none">
            {/* Cone of light from top center */}
            <LinearGradient
                colors={['rgba(110, 231, 255, 0.08)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.lightCone}
            />
        </View>
    );
}

// ==========================================
// 4. METALLIC SHEEN (Overlay)
// ==========================================
export function MetalSheen() {
    return (
        <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.03)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
        />
    );
}

// ==========================================
// 5. TECH GRID (Background Texture)
// ==========================================
export function TechGrid() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Simple grid lines simulation using a few absolute lines for "tech" feel */}
            {/* Horizontal Lines */}
            <View style={{ position: 'absolute', top: '33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
            <View style={{ position: 'absolute', top: '66%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />

            {/* Vertical Lines */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: '25%', width: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: '25%', width: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />

            {/* Ambient Noise / Grain could be here if we had an image asset */}
        </View>
    );
}

const styles = StyleSheet.create({
    // ... items from before ...
    orbContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    orbBody: {
        width: '100%',
        height: '100%',
    },
    specular: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        transform: [{ rotate: '-15deg' }],
    },
    glassCard: {
        borderRadius: radius.card,
        padding: spacing.md,
        overflow: 'visible', // Visible for shadows if on Android/iOS, but hidden for border radius usually. 
        // For heavy shadow + radius, usually need wrapper. 
        // But let's assume standard View implementation.
        // Actually, for Glass bevels we need borders.
        ...effects.glassBevel,
        ...effects.shadow1,
        // Make background a bit translucent if possible? 
        // LinearGradient handles BG.
    },
    innerGlare: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        borderRadius: radius.card,
        opacity: 0.6,
        pointerEvents: 'none'
    },
    rimLight: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '30%',
        borderBottomLeftRadius: radius.card,
        borderBottomRightRadius: radius.card,
        opacity: 0.4,
        pointerEvents: 'none'
    },
    topSpecular: {
        position: 'absolute',
        top: 0, left: 10, right: 10,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        boxShadow: '0px 0px 4px rgba(255,255,255,0.3)', // Web only prop but handled by RN sometimes or ignored
        opacity: 0.5,
        borderRadius: 2
    },
    innerHighlight: {
        // Deprecated by glassBevel but kept for safety if used elsewhere or remove
        display: 'none'
    },
    ambientContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        alignItems: 'center',
        zIndex: -1,
    },
    lightCone: {
        width: '60%',
        height: '100%',
        opacity: 0.6,
    }
});
