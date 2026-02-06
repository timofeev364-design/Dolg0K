/**
 * Root layout with navigation
 * Responsive: Sidebar (Desktop) / Tabs (Mobile)
 */

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getStorage } from '../src/db';
import { colors } from '../src/theme';
import { FallingMoney } from '../src/components/ui/FallingMoney';
import { FinancialProvider } from '../src/context/FinancialContext';

export default function RootLayout() {
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function init() {
            try {
                const storage = getStorage();
                await storage.initialize();

                // Check Onboarding
                const settings = await storage.getSettings();
                if (!settings.onboardingCompleted) {
                    setTimeout(() => {
                        router.replace('/onboarding');
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
                background-image: 
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E"),
                    radial-gradient(circle at 20% 10%, rgba(110, 231, 255, 0.25), transparent 50%),
                    radial-gradient(circle at 80% 30%, rgba(42, 232, 167, 0.15), transparent 50%),
                    radial-gradient(circle at 50% 80%, rgba(111, 78, 55, 0.15), transparent 60%),
                    linear-gradient(180deg, ${colors.bg1} 0%, #000000 100%);
                background-attachment: fixed;
                background-blend-mode: overlay, normal, normal;
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

    // Unified Vertical Layout (Mobile First + Drawer)
    return (
        <FinancialProvider>
            {WebStyles}
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.appContainer}>
                    <FallingMoney />
                    <StatusBar style="light" backgroundColor={colors.bg0} />

                    <Drawer
                        screenOptions={{
                            headerShown: true,
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
                            drawerStyle: {
                                backgroundColor: colors.bg1,
                                width: 280,
                                borderRightWidth: 1,
                                borderRightColor: colors.stroke1,
                            },
                            drawerActiveTintColor: colors.accent,
                            drawerInactiveTintColor: colors.textSecondary,
                            drawerLabelStyle: {
                                marginLeft: -20,
                                fontSize: 14,
                                fontWeight: '500',
                            },
                            sceneContainerStyle: {
                                backgroundColor: colors.bg0,
                            },
                        }}
                    >
                        <Drawer.Screen
                            name="index"
                            options={{
                                title: 'Обзор',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="grid" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="payments"
                            options={{
                                title: 'Платежи',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="list" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="budgets"
                            options={{
                                title: 'Бюджеты',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="pie-chart" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="plan"
                            options={{
                                title: 'План',
                                drawerItemStyle: { display: 'none' }, // Keep hidden or show?
                                drawerIcon: ({ color }: { color: string }) => <Feather name="target" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="templates"
                            options={{
                                title: 'Шаблоны',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="copy" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="debts/index"
                            options={{
                                title: 'Долги',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="credit-card" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="goals/index"
                            options={{
                                title: 'Цели',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="award" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="score/index"
                            options={{
                                title: 'Рейтинг',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="activity" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="payday/index"
                            options={{
                                title: 'Зарплата',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="dollar-sign" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="shared/index"
                            options={{
                                title: 'Общее',
                                drawerItemStyle: { display: 'none' },
                                drawerIcon: ({ color }: { color: string }) => <Feather name="users" size={20} color={color} />,
                            }}
                        />
                        <Drawer.Screen
                            name="settings"
                            options={{
                                title: 'Настройки',
                                drawerIcon: ({ color }: { color: string }) => <Feather name="settings" size={20} color={color} />,
                            }}
                        />
                        {/* Hidden screens (redirects or modals) */}
                        <Drawer.Screen
                            name="add-payment"
                            options={{
                                title: 'Добавить платёж',
                                drawerItemStyle: { display: 'none' },
                            }}
                        />
                        <Drawer.Screen
                            name="panic"
                            options={{
                                title: 'Экстренная помощь',
                                drawerItemStyle: { display: 'none' },
                            }}
                        />
                        <Drawer.Screen
                            name="onboarding"
                            options={{
                                headerShown: false,
                                drawerItemStyle: { display: 'none' },
                                swipeEnabled: false,
                            }}
                        />
                        <Drawer.Screen
                            name="financial-test"
                            options={{
                                headerShown: false,
                                drawerItemStyle: { display: 'none' },
                                swipeEnabled: false,
                            }}
                        />
                    </Drawer>
                </View>
            </GestureHandlerRootView>
        </FinancialProvider>
    );
}

const styles = StyleSheet.create<any>({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg0,
    },
    appContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 480, // Mobile width constraint
        alignSelf: 'center',
        backgroundColor: colors.bg0, // Ensure app bg is solid within the "phone"
        // On web, we might want a border or shadow to separate it from the nebula bg,
        // but simple full-height is cleaner for now.
        ...(Platform.OS === 'web' ? {
            height: '100vh',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)', // Nice shadow to pop from background
        } : {})
    },
});
