/**
 * Home Screen - Ticket Dashboard
 * Shows status summary cards, filter bar, and scrollable ticket list
 * Uses server-side filtering and infinite scroll pagination
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Modal,
    Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TicketType, Ticket, TicketStats } from '../types';
import { apiService } from '../services/api';
import { TicketCard } from '../components/TicketCard';
import { LoadingSpinner, EmptyState } from '../components/LoadingAndEmpty';
import { useAuth } from '../contexts/AuthContext';
import { getDamageTypes, STATUS_CONFIG } from '../constants';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RootStackParamList = {
    HomeTabs: undefined;
    TicketDetail: { ticketId: string; ticketType: TicketType };
    CreateTicket: { ticketType: TicketType };
    SummaryReport: { ticketType: TicketType };
};

interface StatCardProps {
    title: string;
    count: number;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bgColor: string;
    isActive: boolean;
    onPress: () => void;
}

function StatCard({ title, count, icon, color, bgColor, isActive, onPress }: StatCardProps) {
    return (
        <TouchableOpacity
            style={[styles.statCard, isActive && { borderColor: color, borderWidth: 2 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{title}</Text>
                <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
                    <Ionicons name={icon} size={14} color={color} />
                </View>
            </View>
            <Text style={styles.statCount}>{count}</Text>
        </TouchableOpacity>
    );
}

// ---- Filter Dropdown Modal ----
interface FilterModalProps {
    visible: boolean;
    title: string;
    options: readonly string[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

function FilterModal({ visible, title, options, selectedValue, onSelect, onClose }: FilterModalProps) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={filterStyles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={filterStyles.sheet}>
                    <View style={filterStyles.sheetHandle} />
                    <Text style={filterStyles.sheetTitle}>{title}</Text>
                    <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[filterStyles.option, !selectedValue && filterStyles.optionActive]}
                            onPress={() => { onSelect(''); onClose(); }}
                        >
                            <Text style={[filterStyles.optionText, !selectedValue && filterStyles.optionTextActive]}>All</Text>
                            {!selectedValue && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                        </TouchableOpacity>
                        {options.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[filterStyles.option, selectedValue === opt && filterStyles.optionActive]}
                                onPress={() => { onSelect(opt); onClose(); }}
                            >
                                <Text style={[filterStyles.optionText, selectedValue === opt && filterStyles.optionTextActive]} numberOfLines={1}>
                                    {opt}
                                </Text>
                                {selectedValue === opt && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

// ---- Date Picker Modal ----
interface DatePickerModalProps {
    visible: boolean;
    startDate: string;
    endDate: string;
    onApply: (start: string, end: string) => void;
    onClose: () => void;
}

function DatePickerModal({ visible, startDate, endDate, onApply, onClose }: DatePickerModalProps) {
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    useEffect(() => {
        setStart(startDate);
        setEnd(endDate);
    }, [startDate, endDate]);

    // Generate quick presets
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const presets = [
        { label: 'Today', start: formatDate(today), end: formatDate(today) },
        { label: 'Last 7 days', start: formatDate(new Date(today.getTime() - 7 * 86400000)), end: formatDate(today) },
        { label: 'This Month', start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), end: formatDate(today) },
        { label: 'Last Month', start: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)), end: formatDate(new Date(today.getFullYear(), today.getMonth(), 0)) },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={filterStyles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={filterStyles.sheet}>
                    <View style={filterStyles.sheetHandle} />
                    <Text style={filterStyles.sheetTitle}>Date Range</Text>

                    {/* Quick Presets */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {presets.map(p => (
                            <TouchableOpacity
                                key={p.label}
                                style={{
                                    paddingHorizontal: 12, paddingVertical: 6,
                                    borderRadius: 16, backgroundColor: start === p.start && end === p.end ? Colors.primary : Colors.primaryBg,
                                    borderWidth: 1, borderColor: start === p.start && end === p.end ? Colors.primary : Colors.primaryBorder,
                                }}
                                onPress={() => { setStart(p.start); setEnd(p.end); }}
                            >
                                <Text style={{
                                    fontSize: 12, fontWeight: '600',
                                    color: start === p.start && end === p.end ? Colors.white : Colors.primary,
                                }}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Manual Inputs */}
                    <View style={{ gap: 12 }}>
                        <View>
                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>Start Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={filterStyles.dateInput}
                                placeholder="2025-01-01"
                                placeholderTextColor={Colors.textTertiary}
                                value={start}
                                onChangeText={setStart}
                                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                            />
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' }}>End Date (YYYY-MM-DD)</Text>
                            <TextInput
                                style={filterStyles.dateInput}
                                placeholder="2025-12-31"
                                placeholderTextColor={Colors.textTertiary}
                                value={end}
                                onChangeText={setEnd}
                                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
                            />
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                        <TouchableOpacity
                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' }}
                            onPress={() => { setStart(''); setEnd(''); onApply('', ''); onClose(); }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary }}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' }}
                            onPress={() => { onApply(start, end); onClose(); }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.white }}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

// ==== MAIN SCREEN ====
interface HomeScreenProps {
    ticketType?: TicketType;
}

const ITEMS_PER_PAGE = 20;

export default function HomeScreen({ ticketType = 'engineer' }: HomeScreenProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user, isAdmin } = useAuth();
    const insets = useSafeAreaInsets();

    // Data state
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats>({ NEW: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0, CANCEL: 0 });
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filter state
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterType, setFilterType] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [myTickets, setMyTickets] = useState(false);

    // Modal state
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);

    // Debounce timer for search
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search]);

    // Build API filters
    const buildFilters = useCallback((offset: number = 0) => {
        const filters: Record<string, string | number> = {
            limit: ITEMS_PER_PAGE,
            offset,
        };
        if (debouncedSearch) filters.search = debouncedSearch;
        if (filterStatus) filters.status = filterStatus;
        if (filterType) filters.type = filterType;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (myTickets) filters.createdByMe = 'true';
        return filters;
    }, [debouncedSearch, filterStatus, filterType, startDate, endDate, myTickets]);

    // Fetch tickets (initial / filter change)
    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const result = await api.list(buildFilters(0));
            if (result.success && result.data) {
                const newTickets = result.data.tickets || [];
                setTickets(newTickets);
                setTotalCount(result.data.count || 0);
                setHasMore(newTickets.length >= ITEMS_PER_PAGE);
                if (result.data.statusCounts) {
                    setStats(result.data.statusCounts);
                }
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [ticketType, buildFilters]);

    // Fetch more tickets (pagination)
    const fetchMore = useCallback(async () => {
        if (loadingMore || !hasMore || loading) return;
        setLoadingMore(true);
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const result = await api.list(buildFilters(tickets.length));
            if (result.success && result.data) {
                const moreTickets = result.data.tickets || [];
                setTickets(prev => [...prev, ...moreTickets]);
                setHasMore(moreTickets.length >= ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error loading more tickets:', error);
        } finally {
            setLoadingMore(false);
        }
    }, [ticketType, buildFilters, tickets.length, loadingMore, hasMore, loading]);

    // Refetch when filters or ticketType change
    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Reset filters when tab changes
    useEffect(() => {
        setSearch('');
        setDebouncedSearch('');
        setFilterStatus('');
        setFilterType('');
        setStartDate('');
        setEndDate('');
        setMyTickets(false);
    }, [ticketType]);

    // Refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchTickets();
        }, [fetchTickets])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchTickets();
    }, [fetchTickets]);

    const handleStatPress = (status: string) => {
        setFilterStatus(prev => prev === status ? '' : status);
    };

    const activeFilterCount = [filterType, startDate || endDate, myTickets].filter(Boolean).length;

    const typeLabel = ticketType === 'it' ? 'IT' : 'Engineer';
    const damageTypes = getDamageTypes(ticketType);

    // ---- RENDER ----
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
                <View>
                    <Text style={styles.headerTitle}>{typeLabel} Dashboard</Text>
                    <Text style={styles.headerSubtitle}>
                        {isAdmin ? 'Manage all repair tickets' : 'Track your repair tickets'}
                    </Text>
                </View>
                <View style={styles.headerRight}>
                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.reportBtn}
                            onPress={() => navigation.navigate('SummaryReport', { ticketType })}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="bar-chart" size={18} color={Colors.primary} />
                            <Text style={styles.reportBtnText}>Report</Text>
                        </TouchableOpacity>
                    )}
                    {isAdmin && (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                    )}
                </View>
            </View>

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TicketCard
                        ticket={item}
                        onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id, ticketType })}
                    />
                )}
                ListHeaderComponent={
                    <>
                        {/* Stats Cards */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContainer}>
                            <StatCard title="New" count={stats.NEW} icon="alert-circle" color="#3b82f6" bgColor="#dbeafe" isActive={filterStatus === 'NEW'} onPress={() => handleStatPress('NEW')} />
                            <StatCard title="On Process" count={stats.IN_PROGRESS} icon="time" color="#eab308" bgColor="#fef9c3" isActive={filterStatus === 'IN_PROGRESS'} onPress={() => handleStatPress('IN_PROGRESS')} />
                            <StatCard title="On Hold" count={stats.ON_HOLD} icon="pause-circle" color="#f97316" bgColor="#ffedd5" isActive={filterStatus === 'ON_HOLD'} onPress={() => handleStatPress('ON_HOLD')} />
                            <StatCard title="Done" count={stats.DONE} icon="checkmark-circle" color="#22c55e" bgColor="#dcfce7" isActive={filterStatus === 'DONE'} onPress={() => handleStatPress('DONE')} />
                            <StatCard title="Cancel" count={stats.CANCEL} icon="close-circle" color="#ef4444" bgColor="#fee2e2" isActive={filterStatus === 'CANCEL'} onPress={() => handleStatPress('CANCEL')} />
                        </ScrollView>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <View style={styles.searchWrapper}>
                                <Ionicons name="search" size={18} color={Colors.primary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search tickets..."
                                    placeholderTextColor={Colors.textTertiary}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                {search ? (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        {/* Filter Bar */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{ marginTop: Spacing.sm }}
                            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: 8 }}
                        >
                            {/* Type Filter */}
                            <TouchableOpacity
                                style={[styles.filterChip, filterType ? styles.filterChipActive : null]}
                                onPress={() => setShowTypeModal(true)}
                            >
                                <Ionicons name="pricetag-outline" size={14} color={filterType ? Colors.white : Colors.primary} />
                                <Text style={[styles.filterChipText, filterType ? styles.filterChipTextActive : null]} numberOfLines={1}>
                                    {filterType || 'All Types'}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={filterType ? Colors.white : Colors.primary} />
                            </TouchableOpacity>

                            {/* Date Filter */}
                            <TouchableOpacity
                                style={[styles.filterChip, (startDate || endDate) ? styles.filterChipActive : null]}
                                onPress={() => setShowDateModal(true)}
                            >
                                <Ionicons name="calendar-outline" size={14} color={(startDate || endDate) ? Colors.white : Colors.primary} />
                                <Text style={[styles.filterChipText, (startDate || endDate) ? styles.filterChipTextActive : null]} numberOfLines={1}>
                                    {startDate && endDate ? `${startDate} → ${endDate}` : startDate || endDate || 'Date Range'}
                                </Text>
                                <Ionicons name="chevron-down" size={14} color={(startDate || endDate) ? Colors.white : Colors.primary} />
                            </TouchableOpacity>

                            {/* My Tickets */}
                            <TouchableOpacity
                                style={[styles.filterChip, myTickets ? styles.filterChipActive : null]}
                                onPress={() => setMyTickets(prev => !prev)}
                            >
                                <Ionicons name="person-outline" size={14} color={myTickets ? Colors.white : Colors.primary} />
                                <Text style={[styles.filterChipText, myTickets ? styles.filterChipTextActive : null]}>
                                    My Tickets
                                </Text>
                            </TouchableOpacity>

                            {/* Clear All Filters */}
                            {activeFilterCount > 0 && (
                                <TouchableOpacity
                                    style={[styles.filterChip, { backgroundColor: Colors.errorBg, borderColor: Colors.errorBorder }]}
                                    onPress={() => {
                                        setFilterType('');
                                        setStartDate('');
                                        setEndDate('');
                                        setMyTickets(false);
                                        setFilterStatus('');
                                        setSearch('');
                                    }}
                                >
                                    <Ionicons name="close" size={14} color={Colors.error} />
                                    <Text style={[styles.filterChipText, { color: Colors.error }]}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Results count */}
                        <View style={styles.resultsBar}>
                            <Text style={styles.resultsText}>
                                {tickets.length} of {totalCount} ticket{totalCount !== 1 ? 's' : ''}
                                {filterStatus ? ` • ${STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label || filterStatus}` : ''}
                                {filterType ? ` • ${filterType}` : ''}
                                {myTickets ? ' • My Tickets' : ''}
                            </Text>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    loading ? (
                        <LoadingSpinner message="Loading tickets..." />
                    ) : (
                        <EmptyState
                            icon="document-text-outline"
                            title="No tickets found"
                            message={search || filterStatus || filterType || startDate ? 'Try adjusting your filters' : 'Create your first ticket!'}
                        />
                    )
                }
                ListFooterComponent={
                    loadingMore ? (
                        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={{ fontSize: 12, color: Colors.textTertiary, marginTop: 4 }}>Loading more...</Text>
                        </View>
                    ) : null
                }
                onEndReached={fetchMore}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('CreateTicket', { ticketType })}
            >
                <Ionicons name="add" size={28} color={Colors.white} />
            </TouchableOpacity>

            {/* Filter Modals */}
            <FilterModal
                visible={showTypeModal}
                title="Type of Damage"
                options={damageTypes}
                selectedValue={filterType}
                onSelect={setFilterType}
                onClose={() => setShowTypeModal(false)}
            />
            <DatePickerModal
                visible={showDateModal}
                startDate={startDate}
                endDate={endDate}
                onApply={(s, e) => { setStartDate(s); setEndDate(e); }}
                onClose={() => setShowDateModal(false)}
            />
        </View>
    );
}

// ==== STYLES ====

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryBg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    reportBtnText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.primary,
    },
    adminBadge: {
        backgroundColor: Colors.primaryBg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    adminBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.primary,
    },
    statsScroll: {
        marginTop: Spacing.lg,
    },
    statsContainer: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
    },
    statCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        width: 120,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        ...Shadow.sm,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    statTitle: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.textSecondary,
    },
    statIconWrap: {
        width: 26,
        height: 26,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statCount: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryBg,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: FontSize.sm,
        color: Colors.text,
    },
    // Filter Chips
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.primaryBg,
        borderWidth: 1,
        borderColor: Colors.primaryBorder,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.primary,
        maxWidth: 150,
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    resultsBar: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    resultsText: {
        fontSize: FontSize.xs,
        color: Colors.textTertiary,
        fontWeight: FontWeight.medium,
    },
    listContent: {
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.lg,
        elevation: 8,
        zIndex: 100,
    },
});

const filterStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 32,
        paddingTop: 12,
        maxHeight: '70%',
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: Colors.text,
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 2,
    },
    optionActive: {
        backgroundColor: Colors.primaryBg,
    },
    optionText: {
        fontSize: 15,
        color: Colors.text,
        flex: 1,
    },
    optionTextActive: {
        fontWeight: '600' as const,
        color: Colors.primary,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: Colors.text,
        backgroundColor: Colors.background,
    },
});
