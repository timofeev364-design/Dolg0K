/**
 * Panic Screen
 * Экран экстренной помощи - 3 шага
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, typography } from '../src/theme';

const PANIC_STEPS = [
    {
        step: 1,
        emoji: '📞',
        title: 'Свяжитесь с кредитором ДО просрочки',
        description: 'Позвоните в банк или МФО и объясните ситуацию. Большинство кредиторов готовы идти навстречу, если вы обращаетесь заранее.',
        tips: [
            'Звоните на горячую линию, указанную в договоре',
            'Попросите зафиксировать ваше обращение',
            'Уточните возможность реструктуризации',
        ],
    },
    {
        step: 2,
        emoji: '📝',
        title: 'Подайте заявление письменно',
        description: 'Устные обещания не имеют юридической силы. Обязательно оформите всё в письменном виде.',
        tips: [
            'Используйте наши шаблоны заявлений',
            'Отправьте заказным письмом или через личный кабинет',
            'Сохраните копию с отметкой о принятии',
        ],
        action: {
            label: 'Открыть шаблоны',
            route: '/templates',
        },
    },
    {
        step: 3,
        emoji: '🛡️',
        title: 'Защитите свои права',
        description: 'Если кредитор отказывает или нарушает закон, вы можете обратиться в контролирующие органы.',
        tips: [
            'ЦБ РФ — для банков и МФО',
            'Роспотребнадзор — для защиты прав потребителей',
            'Финансовый уполномоченный — для споров до 500 000 ₽',
        ],
        links: [
            { label: 'Сайт ЦБ РФ', url: 'https://cbr.ru' },
            { label: 'Финансовый уполномоченный', url: 'https://finombudsman.ru' },
        ],
    },
];

export default function PanicScreen() {
    const router = useRouter();

    const handleLink = (url: string) => {
        Linking.openURL(url);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.emoji}>🚨</Text>
                <Text style={styles.title}>Экстренная помощь</Text>
                <Text style={styles.subtitle}>
                    Не паникуйте. Следуйте этим шагам, чтобы минимизировать последствия.
                </Text>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
                <Text style={styles.disclaimerTitle}>⚠️ Важно</Text>
                <Text style={styles.disclaimerText}>
                    Это информационные рекомендации, не юридическая консультация. При сложных ситуациях обратитесь к квалифицированному юристу.
                </Text>
            </View>

            {/* Steps */}
            {PANIC_STEPS.map((step) => (
                <View key={step.step} style={styles.stepCard}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{step.step}</Text>
                        </View>
                        <Text style={styles.stepEmoji}>{step.emoji}</Text>
                    </View>

                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>

                    <View style={styles.tipsList}>
                        {step.tips.map((tip, index) => (
                            <View key={index} style={styles.tipItem}>
                                <Text style={styles.tipBullet}>•</Text>
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>

                    {step.action && (
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push(step.action.route as any)}
                        >
                            <Text style={styles.actionButtonText}>{step.action.label}</Text>
                        </Pressable>
                    )}

                    {step.links && (
                        <View style={styles.linksContainer}>
                            {step.links.map((link, index) => (
                                <Pressable
                                    key={index}
                                    style={styles.linkButton}
                                    onPress={() => handleLink(link.url)}
                                >
                                    <Text style={styles.linkButtonText}>{link.label} →</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
                </View>
            ))}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Помните: просрочка — это не конец. Главное — действовать вовремя и не игнорировать проблему.
                </Text>
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
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emoji: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    title: {
        ...typography.h1,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    disclaimer: {
        backgroundColor: colors.warning + '20',
        borderWidth: 1,
        borderColor: colors.warning,
        borderRadius: radius.card,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    disclaimerTitle: {
        ...typography.bodyM,
        color: colors.warning,
        marginBottom: spacing.xs,
    },
    disclaimerText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    stepCard: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    stepNumberText: {
        ...typography.bodyM,
        color: colors.bg0,
    },
    stepEmoji: {
        fontSize: 24,
    },
    stepTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    stepDescription: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    tipsList: {
        marginBottom: spacing.md,
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: spacing.xs,
    },
    tipBullet: {
        color: colors.accent,
        fontSize: 16,
        marginRight: spacing.sm,
    },
    tipText: {
        color: colors.textPrimary,
        fontSize: 14,
        flex: 1,
    },
    actionButton: {
        backgroundColor: colors.accent,
        padding: spacing.md,
        borderRadius: radius.ui,
        alignItems: 'center',
    },
    actionButtonText: {
        ...typography.bodyM,
        color: colors.bg0,
    },
    linksContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    linkButton: {
        backgroundColor: colors.surface2,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.ui,
    },
    linkButtonText: {
        ...typography.caption,
        color: colors.accent,
    },
    footer: {
        marginTop: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
    },
    footerText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
