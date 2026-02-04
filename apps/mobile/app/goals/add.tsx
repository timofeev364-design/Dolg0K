import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { Envelope } from '../../src/logic/math/envelopeFormulas';

export default function AddGoalScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [current, setCurrent] = useState('');
    const [date, setDate] = useState('2024-12-31');

    const handleSave = () => {
        if (!name || !target) return;

        const newGoal: Envelope = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            targetAmount: parseFloat(target),
            currentAmount: parseFloat(current) || 0,
            deadline: date,
            priority: 1
        };

        router.push({
            pathname: '/goals',
            params: { newGoal: JSON.stringify(newGoal) }
        });
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Новая Цель', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>
                <Text style={styles.headerTitle}>Создать цель</Text>

                <GlassCard style={styles.formCard} variant="surface1">

                    <View style={styles.field}>
                        <Text style={styles.label}>Название цели</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Например, MacBook или Отпуск"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Сколько нужно накопить (₽)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="250000"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            value={target}
                            onChangeText={setTarget}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Уже есть (₽)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="numeric"
                            value={current}
                            onChangeText={setCurrent}
                        />
                    </View>

                    <View style={styles.field}>
                        <Text style={styles.label}>Желаемая дата (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="2024-12-31"
                            placeholderTextColor={colors.textTertiary}
                            value={date}
                            onChangeText={setDate}
                        />
                    </View>

                    <Button
                        title="Создать цель"
                        variant="primary"
                        onPress={handleSave}
                        style={{ marginTop: spacing.lg }}
                    />
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg },
    desktopContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
    headerTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
    formCard: { padding: spacing.xl },
    field: { marginBottom: spacing.lg },
    label: { ...typography.body, color: colors.textSecondary, marginBottom: 8 },
    input: {
        backgroundColor: colors.bg1,
        borderWidth: 1,
        borderColor: colors.stroke1,
        borderRadius: radius.small,
        padding: 12,
        color: colors.textPrimary,
        ...typography.body
    },
});
