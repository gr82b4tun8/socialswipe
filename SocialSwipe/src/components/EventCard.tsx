// EventCard.tsx (Using profile_picture for ImageBackground)

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView, // Keep for description if it gets long
    Dimensions,
    Platform,
    LayoutAnimation,
    UIManager,
    ImageBackground,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

// --- Define Business Profile Type (Including profile_picture) ---
// Make sure this matches the type used/fetched in DiscoveryContext.tsx
export interface BusinessProfile {
    user_id: string;
    business_name: string;
    category: string;
    description?: string | null;
    address_street?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_postal_code?: string | null;
    address_country?: string | null;
    phone_number?: string | null;
    business_photo_urls?: string[] | null; // Array of other photos (keep if used)
    profile_picture?: string | null; // *** ADDED: Expecting the main profile picture URL ***
}

// --- Business Profile Card Props ---
interface BusinessProfileCardProps {
    profile: BusinessProfile;
    onLikeBusiness: (userId: string) => void;    // Renamed from onSwipeRight
    onDismissBusiness: (userId: string) => void; // Renamed from onSwipeLeft
}

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Avatar Component (Definition remains, but unused in this card) ---
interface AvatarProps {
    uri?: string;
    fallbackText: string;
    size?: number;
}
const Avatar: React.FC<AvatarProps> = ({ uri, fallbackText, size = 56 }) => {
    const avatarStyle = { width: size, height: size, borderRadius: size / 2, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' };
    const imageStyle = { width: '100%', height: '100%' };
    const fallbackTextStyle = { fontSize: size / 2.5, color: '#555', fontWeight: 'bold' };
    return (
        <View style={avatarStyle}>
            {uri ? (
                <Image source={{ uri }} style={imageStyle} resizeMode="cover" />
            ) : (
                <Text style={fallbackTextStyle}>{fallbackText.charAt(0).toUpperCase()}</Text>
            )}
        </View>
    );
};
// --- End Avatar Component ---


// --- Business Profile Card Component (Modified EventCard) ---
// *** Make sure this is the default export ***
const BusinessProfileCard: React.FC<BusinessProfileCardProps> = ({
    profile,
    onLikeBusiness,
    onDismissBusiness,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    const toggleDetails = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowDetails(!showDetails);
    };

    if (!profile) {
        return null;
    }

    // Construct location string
    const locationParts = [profile.address_city, profile.address_state].filter(Boolean);
    const formattedLocation = locationParts.join(', ');

    // --- Image URL Selection (Using profile_picture) ---
    // *** CHANGED: Use profile.profile_picture directly ***
    const primaryImageUrl = profile.profile_picture;
    const fallbackImageUrl = 'https://via.placeholder.com/600x400.png?text=No+Profile+Image'; // Updated fallback text
    // --- End Image URL Selection ---

    // Construct full address
    const fullAddress = [
        profile.address_street,
        profile.address_city,
        profile.address_state,
        profile.address_postal_code,
        profile.address_country
    ].filter(Boolean).join(', ');

    return (
        // Container for the static card + action buttons
        <View style={styles.container}>
            {/* Main static card structure */}
            <View style={styles.card}>
                <ImageBackground
                    // *** CHANGED: Use primaryImageUrl (from profile_picture) or fallback ***
                    source={{ uri: primaryImageUrl || fallbackImageUrl }}
                    style={styles.imageBackground}
                    resizeMode="cover"
                    onError={(error) => {
                        console.warn(`Image load error for profile ${profile.user_id} (URL: ${primaryImageUrl || fallbackImageUrl}): ${error.nativeEvent.error}`);
                        // Optionally handle error, e.g., show a static fallback in state
                    }}
                >
                    {/* Gradient Replacement */}
                    <View style={styles.gradientOverlay}>
                        {/* Content inside overlay */}
                        <View style={styles.contentOverlay}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title} numberOfLines={2}>{profile.business_name || 'Unnamed Business'}</Text>
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
                            {profile.category ? (
                                <View style={styles.badgeRow}>
                                    <View style={[styles.badge, styles.categoryBadge]}>
                                        <Text style={styles.categoryBadgeText}>{profile.category}</Text>
                                    </View>
                                </View>
                            ) : null}

                            {/* Details Toggle Section */}
                            {(profile.description || profile.phone_number || fullAddress) && (
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
                        {profile.description ? (
                            <Text style={styles.detailsDescription}>{profile.description}</Text>
                        ) : null }

                        {profile.phone_number && (
                            <View style={styles.detailsInfoRow}>
                                <Feather name="phone" size={16} color="#555" style={styles.iconDetails} />
                                <Text style={styles.detailsInfoText}>{profile.phone_number}</Text>
                            </View>
                        )}

                        {fullAddress && (
                            <View style={styles.detailsInfoRow}>
                                <Feather name="map-pin" size={16} color="#555" style={styles.iconDetails} />
                                <Text style={styles.detailsInfoText}>{fullAddress}</Text>
                            </View>
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={() => onDismissBusiness(profile.user_id)}
                >
                    <Ionicons name="close" size={32} color="#F15A6A" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.likeButton]}
                    onPress={() => onLikeBusiness(profile.user_id)}
                >
                    <Ionicons name="heart" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View> // End container
    );
};

// --- Styles --- (Keep previously adjusted styles for size)
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

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
        marginBottom: 10,
    },
    imageBackground: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        backgroundColor: '#E0E0E0',
    },
    gradientOverlay: {
        paddingTop: 80,
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
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#FFFFFFCC',
        marginLeft: 6,
        flex: 1,
    },
    icon: {},
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
    detailsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        maxHeight: screenHeight * 0.25,
        backgroundColor: '#ffffff',
    },
    detailsDescription: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 15,
    },
    detailsInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    iconDetails: {
        marginRight: 8,
        marginTop: 2,
        color: '#555',
    },
    detailsInfoText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
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
    skipButton: {},
    likeButton: {
        backgroundColor: '#4CAF50',
    },
});

export default BusinessProfileCard;