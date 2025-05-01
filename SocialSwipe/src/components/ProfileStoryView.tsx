// src/components/ProfileStoryView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Text,
    ActivityIndicator,
    Dimensions,
    // Import Alert for basic feedback (optional)
    // Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileCard, { Profile } from './ProfileCard';
// *** 1. Import your Supabase client ***
import { supabase } from '../lib/supabaseClient'; // Adjust path as needed

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileStoryViewProps {
    profiles: Profile[];
    initialProfileId?: string;
    onClose: () => void;
    // Keep onLikeProfile prop if parent needs notification
    onLikeProfile?: (profileId: string, success: boolean) => void;
    onProfilesExhausted?: () => void;
    onReloadProfiles?: () => void;
}

const ProfileStoryView: React.FC<ProfileStoryViewProps> = ({
    profiles = [],
    initialProfileId,
    onClose,
    onLikeProfile, // Note: Prop might become optional or removed if parent doesn't need it
    onProfilesExhausted,
    onReloadProfiles,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false); // Optional: state to prevent double-liking while processing

    // --- useEffect and Navigation Handlers (handleNextProfile, handlePreviousProfile, handleReload) remain unchanged ---
    useEffect(() => {
        if (profiles.length > 0) {
            let startIndex = 0;
            if (initialProfileId) {
                const foundIndex = profiles.findIndex(p => p.id === initialProfileId);
                if (foundIndex !== -1) {
                    startIndex = foundIndex;
                }
            }
            setCurrentIndex(startIndex);
            setIsLoading(false);
        } else {
            setCurrentIndex(0);
            setIsLoading(false);
        }
    }, [profiles, initialProfileId]);

    const handleNextProfile = useCallback(() => {
        // ... (no changes needed)
        if (currentIndex < profiles.length) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            if (nextIndex === profiles.length && onProfilesExhausted) {
                onProfilesExhausted();
            }
        }
    }, [currentIndex, profiles.length, onProfilesExhausted]);


    const handlePreviousProfile = useCallback(() => {
        // ... (no changes needed)
        if (currentIndex === profiles.length) {
             setCurrentIndex(profiles.length - 1);
         } else if (currentIndex > 0) {
             setCurrentIndex(prevIndex => prevIndex - 1);
         }
    }, [currentIndex, profiles.length]);


    // *** 2. Modify handleLike ***
    const handleLike = useCallback(async (likedProfileId: string) => {
        if (isLiking) return; // Prevent multiple simultaneous like attempts

        setIsLiking(true);
        console.log(`Attempting to like profile: ${likedProfileId}`);

        try {
            // Get the current logged-in user
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError) {
                throw new Error(`Authentication error: ${authError.message}`);
            }
            if (!user) {
                throw new Error('No authenticated user found. Please log in.');
            }

            const likerUserId = user.id;

            // Prepare the data for insertion
            const likeData = {
                liker_user_id: likerUserId,
                liked_user_id: likedProfileId, // The ID of the profile being viewed/liked
            };

            console.log('Inserting like:', likeData);

            // Insert the like record into the Supabase table
            const { error: insertError } = await supabase
                .from('likes') // Your table name
                .insert([likeData]); // Pass data as an array

            if (insertError) {
                // Handle potential errors (e.g., unique constraint violation if already liked)
                if (insertError.code === '23505') { // Postgres unique violation code
                    console.warn(`Like already exists for user ${likerUserId} on profile ${likedProfileId}`);
                    // Optionally provide feedback that it's already liked
                    // Alert.alert("Already Liked", "You've already liked this profile.");
                } else {
                    // Throw other errors
                    throw new Error(`Failed to insert like: ${insertError.message} (Code: ${insertError.code})`);
                }
                // Notify parent (optional) - indicate failure or already liked?
                 if (onLikeProfile) {
                    onLikeProfile(likedProfileId, false); // Indicate failure/no change
                 }
            } else {
                console.log(`Successfully liked profile ${likedProfileId} by user ${likerUserId}`);
                // Like was successful!
                // Optionally provide feedback
                // Alert.alert("Liked!", "You liked this profile.");

                // Notify parent component of success (if prop exists)
                 if (onLikeProfile) {
                    onLikeProfile(likedProfileId, true); // Indicate success
                 }

                // Optional: Automatically move to the next profile after a successful like
                // handleNextProfile();
            }

        } catch (error) {
            console.error("Error in handleLike:", error);
            // Alert.alert("Error", error instanceof Error ? error.message : "Could not like profile.");
            // Notify parent (optional) - indicate failure
             if (onLikeProfile) {
                 onLikeProfile(likedProfileId, false); // Indicate failure
             }
        } finally {
            setIsLiking(false); // Re-enable liking
        }
    }, [isLiking, onLikeProfile, handleNextProfile]); // Add handleNextProfile if used inside

    const handleReload = useCallback(() => {
        // ... (no changes needed)
        if (onReloadProfiles) {
            setIsLoading(true); // Show loading indicator while parent reloads
            onReloadProfiles();
        } else {
            setCurrentIndex(0);
        }
    }, [onReloadProfiles]);


    // --- Render Logic ---
    // ... (rest of the component remains the same, ensure ProfileCard calls handleLike)

    // Example of how ProfileCard might be used inside the render logic:
    // (Make sure your actual ProfileCard component accepts and calls `onLike`)
    // ... inside the return statement where the card is rendered:
                    // ...
                    // ) : (
                    //     // Display current profile card
                    //     profiles[currentIndex] && (
                    //         <ProfileCard
                    //             key={profiles[currentIndex].id}
                    //             profile={profiles[currentIndex]}
                    //             // Pass the modified handleLike function
                    //             onLike={handleLike}
                    //             isVisible={true}
                    //             // Add isLiking prop if ProfileCard needs to show feedback
                    //             // isLiking={isLiking && profiles[currentIndex].id === /* potential ID being liked */}
                    //         />
                    //     )
                    // )}
    // ...


    // --- Full Render Logic (incorporating ProfileCard usage example) ---

     if (isLoading) {
         return (
             <View style={styles.container}>
                 <View style={styles.centered}>
                     <ActivityIndicator size="large" color="#FFFFFF" />
                 </View>
             </View>
         );
     }

     if (!isLoading && profiles.length === 0 && !onReloadProfiles) {
         return (
             <View style={styles.container}>
                 <View style={styles.centered}>
                     <Text style={styles.endText}>No profiles to show.</Text>
                     <View style={styles.header}>
                         <View style={styles.progressContainer} />
                         <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
                             <Ionicons name="close" size={28} color="#ffffff" style={styles.closeIconShadow} />
                         </Pressable>
                     </View>
                     <Pressable onPress={onClose} style={styles.simpleButton}>
                         <Text style={styles.simpleButtonText}>Go Back</Text>
                     </Pressable>
                 </View>
             </View>
         );
     }

     const showEndScreen = !isLoading && currentIndex === profiles.length;
     const showInitialEmptyScreen = !isLoading && profiles.length === 0 && onReloadProfiles;

     return (
         <View style={styles.container}>
             {!(profiles.length === 0 && !onReloadProfiles) && (
                 <View style={styles.header}>
                     <View style={styles.progressContainer}>
                         {!showInitialEmptyScreen && !showEndScreen && profiles.length > 0 && profiles.map((_, index) => (
                             <View key={`progress-${index}`} style={styles.progressBarOuter}>
                                 <View
                                     style={[
                                         styles.progressBarInner,
                                         { width: index < currentIndex ? '100%' : '0%' },
                                         { backgroundColor: index < currentIndex ? '#ffffff' : 'transparent' }
                                     ]}
                                 />
                             </View>
                         ))}
                         {(showInitialEmptyScreen || showEndScreen || profiles.length === 0) && <View style={{flex: 1}}/>}
                     </View>
                     <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
                         <Ionicons name="close" size={28} color="#ffffff" style={styles.closeIconShadow} />
                     </Pressable>
                 </View>
             )}

             <View style={styles.contentArea}>
                 {showInitialEmptyScreen ? (
                     <View style={styles.centered}>
                         <Text style={styles.endText}>No profiles to show right now.</Text>
                         <Pressable onPress={handleReload} style={[styles.simpleButton, { marginBottom: 15 }]}>
                             <Text style={styles.simpleButtonText}>Check Again</Text>
                         </Pressable>
                     </View>
                 ) : showEndScreen ? (
                     <View style={styles.centered}>
                         <Text style={styles.endText}>That's everyone for now!</Text>
                         {onReloadProfiles && (
                             <Pressable onPress={handleReload} style={[styles.simpleButton, { marginBottom: 15 }]}>
                                 <Text style={styles.simpleButtonText}>Reload</Text>
                             </Pressable>
                         )}
                     </View>
                 ) : (
                     // Display current profile card - Ensure ProfileCard has onLike prop
                     profiles[currentIndex] && (
                         <ProfileCard
                             key={profiles[currentIndex].id}
                             profile={profiles[currentIndex]}
                             onLike={handleLike} // <-- Pass the async handler here
                             isVisible={true}
                         />
                     )
                 )}
             </View>

             {!showEndScreen && !showInitialEmptyScreen && profiles[currentIndex] && (
                 <>
                     <Pressable
                         style={[styles.navOverlay, styles.navOverlayLeft]}
                         onPress={handlePreviousProfile}
                         disabled={currentIndex === 0}
                     />
                     <Pressable
                         style={[styles.navOverlay, styles.navOverlayRight]}
                         onPress={handleNextProfile}
                     />
                 </>
             )}
         </View>
     );
};

// --- Styles remain unchanged ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        position: 'relative',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 15,
        paddingBottom: 10,
        paddingHorizontal: 10,
        zIndex: 20,
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        height: 3,
        marginRight: 15,
        alignItems: 'center',
    },
    progressBarOuter: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 1.5,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        borderRadius: 1.5,
    },
    closeButton: {
        padding: 5,
    },
    closeIconShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 0,
    },
    navOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '35%',
        zIndex: 10,
    },
    navOverlayLeft: {
        left: 0,
    },
    navOverlayRight: {
        right: 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
    },
    endText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 25,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    simpleButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        minWidth: 120,
        alignItems: 'center',
    },
    simpleButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});


export default ProfileStoryView;