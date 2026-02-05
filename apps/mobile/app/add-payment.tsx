/**
 * Add Payment Screen
 * Форма добавления нового платежа
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { PaymentCategory } from '../src/core';
import { CATEGORY_LABELS } from '../src/core';
import { getStorage } from '../src/db';
import { Input, Select, Button } from '../src/components';
import { colors, spacing, typography } from '../src/theme';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} число`,
}));

export default function AddPaymentScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDay, setDueDay] = useState('');
    const [category, setCategory] = useState<PaymentCategory>('other');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'Введите название платежа';
        }

        const amountNum = parseFloat(amount);
        if (!amount || isNaN(amountNum) || amountNum <= 0) {
            newErrors.amount = 'Введите корректную сумму';
        }

        if (!dueDay) {
            newErrors.dueDay = 'Выберите день платежа';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const storage = getStorage();
            await storage.createObligation({
                name: name.trim(),
                amount: parseFloat(amount),
                dueDay: parseInt(dueDay, 10),
                category,
                isPaid: false,
            });

            router.back();
        } catch (error) {
            Alert.alert('Ошибка', 'Не удалось сохранить платёж');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Новый платёж</Text>
            <Text style={styles.subtitle}>
                Добавьте обязательный платёж в ваш календарь
            </Text>

            <View style={styles.form}>
                <Input
                    label="Название"
                    value={name}
                    onChangeText={setName}
                    placeholder="Например: Аренда квартиры"
                    error={errors.name}
                />

                <Input
                    label="Сумма (₽)"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="15000"
                    keyboardType="numeric"
                    error={errors.amount}
                />

                <Select
                    label="День платежа"
                    value={dueDay}
                    options={DAY_OPTIONS}
                    onValueChange={setDueDay}
                    placeholder="Выберите день"
                    error={errors.dueDay}
                />

                <Select
                    label="Категория"
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onValueChange={(v) => setCategory(v as PaymentCategory)}
                />
            </View>

            <View style={styles.actions}>
                <Button
                    title="Сохранить"
                    onPress={handleSubmit}
                    loading={loading}
                    fullWidth
                />
                <Button
                    title="Отмена"
                    onPress={() => router.back()}
                    variant="secondary"
                    fullWidth
                    style={{ marginTop: spacing.sm }}
                />
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
    title: {
        ...typography.h1,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.xl,
    },
    form: {
        marginBottom: spacing.xl,
    },
    actions: {
        marginTop: 'auto',
    },
});
