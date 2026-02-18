/**
 * Summary Report Screen
 * Shows ticket statistics, status breakdown, and damage type analysis
 * For admin users - accessible from each dashboard
 */
import React, { useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TicketType, Ticket, TicketStats } from '../types';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import {
    MOCK_STATS, MOCK_ENGINEER_STATS,
    MOCK_IT_TICKETS, MOCK_ENGINEER_TICKETS,
} from '../services/mockData';

const screenWidth = Dimensions.get('window').width;

// Status colors matching web app
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    NEW: { label: 'New', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'radio-button-on' },
    IN_PROGRESS: { label: 'On Process', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'time' },
    ON_HOLD: { label: 'On Hold', color: '#F97316', bgColor: '#FFF7ED', icon: 'pause-circle' },
    DONE: { label: 'Done', color: '#10B981', bgColor: '#ECFDF5', icon: 'checkmark-circle' },
    CANCEL: { label: 'Cancel', color: '#EF4444', bgColor: '#FEF2F2', icon: 'close-circle' },
};

// Simple progress bar component
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
    const tickets: Ticket[] = isIT ? MOCK_IT_TICKETS : MOCK_ENGINEER_TICKETS;
    const stats: TicketStats = isIT ? MOCK_STATS : MOCK_ENGINEER_STATS;
    const totalTickets = Object.values(stats).reduce((a, b) => a + b, 0);

    // Damage type breakdown
    const damageBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        tickets.forEach(t => {
            const key = t.typeOfDamage || 'Unknown';
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map)
            .map(([type, count]) => ({ type, count, pct: totalTickets > 0 ? (count / totalTickets * 100) : 0 }))
            .sort((a, b) => b.count - a.count);
    }, [tickets, totalTickets]);

    // Department breakdown
    const deptBreakdown = useMemo(() => {
        const map: Record<string, Record<string, number>> = {};
        tickets.forEach(t => {
            const dept = t.department || 'Unknown';
            if (!map[dept]) map[dept] = { NEW: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0, CANCEL: 0, total: 0 };
            map[dept][t.status] = (map[dept][t.status] || 0) + 1;
            map[dept].total += 1;
        });
        return Object.entries(map)
            .map(([dept, counts]) => ({ dept, ...counts }))
            .sort((a: any, b: any) => b.total - a.total);
    }, [tickets]);

    // Recent tickets (latest 5)
    const recentTickets = useMemo(() => {
        return [...tickets]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [tickets]);

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
                    <Text style={styles.statNumber}>{totalTickets}</Text>
                    <Text style={styles.statLabel}>Total Tickets</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                    <Ionicons name="checkmark-done" size={22} color="#10B981" />
                    <Text style={styles.statNumber}>{stats.DONE}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
                    <Ionicons name="hourglass" size={22} color="#F59E0B" />
                    <Text style={styles.statNumber}>{stats.IN_PROGRESS + stats.ON_HOLD}</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                </View>
                <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
                    <Ionicons name="alert-circle" size={22} color="#EF4444" />
                    <Text style={styles.statNumber}>{stats.NEW}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
            </View>

            {/* Status Breakdown */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="pie-chart" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Status Breakdown</Text>
                </View>
                <View style={styles.card}>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = stats[key as keyof TicketStats] || 0;
                        const pct = totalTickets > 0 ? ((count / totalTickets) * 100).toFixed(1) : '0.0';
                        return (
                            <View key={key} style={styles.statusRow}>
                                <View style={styles.statusRowLeft}>
                                    <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                                    <Text style={styles.statusName}>{config.label}</Text>
                                </View>
                                <ProgressBar value={count} total={totalTickets} color={config.color} />
                                <View style={styles.statusRowRight}>
                                    <Text style={[styles.statusCount, { color: config.color }]}>{count}</Text>
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
                    <Ionicons name="construct" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Top Damage Types</Text>
                </View>
                <View style={styles.card}>
                    {damageBreakdown.length > 0 ? damageBreakdown.map((item, i) => (
                        <View key={item.type} style={styles.damageRow}>
                            <View style={styles.damageRank}>
                                <Text style={styles.damageRankText}>{i + 1}</Text>
                            </View>
                            <View style={styles.damageInfo}>
                                <Text style={styles.damageName} numberOfLines={1}>{item.type}</Text>
                                <ProgressBar value={item.count} total={damageBreakdown[0]?.count || 1} color={Colors.primary} />
                            </View>
                            <View style={styles.damageCount}>
                                <Text style={styles.damageCountText}>{item.count}</Text>
                                <Text style={styles.damagePct}>{item.pct.toFixed(1)}%</Text>
                            </View>
                        </View>
                    )) : (
                        <Text style={styles.emptyText}>No data available</Text>
                    )}
                </View>
            </View>

            {/* Department by Status */}
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
                            <Text style={[styles.tableHeaderCell, styles.tableCenter, { width: 55, fontWeight: '700' }]}>Total</Text>
                        </View>
                        {/* Table Rows */}
                        {deptBreakdown.map((row: any, i: number) => (
                            <View key={row.dept} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>{row.dept}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#3B82F6' }]}>{row.NEW}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 75, color: '#F59E0B' }]}>{row.IN_PROGRESS}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#F97316' }]}>{row.ON_HOLD}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 60, color: '#10B981' }]}>{row.DONE}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 65, color: '#EF4444' }]}>{row.CANCEL}</Text>
                                <Text style={[styles.tableCell, styles.tableCenter, { width: 55, fontWeight: '700' }]}>{row.total}</Text>
                            </View>
                        ))}
                        {/* Totals */}
                        <View style={styles.tableTotalRow}>
                            <Text style={[styles.tableCell, { width: 120, fontWeight: '700' }]}>Total</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700', color: '#3B82F6' }]}>{stats.NEW}</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 75, fontWeight: '700', color: '#F59E0B' }]}>{stats.IN_PROGRESS}</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700', color: '#F97316' }]}>{stats.ON_HOLD}</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 60, fontWeight: '700', color: '#10B981' }]}>{stats.DONE}</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 65, fontWeight: '700', color: '#EF4444' }]}>{stats.CANCEL}</Text>
                            <Text style={[styles.tableCell, styles.tableCenter, { width: 55, fontWeight: '800' }]}>{totalTickets}</Text>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* Recent Tickets */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="time" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Recent Tickets</Text>
                </View>
                <View style={styles.card}>
                    {recentTickets.map((ticket) => {
                        const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.NEW;
                        return (
                            <View key={ticket.id} style={styles.recentItem}>
                                <View style={styles.recentLeft}>
                                    <Text style={styles.recentNumber}>{ticket.ticketNumber}</Text>
                                    <Text style={styles.recentTitle} numberOfLines={1}>{ticket.title}</Text>
                                    <Text style={styles.recentMeta}>
                                        {ticket.department} • {new Date(ticket.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={[styles.recentBadge, { backgroundColor: statusCfg.bgColor }]}>
                                    <Text style={[styles.recentBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                                </View>
                            </View>
                        );
                    })}
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

    // Recent tickets
    recentItem: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    },
    recentLeft: { flex: 1, marginRight: Spacing.sm },
    recentNumber: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
    recentTitle: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, marginTop: 2 },
    recentMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
    recentBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
    recentBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
    emptyText: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: Spacing.xl },
});
