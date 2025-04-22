// src/pages/ProfileScreen.tsx (Verified logic for business-only users)

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Alert,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { useAuth } from "../contexts/AuthContext"; // Using simplified context
import { supabase } from "../lib/supabaseClient";
import { RootStackParamList } from '../../App'; // Adjust path if needed
import { Ionicons } from '@expo/vector-icons';

// Interface for the primary user profile data (fetched from individual_profiles)
interface ManagerProfile {
  user_id: string;
  created_at: string;
  updated_at: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  // Add other fields fetched from individual_profiles if needed
}

// Interface for Business Listing data
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
  'Main'
>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const {
    session,
    user,
    loadingAuth,
  } = useAuth();

  // --- Local State ---
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);
  const [loadingManagerProfile, setLoadingManagerProfile] = useState(true);
  const [businessListings, setBusinessListings] = useState<BusinessListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  // --- Fetch Manager (Individual) Profile ---
  useEffect(() => {
    if (user?.id) {
        const fetchManagerProfile = async () => {
            if (!managerProfile) setLoadingManagerProfile(true);
            console.log("[ProfileScreen] Fetching manager (individual) profile for user:", user.id);

            // *** Ensure 'individual_profiles' table exists and user_id is PRIMARY KEY ***
            const { data, error } = await supabase
                .from('individual_profiles') // <<< CONFIRM/ADJUST TABLE NAME
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("[ProfileScreen] Error fetching manager profile:", error);
                 if (error.message.includes('JSON object requested, multiple (or no) rows returned')) {
                     Toast.show({ type: 'error', text1: 'Profile Error', text2: 'Inconsistent profile data found.' });
                 } else {
                    Toast.show({ type: 'error', text1: 'Error loading profile', text2: error.message });
                 }
                setManagerProfile(null);
            } else {
                console.log("[ProfileScreen] Manager profile data:", data);
                setManagerProfile(data);
            }
            setLoadingManagerProfile(false);
        };
        fetchManagerProfile();
    } else {
      setManagerProfile(null);
      setLoadingManagerProfile(false);
    }
  }, [user]);

  // --- Fetch Business Listings ---
  useEffect(() => {
    if (user?.id) {
      const fetchListings = async () => {
        if (businessListings.length === 0) setLoadingListings(true);
        console.log("[ProfileScreen] Fetching business listings for user:", user.id);
        const { data, error } = await supabase
          .from('business_listings')
          .select('*')
          .eq('manager_user_id', user.id); // *** Ensure this column name is correct ***

        if (error) {
          console.error("[ProfileScreen] Error fetching business listings:", error);
          Toast.show({ type: 'error', text1: 'Error loading businesses', text2: error.message });
          setBusinessListings([]);
        } else {
          console.log(`[ProfileScreen] Found ${data?.length ?? 0} business listings.`);
          setBusinessListings(data || []);
        }
        setLoadingListings(false);
      };
      fetchListings();
    } else {
      setBusinessListings([]);
      setLoadingListings(false);
    }
  }, [user]);

  // --- Handlers ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { Toast.show({ type: "error", text1: "Logout failed", text2: error.message }); }
    else { Toast.show({ type: "success", text1: "Logged out successfully" }); }
  };

  const handleEditManagerProfile = () => {
    // This button is only rendered if managerProfile exists (see below)
    if (managerProfile) {
        console.log("Navigating to EditProfile (for manager/individual profile)");
        navigation.navigate('EditProfile', { profileData: managerProfile });
    }
  };

  const handleAddBusiness = () => {
      console.log("Navigating to CreateBusinessProfileScreen");
      navigation.navigate('CreateBusinessProfileScreen');
  };

  const handleManageListings = () => {
    console.log("Navigate to MyListingsScreen (to be created)");
    Toast.show({ type: 'info', text1: 'Manage Listings screen not implemented yet.' });
  };

  // --- Render Logic ---

  // 1. Loading State Check
  if (loadingAuth || (user && (loadingManagerProfile || loadingListings))) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6347" />
          <Text>Loading Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. No Profile State Check: Show prompt ONLY if logged in AND both profile types are missing
  if (user && !managerProfile && businessListings.length === 0) {
    console.log("[ProfileScreen] Rendering 'Create Profile' prompt.");
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.infoText}>How would you like to get started?</Text>
          <Text style={styles.subInfoText}>Choose the type of profile you want to create first.</Text>
          <View style={styles.profileChoiceButtonContainer}>
            <Pressable style={[styles.button, styles.buttonPrimaryChoice]} onPress={() => navigation.navigate('CreateProfile')}>
                <Text style={styles.buttonPrimaryChoiceText}>Create Personal Profile</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.buttonSecondaryChoice]} onPress={handleAddBusiness}>
                <Text style={styles.buttonSecondaryChoiceText}>Create Business Profile</Text>
            </Pressable>
          </View>
          <View style={styles.logoutContainerStandalone}>
            <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleLogout}>
              <Text style={styles.buttonGhostText}>Log Out</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Logged Out State Check (Fallback)
  if (!user) {
      console.log("[ProfileScreen] Rendering 'Not Logged In' state.");
      return (
          <SafeAreaView style={styles.safeArea}>
              <View style={styles.centered}>
                  <Text>You are not logged in.</Text>
              </View>
          </SafeAreaView>
      );
  }

  // 4. Profile Exists State: Render the main view
  console.log("[ProfileScreen] Rendering main profile view.");

  // Determine display name: Prioritize individual, then first business, then email
  const getDisplayName = () => {
      if (managerProfile?.first_name) return managerProfile.first_name;
      if (managerProfile?.username) return managerProfile.username;
      if (businessListings.length > 0) return businessListings[0].business_name;
      return user?.email || 'My Account';
  };
  const displayName = getDisplayName();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* --- Header --- */}
        <View style={styles.header}>
           {/* Add Business Button */}
          <View style={styles.headerButtonContainerLeft}>
              <Pressable style={[styles.button, styles.headerAddButton]} onPress={handleAddBusiness}>
                  <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              </Pressable>
          </View>
          {/* Display Name */}
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
          {/* Edit Button (Conditional) */}
          <View style={styles.headerButtonContainer}>
            {/* Only render Edit button if managerProfile exists */}
            {managerProfile && (
                <Pressable style={[styles.button, styles.buttonOutline, styles.headerButton]} onPress={handleEditManagerProfile}>
                    <Ionicons name="person-circle-outline" size={20} color={"#FF6347"} style={{ marginRight: 5 }}/>
                    <Text style={styles.buttonOutlineText}>Edit</Text>
                </Pressable>
            )}
          </View>
        </View>

        {/* --- Display Manager (Individual) Info --- (Conditional) */}
        {/* Only render Account Details if managerProfile exists */}
        {managerProfile && (
             <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Details</Text>
                <Text style={styles.detailText}>Name: {managerProfile.first_name || 'N/A'} {managerProfile.last_name || ''}</Text>
                {managerProfile.username && <Text style={styles.detailText}>Username: {managerProfile.username}</Text>}
                {user?.email && <Text style={styles.detailText}>Email: {user.email}</Text>}
             </View>
        )}

        {/* --- Business Listings Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Business Listings</Text>
          {/* Display listings if available */}
          {businessListings.length > 0 ? (
            <>
              <Text style={styles.detailText}>You manage {businessListings.length} listing(s).</Text>
              <FlatList
                data={businessListings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.listingItem}>
                    <Text style={styles.listingName}>{item.business_name}</Text>
                    <Text style={styles.listingCategory}>{item.category}</Text>
                  </View>
                )}
                style={styles.listingList}
              />
              <Pressable style={[styles.button, styles.manageButton]} onPress={handleManageListings}>
                  <Ionicons name="briefcase-outline" size={18} color="#fff" style={{ marginRight: 8 }}/>
                  <Text style={styles.manageButtonText}>Manage Listings</Text>
              </Pressable>
            </>
          ) : (
            // Display message if no listings exist (but profile exists)
            <>
              <Text style={styles.detailText}>You haven't added any business listings yet.</Text>
            </>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleLogout}>
            <Text style={styles.buttonGhostText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles --- (Ensure all required styles are present)
const styles = StyleSheet.create({
  // Paste all styles from the previous version here...
  safeArea: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  scrollContentContainer: { padding: 16, paddingBottom: 80 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: '#f0f0f0' },
  infoText: { fontSize: 18, textAlign: 'center', marginBottom: 10, color: '#555' },
  subInfoText: { fontSize: 15, textAlign: 'center', marginBottom: 30, color: '#666', maxWidth: '90%' },
  detailText: { fontSize: 16, marginVertical: 4, color: '#444', textAlign: 'center' },
  profileChoiceButtonContainer: { width: '85%', alignItems: 'stretch', marginTop: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, width: '100%' },
  headerButtonContainer: { flex: 1, alignItems: 'flex-end' },
  headerButtonContainerLeft: { flex: 1, alignItems: 'flex-start' },
  headerButton: { paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 0 },
  headerAddButton: { padding: 8, borderWidth: 0, backgroundColor: 'transparent' },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: 'center', flex: 2, marginHorizontal: 5 },
  section: { marginBottom: 24, padding: 16, backgroundColor: '#fff', borderRadius: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center', color: '#333' },
  listingList: { marginTop: 10, marginBottom: 15 },
  listingItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', borderRadius: 4, marginBottom: 5 },
  listingName: { fontSize: 16, fontWeight: '500', color: '#444' },
  listingCategory: { fontSize: 14, color: '#777' },
  logoutContainer: { marginTop: 24, alignItems: "center" },
  logoutContainerStandalone: { marginTop: 40, width: '80%', alignItems: "stretch" },
  button: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, marginVertical: 8, flexDirection: 'row' },
  buttonPrimaryChoice: { backgroundColor: '#FF6347', borderColor: '#FF6347' },
  buttonPrimaryChoiceText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  buttonSecondaryChoice: { backgroundColor: '#4682B4', borderColor: '#4682B4' },
  buttonSecondaryChoiceText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  buttonOutline: { borderColor: "#FF6347", backgroundColor: "transparent" },
  buttonOutlineText: { color: "#FF6347", fontWeight: "500", fontSize: 14 },
  buttonGhost: { borderColor: "transparent", backgroundColor: "transparent" },
  buttonGhostText: { color: "#6c757d", fontWeight: "500" },
  manageButton: { backgroundColor: '#6c757d', borderColor: '#6c757d', width: '100%' },
  manageButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;
