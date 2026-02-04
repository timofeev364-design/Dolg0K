/**
 * Sidebar Component (Desktop Navigation)
 * Style: Obsidian FinTech
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

const NAV_ITEMS = [
    { label: 'Главная', path: '/', icon: 'grid' },
    { label: 'Платежи', path: '/payments', icon: 'list' },
    { label: 'Бюджеты', path: '/budgets', icon: 'pie-chart' },
    { label: 'Долги', path: '/debts', icon: 'credit-card' },
    { label: 'Цели', path: '/goals', icon: 'award' },
    { label: 'Здоровье', path: '/score', icon: 'activity' },
    { label: 'Зарплата', path: '/payday', icon: 'dollar-sign' },
    // { label: 'Общее', path: '/shared', icon: 'users' },
    // { label: 'План', path: '/plan', icon: 'target' },
    { label: 'Шаблоны', path: '/templates', icon: 'copy' },
    { label: 'Настройки', path: '/settings', icon: 'settings' },
    { label: 'Админка', path: '/admin/users', icon: 'shield' },
] as const;

const ADMIN_USERS = ['dtsvv12'];

export function Sidebar({ style }: { style?: ViewStyle }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check Telegram User
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.username) {
            const username = window.Telegram.WebApp.initDataUnsafe.user.username;
            if (ADMIN_USERS.includes(username)) {
                setIsAdmin(true);
            }
        }
        // Dev backdoor for localhost testing if needed (optional)
        // setIsAdmin(true); 
    }, []);

    const isActive = (path: string) => {
        if (path === '/' && pathname === '/') return true;
        if (path !== '/' && pathname.startsWith(path)) return true;
        return false;
    };

    const displayedItems = NAV_ITEMS.filter(item => {
        if (item.path === '/admin/users' && !isAdmin) return false;
        return true;
    });

    return (
        <View style={[styles.container, style]}>
            {/* Logo area */}
            <View style={styles.header}>
                <Text style={styles.logoText}>все получится!</Text>
            </View>

            {/* Nav Items */}
            <View style={styles.nav}>
                {displayedItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Pressable
                            key={item.path}
                            onPress={() => router.push(item.path as any)}
                            style={({ pressed, hovered }) => [
                                styles.item,
                                active && styles.itemActive,
                                (pressed || hovered) && !active && styles.itemHover,
                            ]}
                        >
                            {active && <View style={styles.activeLine} />}
                            <Feather
                                name={item.icon as any}
                                size={20}
                                color={active ? colors.textOnAccent : colors.textSecondary}
                                style={{ marginRight: 12, opacity: active ? 1 : 0.8 }}
                            />
                            <Text style={[
                                styles.label,
                                active && styles.labelActive
                            ]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 240,
        backgroundColor: colors.bg1,
        borderRightWidth: 1,
        borderRightColor: colors.stroke1,
        paddingTop: spacing.md, // Moved up
        paddingBottom: spacing.lg,
        height: '100%',
    },
    header: {
        paddingHorizontal: spacing.lg, // 24
        paddingBottom: spacing.lg,
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
        alignItems: 'flex-start', // Explicit left alignment
    },
    logoText: {
        ...typography.h3,
        color: colors.textPrimary,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    nav: {
        gap: 4,
        paddingHorizontal: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: spacing.md,
        borderRadius: radius.ui, // 12
        position: 'relative',
        overflow: 'hidden',
    },
    itemActive: {
        // "active item: Accent/Soft background + Accent/Line 2px слева + текст Primary"
        backgroundColor: colors.accentSoft,
    },
    itemHover: {
        backgroundColor: colors.surface2,
    },
    activeLine: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        backgroundColor: colors.accentLine,
        borderRadius: 2,
    },
    label: {
        ...typography.bodyM,
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.textPrimary, // "текст Primary"
        fontWeight: '600',
    }
});
