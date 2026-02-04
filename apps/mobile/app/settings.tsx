/**
 * Settings Screen
 * Obsidian Tech Premium
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getStorage } from '../src/db';
import { useFinancialData } from '../src/context/FinancialContext';
import { Input, Select, Button } from '../src/components';
import { colors, spacing, radius, typography } from '../src/theme';

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} число`,
}));

export default function SettingsScreen() {
    const router = useRouter();
    const { resetAllData } = useFinancialData();

    const [salaryDay, setSalaryDay] = useState('');
    const [notificationTime, setNotificationTime] = useState('');
    const [currentBalance, setCurrentBalance] = useState('');
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        const storage = getStorage();
        const s = await storage.getSettings();
        setSalaryDay(String(s.salaryDay));
        setNotificationTime(s.notificationTime);
        setCurrentBalance(s.currentBalance !== undefined ? String(s.currentBalance) : '');
    }, []);

    useFocusEffect(useCallback(() => { loadSettings(); }, [loadSettings]));

    const handleSave = async () => {
        setSaving(true);
        try {
            const storage = getStorage();
            await storage.saveSettings({
                salaryDay: parseInt(salaryDay, 10) || 10,
                notificationTime: notificationTime || '09:00',
                onboardingCompleted: true,
                currentBalance: currentBalance ? parseFloat(currentBalance) : undefined,
            });

            if (Platform.OS === 'web') alert('Настройки сохранены');
            else Alert.alert('Готово', 'Настройки сохранены');
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось сохранить');
        } finally {
            setSaving(false);
        }
    };

    const handleClearData = () => {
        const doDelete = async () => {
            await resetAllData();
            // Optional: clear entire storage if needed, but context handles critical state
            // const storage = getStorage();
            // await storage.clearAllData(); 

            if (Platform.OS === 'web') alert('Данные сброшены. Начнем сначала!');
            else Alert.alert('Готово', 'Данные сброшены');

            router.replace('/financial-test');
        };

        if (Platform.OS === 'web') {
            if (confirm('Удалить ВСЕ данные? Отменить невозможно.')) doDelete();
        } else {
            Alert.alert('Удалить данные?', 'Отменить будет невозможно.', [
                { text: 'Отмена', style: 'cancel' },
                { text: 'Удалить', style: 'destructive', onPress: doDelete },
            ]);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* Finance Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Финансы</Text>
                <View style={styles.card}>
                    <Select
                        label="День зарплаты"
                        value={salaryDay}
                        options={DAY_OPTIONS}
                        onValueChange={setSalaryDay}
                    />
                    <View style={styles.spacer} />
                    <Input
                        label="Текущий баланс (₽)"
                        value={currentBalance}
                        onChangeText={setCurrentBalance}
                        placeholder="0"
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Уведомления</Text>
                <View style={styles.card}>
                    <Input
                        label="Время напоминаний"
                        value={notificationTime}
                        onChangeText={setNotificationTime}
                        placeholder="09:00"
                    />
                </View>
            </View>

            <View style={styles.actionRow}>
                <Button title="Сохранить изменения" onPress={handleSave} loading={saving} variant="primary" />
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerSection}>
                <Text style={styles.dangerTitle}>Опасная зона</Text>
                <View style={styles.dangerCard}>
                    <Text style={styles.dangerText}>
                        Удаление всех данных (платежи, планы, настройки).
                        Восстановить будет невозможно.
                    </Text>
                    <Button
                        title="Сбросить всё"
                        onPress={handleClearData}
                        variant="danger"
                        size="sm"
                        style={{ alignSelf: 'flex-start', marginTop: spacing.md }}
                    />
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.version}>Babki v1.0.0 (Obsidian)</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.h2,
        marginBottom: spacing.md,
    },
    card: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    spacer: {
        height: spacing.md,
    },
    actionRow: {
        marginBottom: spacing.xxl,
    },
    dangerSection: {
        marginBottom: spacing.xxl,
    },
    dangerTitle: {
        ...typography.h2,
        color: colors.danger,
        marginBottom: spacing.md,
    },
    dangerCard: {
        backgroundColor: colors.dangerSoft,
        borderRadius: radius.card,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.danger + '30',
    },
    dangerText: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    version: {
        ...typography.micro,
        color: colors.textTertiary,
    }
});
