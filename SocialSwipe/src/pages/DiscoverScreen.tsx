// src/screens/DiscoverScreen.tsx (FIXED to pass listing.id)

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
// *** Import the CORRECT names from the context ***
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Make sure BusinessListing is exported or import from card
import BusinessProfileCard from '../components/BusinessProfileCard'; // Ensure path is correct
import { useAuth } from '../contexts/AuthContext';

const DiscoverScreen: React.FC = () => {
    const { session } = useAuth();
    // *** Use the CORRECT names provided by the context ***
    const {
        currentListing,    // <-- Use currentListing
        likeListing,       // <-- Use likeListing (expects listing.id)
        dismissListing,    // <-- Use dismissListing (expects listing.id)
        isLoadingListings, // <-- Use isLoadingListings
        reloadListings,    // <-- Use reloadListings
    } = useDiscovery();

    // *** Update loading logic with CORRECT variable name ***
    if (isLoadingListings && !currentListing) { // <-- Use isLoadingListings and currentListing
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        );
    }

     // --- DEBUGGING: Log ---
     // console.log('DiscoverScreen Render:', { isLoadingListings, currentListing });
     // -----------------------------

    return (
        <View style={styles.container}>
            <View style={styles.contentArea}>
                {/* *** Check if currentListing exists *** */}
                {currentListing ? ( // <-- Use currentListing
                    <View style={styles.cardContainer}>
                        <BusinessProfileCard
                            listing={currentListing} // Pass data via 'listing' prop
                            // --- FIX IMPLEMENTED BELOW ---
                            // Pass the unique ID of the listing (currentListing.id)
                            // to the like/dismiss functions from the context.
                            onLikeBusiness={() => {
                                // Optional log for debugging:
                                console.log(`DiscoverScreen: Liking Listing ID: ${currentListing.id}`);
                                likeListing(currentListing.id); // <-- CORRECT ID passed
                            }}
                            onDismissBusiness={() => {
                                // Optional log for debugging:
                                console.log(`DiscoverScreen: Dismissing Listing ID: ${currentListing.id}`);
                                dismissListing(currentListing.id); // <-- CORRECT ID passed
                            }}
                            // --- END FIX ---
                        />
                    </View>
                ) : (
                    // *** Update condition with CORRECT variable name ***
                    !isLoadingListings && ( // <-- Use isLoadingListings
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
                                    // *** Use CORRECT function name ***
                                    onPress={reloadListings} // <-- Use reloadListings
                                    color="#FF6347"
                                />
                            </View>
                        </View>
                    )
                )}
            </View>
        </View>
    );
};

// --- Styles --- (Keep styles as they were)
const styles = StyleSheet.create({
   // ... styles remain the same
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingTop: 10,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cardContainer: {
        width: '90%',
        maxWidth: 400,
        height: '85%', // Adjust as needed
    },
    noContentContainer: {
        width: '90%',
        maxWidth: 350,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
    },
    noContentCard: {
        width: '100%',
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        alignItems: 'center',
    },
    noContentTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
        textAlign: 'center',
    },
    noContentText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
     reloadButtonContainer: {
        marginTop: 20,
        width: '100%',
        maxWidth: 250,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});


export default DiscoverScreen;