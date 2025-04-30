// BusinessProfileCard.tsx
import React, { useState, useEffect, useCallback } from 'react'; // <-- Added useEffect, useCallback
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    LayoutAnimation,
    UIManager,
    ImageBackground,
    Pressable, // <--- ***** ADD THIS IMPORT *****
    NativeSyntheticEvent, // <--- ***** ADD THIS IMPORT *****
    NativeTouchEvent,     // <--- ***** ADD THIS IMPORT *****
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';

// --- Define Business Listing Type (Keep as is) ---
export interface BusinessListing {
    id: string;
    manager_user_id: string;
    business_name?: string;
    description?: string;
    category?: string;
    address_street?: string;
    address_city?: string;
    address_state?: string;
    address_postal_code?: string;
    address_country?: string;
    phone_number?: string;
    website?: string;
    listing_photos?: string[]; // Array of photo URLs
}

// --- Business Profile Card Props (Keep as is) ---
interface BusinessProfileCardProps {
    listing: BusinessListing | null;
    onLikeBusiness: () => void;
    onDismissBusiness: () => void;
}

// Enable LayoutAnimation for Android (Keep as is)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constants (Keep as is, add TAP_AREA_WIDTH) ---
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;
const ROTATION_DEG = 15;
const TAP_AREA_WIDTH_PERCENTAGE = 0.3; // 30% of the card width for prev/next tap areas
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

// --- Business Profile Card Component ---
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // --- ***** NEW STATE for Photo Index ***** ---
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // --- Extract photos and determine if multiple exist ---
    const photos = listing?.listing_photos?.filter(Boolean) ?? []; // Ensure array and filter out empty strings/nulls
    const hasMultiplePhotos = photos.length > 1;
    const fallbackImageUrl = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image';
    const currentImageUrl = photos[currentPhotoIndex] || fallbackImageUrl;

    // --- ***** NEW EFFECT to Reset Index on Listing Change ***** ---
    useEffect(() => {
        // When the listing changes (identified by ID), reset the photo index
        setCurrentPhotoIndex(0);
        // Also reset details visibility if desired
        // if (showDetails) {
        //   setShowDetails(false); // Optionally hide details when card changes
        // }
    }, [listing?.id]); // Depend on listing ID

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    // --- Gesture Handler (Keep as is) ---
    type AnimatedGHContext = { startX: number; startY: number; };
    const gestureHandler = useAnimatedGestureHandler<
        PanGestureHandlerGestureEvent,
        AnimatedGHContext
    >({
        onStart: (_, ctx) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            // Allow swipe only if not tapping on details or other interactive elements at the bottom?
            // For now, assume swipe takes priority if initiated
            translateX.value = ctx.startX + event.translationX;
            translateY.value = ctx.startY + event.translationY * 0.1; // Less vertical movement effect
        },
        onEnd: (event) => {
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                const direction = Math.sign(translateX.value);
                const targetX = direction * screenWidth * 1.5; // Swipe off screen
                translateX.value = withSpring(
                    targetX,
                    SPRING_CONFIG,
                    (finished) => {
                        if (finished) {
                            // IMPORTANT: Use runOnJS for state updates / navigation from worklet
                            if (direction > 0) { runOnJS(onLikeBusiness)(); }
                            else { runOnJS(onDismissBusiness)(); }
                            // Reset position values for the *next* card animation, AFTER swipe action
                            // runOnJS(() => {
                            //   translateX.value = 0; // Resetting here might cause flicker if next card appears instantly
                            //   translateY.value = 0;
                            // });
                        }
                    }
                );
                // Less pronounced vertical movement on swipe out
                translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG);
            } else {
                // Snap back to center
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        },
    });

    // --- Animated Style (Keep as is) ---
    const animatedCardStyle = useAnimatedStyle(() => {
        const rotateZ = interpolate(
            translateX.value,
            [-screenWidth / 2, 0, screenWidth / 2],
            [-ROTATION_DEG, 0, ROTATION_DEG],
            Extrapolate.CLAMP
        );
       const opacity = interpolate(
            Math.abs(translateX.value),
            [0, SWIPE_THRESHOLD * 1.5], // Start fading slightly before full swipe threshold
            [1, 0.7], // Fade out as it swipes
            Extrapolate.CLAMP
        );
        return {
            opacity,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value },
                { rotateZ: `${rotateZ}deg` },
            ],
        };
    });

    // --- ***** NEW Photo Navigation Handlers ***** ---
    const handleNextPhoto = useCallback(() => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(prevIndex => prevIndex + 1);
        }
        // Optional: If you want to loop back to the start after the last photo
        // else {
        //     setCurrentPhotoIndex(0);
        // }
    }, [currentPhotoIndex, photos.length]);

    const handlePreviousPhoto = useCallback(() => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prevIndex => prevIndex - 1);
        }
        // Optional: If you want to loop back to the end from the first photo
        // else {
        //     setCurrentPhotoIndex(photos.length - 1);
        // }
    }, [currentPhotoIndex]);

    // --- ***** NEW Tap Handler ***** ---
     const handlePhotoTap = useCallback((event: NativeSyntheticEvent<NativeTouchEvent>) => {
        // Only allow tapping if there are multiple photos
        if (!hasMultiplePhotos) return;

        const tapX = event.nativeEvent.locationX;
        const cardWidth = styles.cardContentContainer.width ?? screenWidth * 0.9; // Approximate width if not available
        const tapAreaWidth = cardWidth * TAP_AREA_WIDTH_PERCENTAGE;

        if (tapX < tapAreaWidth) {
            // Tap on left side
            handlePreviousPhoto();
        } else if (tapX > cardWidth - tapAreaWidth) {
            // Tap on right side
            handleNextPhoto();
        } else {
            // Tap in the middle (optional: could trigger details toggle or do nothing)
            // console.log("Middle tap");
             toggleDetails(); // Example: Toggle details on middle tap
        }
    }, [hasMultiplePhotos, handlePreviousPhoto, handleNextPhoto, toggleDetails]); // Added toggleDetails dependency

    if (!listing) {
        return null; // Render nothing if no listing data
    }

    // --- Calculations (Keep as is) ---
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');
    // primaryImageUrl is replaced by currentImageUrl
    const fullAddress = [
        listing.address_street,
        listing.address_city,
        listing.address_state,
        listing.address_postal_code,
        listing.address_country
    ].filter(Boolean).join(', ');
    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress || listing.category;


    return (
        <PanGestureHandler onGestureEvent={gestureHandler} failOffsetY={[-5, 5]} activeOffsetX={[-5, 5]}>
            <Animated.View style={[styles.animatedWrapper, animatedCardStyle]}>
                {/* Main Card Structure */}
                <View style={styles.cardOuterContainer}>
                    <View style={styles.cardContentContainer} collapsable={false}>
                        <ImageBackground
                            source={{ uri: currentImageUrl }} // <--- ***** USE CURRENT IMAGE URL *****
                            style={styles.imageBackground}
                            resizeMode="cover"
                            onError={(error) => {
                                console.warn(`Image load error for listing ${listing.id} (URL: ${currentImageUrl}): ${error.nativeEvent.error}`);
                                // Potential: Fallback state if primary image fails?
                            }}
                        >
                            {/* --- ***** NEW Progress Bars (Only if multiple photos) ***** --- */}
                            {hasMultiplePhotos && (
                                <View style={styles.progressBarsContainer}>
                                    {photos.map((_, index) => (
                                        <View
                                            key={`progress-${index}`}
                                            style={[
                                                styles.progressBar,
                                                index === currentPhotoIndex ? styles.progressBarActive : styles.progressBarInactive,
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}

                             {/* --- ***** NEW Pressable Area for Photo Tapping ***** --- */}
                            {/* This Pressable covers the image area to detect taps for photo navigation */}
                             {/* It needs to be rendered *before* the gradient/text so taps go through */}
                            <Pressable
                                style={styles.photoTapArea}
                                onPress={handlePhotoTap}
                                // disabled={!hasMultiplePhotos} // Disable if only one photo
                             >
                                 {/* This Pressable is transparent and just handles taps */}
                             </Pressable>


                            {/* Title Row - Positioned absolutely at the top */}
                             <View style={styles.titleRow}>
                                 <Text style={styles.title} numberOfLines={2}>{listing.business_name || 'Unnamed Business'}</Text>
                             </View>

                            {/* Gradient Overlay for Text Readability at the Bottom */}
                            <View style={styles.gradientOverlay}>
                                <View style={styles.contentOverlay}>
                                    {/* Location Info */}
                                    {formattedLocation ? (
                                        <View style={styles.infoRow}>
                                            <Feather name="map-pin" size={14} color="#FFFFFFCC" style={styles.icon} />
                                            <Text style={styles.infoText} numberOfLines={1}>
                                                {formattedLocation}
                                            </Text>
                                        </View>
                                    ) : null}

                                    {/* Category Badge */}
                                    {listing.category ? (
                                        <View style={styles.badgeRow}>
                                            <View style={[styles.badge, styles.categoryBadge]}>
                                                <Text style={styles.categoryBadgeText}>{listing.category}</Text>
                                            </View>
                                        </View>
                                    ) : <View style={{ marginBottom: 15 }} />} {/* Placeholder for spacing if no category */}


                                    {/* Details Toggle Section (Below category/info, above buttons) */}
                                     {hasDetailsToShow && (
                                        <View style={styles.detailsToggleSection}>
                                            <TouchableOpacity onPress={toggleDetails} style={styles.detailsButton}>
                                                <Text style={styles.detailsButtonText}>
                                                    {showDetails ? "Hide Details" : "Show Details"}
                                                </Text>
                                                <Feather
                                                    name={showDetails ? "chevron-up" : "chevron-down"}
                                                    size={20}
                                                    color="#FFFFFF"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                     )}
                                </View>
                            </View>

                            {/* Action Buttons - Still absolutely positioned WITHIN ImageBackground */}
                             {/* Ensure these are rendered *after* the Pressable tap area if zIndex isn't enough */}
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.skipButton]}
                                    onPress={() => {
                                        // Animate out left
                                        translateX.value = withSpring(-screenWidth * 1.5, SPRING_CONFIG, (finished) => {
                                            if(finished) runOnJS(onDismissBusiness)();
                                        });
                                        translateY.value = withSpring(0, SPRING_CONFIG); // Keep vertical aligned or add slight movement
                                    }}
                                >
                                    <Ionicons name="close" size={32} color="#F15A6A" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.likeButton]}
                                     onPress={() => {
                                        // Animate out right
                                        translateX.value = withSpring(screenWidth * 1.5, SPRING_CONFIG, (finished) => {
                                             if(finished) runOnJS(onLikeBusiness)();
                                        });
                                         translateY.value = withSpring(0, SPRING_CONFIG); // Keep vertical aligned or add slight movement
                                    }}
                                >
                                    <Ionicons name="heart" size={30} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground> {/* End ImageBackground */}
                    </View> {/* End cardContentContainer */}

                    {/* Collapsible Details Section (BELOW the image part) */}
                    {showDetails && hasDetailsToShow && (
                        <ScrollView
                            style={styles.detailsContainer}
                            nestedScrollEnabled={true} // Important for scrollable content within PanGestureHandler
                        >
                             {/* Description / Phone / Address ... */}
                             {listing.description ? (
                                 <View style={styles.detailsBlock}>
                                     <Text style={styles.detailsHeading}>Description</Text>
                                     <Text style={styles.detailsDescription}>{listing.description}</Text>
                                 </View>
                             ) : null }
                             {listing.phone_number ? (
                                 <View style={styles.detailsBlock}>
                                     <Text style={styles.detailsHeading}>Phone</Text>
                                     <View style={styles.detailsInfoRow}>
                                         <Feather name="phone" size={16} color="#555" style={styles.iconDetails} />
                                         <Text style={styles.detailsInfoText}>{listing.phone_number}</Text>
                                     </View>
                                 </View>
                             ) : null }
                             {fullAddress ? (
                                 <View style={styles.detailsBlock}>
                                     <Text style={styles.detailsHeading}>Address</Text>
                                     <View style={styles.detailsInfoRow}>
                                         <Feather name="map-pin" size={16} color="#555" style={styles.iconDetails} />
                                         <Text style={styles.detailsInfoText}>{fullAddress}</Text>
                                     </View>
                                 </View>
                             ) : null }
                        </ScrollView>
                    )}
                </View> {/* End cardOuterContainer */}
            </Animated.View>
        </PanGestureHandler>
    );
};

// --- Styles (ADD new styles, MODIFY existing ones) ---
const styles = StyleSheet.create({
    animatedWrapper: { // This wrapper handles the swipe animation
        flex: 1, // Take up available space in the parent container
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'lightblue', // For debugging layout
    },
     cardOuterContainer: { // New container to hold both image+overlay and details section
         width: '100%',
         height: '100%',
         borderRadius: 12, // Apply border radius here
         overflow: 'hidden', // Clip children (details section)
         backgroundColor: '#FFFFFF', // Background for the details section area
         shadowColor: '#000',
         shadowOffset: { width: 0, height: 2 },
         shadowOpacity: 0.2,
         shadowRadius: 5,
         elevation: 4,
         flexDirection: 'column', // Stack image part and details part vertically
     },
    cardContentContainer: { // Renamed from original cardContentContainer, now holds only image part
        flex: 1, // Takes remaining space when details are shown/hidden
        // Removed borderRadius, overflow, shadow, elevation - moved to cardOuterContainer
        // Removed backgroundColor, now transparent to show ImageBackground
        position: 'relative', // Needed for absolute positioning of children
        // backgroundColor: 'lightcoral', // For debugging layout
    },
    imageBackground: {
        flex: 1, // Fill the cardContentContainer
        width: '100%',
        justifyContent: 'flex-end', // Aligns gradient/text/buttons to bottom by default
        position: 'relative', // Needed for absolute positioning children like progress bars / tap area
    },
    // --- ***** NEW Styles for Progress Bars ***** ---
    progressBarsContainer: {
        position: 'absolute',
        top: 8, // Position from the top of the imageBackground
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between', // Or 'flex-start'
        alignItems: 'center',
        height: 4, // Height of the bars
        paddingHorizontal: 4, // Small padding inside the container
        zIndex: 10, // Ensure bars are on top
    },
    progressBar: {
        flex: 1, // Each bar takes equal space
        height: '100%',
        borderRadius: 2,
        marginHorizontal: 2, // Spacing between bars
    },
    progressBarActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Active bar color
    },
    progressBarInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)', // Inactive bar color
    },
    // --- ***** NEW Style for Tap Area ***** ---
    photoTapArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, // Cover the entire ImageBackground area
        // backgroundColor: 'rgba(255, 0, 0, 0.2)', // DEBUG: Make tap area visible
        zIndex: 1, // Above image, below progress bars and potentially below text/buttons
    },
    // --- Title Row Styles (Adjusted positioning/padding) ---
    titleRow: {
        position: 'absolute',
        top: 0, // Align to top
        left: 0,
        right: 0,
        paddingTop: 20, // More padding from top (below progress bars)
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 5, // Above tap area, below progress bars
        // Optional: Add a subtle gradient/scrim if text clashes with bright image tops
         // backgroundColor: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0))', // CSS syntax, need alternative for RN
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    // --- Gradient and Content Overlay (Keep as is or adjust padding) ---
    gradientOverlay: {
        // Use a real gradient component if needed, or adjust background color
         backgroundColor: 'rgba(0, 0, 0, 0.4)', // Simple dark overlay at bottom
        paddingTop: 10, // Space above the content inside the gradient
        paddingBottom: 80, // Ample space above action buttons
        zIndex: 5, // Ensure it's above tap area
    },
    contentOverlay: {
        paddingHorizontal: 16,
        // backgroundColor: 'rgba(0, 255, 0, 0.2)', // DEBUG: Content overlay area
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#FFFFFFCC',
        marginLeft: 6,
        flex: 1, // Prevent long text overflowing
    },
    icon: { /* Style as needed */ },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15, // Spacing below badges
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
    },
     detailsToggleSection: {
         // Removed marginTop: 10 - handled by spacing in contentOverlay/gradientOverlay
         alignItems: 'flex-start',
     },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5, // Make it easier to tap
    },
    detailsButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 5,
    },
    // --- Details Section Styles (Adjusted maxHeight, borders) ---
    detailsContainer: {
        // This container appears *below* the cardContentContainer (Image part)
        // width: '100%', // Inherits width from cardOuterContainer
        maxHeight: screenHeight * 0.25, // Limit height
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1, // Separator line
        borderTopColor: '#E0E0E0',
        // backgroundColor: '#FFFFFF', // Set on cardOuterContainer now
        flexGrow: 0, // Don't allow it to grow beyond content
        flexShrink: 1, // Allow it to shrink if needed
    },
    detailsBlock: { marginBottom: 15, },
    detailsHeading: {
        fontSize: 13, fontWeight: 'bold', color: '#888',
        textTransform: 'uppercase', marginBottom: 5,
    },
    detailsDescription: { fontSize: 15, color: '#333', lineHeight: 22, },
    detailsInfoRow: { flexDirection: 'row', alignItems: 'flex-start', },
    iconDetails: { marginRight: 10, marginTop: 2, color: '#555', width: 16, },
    detailsInfoText: { fontSize: 14, color: '#555', flex: 1, lineHeight: 20, },
    // --- Action Buttons (Keep as is, check zIndex if needed) ---
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 20, left: 0, right: 0, zIndex: 6, // Ensure buttons are above gradient/tap area
        flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
    },
    actionButton: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
    },
    skipButton: { /* Specific styles if needed */ },
    likeButton: { backgroundColor: '#4CAF50', }, // Example Like button color
});

export default BusinessProfileCard;