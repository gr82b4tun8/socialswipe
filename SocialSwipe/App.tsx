// App.tsx (Updated to use actual EventsScreen)

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
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
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

// --- Type Definitions for Navigation --- (Keep as is)

type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

type OnboardingStackParamList = {
    CreateProfile: undefined;
    CreateBusinessProfile: undefined;
};

type MainTabParamList = {
    DiscoverTab: undefined;
    EventsTab: undefined; // Represents the "Liked Profiles" tab now
    ProfileTab: undefined;
    NotificationsTab: undefined; // Keep placeholder or replace if needed
};

type RootStackParamList = {
    Main: NavigatorScreenParams<MainTabParamList>;
    EditProfile: undefined;
    CreateProfile: undefined;
    CreateBusinessProfile: undefined;
};
// --- End Type Definitions ---


// --- Create Navigators --- (Keep as is)
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();


// --- Placeholder Screens ---
// *** REMOVED placeholder EventsScreen function ***
function NotificationsScreen() { return <View style={styles.screen}><Text>Notifications Screen</Text></View>; } // Keep placeholder or replace


// --- Navigator Components --- (Keep as is)

function AuthStack() {
    return (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login" component={AuthPage} />
            <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
        </AuthStackNav.Navigator>
    );
}

// OnboardingStack definition remains, useful for manual navigation
function OnboardingStack({ initialRouteName }: { initialRouteName: keyof OnboardingStackParamList }) {
    const screenOptions: NativeStackNavigationOptions = {
        headerShown: true,
        headerBackVisible: false,
        gestureEnabled: false,
    };
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
            <OnboardingStackNav.Screen
                name="CreateBusinessProfile"
                component={CreateBusinessProfileScreen}
                options={{ title: 'Create Business Profile' }}
            />
        </OnboardingStackNav.Navigator>
    );
}


function MainTabs() {
    // TODO: Add screenOptions for icons, colors etc. to MainTabNav.Navigator
    return (
        <MainTabNav.Navigator
            screenOptions={{
                // Example: Add active/inactive tint colors if desired
                // tabBarActiveTintColor: '#FF6347',
                // tabBarInactiveTintColor: 'gray',
            }}
        >
            <MainTabNav.Screen
                name="DiscoverTab"
                component={DiscoverScreen}
                options={{
                    title: 'Discover',
                    tabBarIcon: ({ color, size }) => ( // Example Icon
                      <Ionicons name="search-outline" color={color} size={size} />
                    ),
                 }}
            />
            <MainTabNav.Screen
                name="EventsTab"
                component={EventsScreen} // *** UPDATED: Use imported EventsScreen ***
                options={{
                    title: 'Liked Profiles', // *** UPDATED: Changed title ***
                    tabBarIcon: ({ color, size }) => ( // Example Icon
                      <Ionicons name="heart-outline" color={color} size={size} />
                    ),
                }}
             />
            <MainTabNav.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => ( // Example Icon
                      <Ionicons name="person-outline" color={color} size={size} />
                    ),
                 }}
             />
            <MainTabNav.Screen
                name="NotificationsTab"
                component={NotificationsScreen} // Placeholder
                options={{
                    title: 'Notifications',
                     tabBarIcon: ({ color, size }) => ( // Example Icon
                      <Ionicons name="notifications-outline" color={color} size={size} />
                    ),
                 }}
            />
        </MainTabNav.Navigator>
    );
}


function RootStack() { // Keep as is
    return (
        <RootStackNav.Navigator>
            <RootStackNav.Screen
                name="Main"
                component={MainTabs}
                options={{ headerShown: false }}
            />
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
                name="CreateProfile"
                component={CreateProfile}
                options={{
                    title: 'Create Personal Profile',
                    headerShown: true,
                    headerBackTitleVisible: false,
                }}
            />
            <RootStackNav.Screen
                name="CreateBusinessProfile"
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


// --- Component to Choose Navigator Based on Auth State --- (Keep as is)
function AppContent() {
    const { session, profile, loadingAuth, loadingProfile } = useAuth();

    // console.log("--- AppContent Render ---"); // Keep logs if helpful
    // console.log("Session exists:", !!session);
    // console.log("Profile exists:", !!profile);
    // console.log("Loading Auth:", loadingAuth);
    // console.log("Loading Profile:", loadingProfile);

    if (loadingAuth || (session && loadingProfile)) {
        // console.log(`AppContent: Returning Loading Indicator (Auth: ${loadingAuth}, Profile: ${loadingProfile})`);
        return ( <View style={styles.screen}><ActivityIndicator size="large" color="#FF6347" /></View> );
    }

    if (session && session.user) {
        // console.log("AppContent: Returning RootStack");
        return <RootStack />;
    } else {
        // console.log("AppContent: Returning AuthStack");
        return <AuthStack />;
    }
}
// --- End AppContent ---


// --- Main App Component ---
export default function App() { // Keep as is
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

// --- Basic Styles --- (Keep as is)
const styles = StyleSheet.create({
    screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', },
});