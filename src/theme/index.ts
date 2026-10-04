/**
 * SolarClean Design System – Tokens & Theme
 */

export const Colors = {
  // Core palette
  navy: '#1f3864',
  navyDark: '#162847',
  navyLight: '#2a4a80',
  skyBlue: '#2e75b6',
  skyBlueLight: '#4a9fd4',
  amber: '#f5a623',
  amberDark: '#e08c0a',
  amberLight: '#ffc44d',

  // Status colors
  success: '#34c759',
  warning: '#ff9f0a',
  danger: '#ff3b30',
  info: '#0a84ff',

  // Neutrals
  white: '#ffffff',
  offWhite: '#f8f9fa',
  gray100: '#f1f3f5',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#6c757d',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529',
  black: '#000000',

  // Dark mode surfaces
  surface1Dark: '#0e1e35',
  surface2Dark: '#162847',
  surface3Dark: '#1f3864',
  surface4Dark: '#2a4a80',

  // Light mode surfaces
  surface1Light: '#f0f4f8',
  surface2Light: '#ffffff',
  surface3Light: '#e8f0fe',
  surface4Light: '#d0e3f8',

  // Transparent overlays
  overlayDark: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(255,255,255,0.15)',
  glassLight: 'rgba(255,255,255,0.08)',
  glassDark: 'rgba(0,0,0,0.25)',
} as const;

export interface Theme {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  tabBar: string;
  tabBarBorder: string;
}

export const darkTheme: Theme = {
  dark: true,
  bg: Colors.surface1Dark,
  surface: Colors.surface2Dark,
  surface2: Colors.surface3Dark,
  card: Colors.surface2Dark,
  border: 'rgba(46,117,182,0.25)',
  text: Colors.white,
  textSecondary: Colors.gray400,
  textMuted: Colors.gray600,
  primary: Colors.skyBlue,
  accent: Colors.amber,
  tabBar: Colors.surface1Dark,
  tabBarBorder: 'rgba(46,117,182,0.3)',
};

export const lightTheme: Theme = {
  dark: false,
  bg: Colors.surface1Light,
  surface: Colors.surface2Light,
  surface2: Colors.surface3Light,
  card: Colors.white,
  border: 'rgba(46,117,182,0.15)',
  text: Colors.navy,
  textSecondary: Colors.gray600,
  textMuted: Colors.gray400,
  primary: Colors.skyBlue,
  accent: Colors.amberDark,
  tabBar: Colors.white,
  tabBarBorder: Colors.gray200,
};

export const Typography = {
  // Font families
  regular: 'System',
  medium: 'System',
  bold: 'System',

  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
  '5xl': 60,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  }),
} as const;
