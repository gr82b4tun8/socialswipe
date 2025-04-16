// src/screens/DiscoverScreen.tsx
import React, { useEffect } from 'react';
// *** Import Button ***
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useDiscovery } from '../contexts/DiscoveryContext';
import BusinessProfileCard from '../components/EventCard'; // Ensure this path and export name are correct
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const DiscoverScreen: React.FC = () => {
    const { session } = useAuth(); // Get session info
    const {
        currentProfile,
        likeProfile,
        dismissProfile,
        isLoadingProfiles,
        reloadProfiles, // *** Get reloadProfiles function from context ***
        fetchDiscoveryData, // Keep fetchDiscoveryData if needed elsewhere
    } = useDiscovery();

    // Optional: Add logic to refetch if needed, e.g., pull-to-refresh
    // useEffect(() => {
    //     if (session) {
    //         // Context usually handles initial fetch based on session change now
    //         // fetchDiscoveryData();
    //     }
    // }, [session]); // Removed fetchDiscoveryData dependency if context handles it

    // Loading indicator logic (remains the same)
    // Shows ONLY on initial load before first profile appears
    if (isLoadingProfiles && !currentProfile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#FF6347" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentArea}>
                {currentProfile ? (
                    // If there's a profile, show the card
                    <View style={styles.cardContainer}>
                        <BusinessProfileCard
                            profile={currentProfile}
                            onLikeBusiness={() => likeProfile(currentProfile.user_id)}
                            onDismissBusiness={() => dismissProfile(currentProfile.user_id)}
                        />
                    </View>
                ) : (
                    // Otherwise (no profile currently displayable)
                    // Show "No Content" message and Reload button only if NOT loading
                    !isLoadingProfiles && (
                        // *** Added a container view for message + button ***
                        <View style={styles.noContentContainer}>
                            <View style={styles.noContentCard}>
                                {/* *** Corrected text *** */}
                                <Text style={styles.noContentTitle}>That's everyone!</Text>
                                <Text style={styles.noContentText}>
                                    You've seen all available profiles for now.
                                </Text>
                            </View>
                            {/* *** ADDED Reload Button *** */}
                            <View style={styles.reloadButtonContainer}>
                                <Button
                                    title="Reload Profiles"
                                    onPress={reloadProfiles} // Call the function from context
                                    color="#FF6347" // Example button color
                                    // disabled={isLoadingProfiles} // Optionally disable if loading during reload
                                />
                            </View>
                        </View>
                    )
                )}
            </View>
            {/* Optional: Add a button to manually refresh ALL data */}
            {/* <Button title="Refresh All Data" onPress={fetchDiscoveryData} disabled={isLoadingProfiles} /> */}
        </View>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
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
        marginBottom: 20,
    },
    // *** ADDED: Container for the "No Content" Card + Button ***
    noContentContainer: {
        width: '90%', // Match card container width or adjust
        maxWidth: 350, // Match noContentCard max width
        alignItems: 'center', // Center card and button
        justifyContent: 'center',
        paddingBottom: 20, // Add padding if needed
    },
    noContentCard: {
        width: '100%', // Take full width of noContentContainer
        padding: 24,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        alignItems: 'center',
        // Removed marginHorizontal as centering is handled by parent
        // maxWidth: 350, // Max width handled by parent container
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
    // *** ADDED: Style for button container ***
     reloadButtonContainer: {
        marginTop: 20, // Space above button
        width: '100%', // Button takes width of the container
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
});

export default DiscoverScreen;