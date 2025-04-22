// App.tsx (Updated for CreateBusinessProfileScreen route name and simplified AuthContext)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message'; // Ensure Toast is configured (usually outside NavigationContainer)
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext'; // Using simplified AuthContext
import { DiscoveryProvider } from './src/contexts/DiscoveryContext'; // Adjust path if needed

// --- Import Screens ---
import AuthPage from './src/pages/AuthPage';
import CreateAccount from './src/pages/CreateAccount';
import CreateBusinessProfileScreen from './src/pages/CreateBusinessProfileScreen';
import CreateProfile from './src/pages/CreateProfile';
import DiscoverScreen from './src/pages/DiscoverScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import EditProfileScreen from './src/pages/EditProfile';
import EventsScreen from './src/pages/EventsScreen'; // *** ADDED: Import the actual EventsScreen ***

// --- Import Icons ---
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions for Navigation ---

type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

// Note: OnboardingStackParamList might need review depending on how you use it now
type OnboardingStackParamList = {
    CreateProfile: undefined;
    CreateBusinessProfileScreen: undefined; // <-- CHANGED name here if OnboardingStack is used for this too
};

type MainTabParamList = {
    DiscoverTab: undefined;
    EventsTab: undefined;
    ProfileTab: undefined;
    NotificationsTab: undefined;
};

type RootStackParamList = {
    Main: NavigatorScreenParams<MainTabParamList>;
    EditProfile: undefined;
    CreateProfile: undefined;
    // --- CHANGED Route Name Here ---
    CreateBusinessProfileScreen: undefined; // <<< Was 'CreateBusinessProfile'
};
// --- End Type Definitions ---


// --- Create Navigators ---
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
// Update OnboardingStackParamList if CreateBusinessProfileScreen replaces CreateBusinessProfile here
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();


// --- Placeholder Screens ---
function NotificationsScreen() { return <View style={styles.screen}><Text>Notifications Screen</Text></View>; }


// --- Navigator Components ---

function AuthStack() {
    return (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login" component={AuthPage} />
            <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
        </AuthStackNav.Navigator>
    );
}

// OnboardingStack definition - review if still needed or how it's used
// If you navigate to this stack, ensure the route names match what you navigate with
function OnboardingStack({ initialRouteName }: { initialRouteName?: keyof OnboardingStackParamList }) { // Made initialRouteName optional
    const screenOptions: NativeStackNavigationOptions = {
        headerShown: true,
        headerBackVisible: false,
        gestureEnabled: false,
    };
    // Default route if none provided, adjust if needed
    const finalInitialRoute = initialRouteName || 'CreateProfile';

    return (
        <OnboardingStackNav.Navigator
            initialRouteName={finalInitialRoute}
            screenOptions={screenOptions}
        >
            <OnboardingStackNav.Screen
                name="CreateProfile"
                component={CreateProfile}
                options={{ title: 'Create Personal Profile' }}
            />
            {/* Ensure this route name is correct if navigating to OnboardingStack */}
            <OnboardingStackNav.Screen
                name="CreateBusinessProfileScreen" // <<< CHANGED name here to match RootStack potentially
                component={CreateBusinessProfileScreen}
                options={{ title: 'Create Business Profile' }}
            />
        </OnboardingStackNav.Navigator>
    );
}


function MainTabs() {
    return (
        <MainTabNav.Navigator
            screenOptions={({ route }) => ({ // Example: Adding icons using screenOptions function
                headerShown: false, // Hide header for tabs, RootStack can handle main header if needed
                tabBarActiveTintColor: '#FF6347',
                tabBarInactiveTintColor: 'gray',
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: keyof typeof Ionicons.glyphMap = 'alert-circle-outline'; // Default icon

                  if (route.name === 'DiscoverTab') {
                    iconName = focused ? 'search' : 'search-outline';
                  } else if (route.name === 'EventsTab') {
                    iconName = focused ? 'heart' : 'heart-outline';
                  } else if (route.name === 'ProfileTab') {
                    iconName = focused ? 'person' : 'person-outline';
                  } else if (route.name === 'NotificationsTab') {
                    iconName = focused ? 'notifications' : 'notifications-outline';
                  }
                  return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <MainTabNav.Screen
                name="DiscoverTab"
                component={DiscoverScreen}
                options={{ title: 'Discover' }}
            />
            <MainTabNav.Screen
                name="EventsTab"
                component={EventsScreen}
                options={{ title: 'Liked Profiles' }}
            />
            <MainTabNav.Screen
                name="ProfileTab"
                component={ProfileScreen} // This screen handles the profile view / create prompt
                options={{ title: 'Profile' }}
            />
            <MainTabNav.Screen
                name="NotificationsTab"
                component={NotificationsScreen} // Placeholder
                options={{ title: 'Notifications' }}
            />
        </MainTabNav.Navigator>
    );
}


function RootStack() { // This is the main navigator after login
    return (
        <RootStackNav.Navigator>
            {/* Main screen with bottom tabs */}
            <RootStackNav.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }} // Tabs handle their own titles/headers usually
            />
            {/* Screens presented MODALLY or pushing OVER the tabs */}
            <RootStackNav.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{
                    title: 'Edit Profile',
                    headerShown: true,
                    headerBackTitleVisible: false,
                }}
            />
            <RootStackNav.Screen
                name="CreateProfile" // Route for personal profile creation
                component={CreateProfile}
                options={{
                    title: 'Create Personal Profile',
                    headerShown: true,
                    headerBackTitleVisible: false,
                }}
            />
             {/* --- SCREEN NAME EDITED HERE --- */}
            <RootStackNav.Screen
                name="CreateBusinessProfileScreen" // <<< Was 'CreateBusinessProfile'
                component={CreateBusinessProfileScreen}
                options={{
                    title: 'Create Business Profile',
                    headerShown: true,
                    headerBackTitleVisible: false,
                }}
            />
        </RootStackNav.Navigator>
    );
}


// --- Component to Choose Navigator Based on Auth State --- (MODIFIED)
function AppContent() {
    // Use the simplified AuthContext hook
    const { session, loadingAuth } = useAuth(); // Removed profile, loadingProfile

    // console.log("--- AppContent Render ---");
    // console.log("Session exists:", !!session);
    // console.log("Loading Auth:", loadingAuth);

    // Now only wait for authentication loading
    if (loadingAuth) {
        // console.log(`AppContent: Returning Loading Indicator (Auth: ${loadingAuth})`);
        return ( <View style={styles.screen}><ActivityIndicator size="large" color="#FF6347" /></View> );
    }

    // Decide navigator based only on session existence
    if (session && session.user) {
        // console.log("AppContent: Returning RootStack");
        // User is logged in, show the main app stack (which includes profile checks internally)
        return <RootStack />;
    } else {
        // console.log("AppContent: Returning AuthStack");
        // No user session, show the login/signup stack
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component --- (Unchanged)
export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <DiscoveryProvider>
                        <NavigationContainer>
                            <AppContent />
                        </NavigationContainer>
                        <Toast />
                    </DiscoveryProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
// --- End App ---

// --- Basic Styles --- (Unchanged)
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', },
});
