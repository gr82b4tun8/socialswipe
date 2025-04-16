// src/pages/EventsScreen.tsx

import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList, // Use FlatList for efficient scrolling
    ActivityIndicator,
    Dimensions,
    SafeAreaView // Use SafeAreaView for top/bottom padding on notches
} from 'react-native';
import { useDiscovery } from '../contexts/DiscoveryContext'; // Adjust path if needed
import BusinessProfileCard, { BusinessProfile } from '../components/EventCard'; // Adjust path & ensure BusinessProfile type is exported or defined here

const EventsScreen: React.FC = () => {
    const {
        likedProfilesData, // Array of liked BusinessProfile objects
        isLoadingProfiles, // Loading state from context
        unlikeProfile,     // Function to unlike a profile
        fetchDiscoveryData // Function to potentially refresh data
    } = useDiscovery();

    // Define what happens when the 'X' (Dismiss) button is pressed on a card
    // In this context, it should trigger "unlike"
    const handleUnlike = useCallback((profileUserId: string) => {
        console.log(`EventsScreen: Unliking profile ${profileUserId}`);
        unlikeProfile(profileUserId);
        // Optionally show a toast or confirmation
    }, [unlikeProfile]);

    // Define what happens when the 'Heart' (Like) button is pressed
    // On this screen, it doesn't make sense to "like" again, so it does nothing.
    const handleAlreadyLiked = useCallback((profileUserId: string) => {
        console.log(`EventsScreen: Profile ${profileUserId} already liked.`);
        // Do nothing, or maybe show a toast "Already liked"
    }, []);

    // Render item function for FlatList
    const renderProfileCard = ({ item }: { item: BusinessProfile }) => (
        <View style={styles.cardWrapper}>
             {/*
                NOTE: BusinessProfileCard might need height adjustments
                when used in a list compared to the full-screen Discover view.
                The fixed height in styles.cardWrapper helps manage this.
            */}
            <BusinessProfileCard
                profile={item}
                // Pass the unlike handler to the 'dismiss' action prop
                onDismissBusiness={handleUnlike}
                 // Pass the dummy handler to the 'like' action prop
                onLikeBusiness={handleAlreadyLiked}
            />
        </View>
    );

    // Loading State
    if (isLoadingProfiles && likedProfilesData.length === 0) {
        // Show loader only if data is truly empty during load
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6347" />
            </SafeAreaView>
        );
    }

    // Empty State
    if (!isLoadingProfiles && likedProfilesData.length === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <Text style={styles.emptyText}>You haven't liked any profiles yet!</Text>
                <Text style={styles.emptySubText}>Go to the Discover tab to find businesses.</Text>
            </SafeAreaView>
        );
    }

    // Main List View
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={likedProfilesData}
                renderItem={renderProfileCard}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.listContentContainer}
                // Optional: Add pull-to-refresh functionality
                // refreshing={isLoadingProfiles} // Show refresh indicator while loading
                // onRefresh={fetchDiscoveryData} // Call fetch function on pull
            />
        </SafeAreaView>
    );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0', // Background for the whole screen
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20, // Add padding for text
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
        paddingVertical: 10, // Padding at the top/bottom of the scrollable list
        paddingHorizontal: 10, // Padding on the sides of the scrollable list
    },
    cardWrapper: {
        marginBottom: 20, // Space between cards
        height: height * 0.75, // *** Adjust height as needed for list view ***
                               // Card might need less height than in DiscoverScreen
                               // Or set a fixed height e.g., 500
        // You might need to tweak this value based on BusinessProfileCard's internal layout
    },
});

export default EventsScreen;