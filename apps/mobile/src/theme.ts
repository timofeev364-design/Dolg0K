/**
 * Application theme and colors
 * "Obsidian Tech Premium" Design System
 */

export const colors = {
    // === Backgrounds (Deep, Matte) ===
    bg0: '#05070B',
    bg1: '#070B10',

    // === Surfaces (Physical Depth) ===
    surface1: '#0C121B',     // Base Cards
    surface2: '#101A26',     // Hover / Inputs
    surface3: '#142235',     // Active / Sidebar

    // === Strokes (3D) ===
    stroke1: 'rgba(255, 255, 255, 0.08)', // Slightly brighter for edges
    stroke2: 'rgba(255, 255, 255, 0.15)', // Stronger for interaction
    divider: 'rgba(255, 255, 255, 0.05)',

    // 3D Bevels
    highlight: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.5)',

    // === Text ===
    textPrimary: '#EAF0F7',
    textSecondary: '#A7B3C2',
    textTertiary: '#748196',
    textDisabled: '#4A5568',
    textOnAccent: '#001018',

    // === Accent (Ice) ===
    accent: '#6EE7FF',
    accentHover: '#3DDCFF',
    accentSoft: 'rgba(110, 231, 255, 0.12)',
    accentLine: 'rgba(110, 231, 255, 0.65)',

    // === Status (Muted/Soft) ===
    success: '#2AE8A7',
    successSoft: 'rgba(42, 232, 167, 0.12)',
    warning: '#F7C97B',
    warningSoft: 'rgba(247, 201, 123, 0.12)',
    danger: '#FF5A6B',
    dangerSoft: 'rgba(255, 90, 107, 0.12)',
    dangerStroke: 'rgba(255, 90, 107, 0.35)',

    // === Legacy aliases ===
    background: '#05070B',
    surface: '#0C121B',
    primary: '#6EE7FF',
    border: 'rgba(255, 255, 255, 0.06)',
    text: '#EAF0F7',
    error: '#FF5A6B',
    textMuted: '#748196', // Alias for textTertiary
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    section: 40,
    jumbo: 48,
};

export const radius = {
    small: 10,
    ui: 16, // Chunkier UI
    card: 20, // More rounded cards
    round: 999,
    xl: 24,
};

export const typography = {
    // Headings
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.2, color: colors.textPrimary },
    h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28, color: colors.textPrimary },
    h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24, color: colors.textPrimary },
    // Body
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24, color: colors.textPrimary },
    bodyM: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24, color: colors.textPrimary },
    caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18, color: colors.textSecondary },
    micro: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16, color: colors.textTertiary },
    // Tabular Numbers
    amountL: { fontSize: 28, fontWeight: '700' as const, lineHeight: 32, fontVariant: ['tabular-nums'], color: colors.textPrimary },
    amountM: { fontSize: 20, fontWeight: '600' as const, lineHeight: 24, fontVariant: ['tabular-nums'], color: colors.textPrimary },
    amountS: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20, fontVariant: ['tabular-nums'], color: colors.textPrimary },
};

// Premium Material Effects
export const effects = {
    shadow1: { // Card Lift
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 32,
        elevation: 12,
    },
    shadow2: { // Panel Lift
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 24 }, // Deeper offset
        shadowOpacity: 0.7,
        shadowRadius: 48,
        elevation: 24,
    },
    innerBevel: { // Pseudo-3D Top Highlight
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)', // Brighter top edge
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.6)', // Darker bottom shade for bevel
    },
    sheen: { // Metallic overlay
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    glassBevel: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderTopColor: 'rgba(255,255,255,0.2)',
        borderLeftColor: 'rgba(255,255,255,0.15)',
        borderBottomColor: 'rgba(0,0,0,0.5)',
        borderRightColor: 'rgba(0,0,0,0.5)',
    }
};

export function getCategoryColor(category: string): string {
    switch (category) {
        case 'utilities': return '#A78BFA';
        case 'credit': return colors.danger;
        case 'subscription': return colors.accent;
        case 'mfo': return '#FB923C';
        default: return colors.textSecondary;
    }
}

// === COMPATIBILITY OVERLAYS (Do not remove) ===
// These map old requests to new system to prevent crashes
export const borderRadius = {
    sm: radius.small,
    md: radius.ui,
    lg: radius.card,
    full: radius.round,
    xl: 24,
};

export const fontSize = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    caption: 12,
};

export const fontWeight = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
};
