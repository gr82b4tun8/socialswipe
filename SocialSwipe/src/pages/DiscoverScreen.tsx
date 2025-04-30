// src/screens/DiscoverScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // <--- ***** ADD THIS IMPORT *****

// Import Contexts
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if needed
import { AppTheme } from '../theme/theme'; // Import AppTheme type

// --- REMOVE: Import BusinessCardStack --- (Already removed in your provided code)
// import BusinessCardStack from '../components/BusinessCardStack';

// --- ADD: Import BusinessProfileCard and its type --- (Already added in your provided code)
import BusinessProfileCard, { BusinessListing as BusinessProfileListing } from '../components/BusinessProfileCard'; // Ensure path is correct

// --- REMOVE: Import IndividualProfile type and Supabase (if only used for likers) --- (Already removed)
// import { Profile as IndividualProfile } from './EditProfileScreen'; // Example using type from EditProfileScreen
// import { supabase } from '../lib/supabaseClient'; // Adjust path

// --- REMOVE: MAX_BEHIND_CARDS constant --- (Already removed)
// const MAX_BEHIND_CARDS = 5;

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
    const styles = getThemedStyles(theme); // Generate styles using the theme

    // --- REMOVE: State for Liker Profiles and loading --- (Already removed)
    // const [likerProfiles, setLikerProfiles] = useState<IndividualProfile[]>([]);
    // const [isLoadingLikers, setIsLoadingLikers] = useState<boolean>(false);

    // --- REMOVE: Effect to Fetch Likers --- (Already removed)
    // useEffect(() => {
    //     // ... entire fetchLikers function and effect content removed ...
    // }, [currentListing, user]);

    // **** NEW: Decide if you want blur on the background ****
    const applyBackgroundBlur = true; // Set to true to enable blur, false to disable
    const blurTint = theme?.isDark ? 'dark' : 'light'; // Match blur tint to theme

    // Loading State - Keep simple background for loading state (No Gradient/Blur here)
    if (isLoadingListings && !currentListing) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    // Handlers - Preserved (These will be passed to BusinessProfileCard)
    const handleLike = () => {
        if (!currentListing) return;
        console.log(`DiscoverScreen: Like action triggered for Listing ID: ${currentListing.id}`);
        likeListing(currentListing.id);
    };

    const handleDismiss = () => {
        if (!currentListing) return;
        console.log(`DiscoverScreen: Dismiss action triggered for Listing ID: ${currentListing.id}`);
        dismissListing(currentListing.id);
    };


    // --- UPDATED JSX Structure ---
    return (
        <SafeAreaView style={styles.safeArea}>
             {/* Layer 1: Gradient Background - Now positioned absolutely */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.background]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                // Apply absoluteFill style to cover the SafeAreaView
                style={StyleSheet.absoluteFill}
            />

            {/* Layer 2: Blur View (Conditional) - Also positioned absolutely */}
            {applyBackgroundBlur && (
                <BlurView
                    intensity={85} // Adjust intensity as desired
                    tint={blurTint}
                    style={StyleSheet.absoluteFill} // Covers the gradient
                />
            )}

            {/* Layer 3: Content Area - Renders ON TOP of gradient and blur */}
            <View style={styles.contentArea}>
                {currentListing ? (
                    <View style={styles.cardContainer}>
                        {/* --- REMOVE: Liker loading indicator --- (Already removed) */}
                        {/* {isLoadingLikers && <ActivityIndicator style={styles.likerLoadingIndicator} size="small" />} */}

                        {/* --- REPLACE: BusinessCardStack with BusinessProfileCard --- (Already done) */}
                        <BusinessProfileCard
                            listing={currentListing as BusinessProfileListing} // Pass current listing directly
                            onLikeBusiness={handleLike}     // Pass the handlers
                            onDismissBusiness={handleDismiss}
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
            {/* The LinearGradient is no longer wrapping contentArea directly */}
        </SafeAreaView>
    );
};

// --- UPDATED Helper function to generate styles ---
const getThemedStyles = (theme: AppTheme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        // The background color is now handled by the absolutely positioned gradient/blur
        // backgroundColor: theme.colors.background, // Can remove this if gradient always covers
        position: 'relative', // Needed for absolute positioned children like gradient/blur
        overflow: 'hidden', // Clip gradient/blur to safe area bounds
    },
    // --- REMOVE: gradientContainer style is no longer needed as style is applied inline ---
    // gradientContainer: {
    //     flex: 1,
    // },
    contentArea: { // This View now sits ON TOP of the gradient and blur layers
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent', // Ensure content area is transparent
        position: 'relative', // Keep content in normal flow relative to parent
        zIndex: 1, // Explicitly place content above background layers
    },
    cardContainer: { // Original style
        width: '98%',
        height: '98%',
        maxWidth: 450,
        maxHeight: 775,
        position: 'relative',
    },
    // --- REMOVE: likerLoadingIndicator style --- (Already removed)
    // likerLoadingIndicator: { ... },

    // --- Other styles remain unchanged ---
    noContentContainer: { // Original style
        width: '90%',
        maxWidth: 350,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: theme.spacing.lg,
    },
    noContentCard: { // Original style
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
    noContentTitle: { // Original style
        fontSize: theme.fonts.sizes.large,
        fontWeight: theme.fonts.weights.bold,
        fontFamily: theme.fonts.families.bold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
        textAlign: 'center',
    },
    noContentText: { // Original style
        fontSize: theme.fonts.sizes.medium,
        fontFamily: theme.fonts.families.regular,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    reloadButtonContainer: { // Original style
        marginTop: theme.spacing.lg,
        width: '100%',
        maxWidth: 250,
    },
    centered: { // Original style
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DiscoverScreen;