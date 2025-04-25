// src/contexts/ThemeContext.tsx
import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useMemo,
    useEffect,
    useCallback
} from 'react';
import { lightTheme, darkTheme, AppTheme } from '../theme/theme'; // Adjust path if needed
import { useColorScheme, Appearance } from 'react-native'; // Import Appearance for listener

// Define the shape of the context value
interface ThemeContextProps {
  theme: AppTheme;          // The current theme object (light or dark)
  isDarkMode: boolean;      // Convenience flag
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void; // Allow setting explicitly or follow system
  currentMode: 'light' | 'dark' | 'system'; // Track the current setting
}

// Create the context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get the initial system preference
  const systemColorScheme = useColorScheme(); // 'dark', 'light', or null

  // State to track the *user's chosen setting* ('light', 'dark', or 'system')
  // Default to 'system' to follow OS preference initially
  const [modeSetting, setModeSetting] = useState<'light' | 'dark' | 'system'>('system');

  // Determine the actual theme mode ('light' or 'dark') based on setting and system preference
  const effectiveThemeMode = useMemo((): 'light' | 'dark' => {
    if (modeSetting === 'system') {
      return systemColorScheme || 'light'; // Default to light if system preference is null
    }
    return modeSetting; // Use the explicitly set mode ('light' or 'dark')
  }, [modeSetting, systemColorScheme]);

  // Select the actual theme object based on the effective mode
  const currentTheme = useMemo(() => {
      console.log(`ThemeProvider: Effective theme mode is ${effectiveThemeMode} (Setting: ${modeSetting}, System: ${systemColorScheme})`);
      return effectiveThemeMode === 'dark' ? darkTheme : lightTheme;
  }, [effectiveThemeMode]); // Depend only on the final calculated mode

  // Function to allow changing the theme setting
  const setThemeMode = useCallback((newMode: 'light' | 'dark' | 'system') => {
      console.log(`ThemeProvider: Setting theme mode to: ${newMode}`);
      setModeSetting(newMode);
  }, []);

  // Optional: Add listener for system color scheme changes if mode is 'system'
  // This ensures the app updates if the OS setting changes while the app is running
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      console.log(`ThemeProvider: Appearance listener detected system change: ${colorScheme}`);
      // If the user has selected 'system', we might want to force a re-evaluation,
      // but the state change in `systemColorScheme` via `useColorScheme` hook
      // should already trigger the `effectiveThemeMode` recalculation.
      // No explicit state update needed here if `useColorScheme` updates reliably.
    });

    return () => {
      // Clean up the listener when the provider unmounts
      listener.remove();
    };
  }, []); // Run only once on mount

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    theme: currentTheme,
    isDarkMode: currentTheme.isDark, // Use isDark from the selected theme object
    setThemeMode,
    currentMode: modeSetting,
  }), [currentTheme, setThemeMode, modeSetting]); // Dependencies for the context value

  return (
    <ThemeContext.Provider value={value}>
        {children}
    </ThemeContext.Provider>
  );
};

// Custom Hook to use the theme context easily
export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
