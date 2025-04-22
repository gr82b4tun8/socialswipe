// src/pages/EventsScreen.tsx (MODIFIED to use listing.id for unlike)

import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Dimensions,
    SafeAreaView
} from 'react-native';
// Import context and the specific type for listings
import { useDiscovery, BusinessListing } from '../contexts/DiscoveryContext'; // Adjust path if needed
// Import the BusinessProfileCard component (ensure it expects the 'listing' prop)
import BusinessProfileCard from '../components/BusinessProfileCard'; // Adjust path if needed

// Consider renaming this component later (e.g., LikedListingsScreen) for clarity
const EventsScreen: React.FC = () => {
    const {
        // Use the correct context variables related to listings
        likedListingsData,  // Array of liked BusinessListing objects
        isLoadingListings,  // Loading state for listings
        // --- CHANGED --- unlikeListing now expects listing.id
        unlikeListing,
        fetchDiscoveryData  // Function to potentially refresh all data
    } = useDiscovery();

    // Define what happens when the 'X' (Dismiss/Unlike) button is pressed on a card
    // --- CHANGED --- Accepts listingId and calls unlikeListing with it
    const handleUnlike = useCallback((listingId: string) => {
        console.log(`EventsScreen: Unliking listing with ID: ${listingId}`);
        unlikeListing(listingId); // Call the listing unliking function from context
    }, [unlikeListing]);

    // Define what happens when the 'Heart' (Like) button is pressed
    // --- CHANGED --- Parameter changed to listingId for consistency
    const handleAlreadyLiked = useCallback((listingId: string) => {
        console.log(`EventsScreen: Listing ${listingId} already liked.`);
        // You could optionally show a toast message here
        // Toast.show({ type: 'info', text1: 'Already in your liked list' });
    }, []);

    // Render item function for FlatList - now renders BusinessListing
    const renderListingCard = ({ item }: { item: BusinessListing }) => (
        <View style={styles.cardWrapper}>
            {/* Renders the BusinessProfileCard, passing the listing data */}
            <BusinessProfileCard // Use the card component
                listing={item} // Pass the individual listing data via 'listing' prop
                // --- CHANGED --- Pass item.id to handlers
                onDismissBusiness={() => handleUnlike(item.id)}
                onLikeBusiness={() => handleAlreadyLiked(item.id)}
            />
        </View>
    );

    // Loading State - Check using the correct loading flag and data array
    if (isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
        // ... loading indicator ...
         return (
             <SafeAreaView style={styles.centered}>
                 <ActivityIndicator size="large" color="#FF6347" />
             </SafeAreaView>
         );
    }

    // Empty State - Check using the correct loading flag and data array
    if (!isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
        // ... empty state message ...
         return (
             <SafeAreaView style={styles.centered}>
                 <Text style={styles.emptyText}>You haven't liked any listings yet!</Text>
                 <Text style={styles.emptySubText}>Go to the Discover tab to find businesses.</Text>
             </SafeAreaView>
         );
    }

    // Main List View
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={likedListingsData || []}
                renderItem={renderListingCard}
                keyExtractor={(item) => item.id} // Key extractor uses listing ID
                contentContainerStyle={styles.listContentContainer}
                refreshing={isLoadingListings}
                onRefresh={fetchDiscoveryData}
            />
        </SafeAreaView>
    );
};

const { height } = Dimensions.get('window');

// Styles remain largely the same
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
    },
    listContentContainer: {
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    cardWrapper: {
        marginBottom: 20,
        height: height * 0.75, // Adjust height as needed
    },
});

export default EventsScreen;