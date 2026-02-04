import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_FLAKES = 20; // Slightly reduced count for "neatness"
const ICONS: (keyof typeof Feather.glyphMap)[] = ['dollar-sign', 'trending-up', 'activity', 'pie-chart', 'target', 'briefcase'];



const FallingFlake = ({ index }: { index: number }) => {
    // Smoother, less chaotic randoms
    const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
    const duration = useMemo(() => 8000 + Math.random() * 4000, []); // Slower: 8-12s
    const delay = useMemo(() => Math.random() * 8000, []);
    const iconName = useMemo(() => ICONS[Math.floor(Math.random() * ICONS.length)], []);
    const size = useMemo(() => 20 + Math.random() * 15, []); // Smaller, more uniform size (20-35)

    const translateY = useSharedValue(-100);
    const rotate = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Falling Animation - Linear flow
        translateY.value = withDelay(delay,
            withRepeat(
                withTiming(SCREEN_HEIGHT + 100, { duration, easing: Easing.linear }),
                -1
            )
        );

        // Gentle Rotation (swaying) instead of crazy spinning
        rotate.value = withDelay(delay,
            withRepeat(
                withTiming(45, { duration: duration * 0.5, easing: Easing.inOut(Easing.sin) }),
                -1,
                true // Reverse for swaying effect
            )
        );

        // Subtle opacity fade in/out roughly matching life cycle
        opacity.value = withDelay(delay, withRepeat(
            withTiming(0.2, { duration: duration * 0.5 }), // Fade in to 0.2 (subtle)
            -1,
            true
        ));
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { translateX: startX },
                // Slight swaying or rotation
                { rotate: `${rotate.value}deg` }
            ],
            opacity: opacity.value
        };
    });

    return (
        <Animated.View style={[styles.flake, animatedStyle]}>
            <Feather
                name={iconName}
                size={size}
                color={colors.textTertiary}
            />
        </Animated.View>
    );
};

export function FallingMoney() {
    const flakes = useMemo(() => Array.from({ length: NUM_FLAKES }).map((_, i) => i), []);

    return (
        <View style={styles.container} pointerEvents="none">
            {flakes.map(i => <FallingFlake key={i} index={i} />)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: 0,
    },
    flake: {
        position: 'absolute',
        top: -50,
        left: 0,
        // Remove text styles, handling via Icon props
    }
});
