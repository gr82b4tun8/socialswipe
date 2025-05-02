// src/screens/ProfileDetailScreen.tsx (Modified for Scaling)
import React, { useState, useEffect } from 'react';
// *** Removed ScrollView Import ***
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../lib/supabaseClient'; // Adjust path
import ProfileCard, { Profile } from '../components/ProfileCard'; // Adjust path

// --- Types remain unchanged ---
type ProfileDetailRouteParams = {
  ProfileDetail: {
    userId: string;
  };
};
type ProfileDetailScreenRouteProp = RouteProp<ProfileDetailRouteParams, 'ProfileDetail'>;
// ---

// *** Define a scale factor (adjust this value based on testing) ***
const CARD_SCALE_FACTOR = 0.95; // e.g., 95% of original size. Try 0.9 or 0.92 if needed.

const ProfileDetailScreen: React.FC = () => {
    const route = useRoute<ProfileDetailScreenRouteProp>();
    const { userId } = route.params;

    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            // ... (fetch logic remains unchanged) ...
            if (!userId) {
                setError('User ID not provided.');
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
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
                setProfileData(data as Profile);

            } catch (err: any) {
                console.error("Error in fetchProfileData:", err);
                setError(err.message || 'Failed to load profile.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [userId]);

    // --- Loading State (Unchanged) ---
    if (isLoading) {
        return (
             <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}>
                <ActivityIndicator size="large" color="#FFFFFF" />
             </LinearGradient>
        );
    }

    // --- Error State (Unchanged) ---
    if (error) {
        return (
             <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}>
                <Text style={styles.errorText}>Error: {error}</Text>
             </LinearGradient>
        );
    }

    // --- Profile Not Found State (Unchanged) ---
    if (!profileData) {
         return (
              <LinearGradient colors={['#fe5e58', '#192f6a']} style={styles.centered}>
                 <Text style={styles.errorText}>Profile not available.</Text>
              </LinearGradient>
         );
    }

    // --- Main Content Rendering ---
    return (
        <LinearGradient
            colors={['#fe5e58', '#192f6a']}
            style={styles.container} // Gradient takes full screen
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* *** Use a View to center the scaled card *** */}
            <View style={styles.contentContainer}>
                {/* *** Wrap ProfileCard in a View to apply the scale transform *** */}
                <View style={{ transform: [{ scale: CARD_SCALE_FACTOR }] }}>
                    <ProfileCard
                        profile={profileData}
                        isVisible={true} // Assuming always visible on this screen
                    />
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1, // Gradient fills the screen
    },
    // Centering container for Loading/Error/Not Found states (Unchanged)
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    // Centering container for the ProfileCard content (Unchanged from original)
    contentContainer: {
        flex: 1, // Takes remaining space
        justifyContent: 'center', // Center vertically
        alignItems: 'center', // Center horizontally
        // Add some padding if the scaled card feels too close to the edges
        // padding: 10,
    },
    errorText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
    }
    // No ScrollView styles needed
});

export default ProfileDetailScreen;