// App.tsx

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Contexts & Providers
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { EventProvider } from './src/contexts/EventContext';

// --- Import Screens ---
import AuthPage from './src/pages/AuthPage';
import CreateAccount from './src/pages/CreateAccount';
// --- V V V ADD IMPORT FOR CreateBusinessProfileScreen V V V ---
import CreateBusinessProfileScreen from './src/pages/CreateBusinessProfileScreen'; // Adjust path if necessary
// --- ^ ^ ^ ADD IMPORT FOR CreateBusinessProfileScreen ^ ^ ^ ---
import CreateProfile from './src/pages/CreateProfile'; // Assuming this is for Personal profiles
import ProfilePromptScreen from './src/pages/ProfilePrompt';
import DiscoverScreen from './src/pages/DiscoverScreen';
import ProfileScreen from './src/pages/ProfileScreen';
import EditProfileScreen from './src/pages/EditProfileScreen';

// --- Import Icons ---
import { Ionicons } from '@expo/vector-icons'; // Keep if used in MainTabs options

// --- Type Definitions for Navigation ---

// --- V V V ADD CreateBusinessProfile TO AuthStackParamList V V V ---
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  CreateBusinessProfile: undefined; // Added here for direct navigation from SignUp
};
// --- ^ ^ ^ ADD CreateBusinessProfile TO AuthStackParamList ^ ^ ^ ---

type OnboardingStackParamList = {
  ProfilePrompt: undefined;
  CreateProfile: undefined; // Assumed for Personal profile creation
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
    // Add other full-screen modals or pushed screens here
    // Consider if Onboarding/Create Profile screens should live here instead
    // Or if CreateBusinessProfile should move here later
};

// --- Create Navigators ---
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const OnboardingStackNav = createNativeStackNavigator<OnboardingStackParamList>();
const MainTabNav = createBottomTabNavigator<MainTabParamList>();
const RootStackNav = createNativeStackNavigator<RootStackParamList>();


// --- Placeholder Screens --- (Keep as needed)
function EventsScreen() { return <View style={styles.screen}><Text>Events Screen</Text></View>; }
function NotificationsScreen() { return <View style={styles.screen}><Text>Notifications Screen</Text></View>; }


// --- Navigator Components ---

function AuthStack() { // --- MODIFIED: Added CreateBusinessProfileScreen ---
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={AuthPage} />
      <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
      {/* Add CreateBusinessProfile screen here */}
      <AuthStackNav.Screen
          name="CreateBusinessProfile"
          component={CreateBusinessProfileScreen}
          options={{
              title: 'Create Business Profile', // Set header title
              headerShown: true, // Show header for this screen
              headerBackVisible: false, // Hide back button if they shouldn't return to SignUp
              // gestureEnabled: false, // Prevent swipe back gesture
          }}
      />
    </AuthStackNav.Navigator>
  );
} // --- End AuthStack Modification ---

function OnboardingStack() { /* ... OnboardingStack remains the same for now ... */
  return (
    <OnboardingStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStackNav.Screen name="ProfilePrompt" component={ProfilePromptScreen} />
      {/* Assuming CreateProfile is for personal profiles */}
      <OnboardingStackNav.Screen name="CreateProfile" component={CreateProfile} />
    </OnboardingStackNav.Navigator>
  );
}

function MainTabs() { /* ... MainTabs remains the same ... */
  return (
    <MainTabNav.Navigator /* ... screenOptions ... */ >
        {/* Your Tab Screens */}
        <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
        <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'My Events' }} />
        <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
        <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </MainTabNav.Navigator>
  );
}

function RootStack() { /* ... RootStack remains the same ... */
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
        </RootStackNav.Navigator>
    );
}


// --- Component to Choose Navigator Based on Auth State ---
function AppContent() {
  const { session, loading, profile } = useAuth(); // Assuming profile info is available via AuthContext

  // --- V V V Placeholder Logic - Needs Enhancement V V V ---
  // This logic needs refinement to correctly handle profile creation flows,
  // especially after email confirmation.
  let profileIsComplete = false; // Placeholder - Replace with actual check
  if (profile) {
      // Example check: A profile exists and has a required field filled
      // For business: check if profile.business_name exists?
      // For personal: check if profile.first_name exists?
      if (profile.account_type === 'business') {
          profileIsComplete = !!profile.business_name; // Or check another required business field
      } else {
          profileIsComplete = !!profile.first_name; // Or check another required personal field
      }
  }
  // --- ^ ^ ^ Placeholder Logic - Needs Enhancement ^ ^ ^ ---


  if (loading) {
    return ( <View style={styles.screen}><ActivityIndicator size="large" color="#FF6347" /></View> );
  }

  // Navigation Logic
  if (session && session.user) {
      if (profileIsComplete) {
          // Profile exists and is considered complete -> Show main app
          return <RootStack />;
      } else {
          // Profile incomplete or doesn't exist
          // --- V V V NEEDS REFINEMENT V V V ---
          // This is where you redirect AFTER login (e.g., post-email confirmation)
          // You need to check the account_type from the profile fetched in AuthContext
          if (profile?.account_type === 'business') {
              // If profile exists but incomplete AND type is business
              // Navigate to CreateBusinessProfile - How?
              // Option A: Add CreateBusinessProfile to OnboardingStack/RootStack too
              // Option B: Have a single 'CompleteProfile' stack that shows the right screen
              // For now, let's assume OnboardingStack handles this (needs CreateBusinessProfile added there too)
              // return <OnboardingStack initialRouteName="CreateBusinessProfile" />; // Needs modification
              console.warn("Profile incomplete & business: Needs redirect to CreateBusinessProfile")
              // TEMPORARY: Show OnboardingStack, assumes CreateProfile handles both or needs splitting
                return <OnboardingStack />; // TEMPORARY FALLBACK
          } else {
              // Personal account or profile doesn't exist yet (first login?)
              // Show the existing Onboarding stack (ProfilePrompt -> CreateProfile)
              return <OnboardingStack />;
          }
          // --- ^ ^ ^ NEEDS REFINEMENT ^ ^ ^ ---
      }
  } else {
      // No session -> Show Auth Stack
      return <AuthStack />;
  }
}
// --- End AppContent ---


// --- Main App Component ---
export default function App() { // --- REMAINS THE SAME ---
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <EventProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
            <Toast />
          </EventProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
// --- End App ---

// --- Basic Styles ---
const styles = StyleSheet.create({ // --- REMAINS THE SAME ---
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', },
});