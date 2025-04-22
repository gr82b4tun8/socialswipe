// BusinessProfileCard.tsx (MODIFIED to use BusinessListing data)

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

// --- Define Business Listing Type ---
// This interface should match the structure of your 'business_listings' table data
// Ensure this matches the actual columns and types in your Supabase table.
export interface BusinessListing {
  id: string; // Unique ID of the listing itself
  manager_user_id: string; // ID of the user who manages this listing (links to auth.users.id)
  business_name: string;
  category: string;
  description?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  phone_number?: string | null;
  listing_photos?: string[] | null; // Array of photo URLs/paths from Storage
  status?: string; // Assuming you have a status field
  created_at?: string;
  updated_at?: string;
  // Add any other relevant fields from your business_listings table
}

// --- Business Profile Card Props --- (Updated to use listing)
interface BusinessProfileCardProps {
  listing: BusinessListing; // Renamed prop to 'listing' and use BusinessListing type
  onLikeBusiness: (managerUserId: string) => void; // Pass the manager's user ID
  onDismissBusiness: (managerUserId: string) => void; // Pass the manager's user ID
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Business Profile Card Component --- (Updated to use listing)
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    listing, // Use 'listing' prop
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    // Use listing prop now
    if (!listing) {
        return null; // Don't render if no listing data
    }

    // Construct location string (City, State) using listing data
    const locationParts = [listing.address_city, listing.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');

    // --- Image URL Selection (Using listing_photos) ---
    // Use the first photo from the listing_photos array as the primary image
    const primaryImageUrl = listing.listing_photos?.[0]; // Get the first URL, if available
    const fallbackImageUrl = 'https://placehold.co/600x400/cccccc/ffffff?text=No+Image'; // Generic fallback

    // Construct full address using listing data
    const fullAddress = [
        listing.address_street,
        listing.address_city,
        listing.address_state,
        listing.address_postal_code,
        listing.address_country
    ].filter(Boolean).join(', ');

    // Determine if details exist to show the toggle button using listing data
    // Ensure these field names match your BusinessListing interface and table
    const hasDetailsToShow = listing.description || listing.phone_number || fullAddress || listing.category;

    return (
        // Container for the static card + action buttons
        <View style={styles.container}>
            {/* Main static card structure */}
            <View style={styles.card}>
                <ImageBackground
                    // Use primaryImageUrl (from listing.listing_photos[0]) or fallback
                    source={{ uri: primaryImageUrl || fallbackImageUrl }}
                    style={styles.imageBackground}
                    resizeMode="cover"
                    onError={(error) => {
                        // Updated log message using listing ID
                        console.warn(`Image load error for listing ${listing.id} (URL: ${primaryImageUrl || fallbackImageUrl}): ${error.nativeEvent.error}`);
                    }}
                >
                    {/* Gradient Overlay */}
                    <View style={styles.gradientOverlay}>
                        {/* Content inside overlay */}
                        <View style={styles.contentOverlay}>
                            <View style={styles.titleRow}>
                                {/* Use listing.business_name */}
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

                {/* Collapsible Details Section */}
                {showDetails && (
                    <ScrollView style={styles.detailsContainer}>
                        {/* Use listing.description */}
                        {listing.description ? (
                            <View style={styles.detailsBlock}>
                                <Text style={styles.detailsHeading}>Description</Text>
                                <Text style={styles.detailsDescription}>{listing.description}</Text>
                            </View>
                        ) : null }

                        {/* Use listing.phone_number */}
                        {listing.phone_number ? (
                            <View style={styles.detailsBlock}>
                                <Text style={styles.detailsHeading}>Phone</Text>
                                <View style={styles.detailsInfoRow}>
                                    <Feather name="phone" size={16} color="#555" style={styles.iconDetails} />
                                    <Text style={styles.detailsInfoText}>{listing.phone_number}</Text>
                                </View>
                            </View>
                        ) : null }

                        {/* Use fullAddress derived from listing */}
                        {fullAddress ? (
                            <View style={styles.detailsBlock}>
                                <Text style={styles.detailsHeading}>Address</Text>
                                <View style={styles.detailsInfoRow}>
                                    <Feather name="map-pin" size={16} color="#555" style={styles.iconDetails} />
                                    <Text style={styles.detailsInfoText}>{fullAddress}</Text>
                                </View>
                            </View>
                        ) : null }

                        {/* Optionally display other photos from listing.listing_photos here */}
                        {/* {listing.listing_photos && listing.listing_photos.length > 1 && ( ... ) } */}

                    </ScrollView>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    // Pass manager's user ID for dismiss action
                    // Ensure manager_user_id exists on your listing object
                    onPress={() => onDismissBusiness(listing.manager_user_id)}
                >
                    <Ionicons name="close" size={32} color="#F15A6A" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.likeButton]}
                    // Pass manager's user ID for like action
                    // Ensure manager_user_id exists on your listing object
                    onPress={() => onLikeBusiness(listing.manager_user_id)}
                >
                    <Ionicons name="heart" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View> // End container
    );
};

// --- Styles --- (Keep styles the same)
const { height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        borderRadius: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 10, // Or adjust as needed for spacing below card if buttons aren't absolute
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        backgroundColor: '#E0E0E0', // Background color if image fails
    },
    gradientOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dark gradient overlay
        paddingTop: 80, // Push content down from top
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
        color: '#FFFFFFCC', // Slightly transparent white
        marginLeft: 6,
        flex: 1, // Allow text to wrap if needed
    },
    icon: {
      // Style for icons in the overlay if needed
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15, // Space before details toggle
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6,
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)', // Semi-transparent white badge
    },
    categoryBadgeText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    detailsToggleSection: {
        marginTop: 10,
        alignItems: 'flex-start', // Align button to the left
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
        paddingHorizontal: 16,
        paddingVertical: 16,
        maxHeight: screenHeight * 0.25, // Limit height of details scroll
        backgroundColor: '#ffffff', // White background for details
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    detailsBlock: {
        marginBottom: 15,
    },
    detailsHeading: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#888', // Grey heading
        textTransform: 'uppercase',
        marginBottom: 5,
    },
    detailsDescription: {
        fontSize: 15,
        color: '#333', // Darker text for description
        lineHeight: 22,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align icon and text nicely
    },
    iconDetails: {
        marginRight: 10,
        marginTop: 2, // Align icon slightly lower
        color: '#555',
        width: 16, // Ensure icon takes up consistent space
    },
    detailsInfoText: {
        fontSize: 14,
        color: '#555',
        flex: 1, // Allow text to wrap
        lineHeight: 20,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly', // Distribute buttons evenly
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: 'transparent', // No background for action button area
        // If buttons should overlay the card, use absolute positioning:
        // position: 'absolute',
        // bottom: 20, // Adjust as needed
        // left: 0,
        // right: 0,
        // Otherwise, ensure the parent <View style={styles.container}> handles layout correctly
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32, // Circular buttons
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background for buttons
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    skipButton: {
      // Specific styles for skip button if needed (e.g., border)
    },
    likeButton: {
        backgroundColor: '#4CAF50', // Green for like button
    },
});

// Export component using the correct name
export default BusinessProfileCard;
