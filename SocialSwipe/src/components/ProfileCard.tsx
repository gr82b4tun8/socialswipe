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
  isVisible?: boolean; // Changed to optional as it might not always be passed from ProfileScreen
  // --- ADDED: Callback for liking (assuming it's optional or handled differently in ProfileScreen context) ---
  onLike?: (profileId: string) => void;
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

// --- Dimensions ---
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
// Make card take almost full width (this is fine, affects horizontal space)
const cardWidth = screenWidth; // Use full width (or screenWidth - padding if needed)

// ****** MODIFICATION: Reduced carousel height ******
// Changed from 0.6 to 0.4 (or adjust as needed)
const carouselHeight = screenHeight * 0.4; // Example: 40% of screen height

// --- CarouselImageItem Component --- (Unchanged, includes error handling)
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
  React.useEffect(() => {
      // Only run if isVisible is explicitly provided (might not be from ProfileScreen)
      if (isVisible !== undefined) {
          if (isVisible) {
              setActiveIndex(0);
              // Scroll FlatList to start without animation if needed when visibility changes
              // flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
          }
          // Note: No 'else' block needed unless specific cleanup on becoming invisible is required
      } else {
          // Default behavior if isVisible is not provided: Set to 0 on mount/profile change
          setActiveIndex(0);
      }
  }, [isVisible, profile.id]); // Depend on isVisible (if provided) and profile ID

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


  // --- Double Tap Handler (Conditional based on onLike prop) ---
  const handleDoubleTap = useCallback(() => {
    if (onLike) { // Only trigger if onLike is provided
        // console.log(`Double Tapped profile: ${profile.first_name}`);
        onLike(profile.id);
        // Add visual feedback for like (e.g., heart animation) here if desired
    } else {
        // console.log("Double tap ignored, no onLike handler provided.");
    }
  }, [profile.id, onLike]);

  // --- Single Tap Handler (to detect double taps) ---
  const handleTap = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      handleDoubleTap();
      lastTap.current = null; // Reset tap tracking
    } else {
      // First tap (or tap after delay)
      lastTap.current = now;
      // Optional: Handle single tap (e.g., toggle UI) - currently does nothing extra
    }
  }, [handleDoubleTap]);


  const renderImageItem = useCallback(({ item: url }: { item: string }) => {
    return <CarouselImageItem url={url} />;
  }, []);

  // --- Render ---
  if (!profile) return null; // Handle case where profile might be null/undefined

  return (
    // Use Pressable only if interaction (like double-tap) is expected
    <Pressable onPress={onLike ? handleTap : undefined} style={styles.card} disabled={!onLike}>
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
                {/* Image Navigation (Chevrons & Dots) */}
                {images.length > 1 && (
                <>
                    {/* Chevrons */}
                    <Pressable
                      style={[styles.carouselControl, styles.carouselPrev]}
                      onPress={goToPrevImage}
                      disabled={activeIndex === 0}
                      hitSlop={10}
                    >
                      <Ionicons name="chevron-back-circle" size={36} color={activeIndex === 0 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow} />
                    </Pressable>
                    <Pressable
                      style={[styles.carouselControl, styles.carouselNext]}
                      onPress={goToNextImage}
                      disabled={activeIndex === images.length - 1}
                      hitSlop={10}
                    >
                      <Ionicons name="chevron-forward-circle" size={36} color={activeIndex === images.length - 1 ? "rgba(255, 255, 255, 0.4)" : "#fff"} style={styles.controlIconShadow}/>
                    </Pressable>

                    {/* Pagination Dots */}
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

        {/* Content Section */}
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
              {/* Consider adding numberOfLines={3} ellipsizeMode="tail" for long bios */}
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Interests</Text>
              <View style={styles.badgeContainer}>
                {/* Consider limiting the number of interests shown initially */}
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{interest}</Text>
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
    </Pressable> // End of main Pressable
  );
};

// --- Styles --- (Styles using carouselHeight will automatically adjust)
const styles = StyleSheet.create({
  card: {
    // flex: 1, // Removed flex: 1 to allow card to size naturally based on content
    backgroundColor: '#ffffff',
    // Adjusted width slightly to provide minimal horizontal padding if needed within ProfileScreen's layout
    width: screenWidth * 0.95, // Example: 95% of screen width
    alignSelf: 'center', // Center the card if its container allows
    // Removed margins, border radius - let the container handle it if needed
    overflow: 'hidden', // Keep content clipped
    marginBottom: 10, // Add some margin below the card if needed
    borderRadius: 12, // Added border radius for better visual separation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  // --- Image Area Styles ---
  carouselContainer: {
    height: carouselHeight, // *** Uses the modified constant ***
    width: '100%',
    backgroundColor: '#e0e0e0', // Placeholder background
    position: 'relative', // Needed for absolute positioning of controls
    // Add border radius to top corners if card has overall radius
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden', // Ensure image respects the radius
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    // No specific content style needed here usually
  },
  carouselItemContainer: {
    // Width should match the container's width (which is now 95% of screen)
     width: screenWidth * 0.95, // Match card width
    // width: cardWidth, // Original: used full screen width constant
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
    height: carouselHeight, // *** Uses the modified constant ***
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 12, // Match container
    borderTopRightRadius: 12,
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
    paddingTop: 15, // Keep top padding
    paddingBottom: 10, // Slightly reduce bottom padding if needed
  },
  nameAgeText: {
    fontSize: 22, // Slightly smaller
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10, // Slightly reduced margin
  },
  detailSection: {
    marginBottom: 10, // Slightly reduced margin
  },
  detailLabel: {
    fontSize: 13, // Slightly smaller
    fontWeight: '600',
    color: '#666',
    marginBottom: 4, // Slightly reduced margin
    textTransform: 'uppercase',
  },
  detailText: {
    fontSize: 15, // Slightly smaller
    color: '#444',
    marginBottom: 6, // Slightly reduced margin
    lineHeight: 20, // Adjust line height
  },
   detailTextValue: {
     fontSize: 15, // Slightly smaller
     color: '#444',
     lineHeight: 20, // Adjust line height
   },
  bioText: {
    fontSize: 15, // Slightly smaller
    color: '#444',
    lineHeight: 21, // Adjust line height
  },
  // --- Badge Styles --- (Adjusted slightly)
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2, // Add tiny margin top
  },
  badge: {
    backgroundColor: '#FFA07A',
    borderRadius: 15,
    paddingVertical: 5, // Slightly reduced vertical padding
    paddingHorizontal: 10, // Slightly reduced horizontal padding
    marginRight: 6,
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.00,
    elevation: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12, // Slightly smaller
    fontWeight: '600',
  },

  // --- Carousel Controls & Pagination Styles --- (Unchanged functionality)
  carouselControl: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    zIndex: 10,
  },
  carouselPrev: { left: 8 }, // Adjusted slightly for card padding
  carouselNext: { right: 8 }, // Adjusted slightly for card padding
  controlIconShadow: {
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 8, // Adjusted slightly
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    zIndex: 10,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Increased visibility slightly
    marginHorizontal: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.3)', // Slightly darker border
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.0)',
  },
});

// Memoize for performance, especially useful if props like `isVisible` change often
export default React.memo(ProfileCard);