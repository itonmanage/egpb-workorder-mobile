/**
 * Shared Constants for EGPB Ticket Mobile
 * Ported from web app lib/constants.ts
 */

// ============================================
// IT TICKET CONSTANTS
// ============================================

export const IT_DAMAGE_TYPES = [
    'Hardware',
    'Network / Internet / WIFI',
    'Software',
    'Television / Digital Signage',
    'Telephone',
    'Access / Permission',
    'Printing / Scanning',
    'CCTV',
    'POS',
    'Access Control',
    'Email / Communication',
    'Service Request',
    'Security Incident',
    'Other',
] as const;

export type ITDamageType = typeof IT_DAMAGE_TYPES[number];

export const IT_AREAS = [
    'Guest room',
    'Back Office',
    'Reception',
    'Kitchen',
    'Restaurant/Retail',
    'Juristic/Tenants',
    'Public Area',
    'Other',
] as const;

export type ITArea = typeof IT_AREAS[number];

// ============================================
// ENGINEER TICKET CONSTANTS
// ============================================

export const ENGINEER_DAMAGE_TYPES = [
    'Air Condition',
    'Refrigerator',
    'Wal-in Chiller',
    'Ice Machines',
    'Ventilation System',
    'GAS System',
    'Hot Water',
    'Cold Water',
    'Toilet',
    'Drainage pipe',
    'Water Leaking pipe',
    'EE Equipment',
    'Television / Digital Signage',
    'Telephone',
    'Safe Box',
    'Door',
    'Lighting',
    'Furniture',
    'Touch up/Grouting',
    'Carpenter work',
    'Safety System',
    'Sanitary and Toilet',
    'Lift',
    'PM Program',
    'Other',
] as const;

export type EngineerDamageType = typeof ENGINEER_DAMAGE_TYPES[number];

export const ENGINEER_AREAS = [
    'Guest Rooms',
    'Kitchen',
    'Office Hotel Area',
    'BOH Hotel',
    'Retail',
    'Tenants Office Area',
    'Function Room',
    'Other',
] as const;

export type EngineerArea = typeof ENGINEER_AREAS[number];

// ============================================
// SHARED CONSTANTS
// ============================================

export const DEPARTMENTS = [
    'Engineer',
    'Executive & Accounting',
    'F&B',
    'Banquet',
    'Front Office',
    'Housekeeping',
    'Human Resource',
    'Juristic',
    'Kitchen',
    'Reservations & Sales & Marketing',
    'Security',
] as const;

export type Department = typeof DEPARTMENTS[number];

// Status Configuration
export const STATUS_CONFIG = {
    NEW: {
        value: 'NEW',
        label: 'New',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        textColor: '#1d4ed8',
    },
    IN_PROGRESS: {
        value: 'IN_PROGRESS',
        label: 'On Process',
        color: '#eab308',
        bgColor: '#fef9c3',
        textColor: '#a16207',
    },
    ON_HOLD: {
        value: 'ON_HOLD',
        label: 'On Hold',
        color: '#f97316',
        bgColor: '#ffedd5',
        textColor: '#c2410c',
    },
    DONE: {
        value: 'DONE',
        label: 'Done',
        color: '#22c55e',
        bgColor: '#dcfce7',
        textColor: '#15803d',
    },
    CANCEL: {
        value: 'CANCEL',
        label: 'Cancel',
        color: '#ef4444',
        bgColor: '#fee2e2',
        textColor: '#b91c1c',
    },
} as const;

export type TicketStatus = keyof typeof STATUS_CONFIG;

export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_FILES: 15,
} as const;

export const ROLE_LABELS: Record<string, string> = {
    'ADMIN': 'Admin',
    'IT_ADMIN': 'IT Admin',
    'ENGINEER_ADMIN': 'Engineer Admin',
    'USER': 'User',
};

// Helper functions
export function getDamageTypes(ticketType: 'it' | 'engineer') {
    return ticketType === 'it' ? IT_DAMAGE_TYPES : ENGINEER_DAMAGE_TYPES;
}

export function getAreas(ticketType: 'it' | 'engineer') {
    return ticketType === 'it' ? IT_AREAS : ENGINEER_AREAS;
}

export function getStatusConfig(status: string) {
    return STATUS_CONFIG[status as TicketStatus] || STATUS_CONFIG.NEW;
}

export function getStatusLabel(status: string): string {
    return getStatusConfig(status).label;
}
