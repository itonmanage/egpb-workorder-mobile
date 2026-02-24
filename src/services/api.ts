/**
 * API Service for EGPB Ticket Mobile
 * Uses mock data for testing, easily switchable to real API
 */
import { ApiResponse, Ticket, TicketStats, User, SummaryStats } from '../types';
import {
    MOCK_USER,
    MOCK_STATS,
    MOCK_ENGINEER_STATS,
    MOCK_IT_TICKETS,
    MOCK_ENGINEER_TICKETS,
    simulateDelay,
} from './mockData';

// Internal network API endpoint — update to HTTPS when TLS is available on the server
const API_BASE_URL = 'http://10.70.2.241:3000/egpb/pyt/workorder';

// Toggle this to switch between mock and real API
const USE_MOCK = false;

// Network request timeout (10 seconds)
const REQUEST_TIMEOUT_MS = 10000;

class ApiService {
    private token: string | null = null;
    private onUnauthorizedCallback: (() => void) | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    setOnUnauthorized(callback: () => void) {
        this.onUnauthorizedCallback = callback;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        if (USE_MOCK) {
            return this.mockRequest<T>(endpoint, options);
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...(options.headers as Record<string, string>),
            };

            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return {
                    success: false,
                    error: `Server returned non-JSON response (${response.status})`,
                };
            }

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.onUnauthorizedCallback?.();
                }
                return {
                    success: false,
                    error: data.error || 'An error occurred',
                };
            }

            return {
                success: true,
                data: data.data || data,
            };
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                return { success: false, error: 'Request timed out. Please check your connection.' };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Mock request handler for testing without API
    private async mockRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        await simulateDelay(500);
        const method = options.method || 'GET';

        // Auth endpoints
        if (endpoint === '/auth/login' && method === 'POST') {
            const body = JSON.parse(options.body as string);
            if (body.username && body.password) {
                return {
                    success: true,
                    data: { user: MOCK_USER, token: 'mock-jwt-token-12345' } as T,
                };
            }
            return { success: false, error: 'Invalid credentials' };
        }

        if (endpoint === '/auth/me') {
            return {
                success: true,
                data: { user: MOCK_USER } as T,
            };
        }

        if (endpoint === '/auth/logout') {
            return { success: true, data: {} as T };
        }

        // IT Tickets
        if (endpoint.startsWith('/tickets') && !endpoint.includes('engineer')) {
            if (endpoint === '/tickets' && method === 'GET') {
                return {
                    success: true,
                    data: {
                        tickets: MOCK_IT_TICKETS,
                        count: MOCK_IT_TICKETS.length,
                        statusCounts: MOCK_STATS,
                    } as T,
                };
            }

            // Single ticket by ID
            const ticketMatch = endpoint.match(/^\/tickets\/(.+)$/);
            if (ticketMatch && method === 'GET') {
                const ticket = MOCK_IT_TICKETS.find(t => t.id === ticketMatch[1]);
                if (ticket) {
                    return { success: true, data: { ticket } as T };
                }
                return { success: false, error: 'Ticket not found' };
            }

            if (endpoint === '/tickets' && method === 'POST') {
                const body = JSON.parse(options.body as string);
                const newTicket: Ticket = {
                    id: `it-${Date.now()}`,
                    ticketNumber: `IT-2502-${String(MOCK_IT_TICKETS.length + 1).padStart(3, '0')}`,
                    title: body.title || body.location || '',
                    description: body.description || '',
                    department: body.department || '',
                    location: body.area || body.location || '',
                    typeOfDamage: body.typeOfDamage || 'Other',
                    status: 'NEW',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    adminNotes: null,
                    assignTo: null,
                    user: { username: MOCK_USER.username },
                    images: [],
                };
                MOCK_IT_TICKETS.unshift(newTicket);
                return { success: true, data: { ticket: newTicket } as T };
            }
        }

        // Engineer Tickets
        if (endpoint.startsWith('/engineer-tickets')) {
            if (endpoint === '/engineer-tickets' && method === 'GET') {
                return {
                    success: true,
                    data: {
                        tickets: MOCK_ENGINEER_TICKETS,
                        count: MOCK_ENGINEER_TICKETS.length,
                        statusCounts: MOCK_ENGINEER_STATS,
                    } as T,
                };
            }

            const engMatch = endpoint.match(/^\/engineer-tickets\/(.+)$/);
            if (engMatch && method === 'GET') {
                const ticket = MOCK_ENGINEER_TICKETS.find(t => t.id === engMatch[1]);
                if (ticket) {
                    return { success: true, data: { ticket } as T };
                }
                return { success: false, error: 'Ticket not found' };
            }

            if (endpoint === '/engineer-tickets' && method === 'POST') {
                const body = JSON.parse(options.body as string);
                const newTicket: Ticket = {
                    id: `eng-${Date.now()}`,
                    ticketNumber: `ENG-2502-${String(MOCK_ENGINEER_TICKETS.length + 1).padStart(3, '0')}`,
                    title: body.title || body.location || '',
                    description: body.description || '',
                    department: body.department || '',
                    location: body.area || body.location || '',
                    typeOfDamage: body.typeOfDamage || 'Other',
                    status: 'NEW',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    adminNotes: null,
                    assignTo: null,
                    user: { username: MOCK_USER.username },
                    images: [],
                };
                MOCK_ENGINEER_TICKETS.unshift(newTicket);
                return { success: true, data: { ticket: newTicket } as T };
            }
        }

        // Stats
        if (endpoint.startsWith('/stats/summary')) {
            // Parse type from query: /stats/summary?type=IT or /stats/summary?type=ENGINEER
            const urlType = endpoint.includes('type=ENGINEER') ? 'ENGINEER' : 'IT';
            const mockTickets = urlType === 'IT' ? MOCK_IT_TICKETS : MOCK_ENGINEER_TICKETS;
            const mockStats = urlType === 'IT' ? MOCK_STATS : MOCK_ENGINEER_STATS;
            const total = Object.values(mockStats).reduce((a, b) => a + b, 0);

            // Build statusBreakdown
            const statusBreakdown = Object.entries(mockStats).map(([status, count]) => ({
                status, count,
            }));

            // Build typeBreakdown from tickets
            const typeMap: Record<string, number> = {};
            mockTickets.forEach(t => {
                const key = t.typeOfDamage || 'Other';
                typeMap[key] = (typeMap[key] || 0) + 1;
            });
            const typeBreakdown = Object.entries(typeMap)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count);

            // Build departmentStatusBreakdown from tickets
            const deptMap: Record<string, Record<string, number>> = {};
            mockTickets.forEach(t => {
                const dept = t.department || 'Unknown';
                if (!deptMap[dept]) deptMap[dept] = { NEW: 0, IN_PROGRESS: 0, ON_HOLD: 0, DONE: 0, CANCEL: 0 };
                deptMap[dept][t.status] = (deptMap[dept][t.status] || 0) + 1;
            });
            const departmentStatusBreakdown = Object.entries(deptMap)
                .map(([department, statuses]) => ({
                    department, ...statuses,
                    total: Object.values(statuses).reduce((sum, c) => sum + c, 0),
                }))
                .sort((a: any, b: any) => b.total - a.total);

            return {
                success: true,
                data: {
                    totalTickets: total,
                    thisMonthTickets: mockStats.DONE,
                    lastMonthTickets: Math.floor(mockStats.DONE * 0.8),
                    yearToDateTickets: total,
                    activeUsers: 25,
                    avgResolutionHours: 4.5,
                    statusBreakdown,
                    typeBreakdown,
                    itDepartmentStatusBreakdown: urlType === 'IT' ? departmentStatusBreakdown : undefined,
                    departmentStatusBreakdown: urlType === 'ENGINEER' ? departmentStatusBreakdown : undefined,
                } as T,
            };
        }

        return { success: false, error: `Unknown endpoint: ${endpoint}` };
    }

    // ====== Auth ======
    auth = {
        signIn: async (username: string, password: string) => {
            return this.request<{ user: User; token: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
        },

        signOut: async () => {
            return this.request('/auth/logout', { method: 'POST' });
        },

        getUser: async () => {
            return this.request<{ user: User }>('/auth/me');
        },
    };

    // ====== IT Tickets ======
    tickets = {
        list: async (filters?: Record<string, string | number>) => {
            const params = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                        params.append(key, String(value));
                    }
                });
            }
            return this.request<{ tickets: Ticket[]; count: number; statusCounts: TicketStats }>(
                `/tickets?${params}`
            );
        },

        get: async (id: string) => {
            return this.request<{ ticket: Ticket }>(`/tickets/${id}`);
        },

        create: async (data: Record<string, unknown>) => {
            return this.request<{ ticket: Ticket }>('/tickets', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        update: async (id: string, data: Record<string, unknown>) => {
            return this.request<{ ticket: Ticket }>(`/tickets/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        uploadImages: async (id: string, uris: { uri: string; name: string; type: string }[], isAdminUpload: boolean = false) => {
            if (USE_MOCK) return { success: true, data: { imageUrls: ['mock-url'] } };

            try {
                const formData = new FormData();
                uris.forEach(file => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formData.append('file', {
                        uri: file.uri,
                        name: file.name,
                        type: file.type || 'image/jpeg',
                    } as any);
                });
                formData.append('ticketId', id);
                formData.append('isAdminUpload', String(isAdminUpload));

                const headers: Record<string, string> = {};
                if (apiService['token']) {
                    headers['Authorization'] = `Bearer ${apiService['token']}`;
                }

                const response = await fetch(`${API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    headers,
                    body: formData,
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Upload failed');
                }
                return { success: true, imageUrls: result.data?.images?.map((i: any) => i.url) || [] };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Network error' };
            }
        },
    };

    // ====== Engineer Tickets ======
    engineerTickets = {
        list: async (filters?: Record<string, string | number>) => {
            const params = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== '') {
                        params.append(key, String(value));
                    }
                });
            }
            return this.request<{ tickets: Ticket[]; count: number; statusCounts: TicketStats }>(
                `/engineer-tickets?${params}`
            );
        },

        get: async (id: string) => {
            return this.request<{ ticket: Ticket }>(`/engineer-tickets/${id}`);
        },

        create: async (data: Record<string, unknown>) => {
            return this.request<{ ticket: Ticket }>('/engineer-tickets', {
                method: 'POST',
                body: JSON.stringify(data),
            });
        },

        update: async (id: string, data: Record<string, unknown>) => {
            return this.request<{ ticket: Ticket }>(`/engineer-tickets/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        },

        uploadImages: async (id: string, uris: { uri: string; name: string; type: string }[], isAdminUpload: boolean = false) => {
            if (USE_MOCK) return { success: true, data: { imageUrls: ['mock-url'] } };

            try {
                const formData = new FormData();
                uris.forEach(file => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formData.append('file', {
                        uri: file.uri,
                        name: file.name,
                        type: file.type || 'image/jpeg',
                    } as any);
                });
                formData.append('ticketId', id);
                formData.append('isAdminUpload', String(isAdminUpload));
                formData.append('type', 'engineer');

                const headers: Record<string, string> = {};
                if (apiService['token']) {
                    headers['Authorization'] = `Bearer ${apiService['token']}`;
                }

                const response = await fetch(`${API_BASE_URL}/api/upload`, {
                    method: 'POST',
                    headers,
                    body: formData,
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Upload failed');
                }
                return { success: true, imageUrls: result.data?.images?.map((i: any) => i.url) || [] };
            } catch (error) {
                return { success: false, error: error instanceof Error ? error.message : 'Network error' };
            }
        },
    };

    // ====== Stats ======
    stats = {
        summary: async (params?: { type?: string; from?: string; to?: string }) => {
            const searchParams = new URLSearchParams();
            if (params?.type) searchParams.append('type', params.type);
            if (params?.from) searchParams.append('from', params.from);
            if (params?.to) searchParams.append('to', params.to);
            return this.request<SummaryStats>(`/stats/summary?${searchParams}`);
        },
        damageTypes: async (params: { month: number; year: number; type: string }) => {
            const searchParams = new URLSearchParams();
            searchParams.append('month', params.month.toString());
            searchParams.append('year', params.year.toString());
            searchParams.append('type', params.type);
            return this.request<{ month: number; year: number; totalCount: number; typeBreakdown: { type: string; count: number; percentage: number }[] }>(`/stats/damage-types?${searchParams}`);
        },
    };
}

export const apiService = new ApiService();
export default apiService;
