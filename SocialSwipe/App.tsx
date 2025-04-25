// App.tsx (Theming Tab Scene Container & Added Conversations Tab)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import {
    NavigationContainer,
    NavigatorScreenParams,
    DefaultTheme as NavigationDefaultTheme,
    DarkTheme as NavigationDarkTheme
} from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext'; // Adjust path if needed
import { DiscoveryProvider } from './src/contexts/DiscoveryContext'; // Adjust path if needed
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext'; // Adjust path if needed

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


// --- Placeholder Screens ---
function NotificationsScreen() { return <View style={styles.screen}><Text>Notifications Screen</Text></View>; }
function ChatRoomScreen({ route }: any) {
    const { roomId, recipientName } = route.params;
    // *** ADDED: Basic theme check for placeholder styling ***
    const { theme } = useTheme();
    const screenStyle = theme ? { backgroundColor: theme.colors.background, flex: 1, justifyContent: 'center', alignItems: 'center' } : styles.screen;
    const textStyle = theme ? { color: theme.colors.text } : {};
    return (
        <View style={screenStyle}>
            <Text style={textStyle}>Chat Room Screen</Text>
            <Text style={textStyle}>Room ID: {roomId}</Text>
            <Text style={textStyle}>Chatting with: {recipientName}</Text>
        </View>
    );
}


// --- Navigator Components ---

// AuthStack (Keep as is)
function AuthStack() {
    return (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login" component={AuthPage} />
            <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
        </AuthStackNav.Navigator>
    );
}

// OnboardingStack (Added theme check)
function OnboardingStack({ initialRouteName }: { initialRouteName?: keyof OnboardingStackParamList }) {
    const { theme } = useTheme();

    // *** ADDED: Return loading or null if theme is not ready ***
    if (!theme) {
        return (
            <View style={styles.screen}>
                <ActivityIndicator />
            </View>
        ); // Or return null
    }

    const screenOptions: NativeStackNavigationOptions = {
        headerShown: true,
        headerBackVisible: false,
        gestureEnabled: false,
        headerStyle: { backgroundColor: theme.colors.headerBackground },
        headerTintColor: theme.colors.headerText,
        // headerTitleStyle: { fontFamily: theme.fonts.families.bold }, // Uncomment if defined
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

// --- MainTabs MODIFIED (Added theme check) ---
function MainTabs() {
    const { theme } = useTheme();

    // *** ADDED: Return loading or null if theme is not ready ***
    if (!theme) {
         return (
            <View style={styles.screen}>
                <ActivityIndicator />
            </View>
        ); // Or return null
    }

    return (
        <MainTabNav.Navigator
            sceneContainerStyle={{ backgroundColor: theme.colors.background }}
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.card,
                    borderTopColor: theme.colors.border,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
                    if (route.name === 'DiscoverTab') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'EventsTab') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'ConversationsTab') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'NotificationsTab') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
            <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'Liked Profiles' }} />
            <MainTabNav.Screen name="ConversationsTab" component={ConversationsScreen} options={{ title: 'Messages' }} />
            <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
            <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </MainTabNav.Navigator>
    );
}
// --- End MainTabs Modification ---

// RootStack (MODIFIED - Added theme check)
function RootStack() {
    const { theme } = useTheme();

    // *** ADDED: Return loading or null if theme is not ready ***
    if (!theme) {
         return (
            <View style={styles.screen}>
                <ActivityIndicator />
            </View>
        ); // Or return null
    }

    return (
        <RootStackNav.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                headerStyle: { backgroundColor: theme.colors.headerBackground },
                headerTintColor: theme.colors.headerText,
                // headerTitleStyle: { fontFamily: theme.fonts.families.bold, fontSize: theme.fonts.sizes.large }, // Uncomment if defined
                headerBackTitleVisible: false,
            }}
        >
            <RootStackNav.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <RootStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
            <RootStackNav.Screen name="CreateProfile" component={CreateProfile} options={{ title: 'Create Personal Profile' }} />
            <RootStackNav.Screen name="CreateBusinessProfileScreen" component={CreateBusinessProfileScreen} options={{ title: 'Create Business Profile' }} />
            <RootStackNav.Screen
                name="ChatRoomScreen"
                component={ChatRoomScreen}
                options={({ route }) => ({ title: route.params.recipientName ?? 'Chat' })}
            />
        </RootStackNav.Navigator>
    );
}


// --- AppContent (MODIFIED - Added theme check) ---
function AppContent() {
    const { session, loadingAuth } = useAuth();
    const { theme } = useTheme(); // Get theme for loading indicator

    // *** ADDED: Check for theme here as well, before rendering Auth/Root stack ***
    if (loadingAuth || !theme) { // Also wait for theme
        // Use a default background color if theme isn't available yet
        const loadingBackgroundColor = theme ? theme.colors.background : '#FFFFFF';
        return (
            <View style={[styles.screen, { backgroundColor: loadingBackgroundColor }]}>
                <ActivityIndicator size="large" color={theme ? theme.colors.primary : '#FF6347'} />
            </View>
        );
    }

    // Determine if user needs onboarding (simplified check)
    const needsOnboarding = session?.user && !session.user.user_metadata?.has_completed_onboarding;

    if (session && session.user) {
        // if (needsOnboarding) {
        //     return <OnboardingStack initialRouteName="CreateProfile" />;
        // }
        return <RootStack />;
    } else {
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component --- (Keep as is)
export default function App() {
    return (
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    );
}

// --- Helper component to access theme for Root View and Navigation --- (MODIFIED - Added theme check)
function AppWithTheme() {
    const { theme } = useTheme();

    // *** ADDED: Check if theme is loaded before configuring navigation/rendering ***
    if (!theme) {
        // Render a minimal loading state or null while theme is loading
        // Avoid accessing theme properties here if theme is undefined
        return (
            <View style={styles.screen}>
                <ActivityIndicator size="large" />
            </View>
        );
        // Alternatively, you could return null, but a loading indicator is often better UX.
        // return null;
    }

    // Now that theme is guaranteed to exist, proceed with configuration
    const navigationTheme = React.useMemo(() => {
        const navTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;
        return {
            ...navTheme,
            colors: {
                ...navTheme.colors,
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.card,
                text: theme.colors.text,
                border: theme.colors.border,
                // notification: theme.colors.notification, // Uncomment if defined
            },
        };
    // Add theme to dependency array to recalculate when theme changes
    }, [theme]);

    return (
        // Apply theme background to the outermost view possible
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <DiscoveryProvider>
                        {/* NavigationContainer now receives a valid theme */}
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


// --- Basic Styles --- (Keep as is)
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }, // Added default background
});

// Export RootStackParamList for use in other components
export type { RootStackParamList };

