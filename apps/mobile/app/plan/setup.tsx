import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ALL_PLAN_TEMPLATES, HORIZON_LABELS } from '../../src/core';
import { createPlanInstance } from '../../src/db/repositories';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../src/theme';
import { Button } from '../../src/components';

export default function PlanSetupScreen() {
    const router = useRouter();
    const { templateId } = useLocalSearchParams<{ templateId: string }>();

    const template = useMemo(() => {
        return ALL_PLAN_TEMPLATES.find(t => t.id === templateId);
    }, [templateId]);

    const handleStartPlan = async () => {
        Alert.alert(
            "Подтверждение",
            `Вы уверены, что хотите запустить план "${template?.title}"? \n\nТекущие задачи будут архивированы.`,
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Начать план",
                    style: "default",
                    onPress: async () => {
                        try {
                            if (template) {
                                // Defaulting to first horizon for now
                                await createPlanInstance(template.id, { horizon: template.horizons[0] });
                                Alert.alert("Успех", "План успешно создан!");
                                router.replace('/'); // Go to home usually, or /plan tab
                            }
                        } catch (e) {
                            console.error(e);
                            Alert.alert("Ошибка", "Не удалось создать план");
                        }
                    }
                }
            ]
        );
    };

    if (!template) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Шаблон не найден</Text>
                <TouchableOpacity onPress={() => router.back()}><Text>Назад</Text></TouchableOpacity>
            </SafeAreaView>
        );
    }

    const horizonLabel = template.horizons.map(h => HORIZON_LABELS[h]).join(', ');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.category}>{template.category.toUpperCase()} • {horizonLabel}</Text>
                <Text style={styles.title}>{template.title}</Text>
                <Text style={styles.description}>{template.description}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Кому подходит</Text>
                    <Text style={styles.sectionText}>{template.targetAudience}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Пример задач</Text>
                    {template.exampleTasks.map((task, idx) => (
                        <View key={idx} style={styles.taskItem}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.taskText}>{task}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚠️ Требования</Text>
                    {template.requirements.length > 0 ? (
                        template.requirements.map((req, idx) => (
                            <Text key={idx} style={styles.reqText}>✓ {req}</Text>
                        ))
                    ) : (
                        <Text style={styles.sectionText}>Нет специальных требований</Text>
                    )}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Создать план"
                    onPress={handleStartPlan}
                    variant="primary"
                    fullWidth
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                    <Text style={styles.secondaryButtonText}>Назад</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    errorText: {
        fontSize: fontSize.lg,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.xxl,
    },
    content: {
        padding: spacing.lg,
    },
    category: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
        color: colors.textSecondary,
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    section: {
        marginBottom: spacing.xl,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    sectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.sm,
    },
    sectionText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    taskItem: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
        alignItems: 'flex-start',
    },
    bullet: {
        fontSize: fontSize.lg,
        color: colors.success,
        marginRight: spacing.sm,
        lineHeight: 20,
    },
    taskText: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        lineHeight: 22,
        flex: 1,
    },
    reqText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    footer: {
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
    },
    secondaryButton: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    secondaryButtonText: {
        color: colors.textSecondary,
        fontSize: fontSize.md,
    },
});
