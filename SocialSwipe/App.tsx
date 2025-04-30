// App.tsx (Theming Tab Scene Container & Persistent Custom Header)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-get-random-values';
import 'react-native-gesture-handler'; // <--- CORRECT: Import is present
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
    NavigationContainer,
    NavigatorScreenParams,
    DefaultTheme as NavigationDefaultTheme,
    DarkTheme as NavigationDarkTheme,
    useNavigation
} from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions, NativeStackHeaderProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // <--- CORRECT: Import is present

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { DiscoveryProvider } from './src/contexts/DiscoveryContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // <--- ***** ADD THIS IMPORT *****

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


// --- Custom App Header Component ---
function AppHeader({ navigation, route, options }: NativeStackHeaderProps | BottomTabHeaderProps) {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const canGoBack = navigation.canGoBack();

    const headerGradientConfig = theme?.gradients?.primaryHeader;
    const useGradientHeader = !theme?.isDark && !!headerGradientConfig;

    // **** NEW: Decide if you want blur on the header ****
    const applyHeaderBlur = true; // Set to true to enable blur, false to disable
    const blurTint = theme?.isDark ? 'dark' : 'light'; // Match blur tint to theme

    if (!theme) return null; // Existing null check

    const HeaderContainerComponent = useGradientHeader ? LinearGradient : View;
    const headerProps = useGradientHeader ? headerGradientConfig : {};


    return (
        <HeaderContainerComponent
            {...headerProps}
            style={[
                styles.headerContainer, // Original style
                { // Original inline styles + overflow
                    backgroundColor: !useGradientHeader ? theme.colors.headerBackground : undefined,
                    paddingTop: insets.top,
                    height: (theme.header?.height || 60) + insets.top,
                    overflow: 'hidden', // **** ADD overflow: 'hidden' ****
                }
            ]}
        >
            {/* **** START: Add BlurView Layer **** */}
            {applyHeaderBlur && (
                <BlurView
                    intensity={80} // Adjust blur intensity (0-100)
                    tint={blurTint}
                    style={StyleSheet.absoluteFill} // Make blur cover the entire header area
                />
            )}
            {/* **** END: Add BlurView Layer **** */}

            {/* Original Header Content - Renders on top of BlurView/Gradient */}
            <View style={styles.headerContent}>
                {canGoBack && (
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
                        { // Original inline styles for title
                            color: theme.colors.headerText,
                            fontSize: theme.fonts?.sizes?.xxLarge || 26,
                            fontWeight: 'bold',
                        }
                    ]}
                    numberOfLines={1}
                >
                    Sphere
                </Text>
                 <View style={styles.rightSpacer} />{/* Original Spacer */}
            </View>
        </HeaderContainerComponent>
    );
}
// --- End Custom App Header Component ---


// --- Navigator Components ---

// AuthStack
function AuthStack() {
     return (
         <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
             <AuthStackNav.Screen name="Login" component={AuthPage} />
             <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
         </AuthStackNav.Navigator>
     );
}

// OnboardingStack
function OnboardingStack({ initialRouteName }: { initialRouteName?: keyof OnboardingStackParamList }) {
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

// --- MainTabs ---
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

    // **** NEW: Decide if you want blur on the tab bar ****
    const applyTabBarBlur = true; // Set to true to enable blur, false to disable
    const blurTint = theme.isDark ? 'dark' : 'light'; // Match blur tint to theme

    return (
        <MainTabNav.Navigator
            sceneContainerStyle={{ backgroundColor: theme.colors.background }} // Original
            screenOptions={({ route }) => ({ // Original
                 headerShown: false, // Original
                 tabBarActiveTintColor: theme.colors.primary, // Original
                 tabBarInactiveTintColor: theme.colors.textSecondary, // Original
                 tabBarStyle: { // Original style object
                     borderTopColor: theme.colors.border, // Original
                     borderTopWidth: 0, // Original
                     // **** ADD backgroundColor: 'transparent' ****
                     backgroundColor: 'transparent', // Needed for tabBarBackground to show through
                 },
                 tabBarIcon: ({ focused, color, size }) => { // Original Icon logic
                     let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline';
                     if (route.name === 'DiscoverTab') iconName = focused ? 'search' : 'search-outline';
                     else if (route.name === 'EventsTab') iconName = focused ? 'heart' : 'heart-outline';
                     else if (route.name === 'ConversationsTab') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                     else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                     else if (route.name === 'NotificationsTab') iconName = focused ? 'notifications' : 'notifications-outline';
                     return <Ionicons name={iconName} size={size} color={color} />;
                 },
                 // --- MODIFIED tabBarBackground ---
                 tabBarBackground: () => { // Original prop function
                     // **** START: Modifications for BlurView ****
                     // Wrap original content in a View to manage layers
                     return (
                         <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                             {/* Layer 1: Original Background (Gradient or Solid Color) */}
                             {useGradientTabBar && tabBarGradientConfig ? (
                                 <LinearGradient // Original Gradient Logic
                                     {...tabBarGradientConfig}
                                     style={StyleSheet.absoluteFill}
                                 />
                             ) : (
                                 // Original Solid Color Logic
                                 <View style={{
                                     flex: 1,
                                     backgroundColor: theme.colors.card
                                 }} />
                             )}

                             {/* Layer 2: BlurView on top (Conditional) */}
                             {applyTabBarBlur && (
                                 <BlurView
                                     intensity={90} // Adjust intensity as needed for tab bar
                                     tint={blurTint}
                                     style={StyleSheet.absoluteFill} // Covers the gradient/solid background
                                 />
                             )}
                         </View>
                     );
                     // **** END: Modifications for BlurView ****
                 },
                 // --- END MODIFIED tabBarBackground ---
            })}
        >
            {/* Original Screens */}
            <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
            <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'Liked Profiles' }} />
            <MainTabNav.Screen name="ConversationsTab" component={ConversationsScreen} options={{ title: 'Messages' }} />
            <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
            <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </MainTabNav.Navigator>
    );
}
// --- End MainTabs Modification ---

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
        <RootStackNav.Navigator
            screenOptions={{ // Original screenOptions
                header: (props) => <AppHeader {...props} />, // Original custom header
            }}
        >
            {/* Original Screens */}
            <RootStackNav.Screen name="Main" component={MainTabs}/>
            <RootStackNav.Screen name="EditProfile" component={EditProfileScreen}/>
            <RootStackNav.Screen name="CreateProfile" component={CreateProfile}/>
            <RootStackNav.Screen name="CreateBusinessProfileScreen" component={CreateBusinessProfileScreen}/>
            <RootStackNav.Screen name="ChatRoomScreen" component={ChatRoomScreen}/>
        </RootStackNav.Navigator>
    );
}
// --- End RootStack ---


// --- AppContent ---
function AppContent() { // Original Component
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
        // Logic to determine onboarding completion should be here (Original Comment)
        // For now, assume if user exists, main app is shown (Original Comment)
        // Replace with your actual onboarding check logic if needed (Original Comment)
        // Example: const isOnboardingComplete = session.user.profileComplete; (Original Comment)
        // if (!isOnboardingComplete) { return <OnboardingStack />; } (Original Comment)
        return <RootStack />;
    } else {
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component ---
export default function App() { // Original Component
    return (
        <ThemeProvider>
            <AppWithTheme />
        </ThemeProvider>
    );
}

// --- Helper component to access theme for Root View and Navigation ---
function AppWithTheme() { // Original Component
     const { theme } = useTheme();
    if (!theme) { return <View style={styles.screen}><ActivityIndicator size="large" /></View>; }
    const navigationTheme = React.useMemo(() => {
        const navTheme = theme.isDark ? NavigationDarkTheme : NavigationDefaultTheme;
        return {
            ...navTheme, colors: { ...navTheme.colors, primary: theme.colors.primary, background: theme.colors.background, card: theme.colors.card, text: theme.colors.text, border: theme.colors.border },
        };
    }, [theme]);
    return (
        // CORRECT: GestureHandlerRootView wraps the main content (Original Comment)
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


// --- Styles ---
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }, // Original
    headerContainer: { justifyContent: 'center', }, // Original
    headerContent: { // Original style object
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        flex: 1,
        backgroundColor: 'transparent',
        // **** ADD position and zIndex to help ensure it's on top ****
        position: 'relative',
        zIndex: 1,
    },
    backButton: { padding: 5, marginRight: 0, }, // Original
    headerTitle: { flex: 1, textAlign: 'left', }, // Original
    rightSpacer: { width: (45 + 5*2), } // Original (Adjusted size based on potential icon size + padding)
});

// Export RootStackParamList for use in other components
export type { RootStackParamList }; // Original export