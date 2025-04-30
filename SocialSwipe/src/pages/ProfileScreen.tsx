import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView, // Keep ScrollView for Business view flexibility
  Alert,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // <-- Import useFocusEffect
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { RootStackParamList } from '../../App';
import { Ionicons } from '@expo/vector-icons';

import ProfileCard, { Profile as ProfileCardData } from '../components/ProfileCard'; // Adjust path if needed

// Interfaces (Keep as is)
interface ManagerProfile {
  user_id: string;
  created_at: string;
  updated_at: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  // Include fields needed for the ProfileCard preview, assuming they exist in individual_profiles
  date_of_birth?: string | null;
  gender?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  location?: string | null;
  looking_for?: string | null;
  profile_pictures?: string[] | null;
}
interface BusinessListing {
  id: string;
  manager_user_id: string;
  business_name: string;
  category: string;
  description?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  phone_number?: string | null;
  listing_photos?: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main' // Or the correct name for the navigator containing this screen
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, loadingAuth } = useAuth();

  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);
  const [loadingManagerProfile, setLoadingManagerProfile] = useState(true);
  const [businessListings, setBusinessListings] = useState<BusinessListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // --- Refetch data when screen comes into focus ---
  const fetchData = useCallback(async (userId: string) => {
    if (!userId) return;

    setLoadingManagerProfile(true);
    setLoadingListings(true); // Set both loading states

    console.log("[ProfileScreen] Refetching data on focus for user:", userId);

    // Fetch Manager Profile
    const { data: profileData, error: profileError } = await supabase
      .from('individual_profiles')
      // Select ALL fields needed for the ManagerProfile interface and ProfileCard
      .select('user_id, created_at, updated_at, first_name, last_name, username, date_of_birth, gender, bio, interests, location, looking_for, profile_pictures')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found, which is okay
      console.error("[ProfileScreen] Error fetching manager profile on focus:", profileError);
      Toast.show({ type: 'error', text1: 'Error loading profile', text2: profileError.message });
      setManagerProfile(null);
    } else {
      console.log("[ProfileScreen] Manager profile data on focus:", profileData);
      setManagerProfile(profileData);
    }
    setLoadingManagerProfile(false);


    // Fetch Business Listings (Only if no manager profile exists)
    // *** NOTE: This logic remains, fetching listings only if no manager profile.
    // The UI rendering logic will determine what is ultimately displayed. ***
    if (!profileData) { // Only fetch listings if there's no individual profile
        console.log("[ProfileScreen] Fetching business listings on focus (as no manager profile found)");
       const { data: listingData, error: listingError } = await supabase
            .from('business_listings')
            .select('*')
            .eq('manager_user_id', userId);

        if (listingError) {
            console.error("[ProfileScreen] Error fetching business listings on focus:", listingError);
            Toast.show({ type: 'error', text1: 'Error loading businesses', text2: listingError.message });
            setBusinessListings([]);
        } else {
            console.log(`[ProfileScreen] Found ${listingData?.length ?? 0} business listings on focus.`);
            setBusinessListings(listingData || []);
        }
    } else {
        // If a manager profile exists, we don't need to *fetch* business listings here
        // according to the original logic, but the state is reset just in case.
        // **Important**: If you *ever* want to show businesses alongside a personal profile,
        // you would need to adjust this data fetching logic too.
        setBusinessListings([]);
    }
    setLoadingListings(false);

  }, []); // Empty dependency array, useCallback will memoize the function

  // --- Use useFocusEffect to trigger fetch ---
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Flag to prevent state updates if component is unmounted quickly

      if (user?.id) {
          if (isActive) {
              fetchData(user.id);
          }
      } else {
          // Reset state if user logs out while screen might be cached
          if (isActive) {
              setManagerProfile(null);
              setBusinessListings([]);
              setLoadingManagerProfile(false);
              setLoadingListings(false);
          }
      }

      return () => {
        isActive = false; // Cleanup function to set isActive to false
        console.log("[ProfileScreen] Focus lost, cleanup.");
        // Optional: Cancel any ongoing fetches if needed
      };
    }, [user, fetchData]) // Depend on user and the memoized fetchData
  );


  // --- Handlers ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { Toast.show({ type: "error", text1: "Logout failed", text2: error.message }); }
    else {
        Toast.show({ type: "success", text1: "Logged out successfully" });
        // Reset local state immediately after logout success
        setManagerProfile(null);
        setBusinessListings([]);
    }
  };

  const handleEditManagerProfile = () => {
    // The button should only be visible if managerProfile exists, but check again just in case
    if (managerProfile) {
      console.log("Navigating to EditProfile (for manager/individual profile)");
      // *** CHANGE: Navigate without passing profileData ***
      // EditProfileScreen will fetch its own data using the authenticated user's ID
      navigation.navigate('EditProfile'); // Ensure 'EditProfile' matches your navigator's screen name
    } else {
        console.warn("[ProfileScreen] Edit button pressed but managerProfile is null. This shouldn't happen if UI logic is correct.");
        Toast.show({ type: 'info', text1: 'Cannot edit profile', text2: 'Profile data not loaded.' });
    }
  };

  // --- handleAddBusiness function remains unchanged ---
  // It's still used in the "Create Profile" prompt and the "Add Another Business" button
  const handleAddBusiness = () => {
      console.log("Navigating to CreateBusinessProfileScreen");
      navigation.navigate('CreateBusinessProfileScreen');
  };

  const handleManageListings = () => {
    console.log("Navigate to MyListingsScreen (to be created)");
    Toast.show({ type: 'info', text1: 'Manage Listings screen not implemented yet.' });
  };


  // --- Render Logic ---

  // 1. Loading State Check (Keep as is)
  // Use combined loading check
  if (loadingAuth || (user && (loadingManagerProfile || loadingListings))) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6347" />
          <Text>Loading Your Account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Logged Out State Check (Render this before checking for profiles)
  if (!user) {
      console.log("[ProfileScreen] Rendering 'Not Logged In' state.");
      return (
          <SafeAreaView style={styles.safeArea}>
              <View style={styles.centered}>
                  <Ionicons name="log-in-outline" size={60} color="#aaa" />
                  <Text style={styles.infoText}>You are not logged in.</Text>
                  <Text style={styles.subInfoText}>Please log in or sign up to view your profile.</Text>
                    {/* Optional: Add Login/Signup buttons here */}
                    {/* <Pressable style={[styles.button, styles.buttonPrimaryChoice]} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.buttonPrimaryChoiceText}>Log In</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.buttonSecondaryChoice]} onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.buttonSecondaryChoiceText}>Sign Up</Text>
                    </Pressable> */}
              </View>
          </SafeAreaView>
      );
  }

  // 3. No Profile State Check (User is logged in, but has neither profile type)
  // --- This section remains unchanged ---
  if (user && !managerProfile && businessListings.length === 0) {
    console.log("[ProfileScreen] Rendering 'Create Profile' prompt.");
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
            <Ionicons name="person-add-outline" size={60} color="#aaa" />
            <Text style={styles.infoText}>Welcome!</Text>
            <Text style={styles.subInfoText}>How would you like to get started? Choose the type of profile you want to create first.</Text>
            <View style={styles.profileChoiceButtonContainer}>
                <Pressable style={[styles.button, styles.buttonPrimaryChoice]} onPress={() => navigation.navigate('CreateProfile')}>
                    <Ionicons name="person-outline" size={20} color="#fff" style={{ marginRight: 8 }}/>
                    <Text style={styles.buttonPrimaryChoiceText}>Create Personal Profile</Text>
                </Pressable>
                {/* handleAddBusiness is correctly used here */}
                <Pressable style={[styles.button, styles.buttonSecondaryChoice]} onPress={handleAddBusiness}>
                    <Ionicons name="business-outline" size={20} color="#fff" style={{ marginRight: 8 }}/>
                    <Text style={styles.buttonSecondaryChoiceText}>Create Business Profile</Text>
                </Pressable>
            </View>
            <View style={styles.logoutContainerStandalone}>
                <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#6c757d" style={{ marginRight: 8 }}/>
                    <Text style={styles.buttonGhostText}>Log Out</Text>
                </Pressable>
            </View>
        </View>
      </SafeAreaView>
    );
  }


  // 4. Profile Exists State: Render the main view (Either Individual or Business List)
  console.log("[ProfileScreen] Rendering main profile view (Individual or Business List).");

  // Determine display name (logic remains unchanged)
  const getDisplayName = () => {
      if (managerProfile?.first_name) return `${managerProfile.first_name}${managerProfile.last_name ? ` ${managerProfile.last_name}` : ''}`;
      if (managerProfile?.username) return managerProfile.username;
      // If no manager profile, but listings exist, use the first business name (or a generic title)
      if (!managerProfile && businessListings.length > 0) return businessListings[0].business_name || 'My Businesses';
      // Fallback if somehow user exists but no profile/listing data loaded properly
      return user?.email || 'My Account';
  };
  const displayName = getDisplayName();

  // --- Helper function to create ProfileCardData (logic remains unchanged) ---
  const createProfileCardData = (profile: ManagerProfile | null): ProfileCardData | null => {
      if (!profile) return null;
      // Use actual data if available, otherwise provide sensible defaults/placeholders if needed
      const cardData: ProfileCardData = {
          id: profile.user_id, // Use user_id from profile as the card ID
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          first_name: profile.first_name || profile.username || "User", // Make sure ProfileCard can handle this
          last_name: profile.last_name, // Can be null
          // These fields MUST exist in your ManagerProfile interface and be fetched from Supabase
          date_of_birth: profile.date_of_birth || '1970-01-01', // Provide a default or handle null in ProfileCard
          gender: profile.gender || 'N/A', // Provide a default or handle null in ProfileCard
          bio: profile.bio, // Can be null
          interests: profile.interests, // Can be null
          location: profile.location, // Can be null
          looking_for: profile.looking_for, // Can be null
          profile_pictures: profile.profile_pictures || [], // Ensure it's always an array
      };
      return cardData;
  };

  const profileCardInput = managerProfile ? createProfileCardData(managerProfile) : null;

  // --- MODIFICATION: Choose Root Component based on profile type ---
  // Use ScrollView ONLY if it's the business view (needs FlatList)
  // Use a regular View for the Personal Profile to avoid inherent scrolling
  const RootComponent = managerProfile ? View : ScrollView;
  const rootComponentProps = managerProfile
    ? { style: styles.container } // Use a style that allows content to flex/center if needed
    : { // Props for ScrollView
        style: styles.scrollView,
        contentContainerStyle: styles.scrollContentContainer,
      };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* --- MODIFICATION: Use conditional RootComponent --- */}
      <RootComponent {...rootComponentProps}>
        {/* --- Header --- */}
        <View style={styles.header}>
            {/* --- MODIFICATION START: Move Logout Button to Top Left --- */}
            <View style={styles.headerButtonContainerLeft}>
              {/* Logout Button is always shown when logged in and profile exists */}
              {/* *** CHANGE: Use headerButtonBase instead of button to remove border *** */}
              <Pressable style={[styles.headerButtonBase, styles.headerLogoutButton]} onPress={handleLogout} hitSlop={10}>
                  <Ionicons name="log-out-outline" size={24} color="#6c757d" style={{ marginRight: 0 }}/> {/* Maybe remove text for space */}
                  {/* <Text style={styles.headerLogoutButtonText}>Log Out</Text> */}
              </Pressable>
            </View>
            {/* --- MODIFICATION END --- */}

          {/* Display Name */}
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>

          {/* Edit/Settings Button Area (Logic remains unchanged) */}
          <View style={styles.headerButtonContainer}>
            {/* Show Edit Personal Profile Button if managerProfile exists */}
            {managerProfile && (
                /* *** CHANGE: Use headerButtonBase instead of button to remove border *** */
                <Pressable style={[styles.headerButtonBase, styles.headerEditButton]} onPress={handleEditManagerProfile} hitSlop={10}>
                    <Ionicons name="person-circle-outline" size={24} color={"#FF6347"} style={{ marginRight: 5 }}/>
                    {/* *** CHANGE: Apply specific text style *** */}
                    <Text style={styles.buttonOutlineText}>Edit</Text>
                </Pressable>
            )}
              {/* If no manager profile (business view), show a placeholder to balance the header */}
            {!managerProfile && (
                <View style={{ width: 50 }} /> // Placeholder for balance - adjust width if needed
            )}
          </View>
        </View>

        {/* --- Personal Profile Card Preview --- (Only if managerProfile exists) */}
        {profileCardInput && (
            // --- MODIFICATION: Wrap in a View that allows ProfileCard to take necessary space ---
            // This view is now inside the main <View> (RootComponent), not ScrollView
            <View style={styles.profileCardContainer}>
                {/* <Text style={styles.sectionTitle}>My Personal Profile Preview</Text> */}
                {/* Removed section title to save vertical space */}
                <ProfileCard profile={profileCardInput} />
                {/* Edit button is now in the header, removing redundancy */}
            </View>
        )}

        {/* --- Business Listings Section --- (Only if NO managerProfile exists and listings ARE present) */}
        {/* --- This section remains unchanged, including the "Add Another Business" button --- */}
        {/* --- This will only render when RootComponent is ScrollView --- */}
        {!managerProfile && businessListings.length > 0 && (
            <View style={styles.section}> {/* This section style might need adjustment if used outside ScrollView */}
                <Text style={styles.sectionTitle}>My Business Listings</Text>
                <FlatList
                    data={businessListings}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.listingItem}>
                          <Text style={styles.listingName}>{item.business_name}</Text>
                          <Text style={styles.listingCategory}>{item.category}</Text>
                        {/* Add address or other details if desired */}
                        {/* <Text style={styles.listingDetail}>{`${item.address_city || ''}${item.address_state ? `, ${item.address_state}` : ''}`}</Text> */}
                        </View>
                    )}
                    style={styles.listingList}
                />
                <View style={styles.businessActionsContainer}>
                  <Pressable style={[styles.button, styles.manageButton]} onPress={handleManageListings}>
                      <Ionicons name="briefcase-outline" size={18} color="#fff" style={{ marginRight: 8 }}/>
                      <Text style={styles.manageButtonText}>Manage Listings</Text>
                    </Pressable>
                    {/* handleAddBusiness is correctly used here */}
                    <Pressable style={[styles.button, styles.addBusinessButtonSection]} onPress={handleAddBusiness}>
                        <Ionicons name="add-circle-outline" size={20} color="#007AFF" style={{ marginRight: 8 }}/>
                        <Text style={styles.addBusinessButtonSectionText}>Add Another Business</Text>
                    </Pressable>
                </View>
            </View>
        )}

        {/* --- MODIFICATION: Removed Logout Button from the bottom --- */}
        {/* The logout button is now in the header */}

      {/* --- MODIFICATION: Close conditional RootComponent --- */}
      </RootComponent>
      <Toast /> {/* Ensure Toast is rendered */}
    </SafeAreaView>
  );
};

// --- Styles --- (Adjusted and added styles)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  // Style for the main container when it's a View (Personal Profile)
  container: {
    flex: 1, // Takes full available space
    // Removed paddingVertical from here, apply padding inside components if needed
  },
  // Style for the main container when it's a ScrollView (Business Profile)
  scrollView: { flex: 1 },
  scrollContentContainer: { paddingVertical: 16, paddingBottom: 80 }, // Keep padding for scroll view content
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: '#f0f0f0' },
  infoText: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 10, color: '#444' },
  subInfoText: { fontSize: 15, textAlign: 'center', marginBottom: 30, color: '#666', maxWidth: '90%' },
  detailText: { fontSize: 16, marginVertical: 4, color: '#444', textAlign: 'center' },
  profileChoiceButtonContainer: { width: '85%', alignItems: 'stretch', marginTop: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 24, // Reduced margin for non-scrolling view
    marginBottom: 10, // Adjusted margin
    width: '100%',
    paddingHorizontal: 16, // Add padding here
    paddingTop: 10, // Add some top padding within safe area
    minHeight: 50, // Ensure header has some height
  },
  headerButtonContainer: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' }, // Right side
  headerButtonContainerLeft: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', }, // Left side
  // Shared button style (transparent background, no border unless specified)
  headerButtonBase: {
    paddingVertical: 6,
    paddingHorizontal: 0, // Remove horizontal padding for icon-only/compact buttons
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0, // *** Ensures no border ***
    backgroundColor: 'transparent',
  },
  // Specific style for Edit button in header
  headerEditButton: {
    // Inherits from headerButtonBase
    // Add specific styles if needed, e.g., padding adjustments for icon+text
    paddingHorizontal: 5, // Add slight padding back for the "Edit" text case
  },
  // Specific style for Logout button in header
  headerLogoutButton: {
    // Inherits from headerButtonBase
    paddingLeft: 0, // Ensure icon is close to the edge
  },
  headerLogoutButtonText: { // Style for logout text if you keep it
     color: "#6c757d",
     fontWeight: "500",
     fontSize: 14,
     marginLeft: 5, // Space between icon and text
  },
  // Style for the removed Add Business header button - kept for reference
  // headerAddButton: { paddingVertical: 6, paddingHorizontal: 0, flexDirection: 'row', alignItems: 'center', borderWidth: 0, backgroundColor: 'transparent' },
  // addBusinessText: { color: '#007AFF', fontWeight: 'bold', fontSize: 14 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: 'center', flex: 2.5, marginHorizontal: 5 }, // Increased flex slightly
  // Container for the ProfileCard when in the non-scrolling view
  profileCardContainer: {
      flex: 1, // Allows ProfileCard to expand
      alignItems: 'center', // Center the card horizontally
      justifyContent: 'flex-start', // Align card towards the top
      // *** CHANGE: Increased padding to make card appear smaller ***
      paddingHorizontal: 24, // Was 16 - Padding for the card container
      width: '100%',
      // Remove marginBottom if not needed, rely on flex spacing
  },
  // Style for the ProfileCard section title (now optional/removed)
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 15, /* textAlign: 'center', */ color: '#333' }, // Adjusted alignment

  // Styles for Business View (within ScrollView)
  section: { marginHorizontal: 16, marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  listingList: { marginTop: 10, marginBottom: 15 },
  listingItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', borderRadius: 6, marginBottom: 8 },
  listingName: { fontSize: 16, fontWeight: '500', color: '#444', marginBottom: 2 },
  listingCategory: { fontSize: 14, color: '#777' },
  listingDetail: { fontSize: 13, color: '#888', marginTop: 2 }, // Style for address etc.

  // --- MODIFIED: Removed standalone logout container style ---
  // logoutContainer: { marginTop: 24, alignItems: "center", paddingHorizontal: 16 },
  logoutContainerStandalone: { marginTop: 40, width: '80%', alignItems: "stretch" }, // Keep for the 'No Profile' screen

  // General Button Styles (mostly unchanged, but header buttons no longer use `button` directly)
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 25, alignItems: "center", justifyContent: "center", borderWidth: 1, marginVertical: 8, flexDirection: 'row' },
  buttonPrimaryChoice: { backgroundColor: '#FF6347', borderColor: '#FF6347' },
  buttonPrimaryChoiceText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  buttonSecondaryChoice: { backgroundColor: '#4682B4', borderColor: '#4682B4' },
  buttonSecondaryChoiceText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { borderColor: "#FF6347", backgroundColor: "transparent" },
  // *** NOTE: This text style is now applied directly in the Edit button ***
  buttonOutlineText: { color: "#FF6347", fontWeight: "bold", fontSize: 14 },
  buttonGhost: { borderColor: "transparent", backgroundColor: "transparent" },
  buttonGhostText: { color: "#6c757d", fontWeight: "500", fontSize: 16 },
  businessActionsContainer: { marginTop: 15 }, // Container for manage/add buttons
  manageButton: { backgroundColor: '#5cb85c', borderColor: '#5cb85c', width: '100%' },
  manageButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  addBusinessButtonSection: { backgroundColor: 'transparent', borderColor: '#007AFF', borderWidth: 1, width: '100%', marginTop: 10 },
  addBusinessButtonSectionText: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },

  // --- MODIFIED: Renamed this style for clarity ---
  // profileCardSection: { marginBottom: 24, alignItems: 'center', paddingHorizontal: 16 }, // Old name
  // Style for edit button below card (now removed, button is in header)
  // editCardButton: { marginTop: 15, alignSelf: 'center', width: '100%', maxWidth: 350 }
});

export default ProfileScreen;