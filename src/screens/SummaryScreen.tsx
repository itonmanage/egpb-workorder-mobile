/**
 * Summary Report Screen
 * Fetches real data from API (same endpoint as web version)
 * Shows ticket statistics, status breakdown, damage type, and department table
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketType, SummaryStats, DepartmentStatusRow } from '../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import apiService from '../services/api';

const screenWidth = Dimensions.get('window').width;

// Status colors matching web app
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    NEW: { label: 'New', color: '#3B82F6', bgColor: '#EFF6FF' },
    IN_PROGRESS: { label: 'On Process', color: '#F59E0B', bgColor: '#FFFBEB' },
    ON_HOLD: { label: 'On Hold', color: '#F97316', bgColor: '#FFF7ED' },
    DONE: { label: 'Done', color: '#10B981', bgColor: '#ECFDF5' },
    CANCEL: { label: 'Cancel', color: '#EF4444', bgColor: '#FEF2F2' },
};

// Simple progress bar
function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
    const width = total > 0 ? (value / total) * 100 : 0;
    return (
        <View style={pbStyles.track}>
            <View style={[pbStyles.fill, { width: `${width}%`, backgroundColor: color }]} />
        </View>
    );
}
const pbStyles = StyleSheet.create({
    track: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, flex: 1, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
});

export default function SummaryScreen({ route }: any) {
    const ticketType: TicketType = route?.params?.ticketType || 'engineer';
    const isIT = ticketType === 'it';
    const typeLabel = isIT ? 'IT' : 'Engineer';
    const apiType = isIT ? 'IT' : 'ENGINEER';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<SummaryStats | null>(null);

    // Fetch data from API (same endpoint as web version)
    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await apiService.stats.summary({ type: apiType });
                if (result.success && result.data) {
                    setStats(result.data as unknown as SummaryStats);
                } else {
                    setError(result.error || 'Failed to load summary data');
                }
            } catch (err) {
                setError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [apiType]);

    // Get the department breakdown based on ticket type
    const deptBreakdown: DepartmentStatusRow[] = useMemo(() => {
        if (!stats) return [];
        return (isIT ? stats.itDepartmentStatusBreakdown : stats.departmentStatusBreakdown) || [];
    }, [stats, isIT]);

    const totalTickets = stats?.totalTickets || 0;

    // Status counts from statusBreakdown
    const statusCounts = useMemo(() => {
        if (!stats) return { NEW: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0, CANCEL: 0 };
        const map: Record<string, number> = {};
        stats.statusBreakdown.forEach(s => { map[s.status] = s.count; });
        return {
            NEW: map.NEW || 0,
            IN_PROGRESS: map.IN_PROGRESS || 0,
            ON_HOLD: map.ON_HOLD || 0,
            DONE: map.DONE || 0,
            CANCEL: map.CANCEL || 0,
        };
    }, [stats]);

    const totalStatusCount = useMemo(() => {
        return Object.values(statusCounts).reduce((a, b) => a + b, 0);
    }, [statusCounts]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading summary...</Text>
            </View>
        );
    }

    if (error || !stats) {
        return (
            <View style={styles.centered}>
                <Ionicons name="warning" size={48} color={Colors.error} />
                <Text style={styles.errorText}>{error || 'No data available'}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Type Banner */}
            <View style={[styles.typeBanner, { borderColor: isIT ? Colors.primaryBorder : '#E0E7FF' }]}>
                <Ionicons name={isIT ? 'desktop' : 'construct'} size={20} color={isIT ? Colors.primary : '#6366F1'} />
                <Text style={[styles.typeBannerText, { color: isIT ? Colors.primary : '#6366F1' }]}>
                    {typeLabel} Dashboard Report
                </Text>
            </View>

            {/* Quick Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: '#3B82F6' }]}>
                    <Ionicons name="bar-chart" size={22} color="#3B82F6" />
                    <Text style={styles.statNumber}>{stats.totalTickets.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Tickets</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                    <Ionicons name="checkmark-done" size={22} color="#10B981" />
                    <Text style={styles.statNumber}>{stats.thisMonthTickets.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Done (MTD)</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
                    <Ionicons name="trending-up" size={22} color="#8B5CF6" />
                    <Text style={styles.statNumber}>{stats.lastMonthTickets.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Last Month</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
                    <Ionicons name="calendar" size={22} color="#F59E0B" />
                    <Text style={styles.statNumber}>{stats.yearToDateTickets.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Year-to-Date</Text>
                </View>
            </View>

            {/* Status Breakdown */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pie-chart" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Tickets by Status</Text>
                    <Text style={styles.sectionSubtitle}>Total: {totalStatusCount.toLocaleString()}</Text>
                </View>
                <View style={styles.card}>
                    {stats.statusBreakdown.map(item => {
                        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.NEW;
                        const pct = totalStatusCount > 0 ? ((item.count / totalStatusCount) * 100).toFixed(1) : '0.0';
                        return (
                            <View key={item.status} style={styles.statusRow}>
                                <View style={styles.statusRowLeft}>
                                    <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                    <Text style={styles.statusName}>{config.label}</Text>
                                </View>
                                <ProgressBar value={item.count} total={totalStatusCount} color={config.color} />
                                <View style={styles.statusRowRight}>
                                    <Text style={[styles.statusCount, { color: config.color }]}>{item.count}</Text>
                                    <Text style={styles.statusPct}>({pct}%)</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Damage Type Breakdown */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="shield" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Top Damage Types</Text>
                </View>
                <View style={styles.card}>
                    {stats.typeBreakdown && stats.typeBreakdown.length > 0 ? stats.typeBreakdown.map((item, i) => {
                        const maxCount = stats.typeBreakdown[0]?.count || 1;
                        const pct = totalTickets > 0 ? (item.count / totalTickets * 100).toFixed(1) : '0.0';
                        return (
                            <View key={item.type} style={styles.damageRow}>
                                <View style={styles.damageRank}>
                                    <Text style={styles.damageRankText}>{i + 1}</Text>
                                </View>
                                <View style={styles.damageInfo}>
                                    <Text style={styles.damageName} numberOfLines={1}>{item.type}</Text>
                                    <ProgressBar value={item.count} total={maxCount} color={Colors.primary} />
                                </View>
                                <View style={styles.damageCount}>
                                    <Text style={styles.damageCountText}>{item.count}</Text>
                                    <Text style={styles.damagePct}>{pct}%</Text>
                                </View>
                            </View>
                        );
                    }) : (
                        <Text style={styles.emptyText}>No data available</Text>
                    )}
                </View>
            </View>

            {/* Department by Status Table */}
            {deptBreakdown.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="business" size={20} color={Colors.text} />
                        <Text style={styles.sectionTitle}>Department by Status</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
                        <View>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { width: 120 }]}>Department</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 60, color: '#3B82F6' }]}>New</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 75, color: '#F59E0B' }]}>Process</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 60, color: '#F97316' }]}>Hold</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 60, color: '#10B981' }]}>Done</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 65, color: '#EF4444' }]}>Cancel</Text>
                                <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 55, fontWeight: '700' as const }]}>Total</Text>
                            </View>
                            {/* Table Rows */}
                            {deptBreakdown.map((row, i) => (
                                <View key={row.department} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                                    <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>{row.department}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#3B82F6' }]}>{row.NEW}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 75, color: '#F59E0B' }]}>{row.IN_PROGRESS}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#F97316' }]}>{row.ON_HOLD}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#10B981' }]}>{row.DONE}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 65, color: '#EF4444' }]}>{row.CANCEL}</Text>
                                    <Text style={[styles.tableCell, styles.tableCenter, { width: 55, fontWeight: '700' as const }]}>{row.total}</Text>
                                </View>
                            ))}
                            {/* Totals Row */}
                            <View style={styles.tableTotalRow}>
                                <Text style={[styles.tableCell, { width: 120, fontWeight: '700' as const }]}>Total</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700' as const, color: '#3B82F6' }]}>
                                    {statusCounts.NEW}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 75, fontWeight: '700' as const, color: '#F59E0B' }]}>
                                    {statusCounts.IN_PROGRESS}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700' as const, color: '#F97316' }]}>
                                    {statusCounts.ON_HOLD}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700' as const, color: '#10B981' }]}>
                                    {statusCounts.DONE}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 65, fontWeight: '700' as const, color: '#EF4444' }]}>
                                    {statusCounts.CANCEL}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 55, fontWeight: '800' as const }]}>
                                    {totalTickets}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
    loadingText: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.textSecondary },
    errorText: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.error, textAlign: 'center' },

    typeBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginTop: Spacing.lg, marginBottom: Spacing.md,
        backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
        borderWidth: 1,
    },
    typeBannerText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    },
    statCard: {
        flex: 1, minWidth: (screenWidth - 56) / 2,
        backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
        padding: Spacing.lg, borderLeftWidth: 4,
        ...Shadow.sm, alignItems: 'flex-start', gap: 4,
    },
    statNumber: { fontSize: 28, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

    // Sections
    section: { marginBottom: Spacing.lg },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    },
    sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
    sectionSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginLeft: 'auto' },
    card: {
        backgroundColor: Colors.white, marginHorizontal: Spacing.lg,
        borderRadius: BorderRadius.xl, padding: Spacing.lg,
        borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
    },

    // Status breakdown
    statusRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    statusRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 90 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
    statusRowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 80, justifyContent: 'flex-end' },
    statusCount: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    statusPct: { fontSize: FontSize.xs, color: Colors.textTertiary },

    // Damage breakdown
    damageRow: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    },
    damageRank: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primaryBg,
        justifyContent: 'center', alignItems: 'center',
    },
    damageRankText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
    damageInfo: { flex: 1, gap: 4 },
    damageName: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
    damageCount: { alignItems: 'flex-end' },
    damageCountText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.text },
    damagePct: { fontSize: FontSize.xs, color: Colors.textTertiary },

    // Table
    tableScroll: { marginHorizontal: Spacing.lg, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, ...Shadow.sm, borderWidth: 1, borderColor: Colors.borderLight },
    tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 2, borderBottomColor: Colors.border, paddingVertical: Spacing.md },
    tableHeaderCell: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'uppercase', paddingHorizontal: 6 },
    tableRow: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    tableRowAlt: { backgroundColor: '#FAFAFA' },
    tableCell: { fontSize: FontSize.sm, color: Colors.text, paddingHorizontal: 6 },
    tableCenter: { textAlign: 'center' },
    tableTotalRow: { flexDirection: 'row', paddingVertical: Spacing.md, backgroundColor: '#F3F4F6', borderTopWidth: 2, borderTopColor: Colors.border },

    emptyText: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: Spacing.xl },
});
