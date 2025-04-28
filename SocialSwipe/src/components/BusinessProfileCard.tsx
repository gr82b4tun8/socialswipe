// BusinessProfileCard.tsx
import React, { useState } from 'react';
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
    // ADDED: For screen width calculation
    // Dimensions is already imported, we'll use it below
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
// --- ADDED IMPORTS ---
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedGestureHandler,
    withSpring,
    interpolate,
    Extrapolate,
    runOnJS, // To call JS functions from worklet
} from 'react-native-reanimated';
// --- END ADDED IMPORTS ---


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
    listing_photos?: string[];
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

// --- ADDED CONSTANTS ---
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3; // Trigger action after swiping 30% of screen width
const ROTATION_DEG = 15; // Max rotation in degrees
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};
// --- END ADDED CONSTANTS ---

// --- Business Profile Card Component ---
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    // --- ADDED REANIMATED VALUES ---
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0); // Optional: for a slight vertical movement on swipe
    // --- END ADDED REANIMATED VALUES ---

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    // --- ADDED GESTURE HANDLER ---
    type AnimatedGHContext = {
        startX: number;
        startY: number;
    };
    const gestureHandler = useAnimatedGestureHandler<
        PanGestureHandlerGestureEvent,
        AnimatedGHContext
    >({
        onStart: (_, ctx) => {
            ctx.startX = translateX.value;
            ctx.startY = translateY.value; // Store starting Y position
        },
        onActive: (event, ctx) => {
            translateX.value = ctx.startX + event.translationX;
            // Optional: Add slight vertical movement tied to horizontal swipe
            translateY.value = ctx.startY + event.translationY * 0.1; // Dampen vertical movement
        },
        onEnd: (event) => {
            // Check if swipe distance exceeds threshold
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                // Determine swipe direction
                const direction = Math.sign(translateX.value);
                const targetX = direction * screenWidth * 1.5; // Move card off-screen

                // Animate off-screen and trigger action
                translateX.value = withSpring(
                    targetX,
                    SPRING_CONFIG,
                    (finished) => {
                        if (finished) {
                            // IMPORTANT: Use runOnJS to call props from the UI thread
                            if (direction > 0) { // Swiped right (Like)
                                runOnJS(onLikeBusiness)();
                            } else { // Swiped left (Dismiss)
                                runOnJS(onDismissBusiness)();
                            }
                        }
                    }
                );
                // Also animate Y off-screen if you added vertical movement
                 translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG); // Follow swipe direction slightly

            } else {
                // Animate back to center if threshold not met
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG); // Return Y to center
            }
        },
    });
    // --- END ADDED GESTURE HANDLER ---

    // --- ADDED ANIMATED STYLE ---
    const animatedCardStyle = useAnimatedStyle(() => {
        // Interpolate rotation based on horizontal translation
        const rotateZ = interpolate(
            translateX.value,
            [-screenWidth / 2, 0, screenWidth / 2],
            [-ROTATION_DEG, 0, ROTATION_DEG],
            Extrapolate.CLAMP // Don't rotate more than ROTATION_DEG
        );

        // Interpolate opacity (fade out slightly when swiping away)
        const opacity = interpolate(
             Math.abs(translateX.value),
             [0, SWIPE_THRESHOLD * 1.5], // Start fading after threshold / 2
             [1, 0.7], // Fade from 1 to 0.7
             Extrapolate.CLAMP
         );

        return {
            opacity,
            transform: [
                { translateX: translateX.value },
                { translateY: translateY.value }, // Apply vertical translation
                { rotateZ: `${rotateZ}deg` }, // Apply rotation
            ],
        };
    });
    // --- END ADDED ANIMATED STYLE ---


    if (!listing) {
        return null; // Or a placeholder/loading state
    }

    // --- Keep existing calculations ---
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');
    const primaryImageUrl = listing.listing_photos?.[0];
    const fallbackImageUrl = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image';
    const fullAddress = [
        listing.address_street,
        listing.address_city,
        listing.address_state,
        listing.address_postal_code,
        listing.address_country
    ].filter(Boolean).join(', ');
    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress || listing.category;
    // --- End existing calculations ---

    return (
        // --- WRAP with PanGestureHandler ---
        <PanGestureHandler onGestureEvent={gestureHandler}>
            {/* --- WRAP ImageBackground and its content with Animated.View --- */}
            <Animated.View style={[styles.animatedWrapper, animatedCardStyle]}>
                {/* Container for the card content excluding details */}
                <View style={styles.cardContentContainer}>
                    <ImageBackground
                        source={{ uri: primaryImageUrl || fallbackImageUrl }}
                        style={styles.imageBackground}
                        resizeMode="cover"
                        onError={(error) => {
                            console.warn(`Image load error for listing ${listing.id} (URL: ${primaryImageUrl || fallbackImageUrl}): ${error.nativeEvent.error}`);
                        }}
                    >
                        {/* Content that overlays the image */}
                        <View style={styles.gradientOverlay}>
                            <View style={styles.contentOverlay}>
                                {/* Title Row */}
                                <View style={styles.titleRow}>
                                    <Text style={styles.title} numberOfLines={2}>{listing.business_name || 'Unnamed Business'}</Text>
                                </View>

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
                                ) : <View style={{ marginBottom: 15 }} /> /* Add margin if no badge */}


                                {/* Details Toggle Section */}
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
                        <View style={styles.actionButtonsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.skipButton]}
                                onPress={onDismissBusiness} // Kept original onPress
                            >
                                <Ionicons name="close" size={32} color="#F15A6A" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.likeButton]}
                                onPress={onLikeBusiness} // Kept original onPress
                            >
                                <Ionicons name="heart" size={30} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                    </ImageBackground> {/* End ImageBackground */}
                </View>

                {/* --- Collapsible Details Section - Remains OUTSIDE the Animated.View --- */}
                 {/* NOTE: If showDetails is true, this appears BELOW the swipable card */}
                {showDetails && (
                    <ScrollView style={styles.detailsContainer}
                        nestedScrollEnabled={true}
                    >
                        {/* Description */}
                        {listing.description ? (
                            <View style={styles.detailsBlock}>
                                <Text style={styles.detailsHeading}>Description</Text>
                                <Text style={styles.detailsDescription}>{listing.description}</Text>
                            </View>
                        ) : null }
                        {/* Phone */}
                        {listing.phone_number ? (
                            <View style={styles.detailsBlock}>
                                <Text style={styles.detailsHeading}>Phone</Text>
                                <View style={styles.detailsInfoRow}>
                                    <Feather name="phone" size={16} color="#555" style={styles.iconDetails} />
                                    <Text style={styles.detailsInfoText}>{listing.phone_number}</Text>
                                </View>
                            </View>
                        ) : null }
                        {/* Address */}
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
            {/* --- END WRAP Animated.View --- */}
            </Animated.View>
        {/* --- END WRAP PanGestureHandler --- */}
        </PanGestureHandler>
    );
};

// --- Styles --- (Modify and Add)
// const { height: screenHeight } = Dimensions.get('window'); // Already defined above

const styles = StyleSheet.create({
    // --- ADDED STYLES ---
    animatedWrapper: {
        flex: 1, // Takes available space until details are shown
        // We apply transforms here, so no need for position: 'absolute' on the wrapper itself
        // The shadow/elevation might be better applied here if needed globally for the animated part
    },
    cardContentContainer: {
        flex: 1, // Make this container fill the animated wrapper
        borderRadius: 16, // Apply border radius here
        overflow: 'hidden', // Clip the ImageBackground to the rounded corners
        backgroundColor: '#E0E0E0', // Background color for loading/fallback
        shadowColor: '#000', // Optional: Add shadow to the card itself
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    // --- END ADDED STYLES ---

    // --- MODIFIED/KEPT STYLES ---
    container: { // This style is no longer used directly on the root View, but keep it for potential future use? Or remove.
        flex: 1,
        // borderRadius: 16, // Moved to cardContentContainer
        // overflow: 'hidden', // Moved to cardContentContainer
        // backgroundColor: '#E0E0E0', // Moved to cardContentContainer
        flexDirection: 'column', // Important for layout with details below
    },
    imageBackground: {
        flex: 1, // Take up all space within cardContentContainer
        width: '100%',
        justifyContent: 'flex-end',
        // backgroundColor: '#E0E0E0', // Set on cardContentContainer instead
        position: 'relative', // Keep for absolute positioning of buttons inside
    },
    // Keep all other styles as they were: gradientOverlay, contentOverlay, titleRow, title, infoRow, infoText, icon, badgeRow, badge, categoryBadge, categoryBadgeText, detailsToggleSection, detailsButton, detailsButtonText, actionButtonsContainer, actionButton, skipButton, likeButton

     gradientOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingTop: 40,
        paddingBottom: 80, // Ensure enough space above buttons
    },
    contentOverlay: {
        paddingHorizontal: 16,
    },
    titleRow: {
        marginBottom: 8,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
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
        flex: 1,
    },
    icon: {
        // Style for icons in the overlay if needed
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15, // Space below badge OR placeholder margin
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
        marginTop: 10,
        alignItems: 'flex-start',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
    },
    detailsButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 5,
    },
    // Keep Details Container styles
    detailsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        maxHeight: screenHeight * 0.25, // Limit height
        borderTopWidth: 1,
        borderTopColor: '#eee',
        // These are important for ScrollView within potentially limited height
        flexGrow: 0,
        flexShrink: 1,
        backgroundColor: '#ffffff', // Details have white background
        // Removed position: 'absolute', it should naturally flow below the card content
        // Ensure it doesn't overlap if the card content has shadow/elevation
        // Add margin top if needed to clear shadow visually
        // marginTop: 5, // Example if shadow needs clearance
    },
    detailsBlock: {
        marginBottom: 15,
    },
    detailsHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    detailsDescription: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconDetails: {
        marginRight: 10,
        marginTop: 2,
        color: '#555',
        width: 16,
    },
    detailsInfoText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
        lineHeight: 20,
    },
    // Keep Action Buttons styles
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        zIndex: 1, // Ensure buttons are above gradient
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    skipButton: {
        // Specific styles if needed
    },
    likeButton: {
        backgroundColor: '#4CAF50',
    },
});

export default BusinessProfileCard;