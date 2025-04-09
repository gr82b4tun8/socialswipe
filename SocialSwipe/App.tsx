// App.tsx (Updated with Gesture Handler Setup)

import 'react-native-gesture-handler'; // <--- !! ADDED: Must be at the VERY TOP !!
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // <--- ADDED: Import GestureHandlerRootView

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext'; // Verified path
import { EventProvider } from './src/contexts/EventContext'; // Verified path

// --- Import Screens (using paths from file tree) ---
import AuthPage from './src/pages/AuthPage';               // Verified path
import CreateAccount from './src/pages/CreateAccount';     // Verified path
import CreateProfile from './src/pages/CreateProfile';     // Verified path     // Verified path
import ProfilePromptScreen from './src/pages/ProfilePrompt'; // Verified path

// Placeholder imports for other tab screens (replace if/when you create them)
// import EventsScreen from './src/pages/EventsScreen';
// import NotificationsScreen from './src/pages/NotificationsScreen';

// Import icons for tabs
import { Home, Calendar, User, Bell } from 'lucide-react-native';

// --- Type Definitions for Navigation ---
// Stack for Login / Sign Up
type AuthStackParamList = {
    Login: undefined;
    SignUp: undefined;
};

// Stack for Onboarding (after Sign Up or if profile missing)
type OnboardingStackParamList = {
    ProfilePrompt: undefined;
    CreateProfile: undefined; // Moved here from AuthStack
};

// Main App Tabs
type MainTabParamList = {
    DiscoverTab: undefined;
    EventsTab: undefined; // Placeholder screen
    ProfileTab: undefined;
    NotificationsTab: undefined; // Placeholder screen
};

// --- Create Navigators ---
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();


// --- Placeholder Screens for other Tabs (if not yet created) ---
function EventsScreen() { // Replace with import './src/pages/EventsScreen' later
    return <View style={styles.screen}><Text>Events Screen (Placeholder)</Text></View>;
}
function NotificationsScreen() { // Replace with import './src/pages/NotificationsScreen' later
    return <View style={styles.screen}><Text>Notifications Screen (Placeholder)</Text></View>;
}
// --- End Placeholder Screens ---


// --- Navigator Components ---

// Handles Login and Sign Up
function AuthStack() {
    return (
        <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
            <AuthStackNav.Screen name="Login" component={AuthPage} />
            <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
        </AuthStackNav.Navigator>
    );
}

// Handles Profile Prompt and Creation (Post-Auth, Pre-Main App)
function OnboardingStack() {
    return (
        <OnboardingStackNav.Navigator screenOptions={{ headerShown: false }}>
            <OnboardingStackNav.Screen name="ProfilePrompt" component={ProfilePromptScreen} />
            <OnboardingStackNav.Screen name="CreateProfile" component={CreateProfile} />
        </OnboardingStackNav.Navigator>
    );
}

// Main App Tabs Navigator
function MainTabs() {
    return (
        <MainTabNav.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size, focused }) => {
                     const iconColor = focused ? '#FF6347' : 'gray';
                     size = focused ? size + 2 : size;

                     if (route.name === 'DiscoverTab') {
                        return <Home size={size} color={iconColor} strokeWidth={focused ? 2.5 : 2}/>;
                    } else if (route.name === 'EventsTab') {
                        return <Calendar size={size} color={iconColor} strokeWidth={focused ? 2.5 : 2}/>;
                    } else if (route.name === 'ProfileTab') {
                        return <User size={size} color={iconColor} strokeWidth={focused ? 2.5 : 2}/>;
                    } else if (route.name === 'NotificationsTab') {
                        return <Bell size={size} color={iconColor} strokeWidth={focused ? 2.5 : 2}/>;
                    }
                    return null;
                },
                tabBarActiveTintColor: '#FF6347',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 5 },
                tabBarLabelStyle: { fontWeight: '500', fontSize: 11 },
            })}
        >
            <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
            <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'My Events' }} />
            <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
            <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </MainTabNav.Navigator>
    );
}

// --- Component to Choose Navigator Based on Auth State ---
function AppContent() {
    // REMINDER: Implement profileExists check in AuthContext
    const { session, loading /*, profileExists */ } = useAuth();
    const profileExists = true; // <-- !! Placeholder !! Replace with actual check from context

    if (loading) {
        return (
            <View style={styles.screen}>
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        );
    }

    if (session && session.user) {
         return profileExists ? <MainTabs /> : <OnboardingStack />;
    } else {
        return <AuthStack />;
    }
}


// --- Main App Component ---
export default function App() {
    return (
        // ADDED: Wrap with GestureHandlerRootView
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <EventProvider>
                        <NavigationContainer>
                            <AppContent />
                        </NavigationContainer>
                        {/* Toast component should be outside NavigationContainer or within a top-level view */}
                        <Toast />
                    </EventProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView> // ADDED: Closing Tag
    );
}

// --- Basic Styles ---
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});