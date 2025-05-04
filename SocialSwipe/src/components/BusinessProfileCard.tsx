// BusinessProfileCard.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
    Pressable,
    NativeSyntheticEvent,
    NativeTouchEvent,
    // *** ADDED: For blur effect (optional, requires separate setup if using) ***
    // import { BlurView } from 'expo-blur'; // Uncomment if you have expo-blur installed and want actual blur
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; // Ionicons is already imported
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
// *** ADDED: Import LinearGradient ***
import { LinearGradient } from 'expo-linear-gradient'; // Make sure to install: npx expo install expo-linear-gradient

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

// --- Business Profile Card Props (MODIFIED: onShowAttendees now expects arguments) ---
interface BusinessProfileCardProps {
    listing: BusinessListing | null;
    onLikeBusiness: () => void;
    onDismissBusiness: () => void;
    // <<< MODIFIED: Prop now expects businessId and optional businessName >>>
    onShowAttendees: (businessId: string, businessName?: string) => void;
}

// Enable LayoutAnimation for Android (Keep as is)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Constants (Keep as is) ---
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.3;
const ROTATION_DEG = 15;
const TAP_AREA_WIDTH_PERCENTAGE = 0.3;
const SPRING_CONFIG = {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

// --- Business Profile Card Component (MODIFIED: Destructure updated prop) ---
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing,
    onLikeBusiness,
    onDismissBusiness,
    onShowAttendees, // Destructure the updated prop
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const photos = listing?.listing_photos?.filter(Boolean) ?? [];
    const hasMultiplePhotos = photos.length > 1;
    const fallbackImageUrl = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image';
    const currentImageUrl = photos[currentPhotoIndex] || fallbackImageUrl;

    useEffect(() => {
        setCurrentPhotoIndex(0);
        setShowDetails(false); // Also reset details view on new listing
        translateX.value = 0; // Reset animation values if component re-renders with new listing
        translateY.value = 0;
    }, [listing?.id, translateX, translateY]); // Added translateX/Y dependency for safety

    // Modified toggleDetails: Now only toggles state, doesn't rely on a button within the removed section
    const toggleDetails = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(prev => !prev);
    }, []);


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
            translateX.value = ctx.startX + event.translationX;
            // Dampen vertical movement during swipe
            translateY.value = ctx.startY + event.translationY * 0.1;
        },
        onEnd: (event) => {
            // Check if swipe distance exceeds threshold
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                const direction = Math.sign(translateX.value);
                const targetX = direction * screenWidth * 1.5; // Swipe off screen

                // Determine action based on swipe direction
                if (direction > 0) { // Swiped right (Like)
                    // IMPORTANT: Use runOnJS to call React state updates/logic from Reanimated worklet
                    runOnJS(onLikeBusiness)();
                } else { // Swiped left (Dismiss)
                    runOnJS(onDismissBusiness)();
                }

                // Animate the card off screen
                translateX.value = withSpring(targetX, SPRING_CONFIG);
                // Add some vertical movement to the exit animation based on swipe gesture
                translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG);
            } else {
                // If swipe wasn't far enough, animate back to center
                translateX.value = withSpring(0, SPRING_CONFIG);
                translateY.value = withSpring(0, SPRING_CONFIG);
            }
        },
    });

    const animatedCardStyle = useAnimatedStyle(() => {
        const rotateZ = interpolate(
            translateX.value,
            [-screenWidth / 2, 0, screenWidth / 2],
            [-ROTATION_DEG, 0, ROTATION_DEG],
            Extrapolate.CLAMP
        );
        const opacity = interpolate(
            Math.abs(translateX.value),
            [0, SWIPE_THRESHOLD * 1.5], // Fade out faster as it swipes off
            [1, 0.7], // Start fully opaque, end partially transparent during swipe off
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

    const handleNextPhoto = useCallback(() => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(prevIndex => prevIndex + 1);
        }
    }, [currentPhotoIndex, photos.length]);

    const handlePreviousPhoto = useCallback(() => {
        // Check if we are not already at the first photo
        if (currentPhotoIndex > 0) {
            // CORRECTED: Decrement the index to go to the previous photo
            setCurrentPhotoIndex(prevIndex => prevIndex - 1);
        }
    }, [currentPhotoIndex]); // Dependency is correct

    // Modified handlePhotoTap: Now only switches photos or does nothing in center
    // It no longer calls toggleDetails, as the button is gone.
    const handlePhotoTap = useCallback((event: NativeSyntheticEvent<NativeTouchEvent>) => {
        const tapX = event.nativeEvent.locationX;
        const cardWidth = screenWidth * 0.98; // Approximate width based on potential parent padding
        const tapAreaWidth = cardWidth * TAP_AREA_WIDTH_PERCENTAGE;

        if (hasMultiplePhotos && tapX < tapAreaWidth) {
            handlePreviousPhoto();
        } else if (hasMultiplePhotos && tapX > cardWidth - tapAreaWidth) {
            handleNextPhoto();
        }
    }, [hasMultiplePhotos, handlePreviousPhoto, handleNextPhoto, screenWidth]);


    // --- Null Check (Keep as is) ---
    if (!listing) {
        return (
             <View style={styles.loadingContainer}>
                 <Text>Loading next profile...</Text>
                 {/* Optional: Add an ActivityIndicator here */}
             </View>
        );
    }

    // --- Calculations (Keep 'formattedLocation' and 'fullAddress') ---
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', '); // Used under title now
    const fullAddress = [ // Used in details section
        listing.address_street,
        listing.address_city,
        listing.address_state,
        listing.address_postal_code,
        listing.address_country
    ].filter(Boolean).join(', ');
    // Modified: hasDetailsToShow no longer checks category as it won't be displayed *initially*
    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress; // Removed listing.category check here

    // --- Action Handlers (Keep like/dismiss as is) ---
    const handleLikePress = () => {
        // No need for runOnJS for direct button press
        onLikeBusiness();
        translateX.value = withSpring(screenWidth * 1.5, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
    };

    const handleDismissPress = () => {
        // No need for runOnJS for direct button press
        onDismissBusiness();
        translateX.value = withSpring(-screenWidth * 1.5, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
    };

    // --- Action Handler for the "Attendees" button (MODIFIED) ---
    const handleShowAttendeesPress = () => {
        // Check if listing data is available before calling the prop
        if (listing) {
            console.log('Show Attendees Pressed for listing:', listing.id);
            // Call the prop function passed down from the parent,
            // providing the necessary data for navigation.
            onShowAttendees(listing.id, listing.business_name); // <<< MODIFIED: Pass arguments
        } else {
            // Handle the case where listing might be null unexpectedly
            console.warn('Show Attendees pressed but listing data is missing.');
            // Optionally, you could show an alert or do nothing
        }
    };


    // --- JSX Structure (No changes needed here, relies on updated handler) ---
    return (
        <PanGestureHandler onGestureEvent={gestureHandler} failOffsetY={[-5, 5]} activeOffsetX={[-5, 5]}>
            <Animated.View style={[styles.animatedWrapper, animatedCardStyle]}>
                <View style={styles.cardOuterContainer}>
                    <View style={styles.cardContentContainer} collapsable={false}>
                        <ImageBackground
                            source={{ uri: currentImageUrl }}
                            style={styles.imageBackground}
                            resizeMode="cover"
                            onError={(error) => {
                                console.warn(`Image load error for listing ${listing.id} (URL: ${currentImageUrl}): ${error.nativeEvent.error}`);
                            }}
                        >
                            {/* Progress Bars (Keep as is) */}
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

                            {/* Pressable Area for Photo Tapping (Keep as is) */}
                            <Pressable
                                style={styles.photoTapArea}
                                onPress={handlePhotoTap}
                            >
                                {/* Transparent Pressable */}
                            </Pressable>

                             {/* Title Row (Keep as is) */}
                            <View style={styles.titleRow}>
                                <Text style={styles.title} numberOfLines={2}>{listing.business_name || 'Unnamed Business'}</Text>
                                {formattedLocation ? (
                                    <Text style={styles.locationText} numberOfLines={1}>
                                        {formattedLocation}
                                    </Text>
                                ) : null}
                            </View>

                            {/* ***** SECTION REMOVED ***** */}
                            {/* The gradientOverlay View which contained contentOverlay, badgeRow, and detailsToggleSection has been removed */}


                            {/* ***** Action Buttons Area (MODIFIED: Added Attendees Button) ***** */}
                            <View style={styles.actionButtonAreaContainer}>
                                {/* Optional Background (Uncomment below if using expo-blur) */}
                                {/* <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} /> */}

                                {/* Buttons Row */}
                                <View style={styles.actionButtonsRow}>
                                    {/* Dislike Button */}
                                    <TouchableOpacity
                                        style={styles.touchablePill}
                                        onPress={handleDismissPress}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#FF6B6B', '#D93A3A']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.buttonPill}
                                        >
                                            <Ionicons name="close" size={28} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    {/* <<< NEW: Attendees/Who Liked Button >>> */}
                                    <TouchableOpacity
                                        style={styles.touchablePill}
                                        onPress={handleShowAttendeesPress} // <<< This now calls the modified handler
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            // Using a neutral grey gradient
                                            colors={['#AAAAAA', '#777777']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.buttonPill} // Re-use the same pill style
                                        >
                                            {/* Profile / Person Icon */}
                                            <Ionicons name="person-outline" size={28} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    {/* <<< END NEW BUTTON >>> */}

                                    {/* Like Button */}
                                    <TouchableOpacity
                                        style={styles.touchablePill}
                                        onPress={handleLikePress}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#4CAF50', '#2196F3']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.buttonPill}
                                        >
                                            <Ionicons name="heart" size={26} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {/* ***** END of Action Buttons Area ***** */}

                        </ImageBackground> {/* End ImageBackground */}
                    </View> {/* End cardContentContainer */}

                    {/* Collapsible Details Section (Keep as is, but triggered differently) */}
                    {showDetails && hasDetailsToShow && (
                        <ScrollView
                            style={styles.detailsContainer}
                            nestedScrollEnabled={true} // Important for scrollable content inside PanGestureHandler
                        >
                            {listing.category ? (
                                <View style={styles.detailsBlock}>
                                    <Text style={styles.detailsHeading}>Category</Text>
                                    <Text style={styles.detailsInfoText}>{listing.category}</Text>
                                </View>
                            ) : null}
                            {listing.description ? (
                                <View style={styles.detailsBlock}>
                                    <Text style={styles.detailsHeading}>Description</Text>
                                    <Text style={styles.detailsDescription}>{listing.description}</Text>
                                </View>
                            ) : null}
                            {listing.phone_number ? (
                                <View style={styles.detailsBlock}>
                                    <Text style={styles.detailsHeading}>Phone</Text>
                                    <View style={styles.detailsInfoRow}>
                                        <Feather name="phone" size={16} color="#555" style={styles.iconDetails} />
                                        <Text style={styles.detailsInfoText}>{listing.phone_number}</Text>
                                    </View>
                                </View>
                            ) : null}
                            {fullAddress ? (
                                <View style={styles.detailsBlock}>
                                    <Text style={styles.detailsHeading}>Address</Text>
                                    <View style={styles.detailsInfoRow}>
                                        <Feather name="map-pin" size={16} color="#555" style={styles.iconDetails} />
                                        <Text style={styles.detailsInfoText}>{fullAddress}</Text>
                                    </View>
                                </View>
                            ) : null}
                        </ScrollView>
                    )}
                </View> {/* End cardOuterContainer */}
            </Animated.View>
        </PanGestureHandler>
    );
};

// --- Styles (Remain unchanged) ---
const styles = StyleSheet.create({
    loadingContainer: { // Kept as is
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    animatedWrapper: { // Kept as is
        width: screenWidth * 0.98,
        height: screenHeight * 0.77,
        alignSelf: 'center',
    },
    cardOuterContainer: { // Kept as is
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        flexDirection: 'column',
    },
    cardContentContainer: { // Kept as is
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
    },
    imageBackground: { // Kept as is
        flex: 1,
        justifyContent: 'flex-end', // This is important for positioning bottom elements
        position: 'relative',
        overflow: 'hidden',
    },
    progressBarsContainer: { // Kept as is
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        height: 5,
        paddingHorizontal: 4,
        zIndex: 10,
    },
    progressBar: { // Kept as is
        flex: 1,
        height: '100%',
        borderRadius: 2.5,
        marginHorizontal: 3,
    },
    progressBarActive: { // Kept as is
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    progressBarInactive: { // Kept as is
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    photoTapArea: { // Kept as is
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    titleRow: { // Kept as is
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 25,
        paddingHorizontal: 20,
        paddingBottom: 10,
        zIndex: 5,
    },
    title: { // Kept as is
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 5,
    },
    locationText: { // Kept as is
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFFE6',
        marginTop: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },

    // --- Details Section Styles --- (Kept as is)
    detailsContainer: {
        maxHeight: screenHeight * 0.25,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: '#EAEAEA',
        backgroundColor: '#FFFFFF',
        flexGrow: 0,
        flexShrink: 1,
    },
    detailsBlock: { marginBottom: 18 },
    detailsHeading: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    detailsDescription: {
        fontSize: 15,
        color: '#333',
        lineHeight: 23,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4,
    },
    iconDetails: {
        marginRight: 12,
        marginTop: 3,
        color: '#555',
        width: 16,
    },
    detailsInfoText: {
        fontSize: 15,
        color: '#444',
        flex: 1,
        lineHeight: 21,
    },

    // ***** Action Buttons Area Styles ***** (MODIFIED actionButtonsRow width slightly)
    actionButtonAreaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 6,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        paddingTop: 15,
        alignItems: 'center',
    },
    // Optional: Uncomment if using BlurView
    // buttonBackgroundStrip: {
    //     position: 'absolute',
    //     bottom: 0,
    //     left: 0,
    //     right: 0,
    //     top: 0,
    //     backgroundColor: 'rgba(0, 0, 0, 0.3)', // Or use BlurView
    // },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Distributes the 3 buttons evenly
        alignItems: 'center',
        width: '100%', // Adjusted from 105% - fit 3 buttons better within bounds
        position: 'relative',
        zIndex: 7,
        paddingHorizontal: 10, // Add some padding if buttons feel too close to edges
    },
    touchablePill: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 7,
        // Add some margin if buttons are too close with space-around
        // marginHorizontal: 5,
    },
    buttonPill: {
        width: 90, // <<< REDUCED WIDTH slightly to better fit 3 buttons
        height: 60, // <<< REDUCED HEIGHT slightly
        borderRadius: 30, // Adjust border radius to keep it pill-shaped
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    // ***** END of Action Buttons Styles *****
});

export default BusinessProfileCard;