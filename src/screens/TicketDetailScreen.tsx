/**
 * Ticket Detail Screen
 * Full ticket information with admin controls
 * Matches web version: AssignTo, AdminNotes, InformationBy (engineer), Status
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
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Ticket, TicketType, TicketImage } from '../types';
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

const INFORMATION_BY_OPTIONS = [
    { label: 'Select information source', value: '' },
    { label: 'By Walk', value: 'By Walk' },
    { label: 'By Phone', value: 'By Phone' },
    { label: 'By Line', value: 'By Line' },
    { label: 'By E.Work Order/ Paper', value: 'By E.Work Order/ Paper' },
    { label: 'By 60 Points', value: 'By 60 Points' },
    { label: 'By Other', value: 'By Other' },
];

export default function TicketDetailScreen() {
    const route = useRoute<RouteProp<RouteParams, 'TicketDetail'>>();
    const navigation = useNavigation();
    const { isAdmin } = useAuth();
    const { ticketId, ticketType } = route.params;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    // Admin editable fields
    const [adminNotes, setAdminNotes] = useState('');
    const [assignTo, setAssignTo] = useState('');
    const [informationBy, setInformationBy] = useState('');
    const [saving, setSaving] = useState(false);
    const [showInfoPicker, setShowInfoPicker] = useState(false);

    // Image states
    const [userImages, setUserImages] = useState<TicketImage[]>([]);
    const [adminCompletionImages, setAdminCompletionImages] = useState<TicketImage[]>([]);
    const [selectedAdminImages, setSelectedAdminImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
                const result = await api.get(ticketId);
                if (result.success && result.data) {
                    const t = (result.data as { ticket: Ticket }).ticket || result.data;
                    const ticketData = t as Ticket;
                    setTicket(ticketData);
                    setAdminNotes(ticketData.adminNotes || '');
                    setAssignTo(ticketData.assignTo || '');
                    setInformationBy(ticketData.informationBy || '');

                    if (ticketData.images) {
                        setUserImages(ticketData.images.filter(img => !img.isCompletion && !img.is_completion_image));
                        setAdminCompletionImages(ticketData.images.filter(img => img.isCompletion || img.is_completion_image));
                    }
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTicket();
    }, [ticketId, ticketType]);

    const pickImages = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets) {
                setSelectedAdminImages(prev => [...prev, ...result.assets]);
            }
        } catch (error) {
            console.error('Error picking images:', error);
            if (Platform.OS !== 'web') {
                Alert.alert('Error', 'Failed to pick images');
            }
        }
    };

    const removeSelectedImage = (index: number) => {
        setSelectedAdminImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadImages = async () => {
        if (!ticket || selectedAdminImages.length === 0) return;
        setUploadingImages(true);
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const uris = selectedAdminImages.map(asset => {
                const uri = asset.uri;
                const fileName = asset.fileName || uri.split('/').pop() || 'image.jpg';
                const type = asset.mimeType || 'image/jpeg';
                return { uri, name: fileName, type };
            });

            const result = await api.uploadImages(ticket.id, uris, true);
            if (result.success) {
                if (Platform.OS === 'web') alert('Images uploaded successfully!');
                else Alert.alert('Success', 'Images uploaded successfully!');
                setSelectedAdminImages([]);

                const refreshResult = await api.get(ticket.id);
                if (refreshResult.success && refreshResult.data) {
                    const t = (refreshResult.data as { ticket: Ticket }).ticket || refreshResult.data;
                    if (t.images) {
                        setUserImages(t.images.filter(img => !img.isCompletion && !img.is_completion_image));
                        setAdminCompletionImages(t.images.filter(img => img.isCompletion || img.is_completion_image));
                    }
                }
            } else {
                if (Platform.OS === 'web') alert(`Upload failed: ${result.error}`);
                else Alert.alert('Error', `Upload failed: ${result.error}`);
            }
        } catch (error) {
            console.error('Error uploading:', error);
            if (Platform.OS === 'web') alert('Upload failed');
            else Alert.alert('Error', 'Upload failed');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!ticket) return;

        const confirmChange = () => {
            return new Promise<boolean>((resolve) => {
                if (Platform.OS === 'web') {
                    resolve(window.confirm(`Change status to "${getStatusConfig(newStatus).label}"?`));
                } else {
                    Alert.alert(
                        'Update Status',
                        `Change status to "${getStatusConfig(newStatus).label}"?`,
                        [
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Confirm', onPress: () => resolve(true) },
                        ]
                    );
                }
            });
        };

        const confirmed = await confirmChange();
        if (!confirmed) return;

        const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
        const result = await api.update(ticket.id, { status: newStatus });
        if (result.success) {
            setTicket(prev => prev ? { ...prev, status: newStatus } : null);
        }
    };

    const handleSave = async () => {
        if (!ticket) return;

        // Check if anything changed
        const assignToChanged = assignTo !== (ticket.assignTo || '');
        const notesChanged = adminNotes !== (ticket.adminNotes || '');
        const infoByChanged = ticketType === 'engineer' && informationBy !== (ticket.informationBy || '');

        if (!assignToChanged && !notesChanged && !infoByChanged) {
            return; // Nothing changed
        }

        setSaving(true);
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const updateData: Record<string, string> = {
                assignTo,
                adminNotes,
            };
            if (ticketType === 'engineer') {
                updateData.informationBy = informationBy;
            }

            const result = await api.update(ticket.id, updateData);
            if (result.success) {
                // Update local state
                setTicket(prev => prev ? {
                    ...prev,
                    assignTo,
                    adminNotes,
                    ...(ticketType === 'engineer' ? { informationBy } : {}),
                } : null);

                if (Platform.OS === 'web') {
                    // eslint-disable-next-line no-alert
                    alert('Saved successfully!');
                } else {
                    Alert.alert('Success', 'Saved successfully!');
                }
            } else {
                if (Platform.OS === 'web') {
                    alert('Failed to save');
                } else {
                    Alert.alert('Error', 'Failed to save');
                }
            }
        } catch (error) {
            console.error('Error saving:', error);
            if (Platform.OS === 'web') {
                alert('Failed to save');
            } else {
                Alert.alert('Error', 'Failed to save');
            }
        } finally {
            setSaving(false);
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

    const selectedInfoLabel = INFORMATION_BY_OPTIONS.find(o => o.value === informationBy)?.label || 'Select information source';

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

            {/* User Attached Images */}
            {userImages.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        <Ionicons name="images-outline" size={16} color={Colors.primary} /> Attached Images
                    </Text>
                    <View style={styles.imageGrid}>
                        {userImages.map((img, idx) => (
                            <View key={'user-' + (img.id || idx)} style={styles.imageContainer}>
                                <Image source={{ uri: img.imageUrl || img.image_url }} style={styles.imagePreview} />
                                <Text style={styles.imageName} numberOfLines={1}>{img.imageName || img.image_url?.split('/').pop() || 'Image'}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

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
                </View>
            </View>

            {/* Admin Actions Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    <Ionicons name="settings-outline" size={16} color={Colors.primary} />
                    {' '}{isAdmin ? 'Admin Actions' : 'Ticket Info'}
                </Text>
                <View style={styles.adminCard}>

                    {/* Assign To */}
                    <View style={styles.adminField}>
                        <Text style={styles.adminFieldLabel}>
                            <Ionicons name="person-add-outline" size={14} color={Colors.primary} /> Assign To:
                        </Text>
                        {isAdmin ? (
                            <TextInput
                                style={styles.adminInput}
                                value={assignTo}
                                onChangeText={setAssignTo}
                                placeholder="Type assignee name..."
                                placeholderTextColor={Colors.textTertiary}
                            />
                        ) : (
                            <View style={styles.readOnlyField}>
                                <Text style={styles.readOnlyText}>
                                    {ticket.assignTo || 'Not assigned yet'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Admin Notes */}
                    <View style={styles.adminField}>
                        <Text style={styles.adminFieldLabel}>
                            <Ionicons name="create-outline" size={14} color={Colors.primary} />
                            {' '}{isAdmin ? 'Admin Notes:' : 'Notes from Admin:'}
                        </Text>
                        {isAdmin ? (
                            <TextInput
                                style={[styles.adminInput, styles.notesInput]}
                                value={adminNotes}
                                onChangeText={setAdminNotes}
                                placeholder="Add internal notes here..."
                                placeholderTextColor={Colors.textTertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        ) : (
                            <View style={styles.readOnlyField}>
                                <Text style={[styles.readOnlyText, !ticket.adminNotes && { color: Colors.textTertiary }]}>
                                    {ticket.adminNotes || 'No notes from admin yet'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Information By (Engineer tickets only) */}
                    {ticketType === 'engineer' && (
                        <View style={styles.adminField}>
                            <Text style={styles.adminFieldLabel}>
                                <Ionicons name="information-circle-outline" size={14} color={Colors.primary} /> Information By:
                            </Text>
                            {isAdmin ? (
                                <View>
                                    <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => setShowInfoPicker(!showInfoPicker)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[
                                            styles.pickerButtonText,
                                            !informationBy && { color: Colors.textTertiary }
                                        ]}>
                                            {selectedInfoLabel}
                                        </Text>
                                        <Ionicons
                                            name={showInfoPicker ? 'chevron-up' : 'chevron-down'}
                                            size={18}
                                            color={Colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                    {showInfoPicker && (
                                        <View style={styles.pickerDropdown}>
                                            {INFORMATION_BY_OPTIONS.map((option) => (
                                                <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                        styles.pickerOption,
                                                        informationBy === option.value && styles.pickerOptionActive,
                                                    ]}
                                                    onPress={() => {
                                                        setInformationBy(option.value);
                                                        setShowInfoPicker(false);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.pickerOptionText,
                                                        informationBy === option.value && styles.pickerOptionTextActive,
                                                        !option.value && { color: Colors.textTertiary },
                                                    ]}>
                                                        {option.label}
                                                    </Text>
                                                    {informationBy === option.value && (
                                                        <Ionicons name="checkmark" size={16} color={Colors.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.readOnlyField}>
                                    <Text style={[styles.readOnlyText, !ticket.informationBy && { color: Colors.textTertiary }]}>
                                        {ticket.informationBy || 'Not specified'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Save Button (Admin only) */}
                    {isAdmin && (
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.7}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                            )}
                            <Text style={styles.saveButtonText}>
                                {saving ? 'Saving...' : 'Save'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Last Updated */}
                    {ticket.updatedAt && (
                        <Text style={styles.lastUpdated}>
                            Last updated: {new Date(ticket.updatedAt).toLocaleString()}
                        </Text>
                    )}

                    {/* Admin Image Pick/Upload Section */}
                    {isAdmin && (
                        <View style={styles.imageUploadSection}>
                            <Text style={styles.adminFieldLabel}>
                                <Ionicons name="images-outline" size={14} color={Colors.primary} /> Upload Completion Images
                            </Text>
                            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} activeOpacity={0.7}>
                                <Ionicons name="cloud-upload-outline" size={18} color={Colors.white} />
                                <Text style={styles.uploadBtnText}>Select Images</Text>
                            </TouchableOpacity>

                            {selectedAdminImages.length > 0 && (
                                <View style={styles.selectedImagesContainer}>
                                    <Text style={[styles.adminFieldLabel, { marginTop: Spacing.md }]}>Selected ({selectedAdminImages.length})</Text>
                                    <View style={styles.imageGrid}>
                                        {selectedAdminImages.map((asset, index) => (
                                            <View key={'sel-' + index} style={styles.imageContainer}>
                                                <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
                                                <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeSelectedImage(index)}>
                                                    <Ionicons name="close" size={14} color={Colors.white} />
                                                </TouchableOpacity>
                                                <Text style={styles.imageName} numberOfLines={1}>{asset.fileName || 'Image'}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <TouchableOpacity style={[styles.saveButton, { marginTop: Spacing.md }, uploadingImages && styles.saveButtonDisabled]} onPress={handleUploadImages} disabled={uploadingImages}>
                                        {uploadingImages ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="cloud-upload" size={18} color={Colors.white} />}
                                        <Text style={styles.saveButtonText}>{uploadingImages ? 'Uploading...' : 'Upload Images'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Admin Completion Images View */}
                    {adminCompletionImages.length > 0 && (
                        <View style={styles.completionImagesSection}>
                            <Text style={[styles.adminFieldLabel, { marginTop: Spacing.md }]}>
                                <Ionicons name="images" size={14} color={Colors.primary} /> Completion Images
                            </Text>
                            <View style={styles.imageGrid}>
                                {adminCompletionImages.map((img, idx) => (
                                    <View key={'admin-' + (img.id || idx)} style={styles.imageContainer}>
                                        <Image source={{ uri: img.imageUrl || img.image_url }} style={styles.imagePreview} />
                                        <Text style={styles.imageName} numberOfLines={1}>{img.imageName || img.image_url?.split('/').pop() || 'Image'}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
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

    // Admin Actions Section
    adminCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        ...Shadow.sm,
    },
    adminField: {
        marginBottom: Spacing.lg,
    },
    adminFieldLabel: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    adminInput: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    notesInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    readOnlyField: {
        backgroundColor: Colors.primaryBg,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    readOnlyText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },

    // Information By Picker
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    pickerButtonText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    pickerDropdown: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        overflow: 'hidden',
        ...Shadow.md,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    pickerOptionActive: {
        backgroundColor: Colors.primaryBg,
    },
    pickerOptionText: {
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    pickerOptionTextActive: {
        color: Colors.primary,
        fontWeight: FontWeight.semibold,
    },

    // Save Button
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
        ...Shadow.sm,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.white,
    },
    lastUpdated: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        marginTop: Spacing.md,
        textAlign: 'right',
    },

    // Status Buttons
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
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    imageContainer: {
        width: '30%',
        aspectRatio: 1,
        position: 'relative',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderLight,
        backgroundColor: Colors.background,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: Colors.error,
        borderRadius: BorderRadius.full,
        padding: 4,
    },
    imageName: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        color: Colors.white,
        fontSize: 10,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    imageUploadSection: {
        marginTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.lg,
    },
    uploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.textSecondary,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    uploadBtnText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: FontWeight.medium,
    },
    selectedImagesContainer: {
        marginTop: Spacing.md,
    },
    completionImagesSection: {
        marginTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: Spacing.lg,
    },
});
