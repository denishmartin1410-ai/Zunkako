// ====================================================
// Zunkako App - Global Theme & Colors
// Premium Green + Blue Gradient Theme
// ====================================================

import {Dimensions, PixelRatio} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375;

// Dynamic responsive font scaling with safe clamp boundary to prevent overflow
export const getResponsiveFontSize = size => {
  const newSize = size * scale;
  const fontScale = PixelRatio.getFontScale();
  // Bound font scale between 0.85 and 1.15 so text never clips on small/large devices
  const clampedFontScale = Math.min(Math.max(fontScale, 0.85), 1.15);
  return Math.round(PixelRatio.roundToNearestPixel(newSize / clampedFontScale));
};

export const COLORS = {
  // Primary Gradient Colors
  primaryGreen: '#1B8A4E',
  primaryGreenLight: '#27AE60',
  primaryGreenDark: '#0D5C32',
  primaryBlue: '#1565C0',
  primaryBlueMid: '#1976D2',
  primaryBlueLight: '#2196F3',

  // Gradient Arrays
  gradientPrimary: ['#1B8A4E', '#1565C0'],
  gradientSecondary: ['#27AE60', '#2196F3'],
  gradientCard: ['#0D5C32', '#1565C0'],
  gradientSoft: ['#E8F5E9', '#E3F2FD'],
  gradientHero: ['#0D5C32', '#1B8A4E', '#1565C0'],
  gradientButton: ['#27AE60', '#1976D2'],
  gradientDark: ['#0A3D20', '#0D47A1'],

  // Accent Colors
  accentGold: '#F4A61D',
  accentOrange: '#FF7043',
  accentRed: '#E53935',
  accentTeal: '#00897B',
  accentPurple: '#7B1FA2',

  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  background: '#F0F7F4',
  backgroundBlue: '#EDF4FF',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FFFE',

  // Text Colors
  textPrimary: '#1A2E1A',
  textSecondary: '#4A6741',
  textMuted: '#8BA888',
  textWhite: '#FFFFFF',
  textGray: '#9E9E9E',

  // Status Colors
  success: '#2E7D32',
  warning: '#F57F17',
  error: '#C62828',
  info: '#1565C0',

  // Border & Divider
  border: '#C8E6C9',
  borderLight: '#E8F5E9',
  divider: '#DCEDC8',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  overlayGreen: 'rgba(27,138,78,0.15)',
  overlayBlue: 'rgba(21,101,192,0.15)',

  // Card & Shadow
  cardBackground: '#FFFFFF',
  shadowColor: '#1B8A4E',
  shadowColorBlue: '#1565C0',

  // Verified Badge
  verified: '#1565C0',
  verifiedLight: '#E3F2FD',

  // Star Rating
  starFilled: '#F4A61D',
  starEmpty: '#E0E0E0',
};

export const FONTS = {
  // ─────────────────────────────────────────
  // Standardized Responsive Font Sizes (15-70 Age Group Multi-device Fit)
  // ─────────────────────────────────────────
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 34,
  hero: 40,

  // Font Weights (use as strings for RN)
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',

  // Line Heights
  lineHeightSm: 20,
  lineHeightMd: 24,
  lineHeightLg: 28,
  lineHeightXl: 34,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 50,
  full: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#1B8A4E',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#1B8A4E',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#1565C0',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const SCREEN = {
  headerHeight: 60,
  tabBarHeight: 65,
  bottomInset: 20,
};

export const getThemeColors = isDark => ({
  bg: isDark ? '#121212' : COLORS.background,
  cardBg: isDark ? '#1E1E1E' : COLORS.white,
  text: isDark ? '#FFFFFF' : COLORS.textPrimary,
  subText: isDark ? '#AAAAAA' : COLORS.textSecondary,
  border: isDark ? '#333333' : COLORS.border,
  borderLight: isDark ? '#222222' : COLORS.borderLight,
  textMuted: isDark ? '#777777' : COLORS.textMuted,
  surface: isDark ? '#1E1E1E' : COLORS.surface,
  divider: isDark ? '#2A2A2A' : COLORS.divider,
  inputBg: isDark ? '#252525' : COLORS.white,
  placeholder: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
});
