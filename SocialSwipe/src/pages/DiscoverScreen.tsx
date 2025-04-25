// src/screens/DiscoverScreen.tsx (Fetching Likers)

import React, { useState, useEffect } from 'react'; // Import useState, useEffect
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView } from 'react-native';

// Import Contexts
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if needed
import { AppTheme } from '../theme/theme'; // Import AppTheme type

// Import Components
import BusinessCardStack from '../components/BusinessCardStack'; // Ensure path is correct
// Import the IndividualProfile type (adjust path/name as needed)
import { Profile as IndividualProfile } from './EditProfileScreen'; // Example using type from EditProfileScreen
// Import Supabase client
import { supabase } from '../lib/supabaseClient'; // Adjust path

// Define the maximum number of liker profiles to show behind
const MAX_BEHIND_CARDS = 5; // Consistent with BusinessCardStack

const DiscoverScreen: React.FC = () => {
    // Existing Hooks - Preserved
    const { user, session } = useAuth(); // Get user and session
    const {
        currentListing,
        likeListing,
        dismissListing,
        isLoadingListings,
        reloadListings,
    } = useDiscovery();
    const { theme } = useTheme();
    const styles = getThemedStyles(theme);

    // --- New State for Liker Profiles ---
    const [likerProfiles, setLikerProfiles] = useState<IndividualProfile[]>([]);
    const [isLoadingLikers, setIsLoadingLikers] = useState<boolean>(false);

    // --- Effect to Fetch Likers when currentListing changes ---
    useEffect(() => {
        // Function to fetch likers and their profiles
        const fetchLikers = async () => {
            if (!currentListing || !user) {
                // If no listing or user, clear profiles and stop
                setLikerProfiles([]);
                return;
            }

            setIsLoadingLikers(true);
            setLikerProfiles([]); // Clear previous likers immediately

            try {
                console.log(`[DiscoverScreen] Fetching likes for Listing ID: ${currentListing.id}`);

                // 1. Fetch liker_user_ids from profile_likes table
                const { data: likeData, error: likeError } = await supabase
                    .from('profile_likes')
                    .select('liker_user_id')
                    .eq('liked_listing_id', currentListing.id)
                    // Optional: Exclude the current user viewing the stack
                    // .neq('liker_user_id', user.id)
                    .limit(MAX_BEHIND_CARDS); // Limit the number of likes fetched

                if (likeError) {
                    console.error('[DiscoverScreen] Error fetching likes:', likeError.message);
                    throw likeError; // Throw error to be caught by outer catch
                }

                if (likeData && likeData.length > 0) {
                    const likerIds = likeData.map(like => like.liker_user_id);
                    console.log(`[DiscoverScreen] Found Liker IDs:`, likerIds);

                    // 2. Fetch profiles for these liker_user_ids
                    const { data: profileData, error: profileError } = await supabase
                        .from('individual_profiles') // Fetch from individual profiles table
                        .select('*') // Select necessary fields for ProfileCard
                        .in('user_id', likerIds);

                    if (profileError) {
                        console.error('[DiscoverScreen] Error fetching liker profiles:', profileError.message);
                        // Check for specific errors like RLS issues
                        if (profileError.message.includes('permission denied') || profileError.message.includes('row-level security')) {
                           console.warn('[DiscoverScreen] Possible RLS issue fetching profiles. Ensure policy allows reading other user profiles.');
                        }
                        throw profileError; // Throw error
                    }

                    if (profileData) {
                        console.log(`[DiscoverScreen] Successfully fetched ${profileData.length} liker profiles.`);
                        // Ensure data matches the expected IndividualProfile type
                        setLikerProfiles(profileData as IndividualProfile[]);
                    } else {
                         console.log('[DiscoverScreen] No profile data returned for liker IDs.');
                         setLikerProfiles([]); // Set empty if profile fetch returned null/undefined
                    }

                } else {
                    console.log('[DiscoverScreen] No likes found for this listing.');
                    setLikerProfiles([]); // No likes found, ensure state is empty
                }

            } catch (error) {
                // Catch errors from either query
                console.error('[DiscoverScreen] Failed to complete liker fetch process:', error);
                setLikerProfiles([]); // Ensure profiles are cleared on any error
            } finally {
                setIsLoadingLikers(false); // Stop loading indicator
                console.log('[DiscoverScreen] Finished liker fetch attempt.');
            }
        };

        fetchLikers(); // Execute the fetch function

        // Dependency array: Re-run effect if currentListing or the user session changes
    }, [currentListing, user]); // Ensure user is included if used in queries/checks

    // Loading State - Preserved (Handles initial listing load)
    if (isLoadingListings && !currentListing) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    // Handlers - Preserved (Minor update to pass listing ID consistently)
    const handleLike = () => { // Removed managerUserId param as it wasn't used
        if (!currentListing) return;
        console.log(`DiscoverScreen: Like action triggered for Listing ID: ${currentListing.id}`);
        likeListing(currentListing.id); // Assumes likeListing only needs listingId
    };

    const handleDismiss = () => { // Removed managerUserId param
        if (!currentListing) return;
        console.log(`DiscoverScreen: Dismiss action triggered for Listing ID: ${currentListing.id}`);
        dismissListing(currentListing.id); // Assumes dismissListing only needs listingId
    };


    // JSX Structure - Updated BusinessCardStack props
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentArea}>
                {currentListing ? (
                    <View style={styles.cardContainer}>
                         {/* Optional: Show subtle loading for likers if needed */}
                         {/* {isLoadingLikers && <ActivityIndicator style={styles.likerLoadingIndicator} size="small" />} */}
                        <BusinessCardStack
                            topListing={currentListing}
                            // --- REMOVED behindCount prop ---
                            // behindCount={placeholderBehindCount}
                            // --- ADDED likerProfiles prop ---
                            likerProfiles={likerProfiles}
                            onLikeBusiness={handleLike} // Pass updated handlers
                            onDismissBusiness={handleDismiss} // Pass updated handlers
                        />
                    </View>
                ) : (
                    // "No Content" View Rendering - Preserved
                    !isLoadingListings && (
                        <View style={styles.noContentContainer}>
                            <View style={styles.noContentCard}>
                                <Text style={styles.noContentTitle}>That's everyone!</Text>
                                <Text style={styles.noContentText}>
                                    You've seen all available profiles for now.
                                </Text>
                            </View>
                            <View style={styles.reloadButtonContainer}>
                                <Button
                                    title="Reload Profiles"
                                    onPress={reloadListings}
                                    color={theme.colors.primary}
                                />
                            </View>
                        </View>
                    )
                )}
            </View>
        </SafeAreaView>
    );
};

// Helper function to generate styles based on the theme - Preserved
const getThemedStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: 0,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cardContainer: {
        width: '90%',
        height: '90%',
        maxWidth: 400,
        maxHeight: 700,
        position: 'relative', // Needed if using absolute positioning for indicator
    },
    // Optional style for liker loading indicator
    likerLoadingIndicator: {
        position: 'absolute',
        top: 10,
        alignSelf: 'center',
        zIndex: 100, // Ensure it's above cards if needed
    },
    // --- Other styles remain unchanged ---
    noContentContainer: {
        width: '90%',
        maxWidth: 350,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: theme.spacing.lg,
    },
    noContentCard: {
        width: '100%',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.large,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: theme.isDark ? 0.4 : 0.15,
        shadowRadius: 2,
        elevation: 3,
        alignItems: 'center',
    },
    noContentTitle: {
        fontSize: theme.fonts.sizes.large,
        fontWeight: theme.fonts.weights.bold,
        fontFamily: theme.fonts.families.bold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
        textAlign: 'center',
    },
    noContentText: {
        fontSize: theme.fonts.sizes.medium,
        fontFamily: theme.fonts.families.regular,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    reloadButtonContainer: {
        marginTop: theme.spacing.lg,
        width: '100%',
        maxWidth: 250,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DiscoverScreen;