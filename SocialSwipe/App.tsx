// App.tsx (Theming Tab Scene Container & Persistent Custom Header)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import {
    NavigationContainer,
    NavigatorScreenParams,
    DefaultTheme as NavigationDefaultTheme,
    DarkTheme as NavigationDarkTheme,
    useNavigation // Added useNavigation hook import
} from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabHeaderProps } from '@react-navigation/bottom-tabs'; // Added BottomTabHeaderProps
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext'; // Adjust path if needed
import { DiscoveryProvider } from './src/contexts/DiscoveryContext'; // Adjust path if needed
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext'; // Adjust path if needed
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient (already added)

// --- Import Screens ---
import AuthPage from './src/pages/AuthPage';
import CreateAccount from './src/pages/CreateAccount';
import CreateBusinessProfileScreen from './src/pages/CreateBusinessProfileScreen';
import CreateProfile from './src/pages/CreateProfile';
import DiscoverScreen from './src/pages/DiscoverScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import EditProfileScreen from './src/pages/EditProfile';
import EventsScreen from './src/pages/EventsScreen';
import ConversationsScreen from './src/pages/ConversationsScreen'; // Adjust path if needed

// --- Import Icons ---
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions for Navigation ---
// Unchanged Type Definitions...
type AuthStackParamList = { Login: undefined; SignUp: undefined; };
type OnboardingStackParamList = { CreateProfile: undefined; CreateBusinessProfileScreen: undefined; };
type MainTabParamList = {
  DiscoverTab: undefined;
  EventsTab: undefined; // Liked Profiles
  ConversationsTab: undefined; // Messages/Chats
  ProfileTab: undefined;
  NotificationsTab: undefined;
};
type RootStackParamList = {
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
};
// --- End Type Definitions ---


// --- Create Navigators ---
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();


// --- Placeholder Screens (Keep as is) ---
function NotificationsScreen() { return <View style={styles.screen}><Text>Notifications Screen</Text></View>; }
function ChatRoomScreen({ route }: any) {
    const { roomId, recipientName } = route.params;
    const { theme } = useTheme();
    const screenStyle = theme ? { backgroundColor: theme.colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' } : styles.screen;
    const textStyle = theme ? { color: theme.colors.text } : {};
    return (
        <View style={screenStyle}>
            <Text style={textStyle}>Room ID: {roomId}</Text>
            <Text style={textStyle}>Chatting with: {recipientName}</Text>
        </View>
    );
}


// --- Custom App Header Component --- (MODIFIED)
function AppHeader({ navigation, route, options }: NativeStackHeaderProps | BottomTabHeaderProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const canGoBack = navigation.canGoBack();

    // Get gradient config from theme for header (assuming it's named 'primaryHeader')
    const headerGradientConfig = theme?.gradients?.primaryHeader;
    // Determine if we should use the gradient
    const useGradientHeader = !theme?.isDark && !!headerGradientConfig;

    if (!theme) return null;

    const HeaderContainerComponent = useGradientHeader ? LinearGradient : View;
    const headerProps = useGradientHeader ? headerGradientConfig : {};


    return (
        <HeaderContainerComponent
            {...headerProps} // Spread colors, start, end from theme if using gradient
            style={[
                styles.headerContainer,
                {
                    backgroundColor: !useGradientHeader ? theme.colors.headerBackground : undefined, // Fallback bg color
                    paddingTop: insets.top,
                    height: (theme.header?.height || 60) + insets.top,
                }
            ]}
        >
            <View style={styles.headerContent}>
                {canGoBack && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons
                            name="chevron-back"
                            size={theme.fonts?.sizes?.xxLarge || 45} // Ensure this matches spacer if needed
                            color={theme.colors.headerText}
                        />
                    </TouchableOpacity>
                )}
                {/* Removed the back button placeholder */}
                <Text
                    style={[
                        styles.headerTitle,
                        {
                            color: theme.colors.headerText,
                            fontSize: theme.fonts?.sizes?.xxLarge || 26,
                            fontWeight: 'bold',
                            // REMOVED conditional marginLeft: !canGoBack ? styles.rightSpacer.width : 0
                            // Title will now naturally align left when back button is not present
                        }
                    ]}
                    numberOfLines={1}
                >
                    Sphere
                </Text>
                 <View style={styles.rightSpacer} />
            </View>
        </HeaderContainerComponent>
    );
}
// --- End Custom App Header Component ---


// --- Navigator Components ---

// AuthStack (Keep as is)
function AuthStack() {
    // ... (no changes)
     return (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login" component={AuthPage} />
            <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
        </AuthStackNav.Navigator>
    );
}

// OnboardingStack (Keep as is)
function OnboardingStack({ initialRouteName }: { initialRouteName?: keyof OnboardingStackParamList }) {
    // ... (no changes)
    const { theme } = useTheme();
    if (!theme) { return <View style={styles.screen}><ActivityIndicator /></View>; }
    const screenOptions: NativeStackNavigationOptions = {
        headerShown: true, headerBackVisible: false, gestureEnabled: false,
        headerStyle: { backgroundColor: theme.colors.headerBackground },
        headerTintColor: theme.colors.headerText,
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

// --- MainTabs --- (Keep as is from previous step)
function MainTabs() {
    const { theme } = useTheme(); // Get theme here

    if (!theme) {
         return (
            <View style={styles.screen}>
                <ActivityIndicator />
            </View>
        );
    }

    // Get the gradient config for the tab bar ONCE outside screenOptions
    const tabBarGradientConfig = theme.gradients?.tabBarBackground;
    // Determine if we should use the gradient (light theme AND gradient config exists)
    const useGradientTabBar = !theme.isDark && !!tabBarGradientConfig;

    return (
        <MainTabNav.Navigator
            sceneContainerStyle={{ backgroundColor: theme.colors.background }}
            screenOptions={({ route }) => ({
                headerShown: false, // No header for individual tabs
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    // Remove backgroundColor - background is now handled by tabBarBackground prop
                    // backgroundColor: theme.colors.card,
                    borderTopColor: theme.colors.border, // Keep border color
                },
                tabBarIcon: ({ focused, color, size }) => {
                    // Icon logic remains the same
                    let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
                    if (route.name === 'DiscoverTab') iconName = focused ? 'search' : 'search-outline';
                    else if (route.name === 'EventsTab') iconName = focused ? 'heart' : 'heart-outline';
                    else if (route.name === 'ConversationsTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                    else if (route.name === 'NotificationsTab') iconName = focused ? 'notifications' : 'notifications-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                // *** ADDED: tabBarBackground prop ***
                tabBarBackground: () => {
                    // Check if we should use the gradient (calculated above)
                    if (useGradientTabBar && tabBarGradientConfig) {
                        // Render the gradient if applicable
                        return (
                            <LinearGradient
                                {...tabBarGradientConfig} // Spread colors, start, end from theme
                                style={StyleSheet.absoluteFill} // Fill the tab bar area
                            />
                        );
                    } else {
                        // Otherwise, render a plain View with the fallback card color
                        // This ensures dark mode uses its solid background color
                        return (
                            <View style={{
                                flex: 1,
                                backgroundColor: theme.colors.card // Use card color from theme
                            }} />
                        );
                    }
                }, // --- End tabBarBackground ---
            })}
        >
            {/* Screens remain the same */}
            <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
            <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'Liked Profiles' }} />
            <MainTabNav.Screen name="ConversationsTab" component={ConversationsScreen} options={{ title: 'Messages' }} />
            <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
            <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </MainTabNav.Navigator>
    );
}
// --- End MainTabs Modification ---

// --- RootStack --- (Keep as is - applies custom header globally)
function RootStack() {
    // ... (no changes)
     const { theme } = useTheme();

    if (!theme) {
         return (
            <View style={styles.screen}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <RootStackNav.Navigator
            screenOptions={{
                header: (props) => <AppHeader {...props} />,
            }}
        >
            <RootStackNav.Screen name="Main" component={MainTabs}/>
            <RootStackNav.Screen name="EditProfile" component={EditProfileScreen}/>
            <RootStackNav.Screen name="CreateProfile" component={CreateProfile}/>
            <RootStackNav.Screen name="CreateBusinessProfileScreen" component={CreateBusinessProfileScreen}/>
            <RootStackNav.Screen name="ChatRoomScreen" component={ChatRoomScreen}/>
        </RootStackNav.Navigator>
    );
}
// --- End RootStack ---


// --- AppContent (Keep as is) ---
function AppContent() {
    // ... (no changes)
    const { session, loadingAuth } = useAuth();
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
        return <RootStack />;
    } else {
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component --- (Keep as is)
export default function App() {
    // ... (no changes)
    return (
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    );
}

// --- Helper component to access theme for Root View and Navigation --- (Keep as is)
function AppWithTheme() {
    // ... (no changes needed here for tab bar gradient)
     const { theme } = useTheme();
    if (!theme) { return <View style={styles.screen}><ActivityIndicator size="large" /></View>; }
    const navigationTheme = React.useMemo(() => {
        const navTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;
        return {
            ...navTheme, colors: { ...navTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border },
        };
    }, [theme]);
    return (
        // Using standard background color here. Root background gradient applied separately if desired.
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


// --- Styles --- (Keep as is, except removed backButtonPlaceholder)
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    headerContainer: { /* ... */ justifyContent: 'center', },
    headerContent: { /* ... */ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, flex: 1, backgroundColor: 'transparent', },
    backButton: { /* ... */ padding: 5, marginRight: 0, }, // Keep marginRight 0 or adjust as needed
    // backButtonPlaceholder style definition is removed
    headerTitle: { /* ... */ flex: 1, textAlign: 'left', }, // Ensures title aligns left within its flex container
    rightSpacer: { /* ... */ width: (45 + 5*2), } // Keep for potential right-side balance
});

// Export RootStackParamList for use in other components
export type { RootStackParamList };