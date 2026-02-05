/**
 * Plan Screen
 * Orchestrator for the Financial Plan System.
 */
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ActivePlan, PlanCatalog } from '../../src/components';
import { getStorage } from '../../src/db';
import { colors } from '../../src/theme';
import type { PlanInstance } from '../../src/core';

export default function PlanScreen() {
    const [loading, setLoading] = useState(true);
    const [activePlan, setActivePlan] = useState<PlanInstance | null>(null);

    const loadPlan = useCallback(async () => {
        setLoading(true);
        try {
            const storage = getStorage();
            const plan = await storage.getActivePlan();
            setActivePlan(plan);
        } catch (e) {
            console.error('Failed to load plan', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadPlan(); }, [loadPlan]));

    const handleCreatePlan = async (templateId: string) => {
        try {
            const storage = getStorage();
            // Create plan instance from template
            const newPlan = await storage.createPlanInstance(templateId, {
                // In a real flow, we might ask for params here (e.g. goal amount)
                // For now, use defaults or settings
                startDate: new Date(),
            });
            setActivePlan(newPlan);
        } catch (e) {
            console.error('Failed to create plan', e);
            const msg = 'Не удалось создать план: ' + e;
            if (Platform.OS === 'web') alert(msg);
            else Alert.alert('Ошибка', msg);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color={colors.accent} size="large" />
            </View>
        );
    }

    if (activePlan) {
        return (
            <View style={styles.container}>
                <ActivePlan
                    plan={activePlan}
                    onBack={loadPlan} // Reload to see if archived/changed
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <PlanCatalog onSelectPlan={handleCreatePlan} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg0,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
