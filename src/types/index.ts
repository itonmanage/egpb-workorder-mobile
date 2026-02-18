/**
 * TypeScript types for EGPB Ticket Mobile
 * Ported from web app lib/types.ts
 */

export interface TicketImage {
    id: string;
    imageUrl?: string;
    image_url?: string;
}

export interface Ticket {
    id: string;
    ticketNumber: string;
    title: string | null;
    description: string | null;
    department: string | null;
    location: string | null;
    typeOfDamage: string;
    status: string;
    createdAt: string;
    adminNotes: string | null;
    assignTo: string | null;
    informationBy?: string | null;
    updatedAt: string;
    user?: {
        username: string;
    };
    username?: string;
    images?: TicketImage[];
}

export interface TicketStats {
    NEW: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    DONE: number;
    CANCEL: number;
}

export type TicketType = 'it' | 'engineer';

export interface User {
    id: string;
    username: string;
    role: string;
    department?: string;
    email?: string;
    createdAt?: string;
}

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success: boolean;
}

export interface SummaryStats {
    totalTickets: number;
    thisMonthTickets: number;
    lastMonthTickets: number;
    yearToDateTickets: number;
    activeUsers: number;
    avgResolutionHours: number | null;
    statusBreakdown: { status: string; count: number }[];
    typeBreakdown: { type: string; count: number }[];
    itDepartmentStatusBreakdown?: DepartmentStatusRow[];
    departmentStatusBreakdown?: DepartmentStatusRow[];
}

export interface DepartmentStatusRow {
    department: string;
    NEW: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    DONE: number;
    CANCEL: number;
    total: number;
}
