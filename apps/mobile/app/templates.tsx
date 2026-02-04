/**
 * Templates Screen
 * Obsidian Tech Premium
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { TEMPLATES } from '@babki/core';
import type { Template } from '@babki/core';
import { ListRow, SegmentedControl } from '../src/components';
import { colors, spacing, radius, typography } from '../src/theme';

type Category = Template['category'] | 'all';

export default function TemplatesScreen() {
    const [selectedCategory, setSelectedCategory] = useState<Category>('all');

    const options = [
        { label: 'Все', value: 'all' },
        { label: 'Банки', value: 'bank' },
        { label: 'МФО', value: 'mfo' },
        { label: 'УК', value: 'management' },
    ];

    const filteredTemplates = selectedCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === selectedCategory);

    const handleCopy = async (content: string) => {
        await Clipboard.setStringAsync(content);
        if (Platform.OS === 'web') {
            alert('Шаблон скопирован в буфер обмена');
        } else {
            Alert.alert('Скопировано', 'Шаблон в буфере обмена');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={typography.h2}>Библиотека ответов</Text>
                <Text style={styles.subtitle}>
                    Юридически выверенные шаблоны для общения с кредиторами.
                    Нажмите, чтобы скопировать.
                </Text>
            </View>

            <View style={styles.controls}>
                <SegmentedControl
                    options={options}
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val as Category)}
                />
            </View>

            <View style={styles.listContainer}>
                {filteredTemplates.map(t => (
                    <ListRow
                        key={t.id}
                        title={t.title}
                        subtitle={t.description}
                        icon="copy"
                        onPress={() => handleCopy(t.content)}
                    />
                ))}
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
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        marginBottom: spacing.lg,
    },
    subtitle: {
        ...typography.body,
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    controls: {
        marginBottom: spacing.lg,
    },
    listContainer: {
        backgroundColor: colors.surface1,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.stroke1,
        overflow: 'hidden',
    },
});
