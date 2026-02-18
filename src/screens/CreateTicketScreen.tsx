/**
 * Create Ticket Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { TicketType } from '../types';
import { DEPARTMENTS, getDamageTypes, getAreas } from '../constants';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

function DropdownPicker({ label, required, value, placeholder, options, visible, onToggle, onSelect }: {
    label: string; required?: boolean; value: string; placeholder: string;
    options: readonly string[]; visible: boolean;
    onToggle: () => void; onSelect: (v: string) => void;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label} {required && <Text style={styles.req}>*</Text>}</Text>
            <TouchableOpacity style={styles.picker} onPress={onToggle}>
                <Text style={[styles.pickerText, !value && { color: Colors.textTertiary }]}>{value || placeholder}</Text>
                <Ionicons name={visible ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            {visible && (
                <View style={styles.optionsList}>
                    {options.map((opt) => (
                        <TouchableOpacity key={opt} style={[styles.optionItem, value === opt && styles.optionActive]}
                            onPress={() => onSelect(opt)}>
                            <Text style={[styles.optionText, value === opt && { color: Colors.primary, fontWeight: '600' }]}>{opt}</Text>
                            {value === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

export default function CreateTicketScreen() {
    const navigation = useNavigation();
    const [ticketType, setTicketType] = useState<TicketType>('it');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('');
    const [area, setArea] = useState('');
    const [damageType, setDamageType] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDept, setShowDept] = useState(false);
    const [showArea, setShowArea] = useState(false);
    const [showDamage, setShowDamage] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return Alert.alert('Validation', 'Please enter a location/title');
        if (!description.trim()) return Alert.alert('Validation', 'Please enter a description');
        if (!damageType) return Alert.alert('Validation', 'Please select type of damage');
        setLoading(true);
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const result = await api.create({ title: title.trim(), description: description.trim(), department, area, location: area, typeOfDamage: damageType });
            if (result.success) {
                Alert.alert('Success ✅', 'Ticket created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } else { Alert.alert('Error', result.error || 'Failed'); }
        } catch { Alert.alert('Error', 'Network error'); }
        finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.typeSwitcher}>
                {(['it', 'engineer'] as TicketType[]).map(t => (
                    <TouchableOpacity key={t} style={[styles.typeBtn, ticketType === t && styles.typeBtnActive]}
                        onPress={() => { setTicketType(t); setDamageType(''); setArea(''); }}>
                        <Ionicons name={t === 'it' ? 'desktop-outline' : 'construct-outline'} size={18} color={ticketType === t ? Colors.white : Colors.primary} />
                        <Text style={[styles.typeBtnText, ticketType === t && { color: Colors.white }]}>{t === 'it' ? 'IT Ticket' : 'Engineer'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.formCard}>
                <View style={styles.field}>
                    <Text style={styles.label}>Location / Title <Text style={styles.req}>*</Text></Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g., Room 301 - WiFi Issue" placeholderTextColor={Colors.textTertiary} />
                </View>
                <View style={styles.field}>
                    <Text style={styles.label}>Description <Text style={styles.req}>*</Text></Text>
                    <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Describe the issue..." placeholderTextColor={Colors.textTertiary} multiline numberOfLines={4} />
                    <Text style={styles.charCount}>{description.length}/2000</Text>
                </View>
                <DropdownPicker label="Department" value={department} placeholder="Select department" options={DEPARTMENTS} visible={showDept} onToggle={() => setShowDept(!showDept)} onSelect={(v) => { setDepartment(v); setShowDept(false); }} />
                <DropdownPicker label="Area" value={area} placeholder="Select area" options={getAreas(ticketType)} visible={showArea} onToggle={() => setShowArea(!showArea)} onSelect={(v) => { setArea(v); setShowArea(false); }} />
                <DropdownPicker label="Type of Damage" required value={damageType} placeholder="Select damage type" options={getDamageTypes(ticketType)} visible={showDamage} onToggle={() => setShowDamage(!showDamage)} onSelect={(v) => { setDamageType(v); setShowDamage(false); }} />
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.resetBtn} onPress={() => { setTitle(''); setDescription(''); setDepartment(''); setArea(''); setDamageType(''); }}>
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
    typeSwitcher: { flexDirection: 'row', margin: Spacing.lg, backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.lg, padding: 4, gap: 4 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: BorderRadius.md },
    typeBtnActive: { backgroundColor: Colors.primary, ...Shadow.sm },
    typeBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
    formCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.primaryBorder, ...Shadow.sm },
    field: { marginBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: Spacing.sm },
    req: { color: Colors.error },
    input: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: FontSize.sm, color: Colors.text },
    charCount: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 },
    picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    pickerText: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
    optionsList: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, marginTop: Spacing.sm, maxHeight: 200 },
    optionItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    optionActive: { backgroundColor: Colors.primaryBg },
    optionText: { fontSize: FontSize.sm, color: Colors.text },
    actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border },
    submitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, ...Shadow.md },
});
