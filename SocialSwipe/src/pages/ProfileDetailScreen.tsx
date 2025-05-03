// src/screens/ProfileDetailScreen.tsx (Modified for chatUtils import and usage)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'; // Removed NavigatorScreenParams as it wasn't used directly here
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../lib/supabaseClient'; // Adjust path if needed
import ProfileCard, { Profile } from '../components/ProfileCard'; // Adjust path if needed

// *** --- TYPE DEFINITIONS --- ***
// Import the RootStackParamList (adjust path as needed)
// IMPORTANT: Ensure RootStackParamList includes ChatRoomScreen with its params:
// ChatRoomScreen: { conversationId: string; targetUserId: string; targetUserName?: string; }
import { RootStackParamList } from '../../App'; // <--- ADJUST PATH HERE

// --- Import the chat utility function ---
import { findOrCreateConversation } from '../lib/chatUtils'; // <-- Import the function

// Navigation prop type for this screen
// Now expects ChatRoomScreen to be part of the RootStackParamList
type ProfileDetailScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ProfileDetail'
>;

// Route prop type (Unchanged)
type ProfileDetailRouteParams = {
  ProfileDetail: {
    userId: string;
  };
};
type ProfileDetailScreenRouteProp = RouteProp<ProfileDetailRouteParams, 'ProfileDetail'>;
// *** --- END TYPE DEFINITIONS --- ***

const CARD_SCALE_FACTOR = 0.9;

const ProfileDetailScreen: React.FC = () => {
    const route = useRoute<ProfileDetailScreenRouteProp>();
    const navigation = useNavigation<ProfileDetailScreenNavigationProp>();
    const { userId } = route.params;

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    // --- Add state for chat button loading ---
    const [isStartingChat, setIsStartingChat] = useState(false);

    // --- Current User ID Fetching (Unchanged) ---
    useEffect(() => {
        const fetchSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUserId(session?.user?.id ?? null);
        };
        fetchSession();
    }, []);
    // ---

    // --- Profile Data Fetching (Unchanged) ---
    useEffect(() => {
        const fetchProfileData = async () => {
            if (!userId) {
                setError('User ID not provided.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            // Corrected log message from "Workspaceing" to "Fetching"
            console.log(`Workspaceing profile details for user: ${userId} from individual_profiles`);

            try {
                const { data, error: dbError } = await supabase
                    .from('individual_profiles')
                    .select('*') // Adjust columns if needed
                    .eq('user_id', userId)
                    .single();

                if (dbError) {
                    console.error("Error fetching profile:", dbError);
                    throw new Error(dbError.message);
                }
                if (!data) {
                     throw new Error('Profile not found.');
                }
                console.log("Profile data fetched:", data);
                // Ensure the profile object has an 'id' field consistent with the Profile type
                setProfileData({ ...data, id: data.user_id } as Profile);

            } catch (err: any) {
                console.error("Error in fetchProfileData:", err);
                setError(err.message || 'Failed to load profile.');
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
             fetchProfileData();
        } else {
            setError("User ID parameter missing.");
            setIsLoading(false);
        }

    }, [userId]);
    // ---

    // --- Loading, Error, Not Found States (Unchanged) ---
    if (isLoading) {
        return ( <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}><ActivityIndicator size="large" color="#FFFFFF" /></LinearGradient> );
    }
    if (error) {
        return ( <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></LinearGradient> );
    }
    if (!profileData) {
         return ( <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}><Text style={styles.errorText}>Profile not available.</Text></LinearGradient> );
    }
    // ---

    // *** --- MODIFIED Button Press Handler --- ***
    const handlePressMessage = async () => { // Function is now async
        // Ensure we have profile data, the profile's ID, and the current user's ID
        if (!profileData || !profileData.id || !currentUserId) {
            Alert.alert("Error", "Cannot initiate message. User data or session missing.");
            return;
        }

        // Prevent messaging self
        if (profileData.id === currentUserId) {
             Alert.alert("Info", "You cannot message yourself.");
             return;
        }

        setIsStartingChat(true); // Start loading indicator

        try {
            console.log(`Attempting to find or create conversation between ${currentUserId} and ${profileData.id}`);

            // Call the imported function to get the conversation ID
            const conversationId = await findOrCreateConversation(currentUserId, profileData.id);

            if (conversationId) {
                // If successful, navigate to the ChatRoomScreen
                console.log(`Navigating to ChatRoomScreen with conversationId: ${conversationId}`);
                navigation.navigate('ChatRoomScreen', {
                    conversationId: conversationId, // <-- Name is conversationId
                    targetUserId: profileData.id, // <-- Name is targetUserId
                    targetUserName: profileData.first_name, // <-- Name is targetUserName
                });// Pass name for convenience in ChatRoomScreen header
            } else {
                // Alert should be handled within findOrCreateConversation on failure
                console.error("Failed to get conversation ID from findOrCreateConversation.");
                // Optionally, show a generic alert here if needed, but the util function should handle specifics
                // Alert.alert("Error", "Could not start chat. Please try again.");
            }
        } catch (err) {
             // Catch any unexpected errors during the process
             console.error("Error during handlePressMessage:", err);
             Alert.alert("Error", "An unexpected error occurred while starting the chat.");
        } finally {
            setIsStartingChat(false); // Stop loading indicator regardless of outcome
        }
    };
    // *** --- End Button Press Handler Modification --- ***

    const isOwnProfile = profileData.id === currentUserId;

    // --- Main Content Rendering (Modified Button) ---
    return (
        <LinearGradient
            colors={['#fe5e58', '#192f6a']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.contentContainer}>
                {/* Scaled Profile Card Wrapper */}
                <View style={{ transform: [{ scale: CARD_SCALE_FACTOR }] }}>
                    <ProfileCard
                        profile={profileData}
                        isVisible={true}
                        // Add any other props ProfileCard needs
                    />
                </View>

                {/* Message Button */}
                {!isOwnProfile && (
                    <TouchableOpacity
                        style={[styles.messageButton, isStartingChat && styles.buttonDisabled]} // Apply disabled style
                        onPress={handlePressMessage}
                        activeOpacity={0.7}
                        disabled={isStartingChat} // Disable button while loading
                    >
                        {isStartingChat ? (
                            <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} /> // Show loader
                        ) : (
                           <>
                               <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                               <Text style={styles.messageButtonText}>Message {profileData.first_name}</Text>
                           </>
                        )}
                    </TouchableOpacity>
                )}
                 {/* End Message Button */}

            </View>
        </LinearGradient>
    );
};

// --- Styles (Added buttonDisabled style) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 60, // Adjust as needed based on card scaling/button position
    },
    errorText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fe5e58', // Use your theme color
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginTop: -55, // Adjust margin based on the scaled card size
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: 150, // Give button a minimum width to accommodate loader
        height: 45, // Give button a fixed height
    },
    buttonIcon: {
        marginRight: 8,
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Style for the button when disabled (during loading)
    buttonDisabled: {
        backgroundColor: '#b5b5b5', // A greyed-out color
    },
});

export default ProfileDetailScreen;