// src/screens/DiscoverScreen.tsx (Adjusted Stack Positioning for More Height)

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView } from 'react-native';

// Import Contexts
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if needed
import { AppTheme } from '../theme/theme'; // Import AppTheme type

// Import Components
import BusinessCardStack from '../components/BusinessCardStack'; // Ensure path is correct

const DiscoverScreen: React.FC = () => {
    const { session } = useAuth();
    const {
        currentListing,
        likeListing,
        dismissListing,
        isLoadingListings,
        reloadListings,
    } = useDiscovery();

    const { theme } = useTheme();
    const styles = getThemedStyles(theme);

    // Loading State - Preserved
    if (isLoadingListings && !currentListing) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    // Placeholder for behindCount - Preserved (using fixed value 3 as in original)
    const placeholderBehindCount = 3;

    // Handlers - Preserved
    const handleLike = (managerUserId: string) => {
        if (!currentListing) return;
        console.log(`DiscoverScreen: Like action triggered for manager ${managerUserId} (Listing ID: ${currentListing.id})`);
        likeListing(currentListing.id);
    };

    const handleDismiss = (managerUserId: string) => {
        if (!currentListing) return;
        console.log(`DiscoverScreen: Dismiss action triggered for manager ${managerUserId} (Listing ID: ${currentListing.id})`);
        dismissListing(currentListing.id);
    };

    // console.log("--- DiscoverScreen: Attempting to render BusinessCardStack ---"); // Preserved (commented out)

    // JSX Structure - Preserved
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentArea}>
                {currentListing ? (
                    // Card Stack Rendering - Preserved
                    <View style={styles.cardContainer}>
                        <BusinessCardStack
                            topListing={currentListing}
                            behindCount={placeholderBehindCount}
                            onLikeBusiness={handleLike}
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
        </SafeAreaView>
    );
};

// Helper function to generate styles based on the theme
const getThemedStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        // --- MODIFIED: Reduced/Removed Padding Bottom ---
        // paddingBottom: theme.spacing.medium, // Original value
        paddingBottom: 0, // Changed to 0 to maximize available vertical space
        // You could also use theme.spacing.small if you want a tiny bit of padding
        // -------------------------------------
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center', // Keeps the card vertically centered in the available space
        alignItems: 'center',
        width: '100%',
    },
    cardContainer: {
        width: '90%', // Keep horizontal constraints
        // --- MODIFIED: Increased Height ---
        height: '90%', // Increased from 80%. Adjust as needed (e.g., '88%', '92%')
        // ---------------------------------
        maxWidth: 400, // Keep max width constraint
         // --- MODIFIED: Increased Max Height ---
        maxHeight: 700, // Increased from 550. Adjust to allow percentage height to work on tall screens
        // -----------------------------------
        // backgroundColor: 'lightblue', // Keep commented out
    },
    // --- Other styles remain unchanged ---
    noContentContainer: { // Styles for the "empty deck" view - Preserved
        width: '90%',
        maxWidth: 350,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: theme.spacing.lg, // Keep padding here for button spacing
    },
    noContentCard: { // Styles for the "empty deck" card - Preserved
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
    noContentTitle: { // Styles for the "empty deck" text - Preserved
        fontSize: theme.fonts.sizes.large,
        fontWeight: theme.fonts.weights.bold,
        fontFamily: theme.fonts.families.bold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text,
        textAlign: 'center',
    },
    noContentText: { // Styles for the "empty deck" text - Preserved
        fontSize: theme.fonts.sizes.medium,
        fontFamily: theme.fonts.families.regular,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    reloadButtonContainer: { // Styles for the reload button area - Preserved
        marginTop: theme.spacing.lg,
        width: '100%',
        maxWidth: 250,
    },
    centered: { // Styles for the loading indicator container - Preserved
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DiscoverScreen;