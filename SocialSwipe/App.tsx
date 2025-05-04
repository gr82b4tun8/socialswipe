// App.tsx (Corrected RootStack structure + AttendeesListScreen integration)

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
import ConnectionsScreen from './src/pages/ConnectionsScreen';
import ProfileDetailScreen from './src/pages/ProfileDetailScreen';
import ChatRoomScreen from './src/pages/ChatRoomScreen';
// <<< ADDED >>> Import the new AttendeesListScreen
import AttendeesListScreen from './src/pages/AttendeesListScreen'; // Adjust path if needed

// --- Import Icons ---
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions for Navigation ---

// <<< MODIFIED >>> Added AttendeesList to RootStackParamList
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
    AttendeesList: { // <<< ADDED >>> Parameters for the new screen
        businessId: string;
        businessName?: string; // Optional business name for the header
    };
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
                {canGoBack && navigation && typeof navigation.goBack === 'function' && (
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
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
        headerBackVisible: false,
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
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    borderTopColor: theme.colors.border,
                    borderTopWidth: 0,
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
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
                tabBarBackground: () => (
                    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
                        {useGradientTabBar && tabBarGradientConfig ? (
                            <LinearGradient
                                {...tabBarGradientConfig}
                                style={StyleSheet.absoluteFill}
                            />
                        ) : (
                            <View style={{ flex: 1, backgroundColor: theme.colors.card }} />
                        )}
                        {applyTabBarBlur && (
                            <BlurView
                                intensity={90}
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
// <<< MODIFIED >>> Added AttendeesListScreen to the RootStackNav.Navigator
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
            screenOptions={{
                header: (props) => <AppHeader {...props} />, // Use custom header globally
            }}
        >
            {/* Main screen containing tabs */}
            <RootStackNav.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false, title: 'Sphere' }}
            />
            {/* Other screens stacked on top */}
            <RootStackNav.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ title: 'Edit Profile' }}
            />
            <RootStackNav.Screen
                name="CreateProfile"
                component={CreateProfile}
                options={{ title: 'Create Personal Profile' }}
            />
             <RootStackNav.Screen
                name="CreateBusinessProfileScreen"
                component={CreateBusinessProfileScreen}
                options={{ title: 'Create Business Profile' }}
            />
            <RootStackNav.Screen
                name="ChatRoomScreen"
                component={ChatRoomScreen}
                // Title can be set dynamically in the screen component itself
                // using navigation.setOptions, or provide a fallback here.
                // Example: options={({ route }) => ({ title: route.params.recipientName || 'Chat' })}
            />
            <RootStackNav.Screen
                name="ProfileDetail"
                component={ProfileDetailScreen}
                options={{ title: 'Profile Details' }}
            />
             {/* <<< ADDED >>> Screen definition for AttendeesList */}
             <RootStackNav.Screen
                 name="AttendeesList"
                 component={AttendeesListScreen}
                 // You can optionally set the title dynamically based on route params
                 options={({ route }) => ({
                     title: route.params?.businessName ? `${route.params.businessName} Attendees` : 'Attendees'
                 })}
                 // Alternatively, a static title:
                 // options={{ title: 'Who Liked This' }}
             />
            {/* Ensure no comments, whitespace, etc. here */}
        </RootStackNav.Navigator>
    );
}
// --- End RootStack ---


// --- AppContent (Unchanged) ---
function AppContent() {
    const { session, loadingAuth, profile } = useAuth();
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
        // Your existing onboarding logic can remain here
        // const needsOnboarding = !profile || !profile.setupComplete;
        // if (needsOnboarding) {
        //      const initialRoute = profile?.needsBusinessProfile ? 'CreateBusinessProfileScreen' : 'CreateProfile';
        //      return <OnboardingStack initialRouteName={initialRoute} />;
        // }
        return <RootStack />;
    } else {
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


// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
    headerContainer: { justifyContent: 'flex-end', /* Align content towards bottom */ },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 1,
        paddingBottom: 8,
    },
    backButton: {
        padding: 5,
        position: 'absolute',
        left: 10,
        bottom: 8,
        zIndex: 2,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 50,
    },
    rightSpacer: {
        width: 55,
    }
});

// Export RootStackParamList (Defined at top)
// export type { RootStackParamList }; // Already exported via export statement