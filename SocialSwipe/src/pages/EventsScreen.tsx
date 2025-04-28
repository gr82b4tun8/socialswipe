// src/pages/EventsScreen.tsx (MODIFIED for Liker Profile Swiping Modal)

import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    SafeAreaView, Modal, TouchableOpacity, Alert // Added Modal, TouchableOpacity, Alert
} from 'react-native';
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path
import LikedListingItem from '../components/LikedListingItem'; // Use the updated item

// --- ADDED: Imports for Liker Profiles ---
import { useAuth } from '../contexts/AuthContext'; // Need user ID for fetching/swiping
import { supabase } from '../lib/supabaseClient'; // Adjust path
import { Profile as IndividualProfile } from '../screens/EditProfileScreen'; // Adjust path/name
import ProfileCardStack from '../components/ProfileStoryView'; // Import the new stack component
import { Ionicons } from '@expo/vector-icons'; // For close button

const EventsScreen: React.FC = () => {
    // Existing Context Hooks
    const {
        likedListingsData, isLoadingListings, unlikeListing, fetchDiscoveryData
    } = useDiscovery();
    const { user } = useAuth(); // Get current user

    // --- STATE for Modal and Liker Profiles ---
    const [isLikerModalVisible, setIsLikerModalVisible] = useState(false);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [likerProfiles, setLikerProfiles] = useState<IndividualProfile[]>([]);
    const [isLoadingLikers, setIsLoadingLikers] = useState<boolean>(false);
    const [likerError, setLikerError] = useState<string | null>(null);

    // --- UNLIKE HANDLER: Remains the same ---
    const handleUnlike = useCallback((listingId: string) => {
        console.log(`EventsScreen: Unliking listing with ID: ${listingId}`);
        unlikeListing(listingId);
    }, [unlikeListing]);

    // --- HANDLER to open Modal ---
    const handleItemPress = useCallback((listingId: string) => {
        console.log(`EventsScreen: Item pressed, opening likers for Listing ID: ${listingId}`);
        setSelectedListingId(listingId); // Set the listing ID
        setIsLikerModalVisible(true);    // Show the modal
        setLikerError(null);            // Reset error state
        // Fetching will be triggered by useEffect below
    }, []);

    // --- HANDLER to close Modal ---
    const handleCloseLikerModal = () => {
        setIsLikerModalVisible(false);
        setSelectedListingId(null);
        setLikerProfiles([]);
        setIsLoadingLikers(false);
        setLikerError(null);
    };

    // --- EFFECT to Fetch Likers when Modal Opens for a Listing ---
    useEffect(() => {
        const fetchLikersForListing = async (listingId: string) => {
            if (!user) {
                setLikerError("You must be logged in to see likers.");
                setIsLoadingLikers(false);
                return;
            }

            console.log(`[EventsScreen] Fetching likers for Listing ID: ${listingId}`);
            setIsLoadingLikers(true);
            setLikerProfiles([]); // Clear previous profiles
            setLikerError(null);

            try {
                // 1. Fetch user IDs who liked the specific listing (excluding the current user)
                const { data: likeData, error: likeError } = await supabase
                    .from('profile_likes')
                    .select('liker_user_id')
                    .eq('liked_listing_id', listingId)
                    .neq('liker_user_id', user.id); // Exclude self

                if (likeError) throw likeError;

                if (likeData && likeData.length > 0) {
                    const likerIds = likeData.map(like => like.liker_user_id);
                    console.log(`[EventsScreen] Found Liker IDs:`, likerIds);

                    // 2. Fetch profiles for these liker IDs
                    const { data: profileData, error: profileError } = await supabase
                        .from('individual_profiles')
                        .select('*') // Select fields needed by ProfileCard
                        .in('user_id', likerIds);

                    if (profileError) throw profileError;

                    if (profileData) {
                        console.log(`[EventsScreen] Successfully fetched ${profileData.length} liker profiles.`);
                        // TODO: Potentially filter out users the current user has already swiped on for this context?
                        setLikerProfiles(profileData as IndividualProfile[]);
                    } else {
                        setLikerProfiles([]);
                    }
                } else {
                    console.log('[EventsScreen] No other users found who liked this listing.');
                    setLikerProfiles([]);
                }
            } catch (error: any) {
                console.error('[EventsScreen] Error fetching liker profiles:', error.message);
                setLikerError("Could not load profiles. Please try again.");
                setLikerProfiles([]);
            } finally {
                setIsLoadingLikers(false);
            }
        };

        // Only fetch if the modal is visible and a listing ID is selected
        if (isLikerModalVisible && selectedListingId) {
            fetchLikersForListing(selectedListingId);
        }
    }, [isLikerModalVisible, selectedListingId, user]); // Dependencies for the effect


    // --- HANDLERS for Swiping on User Profiles (Placeholder Logic) ---
    const handleSwipeLeft = (profileId: string) => {
        console.log(`Swiped LEFT on User ID: ${profileId} for Listing ID: ${selectedListingId}`);
        // TODO: Implement Supabase call to record the "dismiss" action
        // e.g., insert into a 'user_swipes' table: { swiper_id: user.id, swiped_id: profileId, liked: false, context_listing_id: selectedListingId }
    };

    const handleSwipeRight = (profileId: string) => {
        console.log(`Swiped RIGHT on User ID: ${profileId} for Listing ID: ${selectedListingId}`);
        // TODO: Implement Supabase call to record the "like" action
        // e.g., insert into 'user_swipes': { swiper_id: user.id, swiped_id: profileId, liked: true, context_listing_id: selectedListingId }
        // TODO: Implement check for a match (has profileId also swiped right on user.id in this context?)
        // If match: Create a match record in a 'matches' table and notify users.
        // Example Match Check (pseudo-code):
        // const { data: potentialMatch } = await supabase.from('user_swipes').select().eq('swiper_id', profileId).eq('swiped_id', user.id).eq('liked', true).eq('context_listing_id', selectedListingId).maybeSingle();
        // if (potentialMatch) { console.log("IT'S A MATCH!"); /* Create match record */ }
    };

    const handleSwipedAll = () => {
        console.log("Swiped through all available profiles for this listing.");
        // Optionally close the modal automatically or show a message
        // handleCloseLikerModal();
    };

    // --- Render item function uses LikedListingItem ---
    const renderLikedItem = ({ item }: { item: BusinessListing }) => (
        <LikedListingItem
            listing={item}
            onUnlike={handleUnlike}
            // --- PASS the onPress handler ---
            onPress={handleItemPress}
        />
    );

    // --- Loading/Empty States for the main list --- (Remain the same)
    if (isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
         return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#FF6347" /></SafeAreaView>;
    }
    if (!isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
         return <SafeAreaView style={styles.centered}><Text style={styles.emptyText}>You haven't liked any listings yet!</Text><Text style={styles.emptySubText}>Go to the Discover tab.</Text></SafeAreaView>;
    }

    // --- MAIN LIST VIEW ---
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={likedListingsData || []}
                renderItem={renderLikedItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContentContainer}
                refreshing={isLoadingListings}
                onRefresh={fetchDiscoveryData}
            />

            {/* --- MODAL for Liker Profile Swiping --- */}
            <Modal
                animationType="slide"
                transparent={false} // Full screen modal
                visible={isLikerModalVisible}
                onRequestClose={handleCloseLikerModal} // Android back button
            >
                {/* Use SafeAreaView inside Modal for content */}
                <SafeAreaView style={styles.modalContainer}>
                     {/* Custom Header for Modal */}
                     <View style={styles.modalHeader}>
                         <Text style={styles.modalTitle}>People who liked this place</Text>
                         <TouchableOpacity onPress={handleCloseLikerModal} style={styles.closeButton}>
                             <Ionicons name="close-circle" size={30} color="#555" />
                         </TouchableOpacity>
                     </View>

                     {/* Content Area for Swiper */}
                     <View style={styles.modalContent}>
                        {isLoadingLikers && (
                            <View style={styles.modalCentered}>
                                <ActivityIndicator size="large" color="#FF6347" />
                                <Text style={styles.loadingText}>Loading profiles...</Text>
                            </View>
                        )}

                        {!isLoadingLikers && likerError && (
                             <View style={styles.modalCentered}>
                                <Text style={styles.errorText}>{likerError}</Text>
                                <TouchableOpacity onPress={handleCloseLikerModal} style={styles.errorCloseButton}>
                                     <Text style={styles.errorCloseButtonText}>Close</Text>
                                 </TouchableOpacity>
                             </View>
                        )}

                        {!isLoadingLikers && !likerError && likerProfiles.length === 0 && (
                             <View style={styles.modalCentered}>
                                <Text style={styles.emptyStateText}>No other users found yet!</Text>
                                <Text style={styles.emptyStateSubText}>Check back later or explore other places.</Text>
                             </View>
                        )}

                        {!isLoadingLikers && !likerError && likerProfiles.length > 0 && (
                            <ProfileCardStack
                                profiles={likerProfiles}
                                onSwipeLeft={handleSwipeLeft}
                                onSwipeRight={handleSwipeRight}
                                onSwipedAll={handleSwipedAll}
                            />
                        )}
                     </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};


// --- STYLES ---
const styles = StyleSheet.create({
    // Existing Styles (Main List, Centered, Empty, List Container)
    container: { flex: 1, backgroundColor: '#f8f8f8', },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#f8f8f8', },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#555', textAlign: 'center', marginBottom: 8, },
    emptySubText: { fontSize: 14, color: '#777', textAlign: 'center', },
    listContentContainer: { paddingVertical: 8, paddingHorizontal: 0, },

    // --- MODAL Styles ---
    modalContainer: {
        flex: 1,
        backgroundColor: '#f0f0f0', // Light background for the modal
    },
     modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        backgroundColor: '#fff', // White header background
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    modalContent: {
        flex: 1, // Take remaining space
        // alignItems: 'center', // Swiper handles its own alignment
        // justifyContent: 'center', // Swiper handles its own alignment
    },
    // Centered content specifically for Loading/Empty/Error states within Modal
    modalCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
     errorCloseButton: {
        marginTop: 15,
        backgroundColor: '#ccc',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    errorCloseButtonText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default EventsScreen;