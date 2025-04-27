// src/theme/theme.ts
import { TextStyle } from 'react-native';

// --- Interfaces (Colors, Fonts, Spacing) ---
interface Colors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  headerBackground: string;
  headerText: string;
  buttonText: string;
}

interface Fonts {
  families: { regular: string; bold: string; };
  sizes: { // Contains '.large'
    caption: number;
    small: number;
    medium: number;
    large: number; // Property 'large' defined here
    xlarge: number;
    xxlarge: number;
  };
  weights: { light: '300'; regular: '400' | 'normal'; medium: '500'; bold: '700' | 'bold'; }
}

interface Spacing { /* ... */ } // Defines 'lg', not 'large'

// --- GradientConfig Interface ---
interface GradientConfig {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
}

// --- AppTheme Interface ---
export interface AppTheme {
  isDark: boolean;
  colors: Colors;
  fonts: Fonts; // Non-optional, expected to be present
  spacing: Spacing; // Non-optional, expected to be present
  borderRadius: { // Non-optional, expected to be present and contains '.large'
      small: number;
      medium: number;
      large: number; // Property 'large' defined here
      xlarge: number;
  };
  gradients?: { // Optional gradients property
      primaryHeader?: GradientConfig;
      screenBackground?: GradientConfig;
      tabBarBackground?: GradientConfig;
      [key: string]: GradientConfig | undefined;
  };
}

// --- Base Theme Properties ---
// These objects are fully defined and assigned below
const baseFonts: Fonts = {
  families: { regular: 'System', bold: 'System' },
  sizes: { caption: 10, small: 12, medium: 14, large: 18, xlarge: 24, xxlarge: 32 },
  weights: { light: '300', regular: '400', medium: '500', bold: '700' }
};

const baseSpacing: Spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 };

const baseBorderRadius = { // Defines '.large'
  small: 4, medium: 8, large: 12, xlarge: 16
};


// --- Light Theme Definition ---
export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    primary: '#A7C7E7',
    secondary: '#549be3',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#D1D5DB',
    accent: '#F59E0B',
    success: '#10B981',
    error: '#EF4444',
    warning: '#FBBF24',
    headerBackground: '#FFFFFF',
    headerText: '#1F2937',
    buttonText: '#FFFFFF',
  },
  fonts: baseFonts, // Assigns the fully defined baseFonts object
  spacing: baseSpacing, // Assigns the fully defined baseSpacing object
  borderRadius: baseBorderRadius, // Assigns the fully defined baseBorderRadius object
  gradients: {
      primaryHeader: { colors: ['red', 'yellow'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      screenBackground: { colors: ['#E0F2FE', '#FFFFFF'], start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
      tabBarBackground: { colors: ['red', 'yellow'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
  },
};

// --- Dark Theme Definition ---
export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    primary: '#003575',
    secondary: '#081c44',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    accent: '#F59E0B',
    success: '#34D399',
    error: '#F87171',
    warning: '#FCD34D',
    headerBackground: '#081c44',
    headerText: '#FFFFFF',
    buttonText: '#FFFFFF',
  },
  fonts: baseFonts, // Assigns the fully defined baseFonts object
  spacing: baseSpacing, // Assigns the fully defined baseSpacing object
  borderRadius: baseBorderRadius, // Assigns the fully defined baseBorderRadius object
  // No gradients defined for dark theme means theme.gradients will be undefined in dark mode
};