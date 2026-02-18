/**
 * Ticket Card Component
 * Card item for ticket lists showing key information
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket } from '../types';
import { StatusBadge } from './StatusBadge';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

interface TicketCardProps {
    ticket: Ticket;
    onPress: () => void;
}

export function TicketCard({ ticket, onPress }: TicketCardProps) {
    const formattedDate = new Date(ticket.createdAt).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header: Ticket Number + Status */}
            <View style={styles.header}>
                <View style={styles.ticketNumberWrap}>
                    <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
                    <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                </View>
                <StatusBadge status={ticket.status} size="sm" />
            </View>

            {/* Title / Location */}
            <Text style={styles.title} numberOfLines={1}>
                {ticket.title || 'No location specified'}
            </Text>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
                {ticket.description || 'No description provided'}
            </Text>

            {/* Footer: Meta info */}
            <View style={styles.footer}>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.metaText}>{ticket.location || 'N/A'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="construct-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.metaText} numberOfLines={1}>{ticket.typeOfDamage}</Text>
                    </View>
                </View>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.metaText}>{ticket.user?.username || 'Unknown'}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
                        <Text style={styles.metaText}>{formattedDate} {formattedTime}</Text>
                    </View>
                </View>
            </View>

            {/* Assign indicator */}
            {ticket.assignTo && (
                <View style={styles.assignRow}>
                    <Ionicons name="person-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.assignText}>Assigned: {ticket.assignTo}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        ...Shadow.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    ticketNumberWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ticketNumber: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        fontFamily: 'monospace',
    },
    title: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
        marginBottom: 4,
    },
    description: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginBottom: Spacing.md,
    },
    footer: {
        gap: 6,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    metaText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        flexShrink: 1,
    },
    assignRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    assignText: {
        fontSize: FontSize.xs,
        color: Colors.primary,
        fontWeight: FontWeight.medium,
    },
});
