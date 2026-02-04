/**
 * Payments Screen
 * Professional Financial List.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { Obligation } from '@babki/core';
import { CATEGORY_LABELS } from '@babki/core';
import { getStorage } from '../src/db';
import { ListRow, SegmentedControl, Button } from '../src/components';
import { colors, spacing, radius, typography } from '../src/theme';

export default function PaymentsScreen() {
    // ... logic same ...
    const router = useRouter();
    const [obligations, setObligations] = useState<Obligation[]>([]);
    const [filter, setFilter] = useState<'all' | 'due' | 'paid'>('all');
    const [search, setSearch] = useState('');

    const loadData = useCallback(async () => {
        const storage = getStorage();
        const obls = await storage.getAllObligations();
        setObligations(obls);
    }, []);

    const handleDelete = async (id: string) => {
        if (Platform.OS === 'web') {
            if (window.confirm('Удалить платёж? Это действие нельзя отменить.')) {
                const storage = getStorage();
                await storage.deleteObligation(id);
                loadData();
            }
        } else {
            Alert.alert(
                'Удалить платёж?',
                'Это действие нельзя отменить.',
                [
                    { text: 'Отмена', style: 'cancel' },
                    {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: async () => {
                            const storage = getStorage();
                            await storage.deleteObligation(id);
                            loadData();
                        }
                    }
                ]
            );
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Filter Logic
    const filtered = obligations
        .filter(o => {
            if (filter === 'due') return !o.isPaid;
            if (filter === 'paid') return o.isPaid;
            return true;
        })
        .filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

    // Segmented Control Options
    const filterOptions = [
        { label: 'Все', value: 'all' },
        { label: 'К оплате', value: 'due' },
        { label: 'Оплачено', value: 'paid' },
    ];

    return (
        <View style={styles.container}>
            {/* Header Controls */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Поиск..."
                        placeholderTextColor={colors.textTertiary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <View style={{ width: 16 }} />
                <Button
                    title="+ Новый"
                    size="sm"
                    onPress={() => router.push('/add-payment')}
                />
            </View>

            <View style={styles.tabsContainer}>
                <SegmentedControl
                    options={filterOptions}
                    value={filter}
                    onChange={(val) => setFilter(val as 'all' | 'due' | 'paid')}
                />
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <ListRow isHeader title="НАЗВАНИЕ / ДАТА" rightText="СУММА" />
                }
                renderItem={({ item }) => (
                    <ListRow
                        title={item.name}
                        subtitle={`${item.dueDay} числа • ${CATEGORY_LABELS[item.category]}`}
                        rightText={`${item.amount.toLocaleString('ru-RU')} ₽`}
                        status={item.isPaid ? 'success' : 'warning'}
                        statusText={item.isPaid ? 'Оплачено' : 'К оплате'}
                        onPress={() => router.push(`/payments?edit=${item.id}`)}
                        onDelete={() => handleDelete(item.id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Ничего не найдено</Text>
                    </View>
                }
            />

            {/* FAB (Mobile only? Or generally?) */}
            <Pressable style={styles.fab} onPress={() => router.push('/add-payment')}>
                <Text style={styles.fabText}>+</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    header: {
        flexDirection: 'row',
        padding: spacing.md,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface1,
        borderRadius: radius.ui, // MD was likely 8 or 10, ui is 12, small is 8
        paddingHorizontal: spacing.sm,
        height: 40,
        borderWidth: 1,
        borderColor: colors.stroke1,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        ...typography.body,
        color: colors.textPrimary, // Ensure override
        height: '100%',
        outlineStyle: 'none',
    } as any,
    tabsContainer: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    listContent: {
        paddingBottom: 100,
    },
    empty: {
        alignItems: 'center',
        padding: spacing.xl,
        marginTop: spacing.xl,
    },
    emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: spacing.md,
        bottom: spacing.md,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    fabText: {
        color: colors.bg0,
        fontSize: 28,
        fontWeight: '600',
        lineHeight: 32,
        marginTop: -2,
    },
});
