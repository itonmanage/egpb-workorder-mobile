/**
 * Create Ticket Screen
 * - Receives ticketType from navigation params
 * - Supports image attachment via camera/gallery
 * - Scrollable dropdown pickers
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Alert, ActivityIndicator, Image,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';
import { TicketType } from '../types';
import { DEPARTMENTS, getDamageTypes, getAreas } from '../constants';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

// Scrollable Dropdown Picker component
function DropdownPicker({ label, required, value, placeholder, options, visible, onToggle, onSelect }: {
    label: string; required?: boolean; value: string; placeholder: string;
    options: readonly string[]; visible: boolean;
    onToggle: () => void; onSelect: (v: string) => void;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label} {required && <Text style={styles.req}>*</Text>}</Text>
            <TouchableOpacity style={[styles.picker, visible && styles.pickerOpen]} onPress={onToggle}>
                <Text style={[styles.pickerText, !value && { color: Colors.textTertiary }]}>{value || placeholder}</Text>
                <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            {visible && (
                <ScrollView style={styles.optionsList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    {options.map((opt) => (
                        <TouchableOpacity key={opt} style={[styles.optionItem, value === opt && styles.optionActive]}
                            onPress={() => onSelect(opt)}>
                            <Text style={[styles.optionText, value === opt && { color: Colors.primary, fontWeight: '600' }]}>{opt}</Text>
                            {value === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

// Image attachment item type
interface ImageAttachment {
    uri: string;
    fileName?: string;
}

export default function CreateTicketScreen({ route }: any) {
    const navigation = useNavigation();
    const ticketType: TicketType = route?.params?.ticketType || 'engineer';
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('');
    const [area, setArea] = useState('');
    const [damageType, setDamageType] = useState('');
    const [images, setImages] = useState<ImageAttachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDept, setShowDept] = useState(false);
    const [showArea, setShowArea] = useState(false);
    const [showDamage, setShowDamage] = useState(false);

    // Close all dropdowns
    const closeAllDropdowns = () => {
        setShowDept(false);
        setShowArea(false);
        setShowDamage(false);
    };

    // Image picker - from gallery
    const pickFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to attach images.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.6,
            selectionLimit: 10 - images.length,
        });
        if (!result.canceled && result.assets) {
            const newImages = result.assets.map(asset => ({
                uri: asset.uri,
                fileName: asset.fileName || `image_${Date.now()}.jpg`,
            }));
            setImages(prev => [...prev, ...newImages].slice(0, 10));
        }
    };

    // Image picker - from camera
    const pickFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow camera access to take photos.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.6,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setImages(prev => [...prev, {
                uri: asset.uri,
                fileName: asset.fileName || `photo_${Date.now()}.jpg`,
            }].slice(0, 10));
        }
    };

    const isImageLimitReached = images.length >= 10;

    // Remove image
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title.trim()) return Alert.alert('Validation', 'Please enter a location/title');
        if (!description.trim()) return Alert.alert('Validation', 'Please enter a description');
        if (!damageType) return Alert.alert('Validation', 'Please select type of damage');
        setLoading(true);
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const result = await api.create({
                title: title.trim(),
                description: description.trim(),
                department,
                area,
                location: area,
                typeOfDamage: damageType,
                // images would be sent via FormData in real API mode
            });
            if (result.success) {
                Alert.alert('Success ✅', 'Ticket created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else { Alert.alert('Error', result.error || 'Failed'); }
        } catch { Alert.alert('Error', 'Network error'); }
        finally { setLoading(false); }
    };

    const handleReset = () => {
        setTitle('');
        setDescription('');
        setDepartment('');
        setArea('');
        setDamageType('');
        setImages([]);
        closeAllDropdowns();
    };

    const typeLabel = ticketType === 'it' ? 'IT' : 'Engineer';
    const typeIcon = ticketType === 'it' ? 'desktop' : 'construct';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
            {/* Type indicator banner */}
            <View style={styles.typeBanner}>
                <Ionicons name={typeIcon as any} size={20} color={Colors.primary} />
                <Text style={styles.typeBannerText}>Creating {typeLabel} Ticket</Text>
            </View>
            <View style={styles.formCard}>
                {/* Title */}
                <View style={styles.field}>
                    <Text style={styles.label}>Location / Title <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} value={title} onChangeText={(t) => setTitle(t.slice(0, 200))} placeholder="e.g., Room 301 - WiFi Issue" placeholderTextColor={Colors.textTertiary} maxLength={200} />
                </View>

                {/* Description */}
                <View style={styles.field}>
                    <Text style={styles.label}>Description <Text style={styles.req}>*</Text></Text>
                    <TextInput
                        style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                        value={description} onChangeText={(t) => setDescription(t.slice(0, 2000))}
                        placeholder="Describe the issue..."
                        placeholderTextColor={Colors.textTertiary}
                        multiline numberOfLines={4}
                        maxLength={2000}
                    />
                    <Text style={[styles.charCount, description.length >= 1900 && { color: Colors.error }]}>
                        {description.length}/2000
                    </Text>
                </View>

                {/* Dropdowns */}
                <DropdownPicker
                    label="Department" value={department} placeholder="Select department"
                    options={DEPARTMENTS} visible={showDept}
                    onToggle={() => { closeAllDropdowns(); setShowDept(!showDept); }}
                    onSelect={(v) => { setDepartment(v); setShowDept(false); }}
                />
                <DropdownPicker
                    label="Area" value={area} placeholder="Select area"
                    options={getAreas(ticketType)} visible={showArea}
                    onToggle={() => { closeAllDropdowns(); setShowArea(!showArea); }}
                    onSelect={(v) => { setArea(v); setShowArea(false); }}
                />
                <DropdownPicker
                    label="Type of Damage" required value={damageType} placeholder="Select damage type"
                    options={getDamageTypes(ticketType)} visible={showDamage}
                    onToggle={() => { closeAllDropdowns(); setShowDamage(!showDamage); }}
                    onSelect={(v) => { setDamageType(v); setShowDamage(false); }}
                />

                {/* Image Attachment */}
                <View style={styles.field}>
                    <Text style={styles.label}>Attach Images</Text>
                    <Text style={styles.imageHint}>{images.length}/10 images • JPG, PNG</Text>

                    {/* Image previews */}
                    {images.length > 0 && (
                        <View style={styles.imageGrid}>
                            {images.map((img, index) => (
                                <View key={index} style={styles.imageThumbWrap}>
                                    <Image source={{ uri: img.uri }} style={styles.imageThumb} />
                                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Camera / Gallery buttons */}
                    <View style={styles.imageButtonRow}>
                        <TouchableOpacity
                            style={[styles.imageSourceBtn, styles.cameraBtn, isImageLimitReached && styles.imageSourceBtnDisabled]}
                            onPress={pickFromCamera}
                            disabled={isImageLimitReached}
                            activeOpacity={0.75}
                        >
                            <View style={styles.imageSourceIcon}>
                                <Ionicons name="camera" size={26} color={isImageLimitReached ? Colors.textTertiary : Colors.white} />
                            </View>
                            <Text style={[styles.imageSourceLabel, isImageLimitReached && { color: Colors.textTertiary }]}>
                                Camera
                            </Text>
                            <Text style={[styles.imageSourceSub, isImageLimitReached && { color: Colors.textTertiary }]}>
                                ถ่ายรูปใหม่
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.imageSourceBtn, styles.galleryBtn, isImageLimitReached && styles.imageSourceBtnDisabled]}
                            onPress={pickFromGallery}
                            disabled={isImageLimitReached}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.imageSourceIcon, { backgroundColor: Colors.primaryBg }]}>
                                <Ionicons name="images" size={26} color={isImageLimitReached ? Colors.textTertiary : Colors.primary} />
                            </View>
                            <Text style={[styles.imageSourceLabel, { color: isImageLimitReached ? Colors.textTertiary : Colors.primary }]}>
                                Gallery
                            </Text>
                            <Text style={[styles.imageSourceSub, { color: isImageLimitReached ? Colors.textTertiary : Colors.textSecondary }]}>
                                เลือกจากคลัง
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {isImageLimitReached && (
                        <Text style={styles.limitText}>ครบจำนวนสูงสุด 10 รูปแล้ว</Text>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                        <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
                        <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                        {loading ? <ActivityIndicator size="small" color={Colors.white} /> : <>
                            <Ionicons name="send" size={18} color={Colors.white} />
                            <Text style={{ fontSize: FontSize.md, fontWeight: '600', color: Colors.white }}>Create Ticket</Text>
                        </>}
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    typeBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.sm,
        backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
        borderWidth: 1, borderColor: Colors.primaryBorder,
    },
    typeBannerText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
    formCard: {
        backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl,
        padding: Spacing.xl, borderWidth: 1, borderColor: Colors.primaryBorder, ...Shadow.sm,
    },
    field: { marginBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },
    req: { color: Colors.error },
    input: {
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        fontSize: FontSize.sm, color: Colors.text,
    },
    charCount: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 },
    picker: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
        borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    pickerOpen: {
        borderColor: Colors.primary, borderWidth: 2,
    },
    pickerText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
    optionsList: {
        backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
        borderRadius: BorderRadius.md, marginTop: Spacing.sm, maxHeight: 180,
    },
    optionItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    },
    optionActive: { backgroundColor: Colors.primaryBg },
    optionText: { fontSize: FontSize.sm, color: Colors.text },
    // Image attachment styles
    imageHint: {
        fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.sm,
    },
    imageGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md,
    },
    imageThumbWrap: {
        position: 'relative', width: 80, height: 80,
    },
    imageThumb: {
        width: 80, height: 80, borderRadius: BorderRadius.md, backgroundColor: Colors.background,
    },
    removeImageBtn: {
        position: 'absolute', top: -6, right: -6, backgroundColor: Colors.white, borderRadius: 12,
    },
    imageButtonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    imageSourceBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl,
        borderRadius: BorderRadius.lg,
        gap: 6,
        ...Shadow.sm,
    },
    imageSourceBtnDisabled: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowOpacity: 0,
        elevation: 0,
    },
    cameraBtn: {
        backgroundColor: Colors.primary,
    },
    galleryBtn: {
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.primaryBorder,
    },
    imageSourceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    imageSourceLabel: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    imageSourceSub: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.8)',
    },
    limitText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    // Action buttons
    actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    resetBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border,
    },
    submitBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, ...Shadow.md,
    },
});
