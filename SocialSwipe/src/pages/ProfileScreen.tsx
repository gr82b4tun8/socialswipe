import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable, // More flexible than Button for custom styling
  ScrollView, // Good for content that might exceed screen height
  Alert, // Alternative for simple feedback if Toast isn't set up
  SafeAreaView // Ensures content avoids notches/status bars
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Or appropriate type
import Toast from 'react-native-toast-message'; // Use the RN Toast library

import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import ProfileCard from '../components/ProfileCard'; // Adjust path & ensure RN version exists
import { supabase } from '../lib/supabaseClient'; // Adjust path if needed

// Define Profile type (keep this)
interface Profile {
    id: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name?: string | null;
    date_of_birth: string;
    gender: string;
    bio?: string | null;
    interests?: string[] | null;
    location?: string | null;
    looking_for?: string | null;
    profile_pictures?: string[] | null;
    // Add any other fields from your profiles table
}

// Define navigation param list including potential destinations
// You might need to combine this with types from App.tsx or a dedicated types file
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  {
    Login: undefined; // Assuming Login is a screen name in your Auth stack
    ProfilePrompt: undefined; // Assuming this is in your Onboarding stack
    EditProfile: undefined; // Assuming you'll have an EditProfile screen
    // Add other relevant screen names if needed
  },
  'ProfileTab' // The current screen's name (adjust if different)
>;


const ProfileScreen: React.FC = () => {
  // Use RN navigation hook
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, loading: authLoading, session } = useAuth(); // Assuming session might be needed for logout check
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Profile fetching loading state

  useEffect(() => {
    if (!authLoading && user) {
      const fetchProfile = async () => {
        setLoading(true);
        console.log('ProfileScreen: Fetching profile for user ID:', user.id);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('ProfileScreen: Error fetching profile:', error);
            throw error;
          }

          if (data) {
            console.log('ProfileScreen: Profile data found:', data);
            setProfile(data as Profile);
          } else {
            console.warn('ProfileScreen: No profile data found.');
             Toast.show({
                type: 'warning', // Use 'warning' or 'info'
                text1: "Profile not found.",
                text2: "Redirecting to create profile."
             });
            // Navigate to profile creation/prompt screen name
            navigation.navigate('ProfilePrompt'); // Use screen name
          }

        } catch (error: any) {
          console.error('ProfileScreen: Failed to fetch profile:', error);
          Toast.show({
            type: 'error',
            text1: "Failed to load profile",
            text2: error?.message || "Please try again later."
          });
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else if (!authLoading && !user) {
        console.log('ProfileScreen: No user session, redirecting to login.');
        // Navigate to Login screen name
        navigation.reset({ // Reset navigation stack to Auth flow
            index: 0,
            routes: [{ name: 'Login' }], // Use Login screen name from AuthStack
        });
    }
  }, [user, authLoading, navigation]);

  // --- Logout Handler ---
  const handleLogout = async () => {
    // Optional: Add loading state for logout button
    const { error } = await supabase.auth.signOut();
    if (error) {
        Toast.show({ type: 'error', text1: "Logout failed", text2: error.message });
    } else {
        Toast.show({ type: 'success', text1: "Logged out successfully" });
        // Navigate to Login screen - reset stack usually preferred after logout
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }], // Use Login screen name from AuthStack
        });
    }
  };

  // --- Edit Profile Navigation ---
   const handleEditProfile = () => {
       // Make sure 'EditProfile' is a defined screen in one of your navigators
       // navigation.navigate('EditProfile');
       Toast.show({ type: 'info', text1: 'Edit Profile action needed' }); // Placeholder
   };

  // --- Retry Fetch (Example) ---
  const handleRetry = () => {
      // Re-trigger the fetch logic - simplest way is often just forcing a re-render
      // or explicitly calling a fetch function if you refactor useEffect
      setLoading(true); // Show loader again
      // You might need to manually call fetchProfile if it's extracted from useEffect
       Toast.show({ type: 'info', text1: 'Retry logic needed' }); // Placeholder
       setLoading(false); // Remove loader if retry isn't implemented yet
  };


  // --- Render Logic ---

  // Show main loader if auth is loading OR profile data is loading
  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        {/* Use built-in ActivityIndicator */}
        <ActivityIndicator size="large" color="#FF6347" /> {/* Example color */}
      </View>
    );
  }

  // If loading is done but profile is still null (error case)
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
          <View style={[styles.centered, styles.errorContainer]}>
              <Text style={styles.errorText}>Could not load profile data.</Text>
              <Text style={styles.errorTextSmall}>Please try again later.</Text>
              {/* Replace window.location.reload() */}
              <Pressable style={[styles.button, styles.buttonOutline, styles.retryButton]} onPress={handleRetry}>
                 <Text style={styles.buttonOutlineText}>Retry</Text>
              </Pressable>
          </View>
      </SafeAreaView>
    );
  }

  // Render Actual Profile inside a ScrollView
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer}>
        {/* Header with Edit Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable style={[styles.button, styles.buttonOutline]} onPress={handleEditProfile}>
            <Text style={styles.buttonOutlineText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Render the Profile Card component */}
        {/* Ensure ProfileCard is a React Native component */}
        <ProfileCard profile={profile} />

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          {/* Use Pressable for custom button look */}
          <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleLogout}>
            <Text style={styles.buttonGhostText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Example background
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16, // Equivalent to p-4
    paddingBottom: 80, // Add padding at bottom if needed (e.g., for tabs) ~mb-16ish
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
      padding: 20,
  },
  errorText: {
      fontSize: 16,
      color: '#dc3545', // Example destructive color
      textAlign: 'center',
      marginBottom: 8,
  },
  errorTextSmall: {
      fontSize: 14,
      color: '#6c757d',
      textAlign: 'center',
  },
  retryButton: {
      marginTop: 20, // mt-4
  },
  header: {
    flexDirection: 'row', // To place items side-by-side
    justifyContent: 'space-between', // Space title and button apart
    alignItems: 'center', // Vertically align items
    marginBottom: 24, // mb-6
  },
  headerTitle: {
    fontSize: 24, // text-2xl
    fontWeight: 'bold',
    color: '#FF6347', // Example primary color - ADJUST
  },
  logoutContainer: {
    marginTop: 32, // mt-8
    alignItems: 'center', // Center button horizontally
  },
  // Basic Button Styling (Adapt as needed)
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1, // Needed for outline/ghost variants
  },
  buttonOutline: {
    borderColor: '#FF6347', // Example primary color - ADJUST
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: '#FF6347', // Example primary color - ADJUST
    fontWeight: '500',
  },
  buttonGhost: {
    borderColor: 'transparent', // No border for ghost
    backgroundColor: 'transparent',
  },
  buttonGhostText: {
    color: '#6c757d', // Muted color - ADJUST
    fontWeight: '500',
  },
});

export default ProfileScreen;