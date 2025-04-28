// src/components/ProfileStoryView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileCard, { Profile } from './ProfileCard'; // Import ProfileCard and Profile interface

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileStoryViewProps {
  profiles: Profile[];
  initialProfileId?: string; // Optional: ID to start viewing from
  onClose: () => void; // Callback to close the story view
  onLikeProfile: (profileId: string) => void; // Callback when a profile is liked
  onProfilesExhausted?: () => void; // Optional: Callback when last profile is passed
}

const ProfileStoryView: React.FC<ProfileStoryViewProps> = ({
  profiles = [], // Default to empty array
  initialProfileId,
  onClose,
  onLikeProfile,
  onProfilesExhausted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
      // Handle case where no profiles are passed immediately
      setIsLoading(false); // Or maybe show a specific "no profiles" state
    }
  }, [profiles, initialProfileId]); // Re-run if profiles array changes

  const handleNextProfile = useCallback(() => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    } else {
      // Reached the end
      if (onProfilesExhausted) {
        onProfilesExhausted();
      }
       // Optionally close automatically or show "That's everyone"
       // For now, we'll show the message within this component
       console.log("End of profiles reached.");
       // onClose(); // Example: Close when finished
    }
  }, [currentIndex, profiles.length, onProfilesExhausted]); // Removed onClose from deps

  const handlePreviousProfile = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    } else {
      // At the first profile, maybe close or do nothing?
      console.log("Already at the first profile.");
      // onClose(); // Example: Close if tapping back on the first item
    }
  }, [currentIndex]); // Removed onClose from deps

  // Memoize the like handler to prevent ProfileCard re-renders if onLikeProfile is stable
  const handleLike = useCallback((profileId: string) => {
      console.log("Liked profile:", profileId);
      onLikeProfile(profileId);
      // Optional: Automatically advance to next profile after like?
      // handleNextProfile();
  }, [onLikeProfile]); // Removed handleNextProfile from deps


  // --- Render Logic ---
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ccc" />
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
              <View style={styles.header}>
                    {/* Progress Bars Area (empty state) */}
                    <View style={styles.progressContainer}></View>
                    <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
                        <Ionicons name="close" size={28} color="#ffffff" />
                    </Pressable>
              </View>
              <View style={styles.centered}>
                    <Text style={styles.endText}>No profiles to show.</Text>
                    <Pressable onPress={onClose} style={styles.simpleButton}>
                      <Text style={styles.simpleButtonText}>Go Back</Text>
                    </Pressable>
              </View>
         </View>
      </SafeAreaView>
    );
  }

   const isLastProfile = currentIndex >= profiles.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Progress Bars and Close Button */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {profiles.map((_, index) => (
              <View key={`progress-${index}`} style={styles.progressBarOuter}>
                <View
                  style={[
                    styles.progressBarInner,
                    { width: index < currentIndex ? '100%' : index === currentIndex ? '100%' : '0%' }, // Fill past/current
                    { backgroundColor: index <= currentIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)' } // Active/inactive color
                  ]}
                />
              </View>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.closeButton} hitSlop={15}>
             <Ionicons name="close" size={28} color="#ffffff" style={styles.closeIconShadow} />
          </Pressable>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
            {isLastProfile ? (
                <View style={styles.centered}>
                    <Text style={styles.endText}>That's everyone for now!</Text>
                     <Pressable onPress={onClose} style={styles.simpleButton}>
                      <Text style={styles.simpleButtonText}>Finish</Text>
                    </Pressable>
                </View>
            ) : (
                 <ProfileCard
                    // Use profile ID as key for efficient updates when index changes
                    key={profiles[currentIndex].id}
                    profile={profiles[currentIndex]}
                    onLike={handleLike}
                    isVisible={!isLastProfile} // Pass visibility status
                 />
            )}
        </View>


        {/* Navigation Overlays (only if not on the last profile message) */}
        {!isLastProfile && (
            <>
            <Pressable
                style={[styles.navOverlay, styles.navOverlayLeft]}
                onPress={handlePreviousProfile}
                // disabled={currentIndex === 0} // Disable visually if needed
            />
            <Pressable
                style={[styles.navOverlay, styles.navOverlayRight]}
                onPress={handleNextProfile}
                // disabled={currentIndex >= profiles.length - 1} // Disable visually if needed
            />
            </>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000', // Black background typical for story views
  },
  container: {
    flex: 1,
    position: 'relative', // Needed for absolute positioning of overlays/header
  },
  header: {
    position: 'absolute',
    top: 0, // Adjust if status bar is translucent or handled differently
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10, // Space from top edge
    paddingHorizontal: 10,
    zIndex: 20, // Ensure header is above content
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    height: 3, // Height of the progress bars
    marginRight: 15, // Space before close button
  },
  progressBarOuter: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Inactive bar background
    borderRadius: 1.5,
    marginHorizontal: 2, // Spacing between bars
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#ffffff', // Active bar color
    borderRadius: 1.5,
  },
  closeButton: {
    padding: 5, // Hit area padding
  },
  closeIconShadow: { // Add shadow to close icon for visibility
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  contentArea: {
      flex: 1,
      marginTop: 30, // Approximate space for header/progress bars - adjust as needed
      justifyContent: 'center', // Center content vertically if needed
      alignItems: 'center', // Center content horizontally if needed
  },
  navOverlay: {
    position: 'absolute',
    top: 40, // Start below header
    bottom: 0,
    width: '35%', // Wider tap area
    // backgroundColor: 'rgba(255, 0, 0, 0.1)', // DEBUG: Visualize tap areas
    zIndex: 10, // Above content card, below header
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
  },
  endText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
    simpleButton: {
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
    },
    simpleButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProfileStoryView;