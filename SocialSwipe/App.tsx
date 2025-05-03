// App.tsx (Corrected RootStack structure)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
    NavigationContainer,
    NavigatorScreenParams,
    DefaultTheme as NavigationDefaultTheme,
    DarkTheme as NavigationDarkTheme,
    // useNavigation // Removed as it's no longer used after placeholder removal
} from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DiscoveryProvider } from './src/contexts/DiscoveryContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// --- Import Screens ---
import AuthPage from './src/pages/AuthPage';
import CreateAccount from './src/pages/CreateAccount';
import CreateBusinessProfileScreen from './src/pages/CreateBusinessProfileScreen';
import CreateProfile from './src/pages/CreateProfile';
import DiscoverScreen from './src/pages/DiscoverScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import EditProfileScreen from './src/pages/EditProfile';
import EventsScreen from './src/pages/EventsScreen';
import ConversationsScreen from './src/pages/ConversationsScreen';
import ConnectionsScreen from './src/pages/ConnectionsScreen'; // Adjust path if needed
import ProfileDetailScreen from './src/pages/ProfileDetailScreen'; // Adjust path if needed
import ChatRoomScreen from './src/pages/ChatRoomScreen'; // <-- Actual screen import

// --- Import Icons ---
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions for Navigation ---
export type RootStackParamList = {
    Main: NavigatorScreenParams<MainTabParamList>;
    EditProfile: { profileData?: any };
    CreateProfile: undefined;
    CreateBusinessProfileScreen: undefined;
    ChatRoomScreen: {
        roomId: string;
        recipientName: string;
        recipientAvatarUrl: string | null;
        recipientId: string;
    };
    ProfileDetail: { userId: string };
};

type AuthStackParamList = { Login: undefined; SignUp: undefined; };
type OnboardingStackParamList = { CreateProfile: undefined; CreateBusinessProfileScreen: undefined; };
type MainTabParamList = {
    DiscoverTab: undefined;
    EventsTab: undefined;
    ConnectionsTab: undefined;
    ConversationsTab: undefined;
    ProfileTab: undefined;
};
// --- End Type Definitions ---

// --- Create Navigators (Unchanged) ---
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();

// --- Custom App Header Component (Unchanged) ---
function AppHeader({ navigation, route, options }: NativeStackHeaderProps | BottomTabHeaderProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    // Check if navigation object and canGoBack method exist before calling
    const canGoBack = navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack();

    const headerGradientConfig = theme?.gradients?.primaryHeader;
    const useGradientHeader = !theme?.isDark && !!headerGradientConfig;

    const applyHeaderBlur = true;
    const blurTint = theme?.isDark ? 'dark' : 'light';

    if (!theme) return null;

    const HeaderContainerComponent = useGradientHeader ? LinearGradient : View;
    const headerProps = useGradientHeader ? headerGradientConfig : {};

    return (
        <HeaderContainerComponent
            {...headerProps}
            style={[
                styles.headerContainer,
                {
                    backgroundColor: !useGradientHeader ? theme.colors.headerBackground : undefined,
                    paddingTop: insets.top,
                    height: (theme.header?.height || 60) + insets.top,
                    overflow: 'hidden',
                }
            ]}
        >
            {applyHeaderBlur && (
                <BlurView
                    intensity={80}
                    tint={blurTint}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <View style={styles.headerContent}>
                {canGoBack && navigation && typeof navigation.goBack === 'function' && ( // Add check for goBack
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons
                            name="chevron-back"
                            size={theme.fonts?.sizes?.xxLarge || 45}
                            color={theme.colors.headerText}
                        />
                    </TouchableOpacity>
                )}
                <Text
                    style={[
                        styles.headerTitle,
                        {
                            color: theme.colors.headerText,
                            fontSize: theme.fonts?.sizes?.xxLarge || 26,
                            fontWeight: 'bold',
                        }
                    ]}
                    numberOfLines={1}
                >
                    {/* Use title from options if available, fallback */}
                    {options?.title ?? route?.name ?? 'Sphere'}
                </Text>
                 <View style={styles.rightSpacer} />
            </View>
        </HeaderContainerComponent>
    );
}
// --- End Custom App Header Component ---

// --- Navigator Components ---

// AuthStack (Unchanged)
function AuthStack() {
     return (
         <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
             <AuthStackNav.Screen name="Login" component={AuthPage} />
             <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
         </AuthStackNav.Navigator>
     );
}

// OnboardingStack (Unchanged)
function OnboardingStack({ initialRouteName }: { initialRouteName?: keyof OnboardingStackParamList }) {
    const { theme } = useTheme();
    if (!theme) { return <View style={styles.screen}><ActivityIndicator /></View>; }
    const screenOptions: NativeStackNavigationOptions = {
        // Use AppHeader for consistency, disable default header
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
        headerBackVisible: false, // Managed by AppHeader
        gestureEnabled: false,
        contentStyle: { backgroundColor: theme.colors.background },
    };
    const finalInitialRoute = initialRouteName || 'CreateProfile';
    return (
        <OnboardingStackNav.Navigator initialRouteName={finalInitialRoute} screenOptions={screenOptions} >
            <OnboardingStackNav.Screen name="CreateProfile" component={CreateProfile} options={{ title: 'Create Personal Profile' }} />
            <OnboardingStackNav.Screen name="CreateBusinessProfileScreen" component={CreateBusinessProfileScreen} options={{ title: 'Create Business Profile' }} />
        </OnboardingStackNav.Navigator>
    );
}

// MainTabs (Unchanged)
function MainTabs() {
    const { theme } = useTheme();

    if (!theme) {
         return (
             <View style={styles.screen}>
                 <ActivityIndicator />
             </View>
         );
    }

    const tabBarGradientConfig = theme.gradients?.tabBarBackground;
    const useGradientTabBar = !theme.isDark && !!tabBarGradientConfig;

    const applyTabBarBlur = true;
    const blurTint = theme.isDark ? 'dark' : 'light';

    return (
        <MainTabNav.Navigator
            sceneContainerStyle={{ backgroundColor: theme.colors.background }}
            screenOptions={({ route }) => ({
                // Keep using AppHeader at the RootStack level, hide tab headers
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 0,
                    backgroundColor: 'transparent', // Needed for blur/gradient background
                    position: 'absolute', // Often needed for blur/gradient background
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0, // Remove shadow on Android if needed
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
                    if (route.name === 'DiscoverTab') iconName = focused ? 'search' : 'search-outline';
                    else if (route.name === 'EventsTab') iconName = focused ? 'heart' : 'heart-outline';
                    else if (route.name === 'ConnectionsTab') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'ConversationsTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarBackground: () => ( // Correct usage for background component
                    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                        {useGradientTabBar && tabBarGradientConfig ? (
                            <LinearGradient
                                {...tabBarGradientConfig}
                                style={StyleSheet.absoluteFill}
                            />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: theme.colors.card }} /> // Fallback solid color
                        )}
                        {applyTabBarBlur && (
                            <BlurView
                                intensity={90} // Adjust intensity as needed
                                tint={blurTint}
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                    </View>
                ),
            })}
        >
            <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
            <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'Liked Profiles' }} />
            <MainTabNav.Screen name="ConnectionsTab" component={ConnectionsScreen} options={{ title: 'Connections' }} />
            <MainTabNav.Screen name="ConversationsTab" component={ConversationsScreen} options={{ title: 'Messages' }} />
            <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
        </MainTabNav.Navigator>
    );
}
// --- End MainTabs ---

// --- RootStack ---
function RootStack() {
     const { theme } = useTheme();

    if (!theme) {
         return (
             <View style={styles.screen}>
                 <ActivityIndicator />
             </View>
         );
    }

    return (
        // *** Corrected Structure: Ensure only Screen components are direct children ***
        <RootStackNav.Navigator
            screenOptions={{
                header: (props) => <AppHeader {...props} />, // Use custom header globally
            }}
        >
            {/* Main screen containing tabs - AppHeader might be shown depending on options */}
            <RootStackNav.Screen
                name="Main"
                component={MainTabs}
                // Hide the RootStack header for the screen containing the tabs,
                // as the tabs handle their own content display. Title set in AppHeader via options.
                options={{ headerShown: false, title: 'Sphere' }} // Set a default title for Main/Tabs
            />
            {/* Other screens stacked on top of the tabs */}
            <RootStackNav.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ title: 'Edit Profile' }} // Title for AppHeader
            />
            <RootStackNav.Screen
                name="CreateProfile"
                component={CreateProfile}
                // This screen likely uses the OnboardingStack header if pushed from there,
                // or AppHeader if pushed from RootStack. Check navigation flow.
                // If part of onboarding, it might not be needed here. Added for completeness.
                options={{ title: 'Create Personal Profile' }}
            />
             <RootStackNav.Screen
                name="CreateBusinessProfileScreen"
                component={CreateBusinessProfileScreen}
                // Similar to CreateProfile, check if it belongs here or only in OnboardingStack
                options={{ title: 'Create Business Profile' }}
            />
            <RootStackNav.Screen
                name="ChatRoomScreen"
                component={ChatRoomScreen}
                // Title is set dynamically within ChatRoomScreen, AppHeader will pick it up.
                // You can provide a fallback options={{ title: 'Chat' }} if needed.
            />
            <RootStackNav.Screen
                name="ProfileDetail"
                component={ProfileDetailScreen}
                options={{ title: 'Profile Details' }} // Title for AppHeader
            />
            {/* Ensure no comments, whitespace, or other elements are direct children here */}
        </RootStackNav.Navigator>
    );
}
// --- End RootStack Correction ---


// --- AppContent (Logic might need refinement based on profile state) ---
function AppContent() {
    const { session, loadingAuth, profile } = useAuth(); // Use profile state if available
    const { theme } = useTheme();

    if (loadingAuth || !theme) {
        const loadingBackgroundColor = theme ? theme.colors.background : '#FFFFFF';
        return (
            <View style={[styles.screen, { backgroundColor: loadingBackgroundColor }]}>
                <ActivityIndicator size="large" color={theme ? theme.colors.primary : '#FF6347'} />
            </View>
        );
    }

    if (session && session.user) {
        // Example onboarding check: Replace 'profile?.setupComplete' with your actual logic
        // const needsOnboarding = !profile || !profile.setupComplete;
        // if (needsOnboarding) {
        //      // Determine initial onboarding route based on profile status
        //      const initialRoute = profile?.needsBusinessProfile ? 'CreateBusinessProfileScreen' : 'CreateProfile';
        //      return <OnboardingStack initialRouteName={initialRoute} />;
        // }
        // If logged in and onboarding is complete (or not needed), show main app
        return <RootStack />;
    } else {
        // No session, show Auth stack
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component (Unchanged) ---
export default function App() {
    return (
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    );
}

// --- Helper component to access theme (Unchanged) ---
function AppWithTheme() {
     const { theme } = useTheme();
    if (!theme) { return <View style={styles.screen}><ActivityIndicator size="large" /></View>; }
    const navigationTheme = React.useMemo(() => {
        const navTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;
        return {
            ...navTheme, colors: { ...navTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border },
        };
    }, [theme]);
    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <DiscoveryProvider>
                        <NavigationContainer theme={navigationTheme}>
                            <AppContent />
                        </NavigationContainer>
                        <Toast />
                    </DiscoveryProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
// --- End AppWithTheme ---


// --- Styles (Minor adjustment for header title flexibility) ---
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    headerContainer: { justifyContent: 'flex-end', /* Align content towards bottom */ },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
       // Removed fixed height, let content + paddingTop determine height
        backgroundColor: 'transparent', // For BlurView/Gradient
        position: 'relative', // Ensure content is above BlurView
        zIndex: 1,
        paddingBottom: 8, // Add some padding at the bottom
    },
    backButton: {
        padding: 5,
        // Position absolutely or adjust layout to prevent title shift
        position: 'absolute',
        left: 10,
        bottom: 8, // Align with text padding
        zIndex: 2, // Ensure button is clickable
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center', // Center title text
        // fontWeight: 'bold', // Moved to component style prop
        // fontSize: 26, // Moved to component style prop
        // color: // Set via theme in component style prop
        marginHorizontal: 50, // Give space for back button and spacer
    },
    rightSpacer: {
        width: 55, // Match back button area width (approx icon size + padding * 2)
    }
});

// Export RootStackParamList (Defined at top)
// export type { RootStackParamList };