// App.tsx (Incorporating @expo/vector-icons for Tab Bar from reference)

// IMPORTANT: react-native-gesture-handler import must be at the very top
import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
import CreateProfile from './src/pages/CreateProfile';
import ProfilePromptScreen from './src/pages/ProfilePrompt';
import DiscoverScreen from './src/pages/DiscoverScreen';
import ProfileScreen from './src/pages/ProfileScreen'; // Assuming this exists

// --- Import Icons ---
// *** Using @expo/vector-icons as per reference snippet ***
import { Ionicons } from '@expo/vector-icons';

// --- Type Definitions for Navigation ---
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

type OnboardingStackParamList = {
  ProfilePrompt: undefined;
  CreateProfile: undefined;
};

type MainTabParamList = {
  DiscoverTab: undefined;
  EventsTab: undefined;
  ProfileTab: undefined;
  NotificationsTab: undefined;
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

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={AuthPage} />
      <AuthStackNav.Screen name="SignUp" component={CreateAccount} />
    </AuthStackNav.Navigator>
  );
}

function OnboardingStack() {
  return (
    <OnboardingStackNav.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStackNav.Screen name="ProfilePrompt" component={ProfilePromptScreen} />
      <OnboardingStackNav.Screen name="CreateProfile" component={CreateProfile} />
    </OnboardingStackNav.Navigator>
  );
}

// --- MainTabs Function using the icon logic from the reference ---
function MainTabs() {
  return (
    <MainTabNav.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => { // Renamed 'color' param as it's overridden
          const iconColor = focused ? '#FF6347' : 'gray'; // Use focused state for color
          let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'alert-circle'; // Default icon

          // Use Ionicons names and component based on focus state
          if (route.name === 'DiscoverTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'EventsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }

          // Adjust size slightly if focused (optional)
          const iconSize = focused ? size + 2 : size;

          return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
        },
        tabBarActiveTintColor: '#FF6347',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopWidth: 0, elevation: 5, height: 60, paddingBottom: 5 },
        tabBarLabelStyle: { fontWeight: '500', fontSize: 11, marginTop: -5 },
      })}
    >
      {/* Tab Screens */}
      <MainTabNav.Screen name="DiscoverTab" component={DiscoverScreen} options={{ title: 'Discover' }} />
      <MainTabNav.Screen name="EventsTab" component={EventsScreen} options={{ title: 'My Events' }} />
      <MainTabNav.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
      <MainTabNav.Screen name="NotificationsTab" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </MainTabNav.Navigator>
  );
}
// --- End MainTabs ---

// --- Component to Choose Navigator Based on Auth State ---
function AppContent() {
  const { session, loading } = useAuth();
  // TODO: Replace this placeholder with actual logic using context or fetching profile status
  const profileExists = true; // <-- !! Placeholder !! Needs real implementation

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  // Navigation Logic
  if (session && session.user) {
      return profileExists ? <MainTabs /> : <OnboardingStack />;
  } else {
      return <AuthStack />;
  }
}
// --- End AppContent ---


// --- Main App Component ---
export default function App() {
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
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
});