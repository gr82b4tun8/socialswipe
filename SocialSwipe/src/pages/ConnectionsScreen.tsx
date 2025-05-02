// src/screens/ConnectionsScreen.tsx (Modified for Navigation)
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

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

// Navigation prop type
import { StackNavigationProp } from '@react-navigation/stack';
// --- IMPORT YOUR PARAM LIST TYPE (Adjust path as needed) ---
// This assumes you defined RootStackParamList in your navigator file
import { RootStackParamList } from '../navigation/AppNavigator'; // <--- ADJUST THIS PATH

// --- UPDATE NAVIGATION PROP TYPE ---
type ConnectionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Connections'>;

interface ConnectionsScreenProps {
    navigation: ConnectionsScreenNavigationProp;
}

const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({ navigation }) => {
    const [matches, setMatches] = useState<MatchedProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // --- Fetch Matches Function (No changes needed) ---
    const fetchMatches = async () => {
        console.log("Fetching matches...");
        setIsLoading(true);
        setError(null);

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error(authError?.message || 'User not authenticated.');
            }
            const currentUserId = user.id;
            console.log("Current user ID:", currentUserId);

            const { data, error: rpcError } = await supabase.rpc('get_matches', {
                current_user_id: currentUserId
            });

            if (rpcError) {
                console.error("RPC Error:", rpcError);
                throw new Error(`Failed to fetch matches: ${rpcError.message}`);
            }

            console.log("Matches received:", data);
            setMatches(Array.isArray(data) ? data : []);

        } catch (err: any) {
            console.error("Error fetching matches:", err);
            setError(err.message || 'An unexpected error occurred.');
            setMatches([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // --- Use useFocusEffect (No changes needed) ---
     useFocusEffect(
         useCallback(() => {
             fetchMatches();
         }, [])
     );


    // --- Pull-to-Refresh Handler (No changes needed) ---
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMatches();
    }, []);


    // --- *** MODIFIED: Item Press Handler *** ---
    const handleMatchPress = (profileId: string) => {
        console.log('Pressed match:', profileId);

        // REMOVED the alert:
        // alert(`Maps to profile/chat for user: ${profileId}`);

        // ADDED navigation:
        // Navigates to the 'ProfileDetail' screen (ensure this name matches your Stack.Screen name)
        // Passes the profileId as the 'userId' parameter
        navigation.navigate('ProfileDetail', { userId: profileId });
    };


    // --- Render Logic (No changes needed) ---

    const renderEmptyListComponent = () => {
        if (isLoading) {
             return null;
        }
         if (error) {
             return (
                 <View style={styles.centered}>
                     <Text style={styles.infoText}>Error: {error}</Text>
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


    // --- Return JSX (No changes needed in structure) ---
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                 <Text style={styles.headerTitle}>Connections</Text>
            </View>

            {isLoading && !refreshing && (
                 <ActivityIndicator size="large" color="#FFAFBD" style={styles.loadingIndicator} />
             )}

            <FlatList
                data={matches}
                // Pass the MODIFIED handleMatchPress function to the item
                renderItem={({ item }) => (
                    <MatchBubbleItem
                        profile={item}
                        onPress={handleMatchPress} // This now triggers navigation
                    />
                )}
                keyExtractor={(item) => item.user_id}
                contentContainerStyle={styles.listContentContainer}
                ListEmptyComponent={renderEmptyListComponent}
                refreshControl={
                     <RefreshControl
                         refreshing={refreshing}
                         onRefresh={onRefresh}
                         colors={['#FFAFBD', '#FFC3A0']}
                         tintColor={'#FFAFBD'}
                     />
                 }
            />
        </SafeAreaView>
    );
};

// --- Styles (No changes needed) ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
     header: {
         paddingVertical: 15,
         paddingHorizontal: 20,
         borderBottomWidth: 1,
         borderBottomColor: '#E9ECEF',
         backgroundColor: '#FFFFFF',
     },
     headerTitle: {
         fontSize: 24,
         fontWeight: 'bold',
         color: '#343A40',
     },
    listContentContainer: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        marginTop: 50,
    },
    infoText: {
        fontSize: 18,
        color: '#6C757D',
        textAlign: 'center',
        marginBottom: 8,
    },
     subInfoText: {
         fontSize: 14,
         color: '#ADB5BD',
         textAlign: 'center',
     },
     loadingIndicator: {
         marginTop: 30,
     }
});

export default ConnectionsScreen;