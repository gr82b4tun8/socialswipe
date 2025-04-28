// src/screens/DiscoverScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Import Contexts
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if needed
import { AppTheme } from '../theme/theme'; // Import AppTheme type

// --- REMOVE: Import BusinessCardStack ---
// import BusinessCardStack from '../components/BusinessCardStack';

// --- ADD: Import BusinessProfileCard and its type ---
import BusinessProfileCard, { BusinessListing as BusinessProfileListing } from '../components/BusinessProfileCard'; // Ensure path is correct

// --- REMOVE: Import IndividualProfile type and Supabase (if only used for likers) ---
// import { Profile as IndividualProfile } from './EditProfileScreen'; // Example using type from EditProfileScreen
// import { supabase } from '../lib/supabaseClient'; // Adjust path

// --- REMOVE: MAX_BEHIND_CARDS constant ---
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

    // --- REMOVE: State for Liker Profiles and loading ---
    // const [likerProfiles, setLikerProfiles] = useState<IndividualProfile[]>([]);
    // const [isLoadingLikers, setIsLoadingLikers] = useState<boolean>(false);

    // --- REMOVE: Effect to Fetch Likers ---
    // useEffect(() => {
    //     // ... entire fetchLikers function and effect content removed ...
    // }, [currentListing, user]);

    // Loading State - Keep simple background for loading state
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
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.background]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.gradientContainer}
            >
                <View style={styles.contentArea}>
                    {currentListing ? (
                        <View style={styles.cardContainer}>
                            {/* --- REMOVE: Liker loading indicator --- */}
                            {/* {isLoadingLikers && <ActivityIndicator style={styles.likerLoadingIndicator} size="small" />} */}

                            {/* --- REPLACE: BusinessCardStack with BusinessProfileCard --- */}
                            <BusinessProfileCard
                                listing={currentListing as BusinessProfileListing} // Pass current listing directly
                                onLikeBusiness={handleLike}       // Pass the handlers
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
            </LinearGradient>
        </SafeAreaView>
    );
};

// --- UPDATED Helper function to generate styles ---
const getThemedStyles = (theme: AppTheme) => StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    gradientContainer: {
        flex: 1,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    cardContainer: {
        width: '98%',
        height: '98%',
        maxWidth: 450,
        maxHeight: 775,
        position: 'relative',
    },
    // --- REMOVE: likerLoadingIndicator style ---
    // likerLoadingIndicator: { ... },

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