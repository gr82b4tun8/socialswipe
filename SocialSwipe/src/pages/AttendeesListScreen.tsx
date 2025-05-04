// src/screens/AttendeesListScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Image,
    ActivityIndicator,
    Dimensions,
    Pressable,
    SafeAreaView, // Use SafeAreaView for better layout on devices with notches/islands
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

const { width: screenWidth } = Dimensions.get('window');
const BUBBLE_COLUMNS = 4; // Number of bubbles per row
const BUBBLE_MARGIN = 8; // Margin around each bubble
const BUBBLE_SIZE = (screenWidth / BUBBLE_COLUMNS) - (BUBBLE_MARGIN * 2); // Calculate bubble size based on columns and margins

// Define a simplified Profile type for attendees
// Ensure these field names match your 'profiles' table
interface AttendeeProfile {
    id: string;
    first_name?: string; // Or full_name, username, etc.
    // Use the correct column name for the profile picture URL
    primary_profile_picture_url?: string | null; // Or avatar_url, profile_image_url, etc.
}

// Define the type for the route parameters expected by this screen
type AttendeesListScreenRouteProp = RouteProp<{ params: { businessId: string; businessName?: string } }, 'params'>;

const AttendeesListScreen: React.FC = () => {
    const route = useRoute<AttendeesListScreenRouteProp>();
    const navigation = useNavigation();
    const { businessId, businessName } = route.params; // Get businessId and optional name from navigation

    const [attendees, setAttendees] = useState<AttendeeProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Data Fetching ---
    const fetchAttendees = useCallback(async () => {
        if (!businessId) {
            setError("No Business ID provided.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setAttendees([]); // Clear previous attendees

        try {
            // 1. Fetch the user IDs of likers for the specific business
            // Assuming your table is named 'business_likes' and has 'liker_user_id' and 'liked_business_id' columns
            const { data: likeData, error: likeError } = await supabase
                .from('profile_likes') // <<< --- CHANGE 'business_likes' if your table name is different
                .select('liker_user_id')
                .eq('liked_listing_id', businessId);

            if (likeError) {
                throw new Error(`Failed to fetch likes: ${likeError.message}`);
            }

            if (!likeData || likeData.length === 0) {
                // No one has liked this business yet
                setAttendees([]);
                setIsLoading(false);
                return;
            }

            // Extract the user IDs
            const userIds = likeData.map(like => like.liker_user_id).filter(id => id); // Filter out any null/undefined IDs

            if (userIds.length === 0) {
                setAttendees([]);
                setIsLoading(false);
                return;
            }

            // 2. Fetch the profiles for these user IDs
            // Select only the necessary fields (id, name, picture URL)
            // Ensure 'primary_profile_picture_url' and 'first_name' match your table columns
            const { data: profileData, error: profileError } = await supabase
                .from('profiles') // <<< --- Your profiles table name
                .select('id, first_name, primary_profile_picture_url') // <<< --- Adjust field names if needed
                .in('id', userIds); // Fetch profiles where the ID is in the list of liker IDs

            if (profileError) {
                throw new Error(`Failed to fetch profiles: ${profileError.message}`);
            }

            // Ensure profileData is an array before setting state
            setAttendees(profileData || []);

        } catch (err: any) {
            console.error("Error fetching attendees:", err);
            setError(err.message || "An unknown error occurred.");
            setAttendees([]); // Clear attendees on error
        } finally {
            setIsLoading(false);
        }
    }, [businessId]); // Re-fetch if businessId changes

    // --- Trigger Fetch on Mount ---
    useEffect(() => {
        fetchAttendees();
    }, [fetchAttendees]);

    // --- Render Attendee Bubble ---
    const renderAttendeeBubble = ({ item }: { item: AttendeeProfile }) => {

        return (
            <Pressable
                style={styles.bubbleContainer}
                // Optional: Add onPress to navigate to the user's profile
                // onPress={() => navigation.navigate('UserProfileScreen', { userId: item.id })}
            >
                <Image
                    source={profileImage}
                    style={styles.bubbleImage}
                    resizeMode="cover" // Cover ensures the image fills the bubble
                />
                {/* Optional: Display name below bubble */}
                {/* <Text style={styles.bubbleName} numberOfLines={1}>{item.first_name || 'User'}</Text> */}
            </Pressable>
        );
    };

    // --- Render Content Based on State ---
    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#555" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Error: {error}</Text>
                    <Pressable onPress={fetchAttendees} style={styles.retryButton}>
                         <Text style={styles.retryButtonText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }

        if (attendees.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No attendees yet!</Text>
                </View>
            );
        }

        // Display the list if data is available
        return (
            <FlatList
                data={attendees}
                renderItem={renderAttendeeBubble}
                keyExtractor={(item) => item.id}
                numColumns={BUBBLE_COLUMNS} // Arrange items in columns
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    // --- Main Component Render ---
    return (
        // Use a gradient background similar to ProfileStoryView or a simple color
        <LinearGradient
            colors={['#f0f0f0', '#e0e0e0']} // Light grey gradient example
            style={styles.flexContainer}
        >
            <SafeAreaView style={styles.flexContainer}>
                {/* --- Header --- */}
                <View style={styles.header}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
                        <Ionicons name="arrow-back" size={28} color="#333" />
                    </Pressable>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {/* Display business name if available, otherwise generic title */}
                        {businessName ? `Liked by (${attendees.length})` : `Attendees (${attendees.length})`}
                    </Text>
                    {/* Optional: Add a placeholder or action on the right */}
                    <View style={{ width: 40 }} />
                </View>

                {/* --- Content Area --- */}
                <View style={styles.content}>
                     {businessName && <Text style={styles.businessNameSubtitle}>{businessName}</Text>}
                     {renderContent()}
                 </View>

            </SafeAreaView>
        </LinearGradient>
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    flexContainer: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
    },
    emptyText: {
        color: '#666',
        fontSize: 18,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF', // Example blue color
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Slight transparency if over gradient
    },
    backButton: {
        padding: 5, // Hit area
        width: 40, // Ensure consistent spacing
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        flex: 1, // Allow title to take available space
        marginHorizontal: 10, // Space between button and title edge cases
    },
    content: {
        flex: 1,
    },
    businessNameSubtitle: {
         fontSize: 16,
         fontWeight: '500',
         color: '#444',
         textAlign: 'center',
         paddingVertical: 8,
         borderBottomWidth: 1,
         borderBottomColor: '#eee',
         marginBottom: 5,
     },
    listContainer: {
        paddingHorizontal: BUBBLE_MARGIN, // Left/right padding for the whole list
        paddingTop: BUBBLE_MARGIN * 2, // Top padding
        paddingBottom: BUBBLE_MARGIN * 2, // Bottom padding
    },
    bubbleContainer: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE, // Make it square before rounding
        borderRadius: BUBBLE_SIZE / 2, // Make it a circle
        margin: BUBBLE_MARGIN,
        backgroundColor: '#ccc', // Fallback background color
        overflow: 'hidden', // Clip the image to the rounded bounds
        alignItems: 'center', // Center content if needed (e.g., for placeholder icon)
        justifyContent: 'center', // Center content if needed
        // Optional: Add a border
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
    },
    // Optional: Style for name below bubble
    // bubbleName: {
    //     marginTop: 4,
    //     fontSize: 12,
    //     color: '#444',
    //     textAlign: 'center',
    //     width: BUBBLE_SIZE, // Ensure text doesn't overflow container width
    // },
});

export default AttendeesListScreen;