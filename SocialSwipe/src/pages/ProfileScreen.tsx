// src/screens/ProfileScreen.tsx (or appropriate path)
// MODIFIED: Only updated handleEditProfile function

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { useAuth } from "../contexts/AuthContext"; // Adjust path if needed
import ProfileCard from "../components/ProfileCard"; // Adjust path if needed
import { supabase } from "../lib/supabaseClient"; // Adjust path if needed

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
  profile_pictures?: string[] | null; // Expecting this to contain full URLs directly from DB
  // Add any other fields from your profiles table
}

// Define navigation param list
type ProfileScreenNavigationProp = NativeStackNavigationProp<
  {
    Login: undefined;
    ProfilePrompt: undefined;
    EditProfile: undefined; // Ensure this screen name is correct for your navigator
    // Add other relevant screen names if needed
  },
  "ProfileTab" // The current screen's name (adjust if different)
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  // Keeping 'session' here as it was in your original code for this file
  const { user, loading: authLoading, session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Only fetch if auth isn't loading and user exists
    if (!authLoading && user) {
      const fetchProfile = async () => {
        setLoading(true);
        console.log("ProfileScreen: Fetching profile for user ID:", user.id);

        // *** BUCKET_NAME and URL Generation code REMOVED ***

        try {
          // Fetch profile data - assuming it includes the full URL in profile_pictures
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*") // Ensure 'profile_pictures' column is selected (using '*' does this)
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("ProfileScreen: Error fetching profile:", profileError);
            throw profileError; // Throw error to be caught below
          }

          // Check if data was returned
          if (profileData) {
            // *** VITAL: Log the data exactly as received ***
            console.log("ProfileScreen: Profile data found (raw):", profileData);

            // *** Use the data directly, as profile_pictures should already contain URLs ***
            setProfile(profileData as Profile); // Cast to Profile type

          } else {
            // Handle case where profile row doesn't exist for the user ID
            console.warn("ProfileScreen: No profile data found for user.");
            Toast.show({
              type: "warning",
              text1: "Profile setup needed.",
              text2: "Let's get your profile ready.",
            });
            navigation.navigate("ProfilePrompt"); // Redirect to profile creation
          }
        } catch (error: any) {
          // Handle any errors during the fetch or processing
          console.error("ProfileScreen: Failed to fetch profile:", error);
          Toast.show({
            type: "error",
            text1: "Failed to load profile",
            text2: error?.message || "Please try again later.",
          });
           // Keep profile null to show error/retry screen
           setProfile(null);
        } finally {
          // Always set loading to false once fetch attempt is complete
          setLoading(false);
        }
      };

      fetchProfile(); // Execute the fetch function

    } else if (!authLoading && !user) {
      // Handle case where user is not logged in (and auth check is complete)
      console.log("ProfileScreen: No user session, redirecting to login.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      setLoading(false); // Ensure loading is false if redirecting
    }
     // If auth is still loading, loading remains true, effect re-runs when auth changes
  }, [user, authLoading, navigation]); // Dependencies for the effect


  // --- Logout Handler ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Toast.show({ type: "error", text1: "Logout failed", text2: error.message });
    } else {
      Toast.show({ type: "success", text1: "Logged out successfully" });
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  // --- *** EDIT PROFILE NAVIGATION (Updated) *** ---
  const handleEditProfile = () => {
    // Navigate to your EditProfile screen - Ensure 'EditProfile' is correct name in navigator
    navigation.navigate('EditProfile'); // <<<< ONLY CHANGE IS HERE
    // Removed the placeholder Toast
  };
  // --- *** END OF CHANGE *** ---


  // --- Retry Fetch ---
   const handleRetry = () => {
       console.log("ProfileScreen: Retrying profile fetch...");
       setProfile(null); // Clear current profile state
       setLoading(true); // Show loading indicator immediately
       // The useEffect hook will re-run because dependencies haven't changed,
       // but the internal logic will now execute fetchProfile again.
   };


  // --- Render Logic ---

  // Show main loader if auth is initially loading OR profile data is being fetched/processed
  if (authLoading || loading) {
    return (
      // Applying safeArea here too for consistency during loading
      <SafeAreaView style={styles.safeArea}>
           <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6347" />
           </View>
      </SafeAreaView>
    );
  }

  // If loading is done but profile is still null (e.g., fetch failed or user needs profile setup)
  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, styles.errorContainer]}>
          <Text style={styles.errorText}>Could not load profile data.</Text>
          <Text style={styles.errorTextSmall}>There might be a network issue or the profile is missing.</Text>
          <Pressable
            style={[styles.button, styles.buttonOutline, styles.retryButton]}
            onPress={handleRetry} // Use the retry handler
          >
            <Text style={styles.buttonOutlineText}>Retry</Text>
          </Pressable>
           <Pressable // Add a logout option in case of persistent failure
            style={[styles.button, styles.buttonGhost, styles.retryButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonGhostText}>Log Out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Render Actual Profile inside a ScrollView now that we have valid profile data
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Header with Edit Button */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          {/* This Pressable now correctly calls the updated handleEditProfile */}
          <Pressable
            style={[styles.button, styles.buttonOutline]}
            onPress={handleEditProfile}
          >
            <Text style={styles.buttonOutlineText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Render the Profile Card component with the direct profile data */}
        {/* profile.profile_pictures should contain the URLs directly from the DB */}
        <ProfileCard profile={profile} />

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
       {/* Make sure Toast messages can render globally, usually configured in App.tsx */}
       {/* <Toast /> */}
    </SafeAreaView>
  );
};

// --- Styles --- (Copied from your previous code - unchanged)
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
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    fontSize: 18, // Slightly larger
    fontWeight: '600',
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 8,
  },
  errorTextSmall: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 20, // Add space before button
  },
  retryButton: {
    marginTop: 15, // Consistent spacing for buttons
    minWidth: 120, // Give buttons some minimum width
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
  },
  logoutContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
});

export default ProfileScreen;