/**
 * Budgets Dashboard
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, TextInput, Modal, Pressable, FlatList } from 'react-native';
import { Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radius } from '../../src/theme';
import { useFinancialData, Transaction, FinancialCategory } from '../../src/context/FinancialContext';
import { TechGrid, AmbientHeader, GlassCard } from '../../src/components/ui/PremiumComponents';
import { Button } from '../../src/components/Button';
import { BudgetCard } from '../../src/components/budgets/BudgetCard';
import { RiskTier } from '../../src/components/budgets/RiskBadge';

// --- Modals ---

const AddTransactionModal = ({
    visible,
    onClose,
    category,
    onAdd
}: {
    visible: boolean;
    onClose: () => void;
    category: FinancialCategory | null;
    onAdd: (amount: number, note: string) => void;
}) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    if (!category) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <GlassCard style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={[styles.iconBox, { backgroundColor: category.colorToken + '20' }]}>
                            <Feather name={category.icon as any} size={20} color={category.colorToken} />
                        </View>
                        <Text style={styles.modalTitle}>Добавить трату: {category.name}</Text>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Feather name="x" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <Text style={styles.label}>Сумма (₽)</Text>
                    <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        autoFocus
                        placeholder="0"
                        placeholderTextColor={colors.textTertiary}
                    />

                    <Text style={styles.label}>Заметка (опционально)</Text>
                    <TextInput
                        style={styles.input}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Например: Обед"
                        placeholderTextColor={colors.textTertiary}
                    />

                    <Button
                        title="Добавить"
                        onPress={() => {
                            if (!amount) return;
                            onAdd(parseFloat(amount), note);
                            setAmount('');
                            setNote('');
                        }}
                        style={{ marginTop: 20 }}
                    />
                </GlassCard>
            </View>
        </Modal>
    );
};

const TransactionHistoryModal = ({
    visible,
    onClose,
    category,
    transactions,
    onRemove
}: {
    visible: boolean;
    onClose: () => void;
    category: FinancialCategory | null;
    transactions: Transaction[];
    onRemove: (id: string) => void;
}) => {
    if (!category) return null;

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <GlassCard style={[styles.modalContent, { height: '80%' }]}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.modalTitle}>{category.name}</Text>
                            <Text style={styles.modalSubtitle}>Всего: {Math.round(total).toLocaleString()} ₽</Text>
                        </View>
                        <Pressable onPress={onClose} hitSlop={10}>
                            <Feather name="x" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <FlatList
                        data={transactions}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingVertical: 10 }}
                        renderItem={({ item }) => (
                            <View style={styles.historyItem}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.historyAmount}>-{item.amount.toLocaleString()} ₽</Text>
                                    {item.note && <Text style={styles.historyNote}>{item.note}</Text>}
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()}</Text>
                                </View>
                                <Pressable onPress={() => onRemove(item.id)} hitSlop={10} style={{ opacity: 0.7 }}>
                                    <Feather name="trash-2" size={16} color={colors.textSecondary} />
                                </Pressable>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>Нет записей</Text>}
                    />
                </GlassCard>
            </View>
        </Modal>
    );
};

export default function BudgetsDashboard() {
    const { categories, transactions, addTransaction, removeTransaction, budgets } = useFinancialData();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<FinancialCategory | null>(null);
    const [selectedCategoryForView, setSelectedCategoryForView] = useState<FinancialCategory | null>(null);

    // Filter transactions for viewing
    const transactionsForView = useMemo(() => {
        if (!selectedCategoryForView) return [];
        return transactions.filter(t => t.categoryId === selectedCategoryForView.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedCategoryForView]);

    const handleAddTransaction = (amount: number, note: string) => {
        if (selectedCategoryForAdd) {
            addTransaction({
                id: Date.now().toString(),
                categoryId: selectedCategoryForAdd.id,
                amount,
                date: new Date().toISOString(),
                note
            });
            setSelectedCategoryForAdd(null);
        }
    };

    // Calculate totals for UI
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        transactions.forEach(t => {
            totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount;
        });
        return totals;
    }, [transactions]);

    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Мои Расходы',
                headerStyle: { backgroundColor: colors.bg0 },
                headerTintColor: colors.textPrimary
            }} />

            <TechGrid />
            <AmbientHeader />

            <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}>

                {/* Total Summary */}
                <GlassCard style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Всего потрачено</Text>
                    <Text style={styles.summaryValue}>{Math.round(totalSpent).toLocaleString()} ₽</Text>
                </GlassCard>

                <Text style={styles.sectionTitle}>Категории</Text>

                <View style={[styles.grid, isDesktop && styles.desktopGrid]}>
                    {categories.map(cat => {
                        const spent = categoryTotals[cat.id] || 0;
                        const budget = budgets.find(b => b.categoryId === cat.id);
                        const limit = budget ? budget.limit : 0;

                        // Calculate Risk
                        let risk: RiskTier = 'onTrack';
                        const ratio = limit > 0 ? spent / limit : (spent > 0 ? 1.1 : 0);

                        if (ratio >= 1.0) risk = 'overLimit';
                        else if (ratio >= 0.85) risk = 'atRisk';

                        return (
                            <View key={cat.id} style={[styles.cardWrapper, isDesktop && styles.desktopCardWrapper]}>
                                <BudgetCard
                                    name={cat.name}
                                    icon={cat.icon}
                                    spent={spent}
                                    limit={limit}
                                    forecast={spent}
                                    riskTier={risk}
                                    onPress={() => setSelectedCategoryForView(cat)}
                                    onAddPress={() => setSelectedCategoryForAdd(cat)}
                                />
                            </View>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Modals */}
            <AddTransactionModal
                visible={!!selectedCategoryForAdd}
                category={selectedCategoryForAdd}
                onClose={() => setSelectedCategoryForAdd(null)}
                onAdd={handleAddTransaction}
            />

            <TransactionHistoryModal
                visible={!!selectedCategoryForView}
                category={selectedCategoryForView}
                transactions={transactionsForView}
                onClose={() => setSelectedCategoryForView(null)}
                onRemove={removeTransaction}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    content: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    desktopContent: {
        paddingHorizontal: spacing.xl,
        maxWidth: 1440,
        alignSelf: 'center',
        width: '100%',
    },
    summaryCard: {
        marginBottom: spacing.xl,
        alignItems: 'center',
        padding: spacing.lg,
    },
    summaryLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    summaryValue: {
        ...typography.h1,
        color: colors.textPrimary,
        marginTop: spacing.xs,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    grid: {
        gap: spacing.md,
    },
    desktopGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cardWrapper: {
        width: '100%',
    },
    desktopCardWrapper: {
        width: '32%',
        minWidth: 200,
    },
    catCard: {
        padding: spacing.md,
        alignItems: 'flex-start',
        position: 'relative',
    },
    catHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    catName: {
        ...typography.body,
        fontWeight: '600',
        color: colors.textPrimary,
        flex: 1,
    },
    spentValue: {
        ...typography.h3,
        color: colors.textPrimary,
        marginBottom: 4,
    },
    addButton: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: 10,
    },
    modalTitle: {
        ...typography.h3,
        color: colors.textPrimary,
        flex: 1,
    },
    modalSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    label: {
        ...typography.caption,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    input: {
        backgroundColor: colors.bg1,
        color: colors.textPrimary,
        padding: 12,
        borderRadius: radius.ui,
        borderWidth: 1,
        borderColor: colors.stroke1,
        fontSize: 16,
        marginBottom: spacing.lg,
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.stroke1,
    },
    historyAmount: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    historyNote: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    historyDate: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 10,
    },
    miniAddBtn: {

    }
});
