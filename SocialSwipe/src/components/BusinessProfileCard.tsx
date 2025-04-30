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

// --- Business Profile Card Component ---
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // --- State for Photo Index (Keep as is) ---
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // --- Photo Logic (Keep as is) ---
    const photos = listing?.listing_photos?.filter(Boolean) ?? [];
    const hasMultiplePhotos = photos.length > 1;
    const fallbackImageUrl = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image';
    const currentImageUrl = photos[currentPhotoIndex] || fallbackImageUrl;

    // --- Effect to Reset Index (Keep as is) ---
    useEffect(() => {
        setCurrentPhotoIndex(0);
    }, [listing?.id]);

    // --- Toggle Details (Keep as is) ---
    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    // --- Gesture Handler (Corrected for performance - Keep as is) ---
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
            translateY.value = ctx.startY + event.translationY * 0.1;
        },
        onEnd: (event) => {
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                const direction = Math.sign(translateX.value);
                const targetX = direction * screenWidth * 1.5;

                // Trigger action immediately for swipe
                if (direction > 0) {
                    runOnJS(onLikeBusiness)();
                } else {
                    runOnJS(onDismissBusiness)();
                }

                // Start animation concurrently
                translateX.value = withSpring(targetX, SPRING_CONFIG);
                translateY.value = withSpring(event.translationY * 0.5, SPRING_CONFIG);
            } else {
                // Snap back
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
            [0, SWIPE_THRESHOLD * 1.5],
            [1, 0.7],
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

    // --- Photo Navigation Handlers (Keep as is) ---
    const handleNextPhoto = useCallback(() => {
        if (currentPhotoIndex < photos.length - 1) {
            setCurrentPhotoIndex(prevIndex => prevIndex + 1);
        }
    }, [currentPhotoIndex, photos.length]);

    const handlePreviousPhoto = useCallback(() => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(prevIndex => prevIndex - 1);
        }
    }, [currentPhotoIndex]);

    // --- Tap Handler (Keep as is) ---
     const handlePhotoTap = useCallback((event: NativeSyntheticEvent<NativeTouchEvent>) => {
        // Allow middle tap even if only one photo to toggle details

        const tapX = event.nativeEvent.locationX;
        const cardWidth = styles.cardOuterContainer.width === '100%' ? screenWidth * 0.98 : (styles.cardOuterContainer.width || screenWidth * 0.98);
        const tapAreaWidth = cardWidth * TAP_AREA_WIDTH_PERCENTAGE;

        if (hasMultiplePhotos && tapX < tapAreaWidth) {
             handlePreviousPhoto();
        } else if (hasMultiplePhotos && tapX > cardWidth - tapAreaWidth) {
             handleNextPhoto();
        } else {
              toggleDetails(); // Middle tap toggles details
        }
    }, [hasMultiplePhotos, handlePreviousPhoto, handleNextPhoto, toggleDetails, photos.length]);

    // --- Null Check (Keep as is) ---
    if (!listing) {
        return null;
    }

    // --- Calculations (Keep as is) ---
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');
    const fullAddress = [
        listing.address_street,
        listing.address_city,
        listing.address_state,
        listing.address_postal_code,
        listing.address_country
    ].filter(Boolean).join(', ');
    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress || listing.category;


    // --- JSX Structure (Action Button onPress EDITED) ---
    return (
        <PanGestureHandler onGestureEvent={gestureHandler} failOffsetY={[-5, 5]} activeOffsetX={[-5, 5]}>
            <Animated.View style={[styles.animatedWrapper, animatedCardStyle]}>
                {/* Main Card Structure */}
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
                            {/* Progress Bars */}
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

                            {/* Pressable Area for Photo Tapping */}
                            <Pressable
                                style={styles.photoTapArea}
                                onPress={handlePhotoTap}
                            >
                                {/* Transparent Pressable */}
                            </Pressable>

                            {/* Title Row */}
                             <View style={styles.titleRow}>
                                 <Text style={styles.title} numberOfLines={2}>{listing.business_name || 'Unnamed Business'}</Text>
                             </View>

                            {/* Gradient Overlay */}
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
                                    ) : <View style={{ marginBottom: 15 }} />}

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

                            {/* Action Buttons --- ***** EDITED FOR PERFORMANCE ***** --- */}
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.skipButton]}
                                    onPress={() => {
                                        // ***** CHANGE START: Trigger action immediately for dismiss button *****
                                        runOnJS(onDismissBusiness)();
                                        // ***** CHANGE END *****

                                        // Animate out left (remove callback)
                                        translateX.value = withSpring(-screenWidth * 1.5, SPRING_CONFIG);
                                        translateY.value = withSpring(0, SPRING_CONFIG);
                                    }}
                                >
                                    <Ionicons name="close" size={32} color="#F15A6A" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.likeButton]}
                                     onPress={() => {
                                         // ***** CHANGE START: Trigger action immediately for like button *****
                                         runOnJS(onLikeBusiness)();
                                         // ***** CHANGE END *****

                                         // Animate out right (remove callback)
                                         translateX.value = withSpring(screenWidth * 1.5, SPRING_CONFIG);
                                         translateY.value = withSpring(0, SPRING_CONFIG);
                                     }}
                                >
                                    <Ionicons name="heart" size={30} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground> {/* End ImageBackground */}
                    </View> {/* End cardContentContainer */}

                    {/* Collapsible Details Section */}
                    {showDetails && hasDetailsToShow && (
                        <ScrollView
                            style={styles.detailsContainer}
                            nestedScrollEnabled={true}
                        >
                            {/* Details Content... (kept as is) */}
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

// --- Styles (Keep as is) ---
const styles = StyleSheet.create({
    animatedWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
     cardOuterContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
        flexDirection: 'column',
     },
    cardContentContainer: {
        flex: 1,
        position: 'relative',
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    progressBarsContainer: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        height: 4,
        paddingHorizontal: 4,
        zIndex: 10,
    },
    progressBar: {
        flex: 1,
        height: '100%',
        borderRadius: 2,
        marginHorizontal: 2,
    },
    progressBarActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    progressBarInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    photoTapArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    titleRow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 5,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0, 0, 0, 0.7)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    gradientOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingTop: 10,
        paddingBottom: 80,
        zIndex: 5,
    },
    contentOverlay: {
        paddingHorizontal: 16,
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
    icon: { /* Style as needed */ },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
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
    detailsContainer: {
        maxHeight: screenHeight * 0.25,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        flexGrow: 0,
        flexShrink: 1,
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
    actionButtonsContainer: {
        position: 'absolute',
        bottom: 20, left: 0, right: 0, zIndex: 6,
        flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
    },
    actionButton: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
    },
    skipButton: { /* Specific styles if needed */ },
    likeButton: { backgroundColor: '#4CAF50', },
});

export default BusinessProfileCard;