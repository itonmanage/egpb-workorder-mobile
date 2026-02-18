/**
 * Summary Report Screen
 * Fetches real data from API (same endpoint as web version)
 * Shows ticket statistics, status breakdown, damage type, comparison table,
 * department/area/information-by breakdowns, and department-by-status table.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity,
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

const MONTHS = [
    { value: 0, label: 'All Time' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

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

// Month/Year Picker component
function PeriodPicker({
    month, year, onMonthChange, onYearChange, accentColor,
}: {
    month: number; year: number;
    onMonthChange: (m: number) => void; onYearChange: (y: number) => void;
    accentColor: string;
}) {
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const monthLabel = MONTHS.find(m => m.value === month)?.label || '';

    return (
        <View style={pickerStyles.container}>
            {/* Month Picker */}
            <View>
                <TouchableOpacity
                    style={[pickerStyles.pickerBtn, { borderColor: accentColor }]}
                    onPress={() => { setShowMonthPicker(!showMonthPicker); setShowYearPicker(false); }}
                >
                    <Text style={[pickerStyles.pickerBtnText, { color: accentColor }]} numberOfLines={1}>
                        {monthLabel}
                    </Text>
                    <Ionicons name={showMonthPicker ? 'chevron-up' : 'chevron-down'} size={14} color={accentColor} />
                </TouchableOpacity>
                {showMonthPicker && (
                    <View style={pickerStyles.dropdown}>
                        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                            {MONTHS.map(m => (
                                <TouchableOpacity
                                    key={m.value}
                                    style={[pickerStyles.dropdownItem, month === m.value && { backgroundColor: accentColor + '20' }]}
                                    onPress={() => { onMonthChange(m.value); setShowMonthPicker(false); }}
                                >
                                    <Text style={[pickerStyles.dropdownText, month === m.value && { color: accentColor, fontWeight: '700' }]}>
                                        {m.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
            {/* Year Picker */}
            <View>
                <TouchableOpacity
                    style={[pickerStyles.pickerBtn, { borderColor: accentColor }]}
                    onPress={() => { setShowYearPicker(!showYearPicker); setShowMonthPicker(false); }}
                >
                    <Text style={[pickerStyles.pickerBtnText, { color: accentColor }]}>{year}</Text>
                    <Ionicons name={showYearPicker ? 'chevron-up' : 'chevron-down'} size={14} color={accentColor} />
                </TouchableOpacity>
                {showYearPicker && (
                    <View style={pickerStyles.dropdown}>
                        {YEARS.map(y => (
                            <TouchableOpacity
                                key={y}
                                style={[pickerStyles.dropdownItem, year === y && { backgroundColor: accentColor + '20' }]}
                                onPress={() => { onYearChange(y); setShowYearPicker(false); }}
                            >
                                <Text style={[pickerStyles.dropdownText, year === y && { color: accentColor, fontWeight: '700' }]}>
                                    {y}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

const pickerStyles = StyleSheet.create({
    container: { flexDirection: 'row', gap: 8, alignItems: 'center', zIndex: 100 },
    pickerBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 8, borderWidth: 1, backgroundColor: Colors.white,
    },
    pickerBtnText: { fontSize: 12, fontWeight: '600' },
    dropdown: {
        position: 'absolute', top: 36, left: 0, minWidth: 120,
        backgroundColor: Colors.white, borderRadius: 10, borderWidth: 1, borderColor: Colors.borderLight,
        ...Shadow.md, zIndex: 200,
    },
    dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
    dropdownText: { fontSize: 13, color: Colors.text },
});

// Simple table for breakdown data (department, area, info-by)
function BreakdownTable({
    title, subtitle, icon, data, totalTickets, barColor,
}: {
    title: string; subtitle: string; icon: string; data: { name: string; count: number }[];
    totalTickets: number; barColor: string;
}) {
    if (!data || data.length === 0) return null;
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon as any} size={20} color={Colors.text} />
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.card}>
                {/* Header */}
                <View style={breakdownStyles.headerRow}>
                    <Text style={[breakdownStyles.headerCell, { flex: 1 }]}>{subtitle}</Text>
                    <Text style={[breakdownStyles.headerCell, { width: 55, textAlign: 'right' }]}>Count</Text>
                    <Text style={[breakdownStyles.headerCell, { width: 50, textAlign: 'right' }]}>%</Text>
                </View>
                {/* Rows */}
                {data.map((item, i) => {
                    const pct = totalTickets > 0 ? (item.count / totalTickets * 100).toFixed(1) : '0.0';
                    return (
                        <View key={`${item.name}-${i}`} style={[breakdownStyles.row, i % 2 === 0 && breakdownStyles.rowAlt]}>
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={breakdownStyles.name} numberOfLines={1}>{item.name}</Text>
                                <ProgressBar value={item.count} total={data[0]?.count || 1} color={barColor} />
                            </View>
                            <Text style={[breakdownStyles.count, { color: barColor }]}>{item.count.toLocaleString()}</Text>
                            <Text style={breakdownStyles.pct}>{pct}%</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const breakdownStyles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: Colors.border, marginBottom: 4,
    },
    headerCell: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
    rowAlt: { backgroundColor: '#FAFAFA', marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
    name: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
    count: { width: 55, textAlign: 'right', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
    pct: { width: 50, textAlign: 'right', fontSize: FontSize.xs, color: Colors.textTertiary },
});


export default function SummaryScreen({ route }: any) {
    const ticketType: TicketType = route?.params?.ticketType || 'engineer';
    const isIT = ticketType === 'it';
    const typeLabel = isIT ? 'IT' : 'Engineer';
    const apiType = isIT ? 'IT' : 'ENGINEER';

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<SummaryStats | null>(null);

    // Comparison states (matching web version)
    const now = new Date();
    const [leftMonth, setLeftMonth] = useState(now.getMonth() + 1);
    const [leftYear, setLeftYear] = useState(now.getFullYear());
    const [rightMonth, setRightMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
    const [rightYear, setRightYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    const [leftData, setLeftData] = useState<{ type: string; count: number; percentage: number }[]>([]);
    const [rightData, setRightData] = useState<{ type: string; count: number; percentage: number }[]>([]);
    const [leftTotal, setLeftTotal] = useState(0);
    const [rightTotal, setRightTotal] = useState(0);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    // Fetch summary data
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

    // Fetch comparison data
    const fetchComparison = useCallback(async () => {
        setComparisonLoading(true);
        try {
            const [leftRes, rightRes] = await Promise.all([
                apiService.stats.damageTypes({ month: leftMonth, year: leftYear, type: apiType }),
                apiService.stats.damageTypes({ month: rightMonth, year: rightYear, type: apiType }),
            ]);

            if (leftRes.success && leftRes.data) {
                setLeftData(leftRes.data.typeBreakdown);
                setLeftTotal(leftRes.data.totalCount);
            }
            if (rightRes.success && rightRes.data) {
                setRightData(rightRes.data.typeBreakdown);
                setRightTotal(rightRes.data.totalCount);
            }
        } catch (err) {
            console.error('Fetch comparison error:', err);
        } finally {
            setComparisonLoading(false);
        }
    }, [leftMonth, leftYear, rightMonth, rightYear, apiType]);

    useEffect(() => {
        fetchComparison();
    }, [fetchComparison]);

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

    // All damage types from both periods (for comparison table)
    const comparisonTypes = useMemo(() => {
        const allTypes = new Set([
            ...leftData.map(d => d.type),
            ...rightData.map(d => d.type),
        ]);
        return Array.from(allTypes).sort((a, b) => {
            const leftA = leftData.find(d => d.type === a)?.count || 0;
            const leftB = leftData.find(d => d.type === b)?.count || 0;
            return leftB - leftA;
        });
    }, [leftData, rightData]);

    const leftPeriodLabel = useMemo(() => {
        if (leftMonth === 0) return 'All Time';
        return `${MONTHS.find(m => m.value === leftMonth)?.label || ''} ${leftYear}`;
    }, [leftMonth, leftYear]);

    const rightPeriodLabel = useMemo(() => {
        if (rightMonth === 0) return 'All Time';
        return `${MONTHS.find(m => m.value === rightMonth)?.label || ''} ${rightYear}`;
    }, [rightMonth, rightYear]);

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

            {/* ============ Detailed Statistics Comparison (Both IT & Engineer) ============ */}
            <View style={[styles.section, { zIndex: 50 }]}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="swap-horizontal" size={20} color={Colors.text} />
                    <Text style={styles.sectionTitle}>Statistics Comparison</Text>
                </View>
                <View style={[styles.card, { zIndex: 50 }]}>
                    {/* Period Pickers */}
                    <View style={compStyles.periodRow}>
                        <View style={[compStyles.periodCol, { zIndex: 110 }]}>
                            <Text style={[compStyles.periodLabel, { color: '#3B82F6' }]}>Period 1</Text>
                            <PeriodPicker
                                month={leftMonth} year={leftYear}
                                onMonthChange={setLeftMonth} onYearChange={setLeftYear}
                                accentColor="#3B82F6"
                            />
                            <Text style={[compStyles.periodTotal, { color: '#3B82F6' }]}>Total: {leftTotal}</Text>
                        </View>
                        <View style={[compStyles.periodCol, { zIndex: 100 }]}>
                            <Text style={[compStyles.periodLabel, { color: '#10B981' }]}>Period 2</Text>
                            <PeriodPicker
                                month={rightMonth} year={rightYear}
                                onMonthChange={setRightMonth} onYearChange={setRightYear}
                                accentColor="#10B981"
                            />
                            <Text style={[compStyles.periodTotal, { color: '#10B981' }]}>Total: {rightTotal}</Text>
                        </View>
                    </View>

                    {/* Comparison Table */}
                    {comparisonLoading ? (
                        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginTop: 12 }}>
                            <View>
                                {/* Table Header */}
                                <View style={compStyles.tableHeader}>
                                    <Text style={[compStyles.thCell, { width: 120 }]}>Damage Type</Text>
                                    <Text style={[compStyles.thCell, compStyles.thBlue, { width: 55 }]}>Count</Text>
                                    <Text style={[compStyles.thCell, compStyles.thBlue, { width: 50 }]}>%</Text>
                                    <Text style={[compStyles.thCell, compStyles.thGreen, { width: 55 }]}>Count</Text>
                                    <Text style={[compStyles.thCell, compStyles.thGreen, { width: 50 }]}>%</Text>
                                </View>
                                {/* Period Labels */}
                                <View style={compStyles.periodLabelRow}>
                                    <Text style={[compStyles.periodLabelCell, { width: 120 }]} />
                                    <Text style={[compStyles.periodLabelCell, compStyles.thBlue, { width: 105 }]} numberOfLines={1}>
                                        {leftPeriodLabel}
                                    </Text>
                                    <Text style={[compStyles.periodLabelCell, compStyles.thGreen, { width: 105 }]} numberOfLines={1}>
                                        {rightPeriodLabel}
                                    </Text>
                                </View>
                                {/* Table Rows */}
                                {comparisonTypes.length > 0 ? comparisonTypes.map((type, i) => {
                                    const left = leftData.find(d => d.type === type);
                                    const right = rightData.find(d => d.type === type);
                                    return (
                                        <View key={type} style={[compStyles.row, i % 2 === 0 && compStyles.rowAlt]}>
                                            <Text style={[compStyles.cell, { width: 120 }]} numberOfLines={1}>{type}</Text>
                                            <Text style={[compStyles.cell, { width: 55, textAlign: 'center', color: '#3B82F6', fontWeight: '600' }]}>
                                                {left?.count?.toLocaleString() || 0}
                                            </Text>
                                            <Text style={[compStyles.cell, { width: 50, textAlign: 'center', color: '#93C5FD' }]}>
                                                {left?.percentage?.toFixed(1) || '0.0'}%
                                            </Text>
                                            <Text style={[compStyles.cell, { width: 55, textAlign: 'center', color: '#10B981', fontWeight: '600' }]}>
                                                {right?.count?.toLocaleString() || 0}
                                            </Text>
                                            <Text style={[compStyles.cell, { width: 50, textAlign: 'center', color: '#6EE7B7' }]}>
                                                {right?.percentage?.toFixed(1) || '0.0'}%
                                            </Text>
                                        </View>
                                    );
                                }) : (
                                    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                                        <Text style={styles.emptyText}>No data available for selected periods</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>

            {/* ============ Engineer-only sections ============ */}
            {!isIT && (
                <>
                    {/* Department Breakdown */}
                    <BreakdownTable
                        title="Department"
                        subtitle="Department"
                        icon="business"
                        data={stats.departmentBreakdown || []}
                        totalTickets={totalTickets}
                        barColor="#10B981"
                    />

                    {/* Area/Location Breakdown */}
                    <BreakdownTable
                        title="Area"
                        subtitle="Area"
                        icon="location"
                        data={stats.locationBreakdown || []}
                        totalTickets={totalTickets}
                        barColor="#3B82F6"
                    />

                    {/* Information By Breakdown */}
                    <BreakdownTable
                        title="Information By"
                        subtitle="Source"
                        icon="information-circle"
                        data={stats.informationByBreakdown || []}
                        totalTickets={totalTickets}
                        barColor="#8B5CF6"
                    />
                </>
            )}

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

// Comparison table styles
const compStyles = StyleSheet.create({
    periodRow: {
        flexDirection: 'row', gap: 12, marginBottom: 4,
    },
    periodCol: { flex: 1, gap: 6 },
    periodLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    periodTotal: { fontSize: 11, fontWeight: '600' },
    tableHeader: {
        flexDirection: 'row', backgroundColor: '#F9FAFB',
        borderBottomWidth: 2, borderBottomColor: Colors.border, paddingVertical: 8,
    },
    thCell: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', paddingHorizontal: 4, textAlign: 'center' },
    thBlue: { backgroundColor: '#EFF6FF' },
    thGreen: { backgroundColor: '#ECFDF5' },
    periodLabelRow: {
        flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: 4,
    },
    periodLabelCell: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center', paddingHorizontal: 4 },
    row: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    rowAlt: { backgroundColor: '#FAFAFA' },
    cell: { fontSize: FontSize.sm, color: Colors.text, paddingHorizontal: 4 },
});

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
