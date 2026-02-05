/**
 * Onboarding Screen - Первоначальная настройка
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
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
    const [name, setName] = useState('');
    const [salaryDay, setSalaryDay] = useState('10');
    const [notificationTime] = useState('09:00');

    const handleNext = () => setStep(step + 1);

    const handleComplete = async () => {
        const storage = getStorage();
        // Save intermediate settings
        // We do NOT set onboardingCompleted: true here, because we want to flow into Financial Test
        await storage.saveSettings({
            userName: name,
            salaryDay: parseInt(salaryDay, 10),
            notificationTime,
            onboardingCompleted: false,
        });
        // Proceed to Questionnaire
        router.replace('/financial-test');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Progress */}
                <View style={styles.progress}>
                    {[1, 2, 3].map(s => (
                        <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
                    ))}
                </View>

                {step === 1 && (
                    <>
                        <Text style={styles.emoji}>👋</Text>
                        <Text style={styles.title}>Давайте знакомиться</Text>
                        <Text style={styles.subtitle}>Как к вам обращаться?</Text>

                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ваше имя"
                            placeholderTextColor={colors.textTertiary}
                        />

                        <Button
                            title="Далее"
                            onPress={handleNext}
                            fullWidth
                            style={styles.btn}
                            disabled={!name.trim()}
                        />
                    </>
                )}

                {step === 2 && (
                    <>
                        <Text style={styles.emoji}>💰</Text>
                        <Text style={styles.title}>Когда зарплата?</Text>
                        <Text style={styles.subtitle}>Выберите день, когда обычно приходит зарплата</Text>

                        <Select
                            value={salaryDay}
                            options={DAY_OPTIONS}
                            onValueChange={setSalaryDay}
                        />

                        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
                            <Button title="Далее" onPress={handleNext} fullWidth />
                            <Button title="Назад" onPress={() => setStep(1)} variant="ghost" fullWidth />
                        </View>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Text style={styles.emoji}>🔔</Text>
                        <Text style={styles.title}>Напоминания</Text>
                        <Text style={styles.subtitle}>Мы будем напоминать о платежах за 24ч и 2ч до срока</Text>

                        <View style={styles.timeInfo}>
                            <Text style={styles.timeText}>Время: {notificationTime}</Text>
                        </View>

                        <Button title="Далее: Анкета" onPress={handleComplete} fullWidth style={styles.btn} />
                        <Button title="Назад" onPress={() => setStep(2)} variant="ghost" fullWidth />
                    </>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { flex: 1, padding: spacing.xl, justifyContent: 'center', maxWidth: 400, alignSelf: 'center', width: '100%' },
    progress: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xl, gap: spacing.sm },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.stroke1 },
    progressDotActive: { backgroundColor: colors.accent, width: 24 },
    emoji: { fontSize: 64, textAlign: 'center', marginBottom: spacing.lg },
    title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    timeInfo: { backgroundColor: colors.surface1, padding: spacing.lg, borderRadius: radius.ui, alignItems: 'center', marginBottom: spacing.lg },
    timeText: { ...typography.h3 },
    btn: { marginTop: spacing.md },
    input: {
        backgroundColor: colors.surface1,
        color: colors.textPrimary,
        padding: spacing.lg,
        borderRadius: radius.ui,
        borderWidth: 1,
        borderColor: colors.stroke1,
        fontSize: 18,
        marginBottom: spacing.lg,
        textAlign: 'center'
    }
});
