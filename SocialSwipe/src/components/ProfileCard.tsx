// src/components/ProfileCard.tsx
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  ActivityIndicator,
  GestureResponderEvent, // Import this type
} from "react-native";
import { differenceInYears } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

// --- Profile Interface --- (Assuming this is defined elsewhere or keep it here)
export interface Profile { // Make sure to export if needed elsewhere
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name?: string | null;
  date_of_birth: string;
  gender: string;
  bio?: string | null;
  interests?: string[] | null;
  location?: string | null;
  looking_for?: string | null;
  profile_pictures?: string[] | null;
}

interface ProfileCardProps {
  profile: Profile;
  isVisible: boolean; // Added to potentially optimize rendering/state updates
  // --- ADDED: Callback for liking ---
  onLike: (profileId: string) => void;
}

// --- calculateAge Function --- (Unchanged)
const calculateAge = (dobString: string): number | null => {
  try {
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) {
      console.warn("Invalid date of birth received:", dobString);
      return null;
    }
    return differenceInYears(new Date(), dob);
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
};

// --- Dimensions --- (Unchanged)
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
// Make card take almost full width for story view
const cardWidth = screenWidth; // Use full width
// Adjust height based on screen, leave space for nav/status bars and profile info
const carouselHeight = screenHeight * 0.6; // Example: 60% of screen height

// --- CarouselImageItem Component --- (Unchanged, but consider error handling/placeholder)
interface CarouselImageItemProps { url: string; }
const CarouselImageItem: React.FC<CarouselImageItemProps> = ({ url }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  return (
    <View style={styles.carouselItemContainer}>
      {isLoading && !hasError && (<ActivityIndicator style={StyleSheet.absoluteFill} size="large" color="#cccccc" />)}
      <Image
          source={{ uri: url }}
          style={styles.carouselImage}
          resizeMode="cover"
          onLoadStart={() => { setIsLoading(true); setHasError(false); }}
          onLoadEnd={() => setIsLoading(false)}
          onError={(error) => {
              setIsLoading(false);
              setHasError(true);
              console.warn("Failed to load image:", url, error.nativeEvent?.error);
          }}
      />
      {hasError && (
          <View style={[StyleSheet.absoluteFill, styles.imageErrorOverlay]}>
              <Ionicons name="alert-circle-outline" size={40} color="#fff" />
              <Text style={styles.imageErrorText}>Image Error</Text>
          </View>
      )}
    </View>
  );
};

// --- ProfileCard Component ---
const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onLike, isVisible }) => {
  const age = calculateAge(profile.date_of_birth);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // State for double tap
  const lastTap = useRef<number | null>(null);
  const DOUBLE_PRESS_DELAY = 300; // milliseconds

  // Use profile pictures safely
  const images = Array.isArray(profile.profile_pictures) ? profile.profile_pictures : [];

  // Reset active index if visibility changes (e.g., navigating between profiles)
  // Avoids showing the wrong image index when swiping quickly
  React.useEffect(() => {
      if (isVisible) {
          setActiveIndex(0);
          // Scroll FlatList to start without animation if needed
          // flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
  }, [isVisible, profile.id]); // Depend on isVisible and profile ID

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    // Add a small tolerance to handle floating point inaccuracies
    const index = Math.round(scrollPosition / cardWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  // Functions to navigate images within the *current* profile card
  const goToPrevImage = useCallback(() => {
    if (activeIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: activeIndex - 1, animated: true });
    }
  }, [activeIndex]);

  const goToNextImage = useCallback(() => {
    if (activeIndex < images.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [activeIndex, images.length]);


  // --- ADDED: Double Tap Handler ---
  const handleDoubleTap = useCallback(() => {
    // console.log(`Double Tapped profile: ${profile.first_name}`);
    onLike(profile.id);
    // Add visual feedback for like (e.g., heart animation) here if desired
  }, [profile.id, onLike]);

  // --- ADDED: Single Tap Handler (to detect double taps) ---
  const handleTap = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      handleDoubleTap();
      lastTap.current = null; // Reset tap tracking
    } else {
      // First tap (or tap after delay)
      lastTap.current = now;

      // Optional: Handle single tap for other actions if needed,
      // e.g., toggle UI elements. For now, it just registers for double tap.
      // const tapX = event.nativeEvent.locationX;
      // console.log("Single Tap registered at X:", tapX);
    }
  }, [handleDoubleTap]); // Include handleDoubleTap in dependencies


  const renderImageItem = useCallback(({ item: url }: { item: string }) => {
    return <CarouselImageItem url={url} />;
  }, []);

  // --- Render ---
  if (!profile) return null; // Handle case where profile might be null/undefined

  return (
    // Pressable container for double-tap detection
    <Pressable onPress={handleTap} style={styles.card}>
        {/* Image Section */}
        <View style={styles.carouselContainer}>
            {images.length > 0 ? (
            <>
                <FlatList
                ref={flatListRef}
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(item, index) => `${profile.id}-img-${index}`} // More unique key
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16} // Keep for smooth index updates
                style={styles.flatList}
                contentContainerStyle={styles.flatListContent}
                getItemLayout={(data, index) => ({
                    length: cardWidth,
                    offset: cardWidth * index,
                    index,
                })}
                bounces={false}
                // Optimization: Only render items near the viewport
                initialNumToRender={1}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={true} // Can improve performance but use with caution
                />
                {/* Image Navigation (Keep Chevrons or rely on taps/dots) */}
                {images.length > 1 && (
                <>
                    {/* Keep these controls for explicit image navigation */}
                    <Pressable
                      style={[styles.carouselControl, styles.carouselPrev]}
                      onPress={goToPrevImage} // Use specific image nav function
                      disabled={activeIndex === 0}
                      hitSlop={10} // Easier to tap
                    >
                      <Ionicons name="chevron-back-circle" size={36} color={activeIndex === 0 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow} />
                    </Pressable>
                    <Pressable
                      style={[styles.carouselControl, styles.carouselNext]}
                      onPress={goToNextImage} // Use specific image nav function
                      disabled={activeIndex === images.length - 1}
                      hitSlop={10} // Easier to tap
                    >
                      <Ionicons name="chevron-forward-circle" size={36} color={activeIndex === images.length - 1 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow}/>
                    </Pressable>

                    {/* Pagination Dots for Images */}
                    <View style={styles.paginationContainer}>
                    {images.map((_, index) => (
                        <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeIndex === index ? styles.paginationDotActive : {},
                        ]}
                        />
                    ))}
                    </View>
                </>
                )}
            </>
            ) : (
            <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={60} color="#ccc" />
                <Text style={styles.imagePlaceholderText}>No profile pictures</Text>
            </View>
            )}
        </View>

        {/* Content Section - Consider placing outside Pressable if taps interfere */}
        {/* For now, keeping it inside; taps on text usually don't trigger container */}
        <View style={styles.content}>
          <Text style={styles.nameAgeText}>
            {profile.first_name}
            {age !== null ? `, ${age}` : ""}
          </Text>
          {/* Conditionally render details only if they exist */}
          {profile.gender && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Gender:</Text> {profile.gender}
            </Text>
          )}
          {profile.location && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Location:</Text> {profile.location}
            </Text>
          )}
          {profile.bio && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>About Me</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Interests</Text>
              <View style={styles.badgeContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.badge}>
                    {/* Use actual interest text if short, or keep initial */}
                    <Text style={styles.badgeText}>{interest}</Text>
                    {/* <Text style={styles.badgeText}>{interest.charAt(0).toUpperCase()}</Text> */}
                  </View>
                ))}
              </View>
            </View>
          )}
          {profile.looking_for && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Looking For</Text>
              <Text style={styles.detailTextValue}>{profile.looking_for}</Text>
            </View>
          )}
        </View>
    </Pressable> // End of main Pressable for double-tap
  );
};

// --- Styles --- (Adjusted for full-width card and potentially larger content)
const styles = StyleSheet.create({
  card: {
    flex: 1, // Make card fill its container (important for story view)
    backgroundColor: '#ffffff',
    // Removed margins, border radius - let the container handle it
    width: cardWidth, // Takes full width passed by FlatList/View
    overflow: 'hidden', // Keep content clipped
  },
  // --- Image Area Styles ---
  carouselContainer: {
    height: carouselHeight,
    width: '100%',
    backgroundColor: '#e0e0e0', // Placeholder background
    position: 'relative', // Needed for absolute positioning of controls
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    // No specific content style needed here usually
  },
  carouselItemContainer: {
    width: cardWidth, // Each item takes full width
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9e9e9',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    height: carouselHeight,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    marginTop: 10,
    color: '#b0b0b0',
    fontSize: 16,
  },
  imageErrorOverlay: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  imageErrorText: {
    color: "#fff",
    fontWeight: "bold",
    marginTop: 5,
  },

  // --- Content Area Styles ---
  content: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    // Removed fixed height, let content determine size
  },
  nameAgeText: {
    fontSize: 24, // Slightly larger
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666', // Slightly lighter
    marginBottom: 5,
    textTransform: 'uppercase', // Style preference
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
    lineHeight: 22,
  },
   detailTextValue: {
     fontSize: 16,
     color: '#444',
     lineHeight: 22,
   },
  bioText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 23,
  },
  // --- Badge Styles --- (Adjusted for potentially longer text)
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#FFA07A', // Light Salmon - adjust color
    borderRadius: 15, // Keep rounded
    paddingVertical: 6,
    paddingHorizontal: 12, // Allow more space for text
    marginRight: 8,
    marginBottom: 8,
    // Removed fixed height/width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600', // Slightly less bold
  },

  // --- Carousel Controls & Pagination Styles ---
  carouselControl: {
    position: 'absolute',
    top: '50%',
    marginTop: -18, // Adjust based on icon size
    // Removed background for cleaner look
    zIndex: 10, // Ensure controls are above image
  },
  carouselPrev: { left: 5 }, // Closer to edge
  carouselNext: { right: 5 }, // Closer to edge
  controlIconShadow: { // Add subtle shadow to icons for visibility
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10, // Position dots above content
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center', // Center dots horizontally
    alignItems: 'center',
    // Removed dark background, dots might need more contrast now
    paddingVertical: 5,
    zIndex: 10,
  },
  paginationDot: {
    width: 7, // Slightly smaller dots
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white
    marginHorizontal: 4,
    // Add a subtle border for better visibility on light images
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  paginationDotActive: {
    backgroundColor: '#ffffff', // Solid white for active
    width: 8, // Slightly larger active dot
    height: 8,
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.0)', // Remove border for active
  },
});

export default React.memo(ProfileCard); // Memoize for performance if props don't change often