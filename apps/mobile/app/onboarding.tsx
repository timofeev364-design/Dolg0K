/**
 * Onboarding Screen - Первоначальная настройка
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { getStorage } from '../src/db';
import { Select, Button } from '../src/components';
import { colors, spacing, radius, typography } from '../src/theme';

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} число`,
}));

export default function OnboardingScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [salaryDay, setSalaryDay] = useState('10');
    const [notificationTime] = useState('09:00');

    const handleComplete = async () => {
        const storage = getStorage();
        await storage.saveSettings({
            salaryDay: parseInt(salaryDay, 10),
            notificationTime,
            onboardingCompleted: true,
        });
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Progress */}
                <View style={styles.progress}>
                    {[1, 2].map(s => (
                        <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
                    ))}
                </View>

                {step === 1 && (
                    <>
                        <Text style={styles.emoji}>💰</Text>
                        <Text style={styles.title}>Когда зарплата?</Text>
                        <Text style={styles.subtitle}>Выберите день, когда обычно приходит зарплата</Text>

                        <Select
                            value={salaryDay}
                            options={DAY_OPTIONS}
                            onValueChange={setSalaryDay}
                        />

                        <Button title="Далее" onPress={() => setStep(2)} fullWidth style={styles.btn} />
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={styles.emoji}>🔔</Text>
                        <Text style={styles.title}>Напоминания</Text>
                        <Text style={styles.subtitle}>Мы будем напоминать о платежах за 24ч и 2ч до срока</Text>

                        <View style={styles.timeInfo}>
                            <Text style={styles.timeText}>Время: {notificationTime}</Text>
                        </View>

                        <Button title="Начать" onPress={handleComplete} fullWidth style={styles.btn} />
                        <Button title="Назад" onPress={() => setStep(1)} variant="ghost" fullWidth />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
    progress: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xl, gap: spacing.sm },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.stroke1 },
    progressDotActive: { backgroundColor: colors.accent, width: 24 },
    emoji: { fontSize: 64, textAlign: 'center', marginBottom: spacing.lg },
    title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    timeInfo: { backgroundColor: colors.surface1, padding: spacing.lg, borderRadius: radius.ui, alignItems: 'center', marginBottom: spacing.lg },
    timeText: { ...typography.h3 },
    btn: { marginTop: spacing.md },
});
