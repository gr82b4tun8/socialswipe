// src/pages/ProfileScreen.tsx (MODIFIED)

import React from "react"; // Removed useEffect, useState
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert, // Keep for potential use
  SafeAreaView,
  Button, // Import Button for creation prompts
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message"; // Keep for logout/edit feedback

import { useAuth } from "../contexts/AuthContext"; // Use profile/loading from context
import ProfileCard from "../components/ProfileCard"; // Adjust path if needed
import { supabase } from "../lib/supabaseClient"; // Adjust path if needed

// Import the RootStackParamList from App.tsx or your types file
// Ensure this path is correct relative to your ProfileScreen.tsx file
import { RootStackParamList } from '../../App';

// Define Profile type (ensure this matches context and DB)
interface Profile {
  id: string;
  created_at: string;
  updated_at: string;
  profile_type: 'personal' | 'business' | null; // Make sure this is here
  first_name?: string | null; // Use optional if they can be null
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  location?: string | null;
  looking_for?: string | null;
  profile_pictures?: string[] | null;
  business_name?: string | null; // Add business fields if applicable
  // Add any other fields from your profiles table
}

// Update navigation prop type to use RootStackParamList
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList, // Use the correct param list
  'Main' // This screen lives within 'Main', but can navigate to RootStack screens
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  // Get session, user, profile, and loading states directly from context
  const {
      session,
      user, // Keep user if needed for email display etc.
      profile, // Use profile from context
      loadingAuth, // Might still need this initial check
      loadingProfile // Use loading state from context
  } = useAuth();

  // REMOVED: Local useState for profile and loading
  // REMOVED: useEffect fetching profile data (handled by AuthContext now)


  // --- Logout Handler ---
  const handleLogout = async () => {
    // Show loading state?
    const { error } = await supabase.auth.signOut();
    if (error) {
      Toast.show({ type: "error", text1: "Logout failed", text2: error.message });
    } else {
      Toast.show({ type: "success", text1: "Logged out successfully" });
      // AppContent will handle redirecting to AuthStack automatically
      // No need for navigation.reset here if AuthContext handles state change correctly
    }
  };

  // --- Edit Profile Navigation ---
  const handleEditProfile = () => {
    // Navigate to EditProfile screen (ensure 'EditProfile' is in RootStackParamList)
    if (profile) { // Only allow editing if profile exists
        navigation.navigate('EditProfile');
    } else {
        Toast.show({ type: 'info', text1: 'Create a profile first!' });
    }
  };

  // REMOVED: handleRetry (no longer fetching locally)

  // --- Render Logic ---

  // Show loader if either initial auth check is happening OR profile is loading
  // Note: AppContent usually handles the loadingAuth part before rendering this screen,
  // but checking loadingProfile is essential here. Checking authLoading is belt-and-suspenders.
  if (loadingAuth || loadingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
          <View style={styles.centered}>
              <ActivityIndicator size="large" color="#FF6347" />
              <Text>Loading Profile...</Text>
          </View>
      </SafeAreaView>
    );
  }

  // If loading is done, but we still don't have a profile object from context
  if (!profile) {
      // Determine potential account type hint from user metadata if available
      const metaAccountType = session?.user?.user_metadata?.profile_type;

      return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.centered}>
                <Text style={styles.infoText}>You haven't created a profile yet.</Text>
                <View style={styles.buttonContainer}>
                    {/* Show "Create Personal" unless metadata explicitly says business */}
                    {metaAccountType !== 'business' && (
                        <Button
                            title="Create Personal Profile"
                            onPress={() => navigation.navigate('CreateProfile')} // Navigate to screen in RootStack
                            color="#FF6347"
                        />
                    )}
                    {/* Add some space if both buttons might show */}
                    {metaAccountType !== 'business' && metaAccountType !== 'personal' && (<View style={{height: 10}} />)}
                    {/* Show "Create Business" unless metadata explicitly says personal */}
                    {metaAccountType !== 'personal' && (
                        <Button
                            title="Create Business Profile"
                            onPress={() => navigation.navigate('CreateBusinessProfile')} // Navigate to screen in RootStack
                            color="#007AFF" // Example different color
                        />
                    )}
                </View>
                {!metaAccountType && (
                    <Text style={styles.noteText}>Choose the type of profile you'd like to create.</Text>
                )}
                {/* Add Logout Button here too if desired */}
                 <View style={styles.logoutContainerStandalone}>
                    <Pressable
                      style={[styles.button, styles.buttonGhost]}
                      onPress={handleLogout}
                    >
                      <Text style={styles.buttonGhostText}>Log Out</Text>
                    </Pressable>
                 </View>
            </View>
         </SafeAreaView>
      );
  }

  // --- Profile Exists: Render Profile Details ---
  // Determine display name based on type (ensure profile.account_type exists)
  const displayName = profile.profile_type === 'business'
      ? profile.business_name
      : profile.first_name;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Header with Edit Button */}
        <View style={styles.header}>
          {/* Display name in header if available */}
          <Text style={styles.headerTitle}>{displayName || 'My Profile'}</Text>
          <Pressable
            style={[styles.button, styles.buttonOutline]}
            onPress={handleEditProfile}
          >
            <Text style={styles.buttonOutlineText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Render the Profile Card component with the profile data from context */}
        <ProfileCard profile={profile} />

         {/* Display some basic info (optional) */}
         <Text style={styles.detailText}>Account Type: {profile.profile_type || 'Not Set'}</Text>
         {user?.email && <Text style={styles.detailText}>Email: {user.email}</Text>}


        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Pressable
            style={[styles.button, styles.buttonGhost]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonGhostText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
      {/* Global Toast defined in App.tsx */}
    </SafeAreaView>
  );
};

// --- Styles --- (Combined styles from previous examples)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa", // Example background
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Add padding for centered content too
    backgroundColor: '#f0f0f0', // Match previous centered style bg
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  noteText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    color: '#888',
  },
  detailText: {
      fontSize: 16,
      marginVertical: 5, // Add some vertical space
      color: '#444',
  },
  buttonContainer: {
      width: '80%', // Limit button width
      alignItems: 'center', // Center buttons if they stack
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6347", // Tomato color from example
    flexShrink: 1, // Allow title to shrink if needed
    marginRight: 10, // Space between title and button
  },
  logoutContainer: {
    marginTop: 32,
    alignItems: "center",
  },
   logoutContainerStandalone: {
    marginTop: 40, // More space when it's the main action
    alignItems: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginVertical: 5, // Add vertical margin between buttons if they stack
  },
  buttonOutline: {
    borderColor: "#FF6347",
    backgroundColor: "transparent",
  },
  buttonOutlineText: {
    color: "#FF6347",
    fontWeight: "500",
  },
  buttonGhost: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  buttonGhostText: {
    color: "#6c757d",
    fontWeight: "500",
  },
  // Removed unused error styles (can be added back if needed)
});

export default ProfileScreen;