import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { Button } from '../../src/components/Button';
import { GlassCard, AmbientHeader } from '../../src/components/ui/PremiumComponents';
import { api } from '../../src/services/api';
import { getStorage } from '../../src/db';

// Mock types for Telegram WebApp
declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                initDataUnsafe?: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                    };
                };
                ready: () => void;
                expand: () => void;
            };
        };
    }
}

export default function RegistrationScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [tgUser, setTgUser] = useState<any>(null);

    useEffect(() => {
        // Init Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            const user = window.Telegram.WebApp.initDataUnsafe?.user;
            if (user) {
                setTgUser(user);
                setName(user.first_name + (user.last_name ? ' ' + user.last_name : ''));
            }
        }
    }, []);

    const handleRegister = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            // 1. Register on Backend
            const res = await api.register({
                telegram_id: tgUser?.id?.toString(),
                username: tgUser?.username,
                display_name: name
            });

            if (res.success) {
                // 2. Save local completion
                const storage = getStorage();
                await storage.saveSettings({ onboardingCompleted: true });

                // 3. Navigate to Main
                router.replace('/');
            } else {
                alert('Ошибка регистрации: ' + (res.error || 'Неизвестная ошибка'));
            }
        } catch (e) {
            console.error(e);
            alert('Ошибка сети. Проверьте подключение к серверу.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.container}>
                    <AmbientHeader />
                    <View style={styles.content}>
                        <Text style={styles.title}>Добро пожаловать в Babki</Text>
                        <Text style={styles.subtitle}>Элитный финансовый помощник</Text>

                        <GlassCard variant="surface1" style={styles.card}>
                            <Text style={styles.label}>Как к вам обращаться?</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Ваше Имя"
                                placeholderTextColor={colors.textTertiary}
                            />

                            {tgUser && (
                                <Text style={styles.hint}>
                                    Обнаружен аккаунт Telegram: @{tgUser.username || tgUser.id}
                                </Text>
                            )}

                            <Button
                                title={loading ? "Регистрация..." : "Войти"}
                                onPress={handleRegister}
                                size="lg"
                                style={{ marginTop: 24 }}
                                disabled={loading || !name.trim()}
                            />
                        </GlassCard>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
        justifyContent: 'center',
        padding: spacing.xl,
        minHeight: '100%', // Ensure full height coverage
    },
    content: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    title: {
        ...typography.h1,
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 48,
    },
    card: {
        padding: spacing.xl,
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    label: {
        ...typography.bodyM,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.bg1,
        padding: 16,
        borderRadius: radius.ui,
        color: colors.textPrimary,
        ...typography.body,
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    hint: {
        ...typography.micro,
        color: colors.success,
        marginTop: 8,
    }
});
