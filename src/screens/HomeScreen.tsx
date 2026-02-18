/**
 * Home Screen - Ticket Dashboard
 * Shows status summary cards and scrollable ticket list
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiService } from '../services/api';
import { Ticket, TicketStats, TicketType } from '../types';
import { TicketCard } from '../components/TicketCard';
import { LoadingSpinner, EmptyState } from '../components/LoadingAndEmpty';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

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

interface HomeScreenProps {
    ticketType?: TicketType;
}

export default function HomeScreen({ ticketType = 'engineer' }: HomeScreenProps) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user, isAdmin } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats>({ NEW: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0, CANCEL: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    const fetchData = useCallback(async () => {
        try {
            const api = ticketType === 'it' ? apiService.tickets : apiService.engineerTickets;
            const result = await api.list({ limit: 50 });
            if (result.success && result.data) {
                setTickets(result.data.tickets || []);
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
    }, [ticketType]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [fetchData]);

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = !search ||
            ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
            ticket.title?.toLowerCase().includes(search.toLowerCase()) ||
            ticket.description?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !filterStatus || ticket.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleStatPress = (status: string) => {
        setFilterStatus(prev => prev === status ? '' : status);
    };

    const typeLabel = ticketType === 'it' ? 'IT' : 'Engineer';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
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
                data={filteredTickets}
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
                            {filterStatus ? (
                                <TouchableOpacity style={styles.clearFilter} onPress={() => setFilterStatus('')}>
                                    <Ionicons name="funnel-outline" size={14} color={Colors.error} />
                                    <Text style={styles.clearFilterText}>Clear</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Results count */}
                        <View style={styles.resultsBar}>
                            <Text style={styles.resultsText}>
                                {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
                                {filterStatus ? ` • ${filterStatus.replace('_', ' ')}` : ''}
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
                            message={search || filterStatus ? 'Try adjusting your filters' : 'Create your first ticket!'}
                        />
                    )
                }
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
        </View>
    );
}

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
    typeSwitcher: {
        flexDirection: 'row',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        backgroundColor: Colors.primaryBg,
        borderRadius: BorderRadius.lg,
        padding: 4,
        gap: 4,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    typeButtonActive: {
        backgroundColor: Colors.primary,
        ...Shadow.sm,
    },
    typeButtonText: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        color: Colors.primary,
    },
    typeButtonTextActive: {
        color: Colors.white,
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
    clearFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.errorBg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.errorBorder,
    },
    clearFilterText: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
        color: Colors.error,
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
