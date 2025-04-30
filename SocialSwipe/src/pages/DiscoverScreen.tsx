// src/screens/DiscoverScreen.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // Import remains

// Import Contexts
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; // Adjust path if needed
import { AppTheme } from '../theme/theme'; // Import AppTheme type

// Import BusinessProfileCard
import BusinessProfileCard, { BusinessListing as BusinessProfileListing } from '../components/BusinessProfileCard'; // Ensure path is correct

// Removed imports and constants are correctly noted as removed previously

const DiscoverScreen: React.FC = () => {
    // Existing Hooks - Preserved
    const { user, session } = useAuth();
    const {
        currentListing,
        likeListing,
        dismissListing,
        isLoadingListings,
        reloadListings,
    } = useDiscovery();
    const { theme } = useTheme();
    const styles = getThemedStyles(theme);

    // Removed state and effects are correctly noted as removed previously

    // Background Blur configuration - Preserved
    const applyBackgroundBlur = true;
    const blurTint = theme?.isDark ? 'dark' : 'light';

    // Loading State - Preserved
    if (isLoadingListings && !currentListing) {
        return (
            <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </SafeAreaView>
        );
    }

    // Handlers - Preserved
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


    // --- UPDATED JSX Structure with the Key Prop Added ---
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Layer 1: Gradient Background - Preserved */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.background]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Layer 2: Blur View (Conditional) - Preserved */}
            {applyBackgroundBlur && (
                <BlurView
                    intensity={85}
                    tint={blurTint}
                    style={StyleSheet.absoluteFill}
                />
            )}

            {/* Layer 3: Content Area - Preserved Structure */}
            <View style={styles.contentArea}>
                {currentListing ? (
                    <View style={styles.cardContainer}>
                        {/* Removed Liker indicator correctly noted as removed previously */}

                        {/* --- BusinessProfileCard with the key prop ADDED --- */}
                        <BusinessProfileCard
                            key={currentListing.id} // <--- ***** THIS IS THE ONLY FUNCTIONAL CHANGE *****
                            listing={currentListing as BusinessProfileListing}
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

// --- Helper function to generate styles - Preserved ---
const getThemedStyles = (theme: AppTheme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 1,
    },
    cardContainer: {
        width: '98%',
        height: '98%',
        maxWidth: 450,
        maxHeight: 775,
        position: 'relative',
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