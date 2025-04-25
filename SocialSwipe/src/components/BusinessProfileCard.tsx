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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

// --- Define Business Listing Type (Keep as is) ---
export interface BusinessListing {
  // ... (interface definition)
}

// --- Business Profile Card Props (Keep as is) ---
interface BusinessProfileCardProps {
  // ... (props definition)
}

// Enable LayoutAnimation for Android (Keep as is)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Business Profile Card Component ---
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    if (!listing) {
        return null;
    }

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

    return (
        // This container now IS the card visually. It fills the parent wrapper from BusinessCardStack.
        <View style={styles.container}>
            {/* Removed the extra 'card' View. ImageBackground is now a direct child */}
            <ImageBackground
                source={{ uri: primaryImageUrl || fallbackImageUrl }}
                style={styles.imageBackground} // Needs to specify how much space it takes
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
            </ImageBackground>

            {/* Collapsible Details Section - Appears BELOW the ImageBackground */}
            {showDetails && (
                <ScrollView style={styles.detailsContainer} // No changes needed here yet
                    nestedScrollEnabled={true} // Good practice for ScrollViews inside ScrollViews/potentially animated views
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

            {/* Action Buttons - Remain at the bottom due to container's flex direction */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={() => onDismissBusiness(listing.manager_user_id)}
                >
                    <Ionicons name="close" size={32} color="#F15A6A" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.likeButton]}
                    onPress={() => onLikeBusiness(listing.manager_user_id)}
                >
                    <Ionicons name="heart" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View> // End container
    );
};

// --- Styles ---
const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1, // Crucial: Makes this View fill its parent (the sized wrapper in CardStack)
        borderRadius: 16, // Apply border radius here
        overflow: 'hidden', // Clip children (ImageBackground, ScrollView) to the rounded corners
        backgroundColor: '#1fb7f0', // Card background color
        flexDirection: 'column', // Explicitly column
        justifyContent: 'space-between', // Push buttons to bottom if details aren't shown/take less space
    },
    // REMOVED the 'card' style as 'container' now serves this purpose.
    // card: { ... }

    imageBackground: {
        // Image takes available space, pushing details/buttons down or overlaying content on top
        // We need to control its height or flex grow behaviour
        // Option 1: Fixed portion of height?
        // height: screenHeight * 0.5, // Example: 50% of screen? Adjust as needed
        // Option 2: Let it flex (might be harder to manage with collapsible details)
        flex: 1, // Let image try to take up max space initially
        width: '100%',
        justifyContent: 'flex-end', // Align gradient overlay to the bottom
        backgroundColor: '#E0E0E0', // Fallback color
    },
    gradientOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingTop: 40, // Adjust as needed for status bar etc.
        paddingBottom: 16,
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
        backgroundColor: 'rgba(98, 92, 184, 0.25)',
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
        paddingVertical: 5, // Make it easier to tap
    },
    detailsButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginRight: 5,
    },
    detailsContainer: {
        // This appears BELOW the ImageBackground when showDetails is true
        paddingHorizontal: 16,
        paddingVertical: 16,
        // Max height relative to the CARD, not screen, might be better
        // Let's limit its flex grow instead? Or keep max height for now.
        maxHeight: screenHeight * 0.25, // Constrain the scrollable area size
        // backgroundColor: '#ffffff', // Inherits from container now
        borderTopWidth: 1, // Separator line
        borderTopColor: '#eee',
        // Crucial for managing space with flex:1 imageBackground
        flexGrow: 0, // Don't allow this to grow indefinitely
        flexShrink: 1, // Allow it to shrink if needed
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
        width: 16, // Keep consistent alignment
    },
    detailsInfoText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
        lineHeight: 20,
    },
    actionButtonsContainer: {
        // Sits at the bottom because of container's justifyContent + its own flex position
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        // backgroundColor: 'transparent', // No background needed here
        // Ensure it doesn't grow or shrink unexpectedly
        flexGrow: 0,
        flexShrink: 0,
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background for the button itself
        // Keep shadows for the buttons
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
        backgroundColor: '#4CAF50', // Green background for like
    },
});

export default BusinessProfileCard;