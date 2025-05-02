// src/screens/ProfileDetailScreen.tsx (Modified for Nested Navigation)
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity, // Import TouchableOpacity
    Alert // Import Alert for potential feedback/errors
} from 'react-native';
// Assuming you use Expo and Ionicons, otherwise adjust icon library
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation, NavigatorScreenParams } from '@react-navigation/native'; // Import useNavigation, NavigatorScreenParams
import { StackNavigationProp } from '@react-navigation/stack'; // Import StackNavigationProp (adjust if using a different navigator)
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../lib/supabaseClient'; // Adjust path
import ProfileCard, { Profile } from '../components/ProfileCard'; // Adjust path

// *** --- TYPE DEFINITIONS --- ***
// --- IMPORTANT: Import the actual RootStackParamList from your App.tsx or navigation setup ---
// Adjust the path '../../App' as necessary to point to where RootStackParamList is exported
import { RootStackParamList as AppRootStackParamList } from '../../App'; // <--- ADJUST PATH HERE

// Navigation prop type for this screen, using the imported ParamList
// This tells TypeScript about the 'Main', 'ConversationsTab' structure
type ProfileDetailScreenNavigationProp = StackNavigationProp<
    AppRootStackParamList, // Use the imported ParamList
    'ProfileDetail'        // Current screen name in the stack
>;

// Route prop type (Unchanged, still receives userId for this screen)
type ProfileDetailRouteParams = {
  ProfileDetail: {
    userId: string;
  };
};
type ProfileDetailScreenRouteProp = RouteProp<ProfileDetailRouteParams, 'ProfileDetail'>;
// *** --- END TYPE DEFINITIONS --- ***

const CARD_SCALE_FACTOR = 0.9; // Keep the scale factor

const ProfileDetailScreen: React.FC = () => {
    const route = useRoute<ProfileDetailScreenRouteProp>();
    // Use the corrected Navigation Prop type
    const navigation = useNavigation<ProfileDetailScreenNavigationProp>();
    const { userId } = route.params;

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Current User ID Fetching (Unchanged) ---
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
            // Original log message had a typo "Workspaceing", corrected to "Fetching"
            console.log(`Workspaceing profile details for user: ${userId} from individual_profiles`);

            try {
                const { data, error: dbError } = await supabase
                    .from('individual_profiles')
                    .select('*')
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

    // *** --- Button Press Handler (MODIFIED) --- ***
    const handlePressMessage = () => {
        if (!profileData || !profileData.id) {
            Alert.alert("Error", "Cannot initiate message, user data is missing.");
            return;
        }

        if (profileData.id === currentUserId) {
             Alert.alert("Info", "You cannot message yourself.");
             return;
        }

        // Updated log message to reflect the nested navigation target
        console.log(`Navigating to Main -> ConversationsTab for user: ${profileData.id}`);

        // --- CORRECTED NAVIGATION CALL for nested structure ---
        navigation.navigate('Main', { // 1. Navigate to the screen containing the Tab Navigator ('Main')
            screen: 'ConversationsTab', // 2. Specify the target tab screen name within 'Main'
            params: { // 3. Pass params nested under the target screen
                 targetUserId: profileData.id
                 // conversationId: undefined // Can add other params if needed by ConversationsScreen later
            },
        });
        // --- End Correction ---
    };
    // *** --- End Button Press Handler Modification --- ***

    const isOwnProfile = profileData.id === currentUserId;

    // --- Main Content Rendering (Unchanged) ---
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
                    />
                </View>

                {/* Message Button */}
                {!isOwnProfile && (
                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={handlePressMessage} // This now calls the corrected function
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                        <Text style={styles.messageButtonText}>Message {profileData.first_name}</Text>
                    </TouchableOpacity>
                )}
                 {/* End Message Button */}

            </View>
        </LinearGradient>
    );
};

// --- Styles (Unchanged) ---
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
        paddingBottom: 60,
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
        backgroundColor: '#fe5e58',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginTop: -55, // Keeps the button close/overlapping as per previous adjustment
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonIcon: {
        marginRight: 8,
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileDetailScreen;