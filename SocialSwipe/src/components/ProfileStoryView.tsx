// src/components/ProfileStoryView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Text,
    // SafeAreaView, // No longer needed here
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient'; // *** REMOVED ***
import ProfileCard, { Profile } from './ProfileCard';
// import { lightTheme } from '../theme/theme'; // *** REMOVED (unless needed for other styles) ***

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileStoryViewProps {
    profiles: Profile[];
    initialProfileId?: string;
    onClose: () => void;
    onLikeProfile: (profileId: string) => void;
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

    // *** REMOVED: gradientColors definition ***

    // --- useEffect and Handlers (handleNextProfile, handlePreviousProfile, handleLike, handleReload) remain unchanged ---
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
        if (currentIndex < profiles.length) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            if (nextIndex === profiles.length && onProfilesExhausted) {
                onProfilesExhausted();
            }
        }
    }, [currentIndex, profiles.length, onProfilesExhausted]);

    const handlePreviousProfile = useCallback(() => {
        if (currentIndex === profiles.length) {
            setCurrentIndex(profiles.length - 1);
        } else if (currentIndex > 0) {
            setCurrentIndex(prevIndex => prevIndex - 1);
        }
    }, [currentIndex, profiles.length]);

    const handleLike = useCallback((profileId: string) => {
        onLikeProfile(profileId);
    }, [onLikeProfile]);

    const handleReload = useCallback(() => {
        if (onReloadProfiles) {
            setIsLoading(true); // Show loading indicator while parent reloads
            onReloadProfiles();
        } else {
            // This case shouldn't happen if reload button is shown correctly
            setCurrentIndex(0);
        }
    }, [onReloadProfiles]);


    // --- Render Logic ---

    // *** REMOVED: renderWrapper function as it's no longer needed for the gradient ***

    // Loading State (Rendered directly now)
    if (isLoading) {
        // This will now render centered within the parent's gradient
        return (
            <View style={styles.container}> {/* Use container style */}
                 <View style={styles.centered}>
                     <ActivityIndicator size="large" color="#FFFFFF" /> {/* White indicator */}
                 </View>
            </View>
        );
    }

    // This specific state (initial empty, no reload prop)
    if (!isLoading && profiles.length === 0 && !onReloadProfiles) {
        // Rendered directly
        return (
            <View style={styles.container}>
                 <View style={styles.centered}>
                    <Text style={styles.endText}>No profiles to show.</Text>
                    {/* Header is still needed for the close button */}
                     <View style={styles.header}>
                         <View style={styles.progressContainer} /> {/* Empty placeholder */}
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

    // --- Main Render Block ---
    const showEndScreen = !isLoading && currentIndex === profiles.length;
    const showInitialEmptyScreen = !isLoading && profiles.length === 0 && onReloadProfiles;

    // Root element is View, now transparent
    return (
        <View style={styles.container}>
            {/* Header (Progress Bar & Close Button) */}
            {/* Render header unless it's the initial empty state without reload (handled above) */}
            {!(profiles.length === 0 && !onReloadProfiles) && (
                 <View style={styles.header}>
                     <View style={styles.progressContainer}>
                        {/* Show progress only when displaying profiles */}
                         {!showInitialEmptyScreen && !showEndScreen && profiles.length > 0 && profiles.map((_, index) => (
                             <View key={`progress-${index}`} style={styles.progressBarOuter}>
                                 <View
                                     style={[
                                         styles.progressBarInner,
                                         { width: index < currentIndex ? '100%' : '0%' },
                                         // Active segment is white, inactive is transparent (shows outer bar color)
                                         { backgroundColor: index < currentIndex ? '#ffffff' : 'transparent' }
                                     ]}
                                 />
                             </View>
                         ))}
                        {/* Fill space if no progress bars (e.g., on end screen) */}
                        {(showInitialEmptyScreen || showEndScreen || profiles.length === 0) && <View style={{flex: 1}}/>}
                     </View>
                     <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
                         <Ionicons name="close" size={28} color="#ffffff" style={styles.closeIconShadow} />
                     </Pressable>
                 </View>
            )}


            {/* Main Content Area */}
            <View style={styles.contentArea}>
                {showInitialEmptyScreen ? (
                    <View style={styles.centered}>
                        <Text style={styles.endText}>No profiles to show right now.</Text>
                        <Pressable onPress={handleReload} style={[styles.simpleButton, { marginBottom: 15 }]}>
                            <Text style={styles.simpleButtonText}>Check Again</Text>
                        </Pressable>
                        {/* No separate close button needed here, header one is visible */}
                    </View>
                ) : showEndScreen ? (
                    <View style={styles.centered}>
                        <Text style={styles.endText}>That's everyone for now!</Text>
                        {onReloadProfiles && (
                            <Pressable onPress={handleReload} style={[styles.simpleButton, { marginBottom: 15 }]}>
                                <Text style={styles.simpleButtonText}>Reload</Text>
                            </Pressable>
                        )}
                         {/* No separate close button needed here, header one is visible */}
                         {/* Optional: Could offer a "Finish" button that calls onClose if desired */}
                         {/* <Pressable onPress={onClose} style={styles.simpleButton}>
                            <Text style={styles.simpleButtonText}>Finish</Text>
                         </Pressable> */}
                    </View>
                ) : (
                    // Display current profile card
                    profiles[currentIndex] && (
                        <ProfileCard
                            key={profiles[currentIndex].id}
                            profile={profiles[currentIndex]}
                            onLike={handleLike}
                            isVisible={true} // Card is always "visible" in this story view context
                        />
                    )
                )}
            </View>

            {/* Navigation Overlays */}
            {/* Show overlays only when displaying a profile card */}
            {!showEndScreen && !showInitialEmptyScreen && profiles[currentIndex] && (
                <>
                    <Pressable
                        style={[styles.navOverlay, styles.navOverlayLeft]}
                        onPress={handlePreviousProfile}
                        disabled={currentIndex === 0} // Disable going back on the first profile
                    />
                    <Pressable
                        style={[styles.navOverlay, styles.navOverlayRight]}
                        onPress={handleNextProfile}
                        // No need to disable, goes to end screen naturally
                    />
                </>
            )}
        </View> // Root View end
    );
};

const styles = StyleSheet.create({
    // *** CHANGED: Renamed safeArea to container, ensure it's transparent ***
    container: {
        flex: 1,
        backgroundColor: 'transparent', // Make ProfileStoryView transparent
        position: 'relative', // Needed for absolute positioning of children like header/nav
    },
    // *** REMOVED: gradientContainer style ***
    header: {
        position: 'absolute',
        // top: 10, // Let parent SafeAreaView handle top spacing. Adjust if needed. Start at 0.
        top: 0, // Position relative to the top of the container View
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 15, // Add more internal padding for space below status bar
        paddingBottom: 10, // Padding below progress bars/close icon
        paddingHorizontal: 10,
        zIndex: 20, // Ensure header is above content
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        height: 3, // Keep progress bar height
        marginRight: 15, // Space between progress and close button
        alignItems: 'center', // Center vertically if needed
    },
    progressBarOuter: {
        flex: 1, // Each segment takes equal space
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.3)', // Background of the holder
        borderRadius: 1.5,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    progressBarInner: {
        height: '100%',
        // backgroundColor set dynamically (white or transparent)
        borderRadius: 1.5,
    },
    closeButton: {
        padding: 5, // Hit area padding
    },
    closeIconShadow: { // Keep shadow for visibility
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    contentArea: {
        flex: 1, // Takes up space NOT used by absolute header/nav
        justifyContent: 'center', // Center content (card/text) vertically
        alignItems: 'center', // Center content horizontally
        width: '100%',
         // Adjust paddingTop to account for the header's height + padding
        paddingTop: 60, // Start with this, may need adjustment based on header height
        paddingBottom: 20, // Space at the bottom
        paddingHorizontal: 0, // ProfileCard likely handles its own horizontal padding
    },
    navOverlay: {
        position: 'absolute',
        // top: 60, // Start below the header area
        top: 0, // Should cover header area too for tapping
        bottom: 0, // Cover full height
        width: '35%', // Tappable area width
        zIndex: 10, // Below header (zIndex 20) but above content
        // backgroundColor: 'rgba(255,0,0,0.1)', // DEBUG: uncomment to see overlay area
    },
    navOverlayLeft: {
        left: 0,
    },
    navOverlayRight: {
        right: 0,
    },
    centered: { // Used for loading indicator and end/empty screen content
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        width: '100%',
    },
    endText: { // Keep styles for text on gradient
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 25,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    simpleButton: { // Keep button styles
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        minWidth: 120,
        alignItems: 'center',
    },
    simpleButtonText: { // Keep text styles
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});

export default ProfileStoryView;