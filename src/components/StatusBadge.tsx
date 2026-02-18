/**
 * Status Badge Component
 * Displays ticket status with matching colors from STATUS_CONFIG
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusConfig } from '../constants';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const config = getStatusConfig(status);

    const sizeStyles = {
        sm: { paddingH: Spacing.sm, paddingV: 2, fontSize: FontSize.xs },
        md: { paddingH: Spacing.md, paddingV: 4, fontSize: FontSize.sm },
        lg: { paddingH: Spacing.lg, paddingV: 6, fontSize: FontSize.md },
    };

    const s = sizeStyles[size];

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: config.bgColor,
                    paddingHorizontal: s.paddingH,
                    paddingVertical: s.paddingV,
                },
            ]}
        >
            <View style={[styles.dot, { backgroundColor: config.color }]} />
            <Text style={[styles.text, { color: config.textColor, fontSize: s.fontSize }]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },
    text: {
        fontWeight: FontWeight.semibold,
    },
});
