/**
 * API Service for EGPB Ticket Mobile
 * Uses mock data for testing, easily switchable to real API
 */
import { ApiResponse, Ticket, TicketStats, User } from '../types';
import {
    MOCK_USER,
    MOCK_STATS,
    MOCK_ENGINEER_STATS,
    MOCK_IT_TICKETS,
    MOCK_ENGINEER_TICKETS,
    simulateDelay,
} from './mockData';

// Set this to your server URL when ready to connect
const API_BASE_URL = 'http://10.70.0.34:3000/egpb/pyt/workorder';

// Toggle this to switch between mock and real API
const USE_MOCK = true;

class ApiService {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
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

            const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
                ...options,
                headers,
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return {
                    success: false,
                    error: `Server returned non-JSON response (${response.status})`,
                };
            }

            const data = await response.json();

            if (!response.ok) {
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
            return {
                success: true,
                data: {
                    totalTickets: 70,
                    thisMonthTickets: 15,
                    activeUsers: 25,
                    avgResolutionHours: 4.5,
                    statusBreakdown: [
                        { status: 'NEW', count: 13 },
                        { status: 'IN_PROGRESS', count: 21 },
                        { status: 'ON_HOLD', count: 5 },
                        { status: 'DONE', count: 83 },
                        { status: 'CANCEL', count: 3 },
                    ],
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
    };
}

export const apiService = new ApiService();
export default apiService;
