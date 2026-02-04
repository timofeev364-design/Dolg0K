import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing, typography, radius } from '../../src/theme';
import { GlassCard, AmbientHeader } from '../../src/components/ui/PremiumComponents';
import { api } from '../../src/services/api';

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        try {
            const data = await api.getUsers();
            if (data.users) {
                setUsers(data.users);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Пользователи', headerStyle: { backgroundColor: colors.bg0 }, headerTintColor: colors.textPrimary }} />
            <AmbientHeader />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} tintColor={colors.accent} />}
            >
                <GlassCard variant="surface2" style={styles.statsCard}>
                    <Text style={styles.statsLabel}>Всего пользователей</Text>
                    <Text style={styles.statsValue}>{users.length}</Text>
                </GlassCard>

                <View style={styles.list}>
                    {users.map((user) => (
                        <GlassCard key={user.id} variant="surface1" style={styles.userRow}>
                            <View>
                                <Text style={styles.userName}>{user.display_name}</Text>
                                <Text style={styles.userMeta}>
                                    @{user.username || 'no_username'} • ID: {user.telegram_id || 'N/A'}
                                </Text>
                            </View>
                            <Text style={styles.date}>
                                {new Date(user.registered_at).toLocaleDateString()}
                            </Text>
                        </GlassCard>
                    ))}

                    {users.length === 0 && !loading && (
                        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>Нет пользователей</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg0 },
    content: { padding: spacing.lg, maxWidth: 800, alignSelf: 'center', width: '100%' },
    statsCard: {
        marginBottom: spacing.lg,
        alignItems: 'center',
        padding: spacing.xl,
    },
    statsLabel: { ...typography.body, color: colors.textSecondary },
    statsValue: { ...typography.h1, color: colors.accent, marginTop: 4 },
    list: { gap: spacing.md },
    userRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    userName: { ...typography.h3, color: colors.textPrimary },
    userMeta: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    date: { ...typography.micro, color: colors.textSecondary }
});
