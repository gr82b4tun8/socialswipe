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
    // Add any other relevant fields
}

// --- Business Profile Card Props (Keep as is) ---
interface BusinessProfileCardProps {
    listing: BusinessListing | null;
    onLikeBusiness: (managerUserId: string) => void;
    onDismissBusiness: (managerUserId: string) => void;
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

    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress || listing.category; // Note: Category is now shown in overlay, but can still trigger details view if needed

    return (
        // This container now IS the card visually. It fills the parent wrapper from BusinessCardStack.
        <View style={styles.container}>
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

                {/* Action Buttons - NOW ABSOLUTELY POSITIONED WITHIN ImageBackground */}
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

            </ImageBackground> {/* End ImageBackground */}

            {/* Collapsible Details Section - Appears BELOW the ImageBackground */}
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

            {/* The actionButtonsContainer View was moved from here */}

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
        backgroundColor: '#E0E0E0', // Fallback color if image doesn't load or has transparency
        flexDirection: 'column', // Explicitly column
        // justifyContent: 'space-between', // Less critical now, positioning handled by flex image and details block
    },
    imageBackground: {
        flex: 1, // Let image try to take up max space initially (adjusts if details are shown)
        width: '100%',
        justifyContent: 'flex-end', // Align gradient overlay to the bottom
        backgroundColor: '#E0E0E0', // Fallback color
        position: 'relative', // Needed for absolute positioning of children (action buttons)
    },
    gradientOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingTop: 40, // Adjust as needed for status bar etc.
        paddingBottom: 80, // Increased padding to avoid overlap with action buttons
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
        maxHeight: screenHeight * 0.25, // Constrain the scrollable area size
        borderTopWidth: 1, // Separator line
        borderTopColor: '#eee',
        flexGrow: 0, // Don't allow this to grow indefinitely
        flexShrink: 1, // Allow it to shrink if needed
        backgroundColor: '#ffffff', // White background for the details section
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
        // Positioned absolutely over the ImageBackground
        position: 'absolute',
        bottom: 20, // Distance from the bottom of the image
        left: 0,
        right: 0,
        zIndex: 1, // Ensure they are above the gradient/text overlay

        // Flex properties for aligning buttons within this container
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        // Removed paddingVertical, paddingHorizontal, backgroundColor, flexGrow, flexShrink
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
        // Specific styles if needed (e.g., different background)
    },
    likeButton: {
        backgroundColor: '#4CAF50', // Green background for like
    },
});

export default BusinessProfileCard;