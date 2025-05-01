// src/components/ProfileStoryView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Text,
    ActivityIndicator,
    Dimensions,
    Platform,
    // Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // *** 1. Import LinearGradient ***

import ProfileCard, { Profile } from './ProfileCard';
import { supabase } from '../lib/supabaseClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileStoryViewProps {
    profiles: Profile[];
    initialProfileId?: string;
    onClose: () => void;
    onLikeProfile?: (profileId: string, success: boolean) => void;
    onProfilesExhausted?: () => void;
    onReloadProfiles?: () => void;
}

const ProfileStoryView: React.FC<ProfileStoryViewProps> = ({
    profiles = [],
    initialProfileId,
    onClose,
    onLikeProfile,
    onProfilesExhausted,
    onReloadProfiles,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiking, setIsLiking] = useState(false);

    const likeAnimationScale = useSharedValue(0);
    const likeAnimationOpacity = useSharedValue(0);
    const doubleTapRef = useRef(null);

    // --- useEffect (unchanged from animation version) ---
    useEffect(() => {
        likeAnimationScale.value = 0;
        likeAnimationOpacity.value = 0;

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
    }, [profiles, initialProfileId, likeAnimationScale, likeAnimationOpacity]);

    // --- Navigation Handlers (unchanged from animation version) ---
    const handleNextProfile = useCallback(() => {
        if (currentIndex < profiles.length) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            likeAnimationScale.value = 0;
            likeAnimationOpacity.value = 0;
            if (nextIndex === profiles.length && onProfilesExhausted) {
                onProfilesExhausted();
            }
        }
    }, [currentIndex, profiles.length, onProfilesExhausted, likeAnimationScale, likeAnimationOpacity]);

    const handlePreviousProfile = useCallback(() => {
        let targetIndex = currentIndex;
        if (currentIndex === profiles.length) {
            targetIndex = profiles.length - 1;
        } else if (currentIndex > 0) {
            targetIndex = currentIndex - 1;
        }
        if (targetIndex !== currentIndex) {
            setCurrentIndex(targetIndex);
            likeAnimationScale.value = 0;
            likeAnimationOpacity.value = 0;
        }
    }, [currentIndex, profiles.length, likeAnimationScale, likeAnimationOpacity]);

    // --- Like Logic (unchanged from animation version) ---
    const performLikeAction = useCallback(async (likedProfileId: string) => {
        if (isLiking) return;
        setIsLiking(true);
        console.log(`Attempting to like profile: ${likedProfileId}`);
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                throw new Error(authError?.message || 'No authenticated user found.');
            }
            const likerUserId = user.id;
            const likeData = { liker_user_id: likerUserId, liked_user_id: likedProfileId };
            console.log('Inserting like:', likeData);
            const { error: insertError } = await supabase.from('likes').insert([likeData]);
            if (insertError) {
                if (insertError.code === '23505') {
                    console.warn(`Like already exists for profile ${likedProfileId}`);
                    if (onLikeProfile) runOnJS(onLikeProfile)(likedProfileId, false);
                } else {
                    throw new Error(`Failed to insert like: ${insertError.message} (Code: ${insertError.code})`);
                }
            } else {
                console.log(`Successfully liked profile ${likedProfileId}`);
                if (onLikeProfile) runOnJS(onLikeProfile)(likedProfileId, true);
            }
        } catch (error) {
            console.error("Error in performLikeAction:", error);
            if (onLikeProfile) runOnJS(onLikeProfile)(likedProfileId, false);
        } finally {
             runOnJS(setIsLiking)(false);
        }
    }, [isLiking, onLikeProfile]);

    // --- Double Tap Handler (unchanged from animation version) ---
    const handleDoubleTap = useCallback(() => {
        const profileToLike = profiles[currentIndex];
        if (!profileToLike || isLiking) {
             console.log("Double tap ignored: no profile or already liking.");
            return;
        }
        console.log("Double tap detected!");
        likeAnimationScale.value = withSequence(
            withTiming(1.4, { duration: 200 }),
            withDelay(300, withTiming(0, { duration: 300 }))
        );
        likeAnimationOpacity.value = withSequence(
            withTiming(1, { duration: 150 }),
            withDelay(350, withTiming(0, { duration: 350 }))
        );
        runOnJS(performLikeAction)(profileToLike.id);
    }, [currentIndex, profiles, isLiking, performLikeAction, likeAnimationScale, likeAnimationOpacity]);

    // --- Animated Style (unchanged from animation version) ---
    const animatedHeartStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: likeAnimationScale.value }],
            opacity: likeAnimationOpacity.value,
        };
    });

    // --- Reload Handler (unchanged from animation version) ---
    const handleReload = useCallback(() => {
        if (onReloadProfiles) {
            setIsLoading(true);
            onReloadProfiles();
        } else {
            setCurrentIndex(0);
        }
    }, [onReloadProfiles]);


    // --- Render Logic ---

    if (isLoading) {
        // *** Use LinearGradient here too if you want gradient on loading screen ***
        return (
            <LinearGradient colors={['#222', '#111']} style={styles.container}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            </LinearGradient>
        );
    }

    // Handle no profiles case (without reload button)
    if (!isLoading && profiles.length === 0 && !onReloadProfiles) {
       // *** Use LinearGradient here too ***
        return (
             <LinearGradient colors={['#222', '#111']} style={styles.container}>
                <View style={styles.centered}>
                    <Text style={styles.endText}>No profiles to show.</Text>
                    {/* Keep header structure for close button consistency */}
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
             </LinearGradient>
        );
    }

    const showEndScreen = !isLoading && currentIndex === profiles.length;
    const showInitialEmptyScreen = !isLoading && profiles.length === 0 && onReloadProfiles;
    const currentProfile = profiles[currentIndex];

    // *** 2. Use LinearGradient as the root component ***
    return (
        <LinearGradient
            // *** Replace with your desired gradient colors ***
            colors={['#fe5e58', '#192f6a']} // Example: Blueish gradient
            // colors={['#8a2387', '#e94057', '#f27121']} // Example: Pink/Orange gradient
            // colors={['#333', '#111']} // Example: Dark grey gradient
            style={styles.container}
            // Optional: Adjust gradient direction
            start={{ x: 0, y: 0.5 }} // Starts at the center of the left edge
            end={{ x: 1, y: 0.5 }} 
        >
            {/* --- Header (Progress bars & Close button) --- */}
            {!(profiles.length === 0 && !onReloadProfiles) && (
                <View style={styles.header}>
                    {/* Header content is unchanged */}
                     <View style={styles.progressContainer}>
                         {!showInitialEmptyScreen && !showEndScreen && profiles.length > 0 && profiles.map((_, index) => (
                             <View key={`progress-${index}`} style={styles.progressBarOuter}>
                                 <View
                                     style={[
                                         styles.progressBarInner,
                                         { width: index < currentIndex ? '100%' : '0%' },
                                         // White progress on gradient might be fine, adjust if needed
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

            {/* --- Content Area (Wrapped in Gesture Handler) --- */}
            <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                maxDelayMs={250}
                onHandlerStateChange={({ nativeEvent }) => {
                    if (nativeEvent.state === State.ACTIVE) {
                        handleDoubleTap();
                    }
                }}
            >
                <Animated.View style={styles.contentAreaWrapper}>
                    {/* --- Main Content (Card or Empty/End Screens) --- */}
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
                            currentProfile && (
                                <ProfileCard
                                    key={currentProfile.id}
                                    profile={currentProfile}
                                    // Like is handled by double tap now
                                    // onLike={handleLike} // Remove if not needed by ProfileCard itself
                                    isVisible={true}
                                />
                            )
                        )}
                    </View>

                    {/* --- Heart Animation Overlay (Unchanged) --- */}
                    {!showInitialEmptyScreen && !showEndScreen && currentProfile && (
                        <Animated.View style={[styles.likeAnimationOverlay, animatedHeartStyle]}>
                            <Ionicons name="heart" size={100} color="rgba(255, 255, 255, 0.9)" />
                        </Animated.View>
                    )}

                </Animated.View>
            </TapGestureHandler>

            {/* --- Navigation Overlays (Unchanged) --- */}
            {!showEndScreen && !showInitialEmptyScreen && currentProfile && (
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
        </LinearGradient> // *** Close LinearGradient ***
    );
};

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        // *** 3. Remove the specific backgroundColor ***
        // backgroundColor: 'rgba(0,0,0,0.9)',
        position: 'relative', // Keep position relative if needed
    },
    // --- All other styles remain IDENTICAL to your second snippet ---
    header: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
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
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white looks good on gradients
        borderRadius: 1.5,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        borderRadius: 1.5,
        backgroundColor: '#ffffff', // Solid white for filled part
    },
    closeButton: {
        padding: 5,
    },
    closeIconShadow: {
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    contentAreaWrapper: {
        flex: 1,
        position: 'relative',
        minHeight: 200, // Keep if needed
    },
    contentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingTop: 60, // Adjust as needed for header overlap
        paddingBottom: 20,
        paddingHorizontal: 0,
        zIndex: 1, // Content below header, potentially above nav overlays
    },
    navOverlay: {
        position: 'absolute',
        top: 70, // Adjust to ensure it's below header
        bottom: 0,
        width: '30%',
        zIndex: 10, // Above content, below header
        // backgroundColor: 'rgba(0,255,0,0.1)', // DEBUG
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
        color: '#ffffff', // White text usually looks good on gradients
        textAlign: 'center',
        marginBottom: 25,
        textShadowColor: 'rgba(0, 0, 0, 0.6)', // Keep text shadow for readability
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    simpleButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.25)', // Semi-transparent white button
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
    likeAnimationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50, // Highest zIndex
        pointerEvents: 'none',
    },
});

export default ProfileStoryView;