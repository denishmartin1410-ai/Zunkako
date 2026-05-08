// ====================================================
// F2C App - Global Theme & Colors
// Premium Green + Blue Gradient Theme
// ====================================================

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
  // Font Sizes - பெரியவர்கள் முதல் சிறியவர்கள்
  // வரை அனைவரும் தெளிவாக படிக்க வேண்டும்
  // ─────────────────────────────────────────
  xs: 13,       // முன்பு: 10  → இப்போ: 13  (tags, badges)
  sm: 15,       // முன்பு: 12  → இப்போ: 15  (sub labels, hints)
  md: 17,       // முன்பு: 14  → இப்போ: 17  (body text, inputs)
  lg: 19,       // முன்பு: 16  → இப்போ: 19  (section titles)
  xl: 22,       // முன்பு: 18  → இப்போ: 22  (card titles)
  xxl: 26,      // முன்பு: 22  → இப்போ: 26  (screen titles)
  xxxl: 32,     // முன்பு: 28  → இப்போ: 32  (hero text)
  display: 42,  // முன்பு: 36  → இப்போ: 42  (big numbers)
  hero: 52,     // முன்பு: 44  → இப்போ: 52  (splash/welcome)

  // Font Weights (use as strings for RN)
  thin: '100',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',

  // Line Heights - reading comfort-க்காக
  lineHeightSm: 22,   // முன்பு: 18
  lineHeightMd: 26,   // முன்பு: 22
  lineHeightLg: 30,   // முன்பு: 26
  lineHeightXl: 38,   // முன்பு: 32
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#1B8A4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
