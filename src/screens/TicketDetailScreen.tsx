/**
 * Ticket Detail Screen
 * Full ticket information with admin controls
 */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Ticket, TicketType } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingAndEmpty';
import { useAuth } from '../contexts/AuthContext';
import { getStatusConfig } from '../constants';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

type RouteParams = {
    TicketDetail: {
        ticketId: string;
        ticketType: TicketType;
    };
};

interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={18} color={Colors.primary} />
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value || 'N/A'}</Text>
            </View>
        </View>
    );
}

export default function TicketDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, 'TicketDetail'>>();
    const navigation = useNavigation();
    const { isAdmin } = useAuth();
    const { ticketId, ticketType } = route.params;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [adminNotes, setAdminNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
                const result = await api.get(ticketId);
                if (result.success && result.data) {
                    const t = (result.data as { ticket: Ticket }).ticket || result.data;
                    setTicket(t as Ticket);
                    setAdminNotes((t as Ticket).adminNotes || '');
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [ticketId, ticketType]);

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket) return;

        Alert.alert(
            'Update Status',
            `Change status to "${getStatusConfig(newStatus).label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
                        const result = await api.update(ticket.id, { status: newStatus });
                        if (result.success) {
                            setTicket(prev => prev ? { ...prev, status: newStatus } : null);
                        }
                    },
                },
            ]
        );
    };

    const handleSaveNotes = async () => {
        if (!ticket) return;
        const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
        const result = await api.update(ticket.id, { adminNotes });
        if (result.success) {
            setTicket(prev => prev ? { ...prev, adminNotes } : null);
            setIsEditing(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen message="Loading ticket..." />;
    }

    if (!ticket) {
        return (
            <View style={styles.notFound}>
                <Ionicons name="document-text-outline" size={64} color={Colors.textTertiary} />
                <Text style={styles.notFoundText}>Ticket not found</Text>
            </View>
        );
    }

    const formattedDate = new Date(ticket.createdAt).toLocaleDateString('th-TH', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    const formattedTime = new Date(ticket.createdAt).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const typePrefix = ticketType === 'it' ? 'IT' : 'Engineer';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <View style={styles.ticketNumberWrap}>
                        <Ionicons name="document-text" size={18} color={Colors.primary} />
                        <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                    </View>
                    <StatusBadge status={ticket.status} size="lg" />
                </View>

                <View style={styles.typeBadge}>
                    <Ionicons
                        name={ticketType === 'it' ? 'desktop-outline' : 'construct-outline'}
                        size={12}
                        color={Colors.primary}
                    />
                    <Text style={styles.typeBadgeText}>{typePrefix} Ticket</Text>
                </View>

                <Text style={styles.ticketTitle}>{ticket.title || 'No location specified'}</Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <Ionicons name="chatbox-outline" size={16} color={Colors.primary} /> Description
                </Text>
                <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionText}>
                        {ticket.description || 'No description provided'}
                    </Text>
                </View>
            </View>

            {/* Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <Ionicons name="information-circle-outline" size={16} color={Colors.primary} /> Details
                </Text>
                <View style={styles.detailsCard}>
                    <InfoRow icon="business-outline" label="Department" value={ticket.department || 'N/A'} />
                    <InfoRow icon="location-outline" label="Area" value={ticket.location || 'N/A'} />
                    <InfoRow icon="construct-outline" label="Type of Damage" value={ticket.typeOfDamage} />
                    <InfoRow icon="person-outline" label="Reported By" value={ticket.user?.username || 'Unknown'} />
                    <InfoRow icon="calendar-outline" label="Created" value={`${formattedDate} ${formattedTime}`} />
                    {ticket.assignTo && (
                        <InfoRow icon="person-circle-outline" label="Assigned To" value={ticket.assignTo} />
                    )}
                </View>
            </View>

            {/* Admin Notes */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="create-outline" size={16} color={Colors.primary} /> Admin Notes
                    </Text>
                    {isAdmin && !isEditing && (
                        <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
                            <Ionicons name="pencil" size={14} color={Colors.primary} />
                            <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {isEditing ? (
                    <View style={styles.editContainer}>
                        <TextInput
                            style={styles.notesInput}
                            value={adminNotes}
                            onChangeText={setAdminNotes}
                            multiline
                            numberOfLines={4}
                            placeholder="Enter admin notes..."
                            placeholderTextColor={Colors.textTertiary}
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setAdminNotes(ticket.adminNotes || '');
                                    setIsEditing(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNotes}>
                                <Ionicons name="checkmark" size={16} color={Colors.white} />
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.notesBox}>
                        <Text style={[styles.notesText, !ticket.adminNotes && { color: Colors.textTertiary }]}>
                            {ticket.adminNotes || 'No admin notes yet'}
                        </Text>
                    </View>
                )}
            </View>

            {/* Status Update Buttons (Admin only) */}
            {isAdmin && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="swap-horizontal-outline" size={16} color={Colors.primary} /> Update Status
                    </Text>
                    <View style={styles.statusButtons}>
                        {['NEW', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCEL'].map((status) => {
                            const config = getStatusConfig(status);
                            const isCurrentStatus = ticket.status === status;
                            return (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusButton,
                                        { backgroundColor: isCurrentStatus ? config.bgColor : Colors.white, borderColor: config.color },
                                        isCurrentStatus && { borderWidth: 2 },
                                    ]}
                                    onPress={() => handleStatusChange(status)}
                                    disabled={isCurrentStatus}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.statusButtonText, { color: config.textColor }]}>
                                        {config.label}
                                    </Text>
                                    {isCurrentStatus && (
                                        <Ionicons name="checkmark-circle" size={14} color={config.color} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerCard: {
        backgroundColor: Colors.white,
        margin: Spacing.lg,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        ...Shadow.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    ticketNumberWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    ticketNumber: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        color: Colors.primary,
        fontFamily: 'monospace',
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryBg,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
        alignSelf: 'flex-start',
        marginBottom: Spacing.sm,
    },
    typeBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.primary,
    },
    ticketTitle: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
    },
    section: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    descriptionBox: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    descriptionText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    detailsCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.textTertiary,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.text,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        backgroundColor: Colors.primaryBg,
        borderRadius: BorderRadius.sm,
        marginBottom: Spacing.md,
    },
    editButtonText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.primary,
    },
    editContainer: {
        gap: Spacing.md,
    },
    notesInput: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primary,
        fontSize: FontSize.sm,
        color: Colors.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
    },
    cancelButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelButtonText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: FontWeight.medium,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.primary,
    },
    saveButtonText: {
        fontSize: FontSize.sm,
        color: Colors.white,
        fontWeight: FontWeight.medium,
    },
    notesBox: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notesText: {
        fontSize: FontSize.sm,
        color: Colors.text,
        lineHeight: 22,
    },
    statusButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    statusButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: Spacing.md,
    },
    notFoundText: {
        fontSize: FontSize.lg,
        color: Colors.textSecondary,
    },
});
