// src/pages/EventsScreen.tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    SafeAreaView, Modal, TouchableOpacity, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path
import LikedListingItem from '../components/LikedListingItem'; // Use the updated item
import { useAuth } from '../contexts/AuthContext'; // Need user ID for fetching/swiping
import { supabase } from '../lib/supabaseClient'; // Adjust path
import { Profile as StoryProfile } from '../components/ProfileCard'; // Adjust path if needed
import ProfileCardStack from '../components/ProfileStoryView'; // Keep alias if preferred
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '../theme/theme'; // Import for gradient colors

const EventsScreen: React.FC = () => {
    // --- State and Context Hooks ---
    const {
        likedListingsData, isLoadingListings, unlikeListing, fetchDiscoveryData
    } = useDiscovery();
    const { user } = useAuth();
    const [isLikerModalVisible, setIsLikerModalVisible] = useState(false);
    const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
    const [likerProfiles, setLikerProfiles] = useState<StoryProfile[]>([]);
    const [isLoadingLikers, setIsLoadingLikers] = useState<boolean>(false);
    const [likerError, setLikerError] = useState<string | null>(null);

    // --- Gradient Colors ---
    const gradientColors = [
        lightTheme.colors.primary,
        lightTheme.colors.background
    ];

    // --- UNLIKE HANDLER ---
    const handleUnlike = useCallback((listingId: string) => {
        console.log(`EventsScreen: Unliking listing with ID: ${listingId}`);
        unlikeListing(listingId);
    }, [unlikeListing]);

    // --- HANDLER to open Modal ---
    const handleItemPress = useCallback((listingId: string) => {
        console.log(`EventsScreen: Item pressed, opening likers for Listing ID: ${listingId}`);
        setSelectedListingId(listingId); // Set the listing ID
        setIsLikerModalVisible(true);   // Show the modal
        setLikerError(null);            // Reset error state
        // Fetching will be triggered by useEffect below
    }, []);

    // --- HANDLER to close Modal ---
    const handleCloseLikerModal = useCallback(() => {
        setIsLikerModalVisible(false);
        setSelectedListingId(null);
        setLikerProfiles([]);
        setIsLoadingLikers(false);
        setLikerError(null);
    }, []);

    // --- REUSABLE LIKER FETCH LOGIC ---
    const fetchLikersForListing = useCallback(async (listingId: string) => {
        if (!user) {
            setLikerError("You must be logged in to see likers.");
            setIsLoadingLikers(false);
            return;
        }

        console.log(`[EventsScreen] Fetching/Re-fetching likers for Listing ID: ${listingId}`);
        setIsLoadingLikers(true);
        setLikerProfiles([]); // Clear previous profiles
        setLikerError(null);

        try {
            // 1. Fetch user IDs who liked the specific listing (excluding the current user)
            const { data: likeData, error: likeError } = await supabase
                .from('profile_likes') // Ensure this table name is correct
                .select('liker_user_id')
                .eq('liked_listing_id', listingId)
                .neq('liker_user_id', user.id); // Exclude self

            if (likeError) throw likeError;

            if (likeData && likeData.length > 0) {
                const likerIds = likeData.map(like => like.liker_user_id);
                console.log(`[EventsScreen] Found Liker IDs:`, likerIds);

                // 2. Fetch profiles for these liker IDs
                const { data: profileData, error: profileError } = await supabase
                    .from('individual_profiles') // Ensure this table name is correct
                    .select(
                        `user_id,
                         created_at,
                         updated_at,
                         first_name,
                         last_name,
                         date_of_birth,
                         gender,
                         bio,
                         interests,
                         location,
                         looking_for,
                         profile_pictures`
                    )
                    .in('user_id', likerIds);

                if (profileError) throw profileError;

                if (profileData) {
                    console.log(`[EventsScreen] Successfully fetched ${profileData.length} raw liker profiles.`);
                    const formattedProfiles = profileData.map((rawProfile): StoryProfile => {
                        // Provide defaults for potentially missing or optional fields
                        const createdAt = rawProfile.created_at || new Date().toISOString();
                        const updatedAt = rawProfile.updated_at || new Date().toISOString();
                        const dob = rawProfile.date_of_birth || '';

                        // Handle 'interests'
                        let interestsArray: string[] | null = null;
                        if (Array.isArray(rawProfile.interests)) {
                            interestsArray = rawProfile.interests.filter((i): i is string => typeof i === 'string');
                        } else if (typeof rawProfile.interests === 'string' && rawProfile.interests.trim() !== '') {
                            interestsArray = [rawProfile.interests];
                        }

                        // Handle 'profile_pictures'
                        let pictures: string[] | null = null;
                        if (Array.isArray(rawProfile.profile_pictures)) {
                            pictures = rawProfile.profile_pictures.filter((p): p is string => typeof p === 'string');
                        } else if (typeof rawProfile.profile_pictures === 'string' && rawProfile.profile_pictures.trim() !== '') {
                            pictures = [rawProfile.profile_pictures];
                        }

                        // Return object conforming to the Profile interface
                        return {
                            id: rawProfile.user_id,
                            created_at: createdAt,
                            updated_at: updatedAt,
                            first_name: rawProfile.first_name || 'User',
                            last_name: rawProfile.last_name || null,
                            date_of_birth: dob,
                            gender: rawProfile.gender || 'Not specified',
                            bio: rawProfile.bio || null,
                            interests: interestsArray,
                            location: rawProfile.location || null,
                            looking_for: rawProfile.looking_for || null,
                            profile_pictures: pictures,
                        };
                    });

                    setLikerProfiles(formattedProfiles);
                } else {
                    setLikerProfiles([]);
                }
            } else {
                console.log('[EventsScreen] No other users found who liked this listing.');
                setLikerProfiles([]);
            }
        } catch (error: any) {
            console.error('[EventsScreen] Error fetching liker profiles:', error);
            const errorMsg = error.message || "Could not load profiles. Please try again.";
            setLikerError(errorMsg);
            setLikerProfiles([]);
        } finally {
            setIsLoadingLikers(false);
        }
    }, [user]); // Dependency: user


    // --- EFFECT to Fetch Likers when Modal Opens ---
    useEffect(() => {
        if (isLikerModalVisible && selectedListingId) {
            fetchLikersForListing(selectedListingId);
        }
    }, [isLikerModalVisible, selectedListingId, fetchLikersForListing]);


    // --- HANDLER for Reloading Likers (used by ProfileStoryView) ---
    const handleReloadLikers = useCallback(() => {
        if (selectedListingId) {
             fetchLikersForListing(selectedListingId);
        } else {
             console.warn("[EventsScreen] Cannot reload likers, no listing selected.");
        }
    }, [selectedListingId, fetchLikersForListing]);


    // --- HANDLERS for Interaction within ProfileStoryView ---
    const handleLikeProfileInStory = useCallback((profileId: string) => {
        console.log(`Liked User ID: ${profileId} within Story View for Listing ID: ${selectedListingId}`);
        // TODO: Implement Supabase call to record the "like" action
        // TODO: Implement match check logic here
    }, [selectedListingId, user]);

    const handleStoryFinished = useCallback(() => {
        console.log("Finished viewing all profiles in Story View for this listing.");
        // Optional: Could add logic here if needed when the end screen is first reached
    }, []);


    // --- *** RESTORED: Render item function uses LikedListingItem *** ---
    const renderLikedItem = ({ item }: { item: BusinessListing }) => (
        <LikedListingItem
            listing={item}
            onUnlike={handleUnlike}
            onPress={handleItemPress} // Pass the handler to open the modal
        />
    );

    // --- Loading/Empty States for the main list ---
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
                transparent={false}
                visible={isLikerModalVisible}
                onRequestClose={handleCloseLikerModal}
                statusBarTranslucent={true}
            >
                {/* LinearGradient is the outermost view INSIDE Modal */}
                <LinearGradient
                    colors={gradientColors}
                    style={styles.gradientBackground}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                >
                    {/* SafeAreaView is now INSIDE the gradient */}
                    <SafeAreaView style={styles.modalContainer}>
                        {/* Content View remains the same, inside SafeAreaView */}
                        <View style={styles.modalContent}>
                            {/* Loading State */}
                            {isLoadingLikers && (
                                <View style={styles.centeredWrapper}>
                                    <ActivityIndicator size="large" color="#FFFFFF" />
                                    <Text style={styles.loadingText}>Loading profiles...</Text>
                                </View>
                            )}

                            {/* Error State */}
                            {!isLoadingLikers && likerError && (
                                <View style={styles.centeredWrapper}>
                                    <Text style={styles.errorText}>{likerError}</Text>
                                    {selectedListingId && (
                                        <TouchableOpacity onPress={handleReloadLikers} style={styles.errorRetryButton}>
                                            <Text style={styles.errorRetryButtonText}>Try Again</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={handleCloseLikerModal} style={styles.errorCloseButton}>
                                        <Text style={styles.errorCloseButtonText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Empty State */}
                            {!isLoadingLikers && !likerError && likerProfiles.length === 0 && (
                                 <View style={styles.centeredWrapper}>
                                     <Text style={styles.emptyStateText}>No other users found yet!</Text>
                                     <Text style={styles.emptyStateSubText}>Check back later or explore other places.</Text>
                                     {selectedListingId && (
                                         <TouchableOpacity onPress={handleReloadLikers} style={styles.errorRetryButton}>
                                             <Text style={styles.errorRetryButtonText}>Check Again</Text>
                                         </TouchableOpacity>
                                     )}
                                      <TouchableOpacity onPress={handleCloseLikerModal} style={styles.errorCloseButton}>
                                         <Text style={styles.errorCloseButtonText}>Close</Text>
                                     </TouchableOpacity>
                                 </View>
                            )}

                            {/* Profile Card Stack Rendering */}
                            {!isLoadingLikers && !likerError && likerProfiles.length > 0 && (
                                <ProfileCardStack
                                    profiles={likerProfiles}
                                    onLikeProfile={handleLikeProfileInStory}
                                    onProfilesExhausted={handleStoryFinished}
                                    onClose={handleCloseLikerModal}
                                    onReloadProfiles={handleReloadLikers}
                                />
                            )}
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </Modal>
        </SafeAreaView>
    );
};


// --- STYLES --- (Styles remain unchanged from the previous correct version)
const styles = StyleSheet.create({
    // Main screen styles
    container: { flex: 1, backgroundColor: '#f8f8f8', },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#f8f8f8', },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#555', textAlign: 'center', marginBottom: 8, },
    emptySubText: { fontSize: 14, color: '#777', textAlign: 'center', },
    listContentContainer: { paddingVertical: 8, paddingHorizontal: 0, },

    // Modal styles
    gradientBackground: { // For the LinearGradient wrapper
        flex: 1,
    },
    modalContainer: { // For the SafeAreaView inside the gradient
        flex: 1,
        backgroundColor: 'transparent', // MUST be transparent
    },
    modalContent: { // For the View inside SafeAreaView
        flex: 1,
        backgroundColor: 'transparent', // MUST be transparent
    },
    centeredWrapper: { // For Loading/Error/Empty states
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
        backgroundColor: 'transparent',
    },
    // Styles for text/buttons within centeredWrapper
    loadingText: {
        marginTop: 10, fontSize: 16, color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
    },
    emptyStateText: {
        fontSize: 18, fontWeight: '600', color: '#FFFFFF', textAlign: 'center', marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
    },
    emptyStateSubText: {
        fontSize: 14, color: '#DDDDDD', textAlign: 'center', marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
    },
    errorText: {
        fontSize: 16, color: '#FFD1D1', textAlign: 'center', marginBottom: 15, fontWeight: '500',
        textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
    },
    errorRetryButton: {
        marginTop: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, marginBottom: 10,
        borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    errorRetryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', },
    errorCloseButton: {
        marginTop: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20,
    },
    errorCloseButtonText: { color: '#CCCCCC', fontSize: 14, fontWeight: '500', },
});

export default EventsScreen;