// src/theme/theme.ts
import { TextStyle } from 'react-native'; // Import TextStyle for font weights

// Define the structure for your colors
interface Colors {
  primary: string;        // Main interactive color (buttons, links)
  secondary: string;      // Secondary accent color
  background: string;     // Screen background
  card: string;           // Card background (slightly different from screen bg)
  text: string;           // Primary text color
  textSecondary: string;  // Lighter/dimmed text color
  border: string;         // Border color for inputs, dividers etc.
  accent: string;         // Extra accent color (optional)
  success: string;        // Success feedback color
  error: string;          // Error feedback color
  warning: string;        // Warning feedback color
  headerBackground: string; // Background for headers/nav bars
  headerText: string;     // Text color for headers/nav bars
  buttonText: string;     // Text color for primary buttons
  // Add more specific colors as needed (e.g., disabled, placeholder)
}

// Define the structure for fonts
interface Fonts {
  families: {
    regular: string; // Font family name (ensure it's linked/available)
    bold: string;
    // Add more (e.g., light, medium, italic) if needed
  };
  sizes: {
    caption: number;
    small: number;
    medium: number; // Standard body text
    large: number;
    xlarge: number; // Titles
    xxlarge: number; // Main headings
  };
  weights: {
      // Use string values compatible with TextStyle['fontWeight']
      light: '300';
      regular: '400' | 'normal';
      medium: '500';
      bold: '700' | 'bold';
  }
}

// Define spacing units
interface Spacing {
  xxs: number; // 4
  xs: number;  // 8
  sm: number;  // 12
  md: number;  // 16 (standard margin/padding)
  lg: number;  // 24
  xl: number;  // 32
  xxl: number; // 48
}

// Define the overall Theme interface
export interface AppTheme {
  isDark: boolean; // Flag to easily check theme type
  colors: Colors;
  fonts: Fonts;
  spacing: Spacing;
  borderRadius: {
      small: number;
      medium: number;
      large: number;
      xlarge: number; // For cards etc.
  };
  // You could add more complex shared styles here later
  // e.g., buttonVariants: { primary: ButtonStyle, secondary: ButtonStyle }
}

// --- Base Theme Properties (Shared between light/dark) ---
// Define fonts, spacing, border radius once to avoid duplication
const baseFonts: Fonts = {
  families: {
    regular: 'System', // Use system default or replace with your custom font name
    bold: 'System',    // Use system default or replace with your custom bold font name
  },
  sizes: {
    caption: 10,
    small: 12,
    medium: 14,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    bold: '700',
  }
};

const baseSpacing: Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const baseBorderRadius = {
  small: 4,
  medium: 8,
  large: 12, // Good for buttons/inputs
  xlarge: 16, // Good for cards
};


// --- Light Theme Definition ---
export const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    primary: '#A7C7E7',       // Your lighter blue for main actions
    secondary: '#549be3',     // Your darker blue as secondary accent
    background: '#000014',    // Light gray background
    card: '#003575',          // White cards
    text: '#1F2937',          // Dark gray text
    textSecondary: '#6B7280', // Medium gray text
    border: '#D1D5DB',        // Light gray border
    accent: '#F59E0B',        // Example: Amber accent
    success: '#10B981',       // Example: Green
    error: '#EF4444',         // Example: Red
    warning: '#FBBF24',       // Example: Yellow/Orange
    headerBackground: '#081c44', // Use the darker blue for header
    headerText: '#FFFFFF',    // White text on dark header
    buttonText: '#FFFFFF',    // White text on primary buttons
  },
  fonts: baseFonts,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
};

// --- Dark Theme Definition ---
export const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    primary: '#003575',       // Adjusted lighter blue for better contrast on dark
    secondary: '#081c44',     // Darker blue remains secondary
    background: '#111827',    // Very dark gray/blue background
    card: '#1F2937',          // Dark gray cards
    text: '#F9FAFB',          // Off-white text
    textSecondary: '#9CA3AF', // Lighter gray text
    border: '#374151',        // Darker gray border
    accent: '#F59E0B',        // Amber accent can often work on dark too
    success: '#34D399',       // Brighter green
    error: '#F87171',         // Brighter red
    warning: '#FCD34D',       // Brighter yellow/orange
    headerBackground: '#081c44', // Dark blue header remains same
    headerText: '#FFFFFF',    // White text on dark header
    buttonText: '#FFFFFF',    // White text on primary buttons
  },
  fonts: baseFonts,
  spacing: baseSpacing,
  borderRadius: baseBorderRadius,
};
