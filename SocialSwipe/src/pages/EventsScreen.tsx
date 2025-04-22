// src/pages/EventsScreen.tsx (MODIFIED to display Liked Listings)

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
        unlikeListing,      // Function to unlike a listing (using manager_user_id)
        fetchDiscoveryData  // Function to potentially refresh all data
    } = useDiscovery();

    // Define what happens when the 'X' (Dismiss) button is pressed on a card
    // In this context, it should trigger "unlikeListing" using the manager's ID
    const handleUnlike = useCallback((managerUserId: string) => {
        console.log(`EventsScreen: Unliking listing associated with manager ${managerUserId}`);
        unlikeListing(managerUserId); // Call the listing unliking function from context
    }, [unlikeListing]);

    // Define what happens when the 'Heart' (Like) button is pressed
    // On this screen, the listing is already liked, so we do nothing or show a message.
    const handleAlreadyLiked = useCallback((managerUserId: string) => {
        console.log(`EventsScreen: Listing associated with manager ${managerUserId} already liked.`);
        // You could optionally show a toast message here
        // Toast.show({ type: 'info', text1: 'Already in your liked list' });
    }, []);

    // Render item function for FlatList - now renders BusinessListing
    const renderListingCard = ({ item }: { item: BusinessListing }) => ( // Use BusinessListing type
        <View style={styles.cardWrapper}>
            {/* Renders the BusinessProfileCard, passing the listing data */}
            <BusinessProfileCard // Use the card component
                listing={item} // Pass the individual listing data via 'listing' prop
                // Pass the unlike handler to the 'dismiss' action prop
                // Ensure manager_user_id exists on the item (it should from BusinessListing type)
                onDismissBusiness={() => handleUnlike(item.manager_user_id)}
                // Pass the dummy handler to the 'like' action prop
                onLikeBusiness={() => handleAlreadyLiked(item.manager_user_id)}
            />
        </View>
    );

    // Loading State - Check using the correct loading flag and data array
    if (isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6347" />
            </SafeAreaView>
        );
    }

    // Empty State - Check using the correct loading flag and data array
    if (!isLoadingListings && (!likedListingsData || likedListingsData.length === 0)) {
        return (
            <SafeAreaView style={styles.centered}>
                {/* Updated empty state text */}
                <Text style={styles.emptyText}>You haven't liked any listings yet!</Text>
                <Text style={styles.emptySubText}>Go to the Discover tab to find businesses.</Text>
            </SafeAreaView>
        );
    }

    // Main List View
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                // Use likedListingsData as the data source
                data={likedListingsData || []} // Provide fallback for safety
                renderItem={renderListingCard} // Use the correct render function
                // Use the unique ID of the listing itself as the key
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContentContainer}
                // Optional: Add pull-to-refresh functionality
                refreshing={isLoadingListings} // Use the correct loading state
                onRefresh={fetchDiscoveryData} // Call the function to re-fetch all data
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
        // Ensure this height works well with BusinessProfileCard's internal layout
    },
});

// Export the component (still named EventsScreen for now)
export default EventsScreen;