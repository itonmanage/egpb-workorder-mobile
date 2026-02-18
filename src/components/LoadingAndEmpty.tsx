/**
 * Loading Spinner Component
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/theme';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'large';
    fullScreen?: boolean;
}

export function LoadingSpinner({ message, size = 'large', fullScreen = false }: LoadingSpinnerProps) {
    if (fullScreen) {
        return (
            <View style={styles.fullScreen}>
                <ActivityIndicator size={size} color={Colors.primary} />
                {message && <Text style={styles.message}>{message}</Text>}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={Colors.primary} />
            {message && <Text style={styles.message}>{message}</Text>}
        </View>
    );
}

/**
 * Empty State Component
 */
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message?: string;
}

export function EmptyState({ icon = 'document-text-outline', title, message }: EmptyStateProps) {
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name={icon} size={64} color={Colors.textTertiary} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyTitle}>{title}</Text>
            {message && <Text style={styles.emptyMessage}>{message}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
    },
    message: {
        marginTop: Spacing.md,
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xxxxl,
        gap: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: FontSize.sm,
        color: Colors.textTertiary,
        textAlign: 'center',
    },
});
