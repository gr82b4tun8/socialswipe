// src/screens/ConnectionsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView // Use SafeAreaView for top/bottom padding
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

// Import your Supabase client
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

// Import the bubble item component
import MatchBubbleItem from '../components/MatchBubbleItem'; // Adjust path

// Interface for profile data (should match MatchBubbleItem's expectation)
interface MatchedProfile {
    user_id: string;
    full_name?: string;
    profile_photo_url?: string | null;
    // Include other fields returned by your get_matches function if needed
}

// Navigation prop type (adjust based on your navigation setup)
import { StackNavigationProp } from '@react-navigation/stack'; // Example
type ConnectionsScreenNavigationProp = StackNavigationProp<any, 'Connections'>; // Adjust StackParamList and Screen name

interface ConnectionsScreenProps {
    navigation: ConnectionsScreenNavigationProp; // Or appropriate type
}

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ navigation }) => {
    const [matches, setMatches] = useState<MatchedProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // --- Fetch Matches Function ---
    const fetchMatches = async () => {
        console.log("Fetching matches...");
        setIsLoading(true);
        setError(null);

        try {
            // 1. Get current user ID
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error(authError?.message || 'User not authenticated.');
            }
            const currentUserId = user.id;
            console.log("Current user ID:", currentUserId);

            // 2. Call the RPC function
            const { data, error: rpcError } = await supabase.rpc('get_matches', {
                current_user_id: currentUserId
            });

            if (rpcError) {
                console.error("RPC Error:", rpcError);
                throw new Error(`Failed to fetch matches: ${rpcError.message}`);
            }

            console.log("Matches received:", data);
            // Ensure data is an array, even if null/undefined is returned
            setMatches(Array.isArray(data) ? data : []);

        } catch (err: any) {
            console.error("Error fetching matches:", err);
            setError(err.message || 'An unexpected error occurred.');
            setMatches([]); // Clear matches on error
        } finally {
            setIsLoading(false);
            setRefreshing(false); // Ensure refreshing indicator stops
        }
    };

    // --- Use useFocusEffect to fetch data when the screen comes into view ---
     useFocusEffect(
         useCallback(() => {
             fetchMatches(); // Fetch when screen is focused

             // Optional: Return a cleanup function if needed
             // return () => { console.log("Connections screen unfocused"); };
         }, []) // Empty dependency array means it runs on focus
     );


    // --- Pull-to-Refresh Handler ---
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMatches(); // Re-fetch data
    }, []); // Empty dependency array


    // --- Item Press Handler ---
    const handleMatchPress = (profileId: string) => {
        console.log('Pressed match:', profileId);
        // Navigate to chat screen or profile details screen
        // Example navigation:
        // navigation.navigate('ChatScreen', { userId: profileId });
        // navigation.navigate('ProfileDetail', { profileId: profileId });
        alert(`Maps to profile/chat for user: ${profileId}`); // Placeholder action
    };


    // --- Render Logic ---

    const renderEmptyListComponent = () => {
        if (isLoading) {
             // Don't show "no matches" while initially loading
             return null;
        }
         if (error) {
             return (
                 <View style={styles.centered}>
                     <Text style={styles.infoText}>Error: {error}</Text>
                     {/* Optionally add a retry button */}
                 </View>
             );
         }
        return (
            <View style={styles.centered}>
                <Text style={styles.infoText}>No connections yet.</Text>
                <Text style={styles.subInfoText}>Keep liking profiles to find a match!</Text>
            </View>
        );
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                 <Text style={styles.headerTitle}>Connections</Text>
                 {/* You could add filter/search icons here if needed */}
            </View>

            {/* Show loading indicator only when not refreshing */}
            {isLoading && !refreshing && (
                 <ActivityIndicator size="large" color="#FFAFBD" style={styles.loadingIndicator} />
             )}

            <FlatList
                data={matches}
                renderItem={({ item }) => (
                    <MatchBubbleItem
                        profile={item}
                        onPress={handleMatchPress}
                    />
                )}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={renderEmptyListComponent}
                refreshControl={ // Add pull-to-refresh
                     <RefreshControl
                         refreshing={refreshing}
                         onRefresh={onRefresh}
                         colors={['#FFAFBD', '#FFC3A0']} // Spinner colors
                         tintColor={'#FFAFBD'} // iOS spinner color
                     />
                 }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA', // Light background for the screen
    },
     header: {
         paddingVertical: 15,
         paddingHorizontal: 20,
         borderBottomWidth: 1,
         borderBottomColor: '#E9ECEF',
         backgroundColor: '#FFFFFF', // White header background
     },
     headerTitle: {
         fontSize: 24,
         fontWeight: 'bold',
         color: '#343A40', // Dark title color
     },
    listContentContainer: {
        paddingTop: 10, // Add some padding at the top of the list
        paddingBottom: 20, // Padding at the bottom
    },
    centered: {
        flex: 1, // Make it take available space if list is empty
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        marginTop: 50, // Add margin from the top
    },
    infoText: {
        fontSize: 18,
        color: '#6C757D', // Grayish text
        textAlign: 'center',
        marginBottom: 8,
    },
     subInfoText: {
         fontSize: 14,
         color: '#ADB5BD', // Lighter gray text
         textAlign: 'center',
     },
     loadingIndicator: {
         marginTop: 30, // Position loading indicator if needed outside FlatList
     }
});

export default ConnectionsScreen;