/**
 * Root layout with navigation
 * Responsive: Sidebar (Desktop) / Tabs (Mobile)
 */

import React, { useEffect, useState } from 'react';
import { Tabs, Slot, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getStorage } from '../src/db';
import { colors } from '../src/theme';
import { Sidebar } from '../src/components';
import { FallingMoney } from '../src/components/ui/FallingMoney';

import { FinancialProvider } from '../src/context/FinancialContext';

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;
    const router = useRouter();

    useEffect(() => {
        async function init() {
            try {
                const storage = getStorage();
                await storage.initialize();

                // Check Onboarding
                const settings = await storage.getSettings();
                if (!settings.onboardingCompleted) {
                    // Avoid redirect loop if already there
                    // We can't easily check segments inside init async immediately, 
                    // but we can trust this runs once on mount.
                    setTimeout(() => {
                        router.replace('/financial-test');
                    }, 100);
                }
            } catch (error) {
                console.error('Failed to initialize storage:', error);
            } finally {
                setIsReady(true);
            }
        }
        init();
    }, []);

    if (!isReady) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.accent} />
                <StatusBar style="light" />
            </View>
        );
    }

    // Global Web Styles
    const WebStyles = Platform.OS === 'web' ? (
        <style type="text/css">{`
            body {
                background-color: ${colors.bg0};
                /* Complex layered background: Noise + Deep Nebulas + Linear Darkening */
                background-image: 
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E"),
                    radial-gradient(circle at 20% 10%, rgba(110, 231, 255, 0.25), transparent 50%),
                    radial-gradient(circle at 80% 30%, rgba(42, 232, 167, 0.15), transparent 50%),
                    radial-gradient(circle at 50% 80%, rgba(111, 78, 55, 0.15), transparent 60%),
                    linear-gradient(180deg, ${colors.bg1} 0%, #000000 100%);
                background-attachment: fixed;
                background-blend-mode: overlay, normal, normal;
                /* Mobile App Feel */
                user-select: none;
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior: none;
            }
            ::-webkit-scrollbar {
                width: 8px;
            }
            ::-webkit-scrollbar-track {
                background: ${colors.bg0}; 
            }
            ::-webkit-scrollbar-thumb {
                background: ${colors.surface2}; 
                border-radius: 4px;
                border: 1px solid ${colors.stroke1};
            }
            ::-webkit-scrollbar-thumb:hover {
                background: ${colors.accent}; 
            }
        `}</style>
    ) : null;

    if (isDesktop) {
        return (
            <FinancialProvider>
                <View style={styles.desktopContainer}>
                    {WebStyles}
                    <FallingMoney />
                    <StatusBar style="light" backgroundColor={colors.bg0} />
                    <Sidebar />
                    <View style={styles.desktopContent}>
                        <Slot />
                    </View>
                </View>
            </FinancialProvider>
        );
    }

    // Mobile Layout: Tabs
    return (
        <FinancialProvider>
            {WebStyles}
            <FallingMoney />
            <StatusBar style="light" backgroundColor={colors.bg0} />
            <Tabs
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.bg0,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.stroke1,
                        shadowOpacity: 0,
                        elevation: 0,
                    },
                    headerTintColor: colors.textPrimary,
                    headerTitleStyle: {
                        fontWeight: '600',
                        fontSize: 17,
                        color: colors.textPrimary,
                    },
                    tabBarStyle: {
                        backgroundColor: colors.bg1,
                        borderTopWidth: 1,
                        borderTopColor: colors.stroke1,
                        height: 60,
                        paddingBottom: 8,
                        paddingTop: 8,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarActiveTintColor: colors.accent,
                    tabBarInactiveTintColor: colors.textTertiary,
                    tabBarShowLabel: true,
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                    }
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Обзор',
                        tabBarIcon: ({ color }) => <Feather name="grid" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="payments"
                    options={{
                        title: 'Платежи',
                        tabBarIcon: ({ color }) => <Feather name="list" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="budgets"
                    options={{
                        title: 'Бюджеты',
                        tabBarIcon: ({ color }) => <Feather name="pie-chart" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="plan"
                    options={{
                        href: null,
                        title: 'План',
                        tabBarIcon: ({ color }) => <Feather name="target" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="templates"
                    options={{
                        title: 'Шаблоны',
                        tabBarIcon: ({ color }) => <Feather name="copy" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="debts/index"
                    options={{
                        title: 'Долги',
                        tabBarIcon: ({ color }) => <Feather name="credit-card" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="goals/index"
                    options={{
                        title: 'Цели',
                        tabBarIcon: ({ color }) => <Feather name="award" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="score/index"
                    options={{
                        title: 'Рейтинг',
                        tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="payday/index"
                    options={{
                        title: 'Зарплата',
                        tabBarIcon: ({ color }) => <Feather name="dollar-sign" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="shared/index"
                    options={{
                        href: null,
                        title: 'Общее',
                        tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="settings"
                    options={{
                        title: 'Настройки',
                        tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
                    }}
                />
                {/* Hidden screens */}
                <Tabs.Screen
                    name="add-payment"
                    options={{
                        href: null,
                        title: 'Добавить платёж',
                    }}
                />
                <Tabs.Screen
                    name="panic"
                    options={{
                        href: null,
                        title: 'Экстренная помощь',
                    }}
                />
                <Tabs.Screen
                    name="onboarding"
                    options={{
                        href: null,
                        headerShown: false,
                        tabBarStyle: { display: 'none' },
                    }}
                />
                <Tabs.Screen
                    name="financial-test"
                    options={{
                        href: null,
                        headerShown: false,
                        tabBarStyle: { display: 'none' },
                    }}
                />
            </Tabs>
        </FinancialProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg0,
    },
    desktopContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.bg0,
    },
    desktopContent: {
        flex: 1,
        // No padding here, each screen handles its container max-width
        // But we ensure it takes remaining space
    }
});
