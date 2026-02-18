/**
 * Profile Screen - User info, stats, logout
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABELS } from '../constants';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

export default function ProfileScreen() {
    const { user, isAdmin, logout } = useAuth();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const roleLabel = user?.role ? (ROLE_LABELS[user.role] || user.role) : 'User';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    {isAdmin && (
                        <View style={styles.adminIndicator}>
                            <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                        </View>
                    )}
                </View>
                <Text style={styles.username}>{user?.username || 'User'}</Text>
                <View style={styles.roleBadge}>
                    <Ionicons name="ribbon-outline" size={14} color={Colors.primary} />
                    <Text style={styles.roleText}>{roleLabel}</Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Account Information</Text>
                <View style={styles.infoItem}>
                    <Ionicons name="person-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Username</Text>
                        <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                    <Ionicons name="shield-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Role</Text>
                        <Text style={styles.infoValue}>{roleLabel}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                    <Ionicons name="business-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Department</Text>
                        <Text style={styles.infoValue}>{user?.department || 'N/A'}</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                    <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
                    </View>
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Stats</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                            <Ionicons name="document-text" size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.statNumber}>15</Text>
                        <Text style={styles.statLabel}>Total Tickets</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#fef9c3' }]}>
                            <Ionicons name="time" size={20} color="#eab308" />
                        </View>
                        <Text style={styles.statNumber}>3</Text>
                        <Text style={styles.statLabel}>In Progress</Text>
                    </View>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                        </View>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Resolved</Text>
                    </View>
                </View>
            </View>

            {/* App Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>App Information</Text>
                <View style={styles.infoItem}>
                    <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoItem}>
                    <Ionicons name="server-outline" size={20} color={Colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Mode</Text>
                        <Text style={styles.infoValue}>Demo (Mock Data)</Text>
                    </View>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.footer}>© 2025 EGPB Ticket System v1.0.0</Text>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    profileHeader: { alignItems: 'center', paddingTop: Spacing.xxl, paddingBottom: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    avatarContainer: { position: 'relative', marginBottom: Spacing.md },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...Shadow.md },
    avatarText: { fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white },
    adminIndicator: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.white },
    username: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryBg, paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: BorderRadius.full, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.primaryBorder },
    roleText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.primary },
    card: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.primaryBorder, ...Shadow.sm },
    cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.lg },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: 2 },
    infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },
    statsGrid: { flexDirection: 'row', gap: Spacing.md },
    statItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.md },
    statIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
    statNumber: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginHorizontal: Spacing.lg, marginTop: Spacing.xl, paddingVertical: Spacing.lg, backgroundColor: Colors.errorBg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.errorBorder },
    logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.error },
    footer: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.xl },
});
