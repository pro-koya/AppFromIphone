export const Colors = {
  // Background
  background: '#F5F0E8',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE8DF',

  // Board
  boardBg: '#DDD8CF',
  cellEmpty: '#EDE8DF',
  cellBorder: '#C8C3BA',

  // Piece colors (muted, high-visibility palette)
  pieces: [
    '#6B8FAB', // slate blue
    '#7BA99C', // sage green
    '#B08A6E', // warm brown
    '#9B7EB8', // muted purple
    '#C97B6A', // terracotta
    '#8BAA7A', // moss green
    '#A89060', // tan
  ],

  // Text
  textPrimary: '#2C2A26',
  textSecondary: '#7A756C',
  textMuted: '#A8A39A',

  // Accent
  accent: '#6B8FAB',
  accentLight: '#C8D8E6',

  // Status
  success: '#7BA99C',
  error: '#C97B6A',
  warning: '#D4A853',

  // UI
  border: '#DDD8CF',
  shadow: '#00000015',

  // Ad placeholder
  adBg: '#F0EDE6',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};
