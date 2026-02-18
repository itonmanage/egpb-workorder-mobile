/**
 * EGPB Ticket Mobile - Design System / Theme
 * Matches the web app's green/white color scheme
 */

export const Colors = {
    // Primary - Green (matching web)
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#22c55e',
    primaryBg: '#f0fdf4',
    primaryBorder: '#bbf7d0',

    // Status colors (matching web STATUS_CONFIG)
    statusNew: '#3b82f6',
    statusNewBg: '#dbeafe',
    statusNewText: '#1d4ed8',

    statusInProgress: '#eab308',
    statusInProgressBg: '#fef9c3',
    statusInProgressText: '#a16207',

    statusOnHold: '#f97316',
    statusOnHoldBg: '#ffedd5',
    statusOnHoldText: '#c2410c',

    statusDone: '#22c55e',
    statusDoneBg: '#dcfce7',
    statusDoneText: '#15803d',

    statusCancel: '#ef4444',
    statusCancelBg: '#fee2e2',
    statusCancelText: '#b91c1c',

    // Neutral
    white: '#ffffff',
    background: '#f9fafb',
    surface: '#ffffff',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',

    // Text
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    textInverse: '#ffffff',

    // Feedback
    error: '#ef4444',
    errorBg: '#fef2f2',
    errorBorder: '#fecaca',
    warning: '#f97316',
    warningBg: '#fff7ed',
    warningBorder: '#fed7aa',
    info: '#3b82f6',
    infoBg: '#eff6ff',
    infoBorder: '#bfdbfe',
    success: '#22c55e',
    successBg: '#f0fdf4',

    // Misc
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 48,
};

export const FontSize = {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    title: 34,
};

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
};

export const BorderRadius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    xxl: 24,
    full: 9999,
};

export const Shadow = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
};
